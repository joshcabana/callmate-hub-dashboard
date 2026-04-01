-- Add Stripe columns to businesses table for monetization handling
ALTER TABLE businesses
ADD COLUMN stripe_customer_id TEXT UNIQUE,
ADD COLUMN stripe_subscription_id TEXT UNIQUE,
ADD COLUMN stripe_price_id TEXT,
ADD COLUMN subscription_status TEXT,
ADD COLUMN subscription_current_period_end TIMESTAMPTZ;

-- Add index on stripe_customer_id for faster webhook lookups
CREATE INDEX idx_businesses_stripe_customer_id ON businesses (stripe_customer_id);
