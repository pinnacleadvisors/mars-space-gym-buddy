import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
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

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });

    // Find customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found");
      return new Response(JSON.stringify({ 
        has_subscription: false,
        message: "No Stripe customer found"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      logStep("No active subscription found");
      return new Response(JSON.stringify({ 
        has_subscription: false,
        message: "No active subscription"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subscription = subscriptions.data[0];
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    
    logStep("Active subscription found", { 
      subscriptionId: subscription.id, 
      endDate: currentPeriodEnd.toISOString() 
    });

    // Get the membership from database
    const { data: membership } = await supabaseClient
      .from("memberships")
      .select("*")
      .eq("price", 150)
      .single();

    if (!membership) {
      throw new Error("Membership not found in database");
    }

    // Update or create user_membership record
    const { data: existingMembership } = await supabaseClient
      .from("user_memberships")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingMembership) {
      // Update existing membership
      const { error: updateError } = await supabaseClient
        .from("user_memberships")
        .update({
          status: "active",
          payment_status: "paid",
          payment_method: "stripe",
          stripe_subscription_id: subscription.id,
          end_date: currentPeriodEnd.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", existingMembership.id);

      if (updateError) {
        logStep("Error updating membership", { error: updateError });
      } else {
        logStep("Membership updated successfully", { 
          subscriptionId: subscription.id,
          paymentMethod: "stripe"
        });
      }
    } else {
      // Create new membership record
      const startDate = new Date(subscription.current_period_start * 1000);
      const { error: insertError } = await supabaseClient
        .from("user_memberships")
        .insert({
          user_id: user.id,
          membership_id: membership.id,
          start_date: startDate.toISOString(),
          end_date: currentPeriodEnd.toISOString(),
          status: "active",
          payment_status: "paid",
          payment_method: "stripe",
          stripe_subscription_id: subscription.id
        });

      if (insertError) {
        logStep("Error creating membership", { error: insertError });
      } else {
        logStep("Membership created successfully", { 
          subscriptionId: subscription.id,
          paymentMethod: "stripe"
        });
      }
    }

    return new Response(JSON.stringify({
      has_subscription: true,
      subscription_id: subscription.id,
      subscription_end: currentPeriodEnd.toISOString(),
      status: subscription.status
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
