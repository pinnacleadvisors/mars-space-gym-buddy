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

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

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
    const paymentMethod = userMembership.payment_method?.trim() || null;
    const stripeSubscriptionId = userMembership.stripe_subscription_id;
    
    logStep("Checking membership type", {
      paymentMethod,
      stripeSubscriptionId,
      membershipId: userMembership.id,
      userId: user.id,
      rawPaymentMethod: userMembership.payment_method
    });
    
    const isStripeMembership = paymentMethod === 'stripe' || 
                                (stripeSubscriptionId !== null && stripeSubscriptionId !== undefined && stripeSubscriptionId !== '');

    if (!isStripeMembership) {
      // Non-Stripe membership - just update database status
      logStep("Non-Stripe membership - cancelling in database only", { 
        paymentMethod: paymentMethod || 'null',
        membershipId: userMembership.id,
        userId: user.id
      });
      
      try {
        const { data: updateData, error: updateError } = await supabaseClient
          .from("user_memberships")
          .update({
            status: "cancelled",
            updated_at: new Date().toISOString()
          })
          .eq("id", userMembership.id)
          .select();

        if (updateError) {
          logStep("Error updating membership status", { 
            error: updateError,
            errorCode: updateError.code,
            errorMessage: updateError.message,
            errorDetails: updateError.details,
            errorHint: updateError.hint,
            membershipId: userMembership.id
          });
          throw new Error(`Failed to update membership: ${updateError.message || JSON.stringify(updateError)}`);
        }

        if (!updateData || updateData.length === 0) {
          logStep("Warning: No rows updated", { 
            membershipId: userMembership.id,
            userId: user.id
          });
          // Still return success as the membership might have already been cancelled
        } else {
          logStep("Membership cancelled successfully", { 
            membershipId: userMembership.id,
            updatedStatus: updateData[0].status
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
        logStep("Exception during membership update", { 
          error: updateErrorMessage,
          membershipId: userMembership.id
        });
        throw updateErr;
      }
    }

    // Stripe membership - cancel via Stripe
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
        // No Stripe customer but membership marked as Stripe - update database only
        logStep("No Stripe customer found but membership is Stripe - cancelling in database only");
        
        const { error: updateError } = await supabaseClient
          .from("user_memberships")
          .update({
            status: "cancelled",
            updated_at: new Date().toISOString()
          })
          .eq("id", userMembership.id);

        if (updateError) {
          logStep("Error updating membership status", { error: updateError });
          throw updateError;
        }

        return new Response(JSON.stringify({
          success: true,
          message: "Membership cancelled successfully"
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
        // No active subscription but membership marked as Stripe - update database only
        logStep("No active Stripe subscription found - cancelling in database only");
        
        const { error: updateError } = await supabaseClient
          .from("user_memberships")
          .update({
            status: "cancelled",
            updated_at: new Date().toISOString()
          })
          .eq("id", userMembership.id);

        if (updateError) {
          logStep("Error updating membership status", { error: updateError });
          throw updateError;
        }

        return new Response(JSON.stringify({
          success: true,
          message: "Membership cancelled successfully"
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
    const { error: updateError } = await supabaseClient
      .from("user_memberships")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString()
      })
      .eq("id", userMembership.id);

    if (updateError) {
      logStep("Error updating membership status", { error: updateError });
    } else {
      logStep("Membership status updated to cancelled");
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Subscription will be cancelled at the end of the billing period",
      cancel_at: new Date(canceledSubscription.cancel_at! * 1000).toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    logStep("ERROR in cancel-subscription", { 
      message: errorMessage,
      stack: errorStack,
      errorType: error?.constructor?.name || typeof error
    });
    
    // Ensure we always return a proper response
    try {
      return new Response(JSON.stringify({ 
        error: errorMessage,
        success: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    } catch (responseError) {
      // Fallback if JSON.stringify fails
      logStep("CRITICAL: Failed to create error response", { responseError });
      return new Response("Internal Server Error", {
        headers: corsHeaders,
        status: 500,
      });
    }
  }
});
