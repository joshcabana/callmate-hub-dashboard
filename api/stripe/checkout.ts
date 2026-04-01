import { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Initialize Stripe
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-11-20.acacia" });

// Initialize Supabase with Service Role to bypass RLS securely in backends
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { business_id, price_id } = req.body;

  if (!business_id) {
    return res.status(400).json({ error: "Missing business_id" });
  }

  try {
    // 1. Fetch the business record
    const { data: business, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", business_id)
      .single();

    if (error || !business) {
      console.error("Error fetching business:", error);
      return res.status(404).json({ error: "Business not found." });
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

      // Persist the new customer ID
      await supabase
        .from("businesses")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", business_id);
    }

    // 4. Create new Checkout Session
    if (!price_id) {
      return res.status(400).json({ error: "Missing price_id to start a new subscription." });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [
        {
          price: price_id,
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
