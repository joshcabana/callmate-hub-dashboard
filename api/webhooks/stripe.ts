import { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Initialize Stripe
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-11-20.acacia" });

// Initialize Supabase Service Role
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Required to parse raw body for Stripe signature validation
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;

  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    const rawBody = Buffer.concat(chunks);
    event = stripe.webhooks.constructEvent(rawBody.toString("utf8"), sig, STRIPE_WEBHOOK_SECRET);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Webhook signature verification failed:", error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const businessId = session.subscription_data?.metadata?.businessId;
      
      if (!businessId) {
          console.warn("checkout session missing businessId in metadata -> skipping");
          break;
      }

      const subscriptionId = session.subscription as string;
      await updateSubscriptionStatus(businessId, subscriptionId);
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const businessId = subscription.metadata?.businessId;
      
      if (!businessId) {
          console.warn("subscription missing businessId in metadata -> skipping");
          break;
      }

      await updateSubscriptionStatus(businessId, subscription.id);
      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  res.status(200).json({ received: true });
}

// Helper to pull fresh state from Stripe and UPSERT into businesses
async function updateSubscriptionStatus(businessId: string, subscriptionId: string) {
    try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id || null;
        
        await supabase
            .from("businesses")
            .update({
                stripe_subscription_id: subscription.id,
                stripe_price_id: priceId,
                subscription_status: subscription.status,
                subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq("id", businessId);
            
        console.log(`Successfully synced subscription state for business ${businessId}`);
    } catch (err) {
        console.error("Failed syncing subscription from Stripe to DB:", err);
    }
}
