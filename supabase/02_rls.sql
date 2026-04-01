-- ============================================
-- Enable RLS on all tables
-- ============================================
ALTER TABLE businesses    ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls         ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- businesses policies
-- ============================================
CREATE POLICY "Users can view own business"
  ON businesses FOR SELECT
  TO authenticated
  USING (owner_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own business"
  ON businesses FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own business"
  ON businesses FOR UPDATE
  TO authenticated
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()));

-- ============================================
-- calls policies
-- ============================================
CREATE POLICY "Users can view own calls"
  ON calls FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Service role can insert calls"
  ON calls FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================
-- call_logs policies
-- ============================================
CREATE POLICY "Users can view own call logs"
  ON call_logs FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Service role can insert call logs"
  ON call_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================
-- subscriptions policies
-- ============================================
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
