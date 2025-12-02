import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// Validation utilities (inlined to avoid _shared import issues during deployment)
function validateEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.toLowerCase().trim());
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return false;
  }

  if (entry.count >= maxRequests) {
    return true;
  }

  entry.count++;
  return false;
}

function getClientIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown";
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting
  const clientIP = getClientIP(req);
  if (checkRateLimit(`checkout:${clientIP}`, 5, 60000)) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    
    // Validate email format
    if (!validateEmail(user.email)) {
      throw new Error("Invalid email format");
    }
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse request body to get membership_id and coupon_code
    let membershipId: string | null = null;
    let membershipPrice: number | null = null;
    let membershipName: string | null = null;
    let couponCode: string | null = null;
    let couponId: string | null = null;
    let discountAmount: number = 0;
    
    try {
      const body = await req.json();
      membershipId = body.membership_id || null;
      couponCode = body.coupon_code || null;
      logStep("Request body parsed", { membershipId, hasCouponCode: !!couponCode });
    } catch (parseError) {
      // Body might be empty or invalid JSON, that's okay - we'll use default price
      logStep("No request body or invalid JSON, will use default price");
    }

    // Fetch membership details if membership_id is provided
    if (membershipId) {
      const { data: membershipData, error: membershipError } = await supabaseClient
        .from("memberships")
        .select("id, price, name")
        .eq("id", membershipId)
        .single();

      if (membershipError) {
        logStep("Error fetching membership", { error: membershipError.message, membershipId });
        throw new Error(`Membership not found: ${membershipError.message}`);
      }

      if (membershipData) {
        membershipPrice = membershipData.price;
        membershipName = membershipData.name;
        logStep("Membership found", { 
          membershipId, 
          price: membershipPrice, 
          name: membershipName 
        });
      } else {
        logStep("Membership not found, will use default price", { membershipId });
      }
    }

    // Validate and apply coupon code if provided
    if (couponCode && couponCode.trim() !== "" && membershipPrice) {
      const normalizedCouponCode = couponCode.toUpperCase().trim();
      logStep("Validating coupon code", { code: normalizedCouponCode });

      // Validate coupon using database function
      const { data: isValid, error: validationError } = await supabaseClient
        .rpc("is_coupon_valid", { _code: normalizedCouponCode });

      if (validationError) {
        logStep("Error validating coupon", { error: validationError.message });
        throw new Error(`Failed to validate coupon code: ${validationError.message}`);
      }

      if (!isValid) {
        logStep("Invalid coupon code", { code: normalizedCouponCode });
        throw new Error("Invalid or expired coupon code");
      }

      // Fetch coupon details
      const { data: couponData, error: couponError } = await supabaseClient
        .from("coupon_codes")
        .select("id, type, value, description")
        .eq("code", normalizedCouponCode)
        .single();

      if (couponError || !couponData) {
        logStep("Error fetching coupon details", { error: couponError?.message });
        throw new Error("Coupon code not found");
      }

      couponId = couponData.id;

      // Calculate discount
      if (couponData.type === "percentage") {
        discountAmount = membershipPrice * (couponData.value / 100);
        logStep("Percentage discount calculated", { 
          percentage: couponData.value, 
          discountAmount,
          originalPrice: membershipPrice
        });
      } else {
        // money_off type
        discountAmount = couponData.value;
        logStep("Fixed amount discount calculated", { 
          discountAmount,
          originalPrice: membershipPrice
        });
      }

      // Apply discount (ensure price doesn't go below 0)
      membershipPrice = Math.max(0, membershipPrice - discountAmount);
      logStep("Price after discount", { 
        originalPrice: membershipPrice + discountAmount,
        discountAmount,
        finalPrice: membershipPrice,
        couponId
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id
        }
      });
      customerId = customer.id;
      logStep("New customer created", { customerId });
    }

    // Determine which Stripe price to use
    let stripePriceId: string;
    
    if (membershipPrice && membershipPrice > 0) {
      // Convert price from pounds to pence (Stripe uses smallest currency unit)
      const priceInPence = Math.round(membershipPrice * 100);
      
      logStep("Looking for or creating Stripe price", { 
        priceInPounds: membershipPrice, 
        priceInPence 
      });
      
      // Try to find existing price with this amount
      const existingPrices = await stripe.prices.list({
        active: true,
        type: 'recurring',
        recurring: { interval: 'month' },
        currency: 'gbp',
        limit: 100,
      });
      
      const matchingPrice = existingPrices.data.find(
        price => price.unit_amount === priceInPence && 
                 price.currency === 'gbp' &&
                 price.recurring?.interval === 'month'
      );
      
      if (matchingPrice) {
        stripePriceId = matchingPrice.id;
        logStep("Using existing Stripe price", { 
          priceId: stripePriceId, 
          amount: priceInPence,
          priceName: matchingPrice.nickname || 'Unnamed'
        });
      } else {
        // Create a new price if it doesn't exist
        // Get Stripe Product ID from environment variable
        const productId = Deno.env.get("STRIPE_PRODUCT_ID");
        
        if (!productId) {
          logStep("STRIPE_PRODUCT_ID not set, attempting to find or create default product");
          
          // Try to find existing product
          const products = await stripe.products.list({ limit: 10 });
          const defaultProduct = products.data.find(p => 
            p.name.toLowerCase().includes('membership') || 
            p.name.toLowerCase().includes('gym')
          ) || products.data[0];
          
          if (defaultProduct) {
            logStep("Using existing Stripe product", { productId: defaultProduct.id });
            const newPrice = await stripe.prices.create({
              product: defaultProduct.id,
              unit_amount: priceInPence,
              currency: 'gbp',
              recurring: {
                interval: 'month',
              },
              nickname: membershipName || `£${membershipPrice}/month`,
            });
            
            stripePriceId = newPrice.id;
            logStep("Created new Stripe price", { 
              priceId: stripePriceId, 
              amount: priceInPence,
              productId: defaultProduct.id
            });
          } else {
            throw new Error("STRIPE_PRODUCT_ID environment variable is required. Please set it in Supabase Dashboard → Edge Functions → Secrets");
          }
        } else {
          const newPrice = await stripe.prices.create({
            product: productId,
            unit_amount: priceInPence,
            currency: 'gbp',
            recurring: {
              interval: 'month',
            },
            nickname: membershipName || `£${membershipPrice}/month`,
          });
          
          stripePriceId = newPrice.id;
          logStep("Created new Stripe price", { 
            priceId: stripePriceId, 
            amount: priceInPence,
            productId: productId
          });
        }
      }
    } else {
      // Fallback to default £150 price if no membership price found
      stripePriceId = "price_1STEriRpTziRf7OxCPXLGPLw";
      logStep("Using default price (no membership price found)", { 
        priceId: stripePriceId,
        reason: membershipPrice === null ? "No membership selected" : "Membership has no price"
      });
    }

    // Create checkout session for subscription
    // Determine base path based on origin (for GitHub Pages deployment)
    const origin = req.headers.get("origin") || "";
    const isProduction = origin.includes("pinnacleadvisors.github.io");
    const basePath = isProduction ? "/mars-space-gym-buddy" : "";
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}${basePath}/managememberships?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${basePath}/managememberships?canceled=true`,
      subscription_data: couponId ? {
        metadata: {
          coupon_id: couponId,
          coupon_code: couponCode || "",
        }
      } : undefined,
      metadata: {
        supabase_user_id: user.id,
        membership_id: membershipId || "",
        coupon_id: couponId || "",
        coupon_code: couponCode || "",
        original_price: membershipPrice && discountAmount > 0 
          ? String((membershipPrice + discountAmount) * 100) 
          : "",
        discount_amount: discountAmount > 0 ? String(discountAmount * 100) : "",
      }
    });

    logStep("Checkout session created", { 
      sessionId: session.id, 
      url: session.url, 
      priceId: stripePriceId,
      membershipId: membershipId || "default"
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
