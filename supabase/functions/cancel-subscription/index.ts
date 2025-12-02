// Deno type declarations for Supabase Edge Functions
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CANCEL-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  
  if (!supabaseUrl || !supabaseServiceKey) {
    logStep("CRITICAL: Missing environment variables", {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    });
    return new Response(JSON.stringify({ 
      error: "Server configuration error",
      success: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  const supabaseClient = createClient(
    supabaseUrl,
    supabaseServiceKey,
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started", {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get user's active membership from database first
    const { data: userMembership, error: membershipError } = await supabaseClient
      .from("user_memberships")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      logStep("Error fetching user membership", { error: membershipError });
      throw new Error("Failed to fetch membership information");
    }

    if (!userMembership) {
      throw new Error("No active membership found");
    }

    // Check if this is a Stripe membership
    const paymentMethod = userMembership.payment_method?.trim()?.toLowerCase() || null;
    const stripeSubscriptionId = userMembership.stripe_subscription_id;
    
    // Explicitly check if it's a Stripe membership
    const hasStripePaymentMethod = paymentMethod === 'stripe';
    const hasStripeSubscriptionId = stripeSubscriptionId !== null && 
                                     stripeSubscriptionId !== undefined && 
                                     stripeSubscriptionId !== '' &&
                                     stripeSubscriptionId !== 'null';
    
    // CRITICAL: If payment_method is explicitly set to a non-Stripe value, it's NEVER Stripe
    // This prevents the function from treating staff/family/cash memberships as Stripe
    // even if the user's email exists in Stripe from previous transactions
    // The payment_method column is the source of truth for how the membership was paid
    const isStripeMembership = paymentMethod && paymentMethod !== 'stripe' 
      ? false  // Explicitly non-Stripe payment method (staff, family, cash, other)
      : (hasStripePaymentMethod || hasStripeSubscriptionId);
    
    logStep("Checking membership type", {
      paymentMethod,
      stripeSubscriptionId,
      membershipId: userMembership.id,
      userId: user.id,
      rawPaymentMethod: userMembership.payment_method,
      hasStripePaymentMethod,
      hasStripeSubscriptionId,
      isStripeMembership,
      stripeSubscriptionIdType: typeof stripeSubscriptionId,
      stripeSubscriptionIdIsNull: stripeSubscriptionId === null,
      stripeSubscriptionIdIsUndefined: stripeSubscriptionId === undefined,
      stripeSubscriptionIdValue: String(stripeSubscriptionId),
      reason: paymentMethod && paymentMethod !== 'stripe' 
        ? 'payment_method is explicitly non-Stripe' 
        : (hasStripePaymentMethod ? 'payment_method is stripe' : (hasStripeSubscriptionId ? 'has stripe_subscription_id' : 'no Stripe indicators'))
    });

    if (!isStripeMembership) {
      // Non-Stripe membership - keep active until end_date
      logStep("Non-Stripe membership - keeping active until end_date", { 
        paymentMethod: paymentMethod || 'null',
        membershipId: userMembership.id,
        userId: user.id
      });
      
      try {
        logStep("Attempting to update membership", {
          membershipId: userMembership.id,
          currentStatus: userMembership.status,
          userId: user.id
        });

        // Keep status as "active" to maintain benefits until end_date
        // The membership will naturally expire at end_date
        // Set cancelled_at timestamp to track cancellation request for admin visibility
        const updatePayload = {
          status: "active", // Keep active until end_date
          cancelled_at: new Date().toISOString(), // Track when cancellation was requested
          updated_at: new Date().toISOString()
        };

        logStep("Update payload", { updatePayload });

        const { data: updateData, error: updateError } = await supabaseClient
          .from("user_memberships")
          .update(updatePayload)
          .eq("id", userMembership.id)
          .select();

        logStep("Update query completed", {
          hasData: !!updateData,
          dataLength: updateData?.length || 0,
          hasError: !!updateError,
          membershipId: userMembership.id
        });

        if (updateError) {
          logStep("Error updating membership status", { 
            error: updateError,
            errorCode: updateError.code,
            errorMessage: updateError.message,
            errorDetails: updateError.details,
            errorHint: updateError.hint,
            membershipId: userMembership.id,
            userId: user.id,
            fullError: JSON.stringify(updateError, Object.getOwnPropertyNames(updateError))
          });
          throw new Error(`Failed to update membership: ${updateError.message || JSON.stringify(updateError)}`);
        }

        if (!updateData || updateData.length === 0) {
          logStep("Warning: No rows updated - membership may already be cancelled", { 
            membershipId: userMembership.id,
            userId: user.id,
            currentStatus: userMembership.status
          });
          // Still return success as the membership might have already been cancelled
        } else {
          logStep("Membership cancelled successfully", { 
            membershipId: userMembership.id,
            updatedStatus: updateData[0].status,
            previousStatus: userMembership.status
          });
        }

        return new Response(JSON.stringify({
          success: true,
          message: "Membership cancelled successfully"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } catch (updateErr) {
        const updateErrorMessage = updateErr instanceof Error ? updateErr.message : String(updateErr);
        const updateErrorStack = updateErr instanceof Error ? updateErr.stack : undefined;
        logStep("Exception during membership update", { 
          error: updateErrorMessage,
          stack: updateErrorStack,
          errorType: updateErr?.constructor?.name || typeof updateErr,
          membershipId: userMembership.id,
          userId: user.id
        });
        throw updateErr;
      }
    }

    // Stripe membership - cancel via Stripe
    logStep("Processing Stripe membership cancellation", {
      paymentMethod,
      stripeSubscriptionId,
      membershipId: userMembership.id
    });
    
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });

    // If we have stripe_subscription_id, use it directly
    let subscription;
    if (userMembership.stripe_subscription_id) {
      try {
        subscription = await stripe.subscriptions.retrieve(userMembership.stripe_subscription_id);
        logStep("Retrieved subscription by ID", { subscriptionId: subscription.id });
      } catch (error) {
        logStep("Error retrieving subscription by ID, trying email lookup", { error });
        // Fall back to email lookup
        subscription = null;
      }
    }

    // If we don't have subscription yet, try email lookup
    if (!subscription) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      
      if (customers.data.length === 0) {
        // No Stripe customer but membership marked as Stripe - keep active until end_date
        logStep("No Stripe customer found but membership is Stripe - keeping active until end_date");
        
        // Keep status as "active" to maintain benefits until end_date
        const { error: updateError } = await supabaseClient
          .from("user_memberships")
          .update({
            status: "active", // Keep active until end_date
            updated_at: new Date().toISOString()
          })
          .eq("id", userMembership.id);

        if (updateError) {
          logStep("Error updating membership status", { error: updateError });
          throw updateError;
        }

        return new Response(JSON.stringify({
          success: true,
          message: "Membership will remain active until the end date. Benefits will continue until then."
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const customerId = customers.data[0].id;
      logStep("Found Stripe customer", { customerId });

      // Get active subscription
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });

      if (subscriptions.data.length === 0) {
        // No active subscription but membership marked as Stripe - keep active until end_date
        logStep("No active Stripe subscription found - keeping active until end_date");
        
        // Keep status as "active" to maintain benefits until end_date
        const { error: updateError } = await supabaseClient
          .from("user_memberships")
          .update({
            status: "active", // Keep active until end_date
            updated_at: new Date().toISOString()
          })
          .eq("id", userMembership.id);

        if (updateError) {
          logStep("Error updating membership status", { error: updateError });
          throw updateError;
        }

        return new Response(JSON.stringify({
          success: true,
          message: "Membership will remain active until the end date. Benefits will continue until then."
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      subscription = subscriptions.data[0];
    }

    logStep("Found active subscription", { subscriptionId: subscription.id });

    // Cancel subscription at period end
    const canceledSubscription = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true
    });

    logStep("Subscription set to cancel at period end", { 
      subscriptionId: canceledSubscription.id,
      cancelAt: new Date(canceledSubscription.cancel_at! * 1000).toISOString()
    });

    // Update user_membership in database
    // Keep status as "active" to maintain benefits until period end
    // Stripe will handle the actual cancellation at period end
    const { error: updateError } = await supabaseClient
      .from("user_memberships")
      .update({
        status: "active", // Keep active until period end - Stripe handles cancellation
        updated_at: new Date().toISOString()
      })
      .eq("id", userMembership.id);

    if (updateError) {
      logStep("Error updating membership status", { error: updateError });
    } else {
      logStep("Membership will remain active until period end");
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Subscription will be cancelled at the end of the billing period. Your membership benefits will continue until then.",
      cancel_at: new Date(canceledSubscription.cancel_at! * 1000).toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    let errorMessage = "Unknown error";
    let errorDetails: any = {};
    
    try {
      if (error instanceof Error) {
        errorMessage = error.message;
        errorDetails = {
          name: error.name,
          message: error.message,
          stack: error.stack
        };
      } else if (typeof error === 'object' && error !== null) {
        // Try to extract error information from Supabase error objects
        errorMessage = (error as any).message || String(error);
        errorDetails = {
          code: (error as any).code,
          message: (error as any).message,
          details: (error as any).details,
          hint: (error as any).hint
        };
      } else {
        errorMessage = String(error);
      }
    } catch (parseError) {
      errorMessage = "Error parsing error object";
      logStep("CRITICAL: Failed to parse error", { parseError, originalError: error });
    }
    
    logStep("ERROR in cancel-subscription", { 
      message: errorMessage,
      details: errorDetails,
      errorType: error?.constructor?.name || typeof error
    });
    
    // Ensure we always return a proper response
    try {
      return new Response(JSON.stringify({ 
        error: errorMessage,
        errorDetails: errorDetails,
        success: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    } catch (responseError) {
      // Fallback if JSON.stringify fails
      logStep("CRITICAL: Failed to create error response", { 
        responseError,
        originalError: errorMessage
      });
      return new Response(`Internal Server Error: ${errorMessage}`, {
        headers: corsHeaders,
        status: 500,
      });
    }
  }
});
