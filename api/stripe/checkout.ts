import { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Initialize Stripe
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2026-03-25.dahlia" });

// Initialize Supabase with Service Role ONLY for internal mutations
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { business_id, tier, price_id: rawPriceId } = req.body;

  if (!business_id) {
    return res.status(400).json({ error: "Missing business_id" });
  }

  // Resolve price_id: prefer explicit price_id, fall back to tier-based lookup
  const PRICE_MAP: Record<string, string | undefined> = {
    starter: process.env.STRIPE_PRICE_STARTER,
    pro: process.env.STRIPE_PRICE_PRO,
  };
  const resolvedPriceId = rawPriceId || (tier ? PRICE_MAP[tier] : undefined);

  // Ensure request is authenticated
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  try {
    // Scaffold isolated client bound to the request's JWT
    const userSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // 1. Fetch the business record via RLS (prevents IDOR)
    const { data: business, error } = await userSupabase
      .from("businesses")
      .select("*")
      .eq("id", business_id)
      .single();

    if (error || !business) {
      console.error("Error fetching business or unauthorized IDOR attempt:", error);
      return res.status(404).json({ error: "Business not found or unauthorized." });
    }

    const returnUrl = `${req.headers.origin || "http://localhost:5173"}/billing`;
    let stripeCustomerId = business.stripe_customer_id;

    // 2. Manage existing active customer via Portal
    if (stripeCustomerId && business.subscription_status === "active") {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: returnUrl,
      });

      return res.status(200).json({ url: portalSession.url });
    }

    // 3. Ensure a Stripe Customer exists (if missing)
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        name: business.name,
        metadata: {
          businessId: business.id
        }
      });
      stripeCustomerId = customer.id;

      // Persist the new customer ID using the admin client just in case
      await adminSupabase
        .from("businesses")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", business_id);
    }

    if (!resolvedPriceId) {
      return res.status(400).json({ error: "Missing or invalid tier/price_id for new subscription." });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [
        {
          price: resolvedPriceId,
          quantity: 1,
        },
      ],
      success_url: `${returnUrl}?success=true`,
      cancel_url: `${returnUrl}?canceled=true`,
      client_reference_id: business.id, // Good for tracking
      subscription_data: {
        metadata: {
          businessId: business.id, // Embedded metadata guarantees it carries through to subscription webhooks
        },
      },
    });

    return res.status(200).json({ url: checkoutSession.url });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Stripe Error:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
