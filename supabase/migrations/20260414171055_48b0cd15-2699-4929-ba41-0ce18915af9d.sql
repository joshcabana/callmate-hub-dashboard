
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Businesses
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  twilio_number TEXT,
  vapi_assistant_id TEXT,
  plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'growth', 'pro')),
  trial_ends_at TIMESTAMPTZ DEFAULT (now() + interval '14 days'),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  subscription_status TEXT,
  subscription_current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON public.businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_businesses_stripe_customer_id ON public.businesses(stripe_customer_id);

-- Calls
CREATE TABLE IF NOT EXISTS public.calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  vapi_call_id TEXT UNIQUE,
  caller_number TEXT,
  duration_secs INTEGER DEFAULT 0,
  status TEXT DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calls_business_id ON public.calls(business_id);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON public.calls(created_at DESC);

-- Call Logs
CREATE TABLE IF NOT EXISTS public.call_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id UUID NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  caller_number TEXT,
  transcript TEXT,
  summary TEXT,
  intent_detected TEXT,
  caller_name TEXT,
  callback_number TEXT,
  recording_url TEXT,
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.call_logs ADD CONSTRAINT call_logs_call_id_unique UNIQUE (call_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_business_id ON public.call_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_created_at ON public.call_logs(created_at DESC);

-- Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  plan TEXT NOT NULL DEFAULT 'starter',
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_business_id ON public.subscriptions(business_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);

-- Agent Configs (new table for persisting AI agent settings)
CREATE TABLE IF NOT EXISTS public.agent_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE UNIQUE,
  system_prompt TEXT NOT NULL DEFAULT '',
  voice TEXT NOT NULL DEFAULT 'sarah',
  interruption_sensitivity INTEGER NOT NULL DEFAULT 50 CHECK (interruption_sensitivity >= 0 AND interruption_sensitivity <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_configs ENABLE ROW LEVEL SECURITY;

-- Businesses policies
CREATE POLICY "Users can view own business" ON public.businesses FOR SELECT TO authenticated USING (owner_id = (SELECT auth.uid()));
CREATE POLICY "Users can insert own business" ON public.businesses FOR INSERT TO authenticated WITH CHECK (owner_id = (SELECT auth.uid()));
CREATE POLICY "Users can update own business" ON public.businesses FOR UPDATE TO authenticated USING (owner_id = (SELECT auth.uid())) WITH CHECK (owner_id = (SELECT auth.uid()));

-- Calls policies
CREATE POLICY "Users can view own calls" ON public.calls FOR SELECT TO authenticated USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = (SELECT auth.uid())));
CREATE POLICY "Service role can manage calls" ON public.calls FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Call logs policies
CREATE POLICY "Users can view own call logs" ON public.call_logs FOR SELECT TO authenticated USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = (SELECT auth.uid())));
CREATE POLICY "Service role can manage call logs" ON public.call_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Subscriptions policies
CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT TO authenticated USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = (SELECT auth.uid())));
CREATE POLICY "Service role can manage subscriptions" ON public.subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Agent configs policies
CREATE POLICY "Users can view own agent config" ON public.agent_configs FOR SELECT TO authenticated USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = (SELECT auth.uid())));
CREATE POLICY "Users can insert own agent config" ON public.agent_configs FOR INSERT TO authenticated WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_id = (SELECT auth.uid())));
CREATE POLICY "Users can update own agent config" ON public.agent_configs FOR UPDATE TO authenticated USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = (SELECT auth.uid())));

-- Auto-update triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_agent_configs_updated_at BEFORE UPDATE ON public.agent_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
