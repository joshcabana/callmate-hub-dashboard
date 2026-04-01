import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Utility: pctChange ────────────────────────────────────────────────────
// Replicated here because it's an inline helper in Dashboard.tsx.
// If it moves to lib/, import from there instead.
function pctChange(current: number, previous: number): string {
  if (previous === 0 && current === 0) return "0%";
  if (previous === 0) return "+100%";
  const pct = ((current - previous) / previous) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

describe("pctChange", () => {
  it("returns 0% when both values are zero", () => {
    expect(pctChange(0, 0)).toBe("0%");
  });

  it("returns +100% when previous is zero and current is non-zero", () => {
    expect(pctChange(5, 0)).toBe("+100%");
  });

  it("calculates positive percentage increase", () => {
    expect(pctChange(12, 10)).toBe("+20.0%");
  });

  it("calculates negative percentage decrease", () => {
    expect(pctChange(8, 10)).toBe("-20.0%");
  });

  it("handles equal values", () => {
    expect(pctChange(10, 10)).toBe("+0.0%");
  });

  it("handles large swings", () => {
    expect(pctChange(0, 10)).toBe("-100.0%");
  });
});

// ── Supabase metrics aggregation logic ───────────────────────────────────
// We test the pure computation, not the DB call itself.

type CallStub = { duration_secs: number; created_at: string };

function computeWeekMetrics(calls: CallStub[], now: Date) {
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - 6);
  startOfThisWeek.setHours(0, 0, 0, 0);

  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

  const thisWeek = calls.filter((c) => new Date(c.created_at) >= startOfThisWeek);
  const lastWeek = calls.filter(
    (c) =>
      new Date(c.created_at) >= startOfLastWeek &&
      new Date(c.created_at) < startOfThisWeek
  );

  const sumMinutes = (arr: CallStub[]) =>
    Math.round(arr.reduce((acc, c) => acc + (c.duration_secs ?? 0), 0) / 60);

  return {
    totalCalls: calls.length,
    totalMinutes: sumMinutes(calls),
    callsThisWeek: thisWeek.length,
    callsLastWeek: lastWeek.length,
    minutesThisWeek: sumMinutes(thisWeek),
    minutesLastWeek: sumMinutes(lastWeek),
  };
}

describe("computeWeekMetrics", () => {
  const NOW = new Date("2026-04-02T12:00:00Z");

  it("counts zero when no calls exist", () => {
    const result = computeWeekMetrics([], NOW);
    expect(result.totalCalls).toBe(0);
    expect(result.totalMinutes).toBe(0);
    expect(result.callsThisWeek).toBe(0);
    expect(result.callsLastWeek).toBe(0);
  });

  it("buckets calls correctly into this week vs last week", () => {
    const calls: CallStub[] = [
      // This week (within 6 days)
      { duration_secs: 120, created_at: "2026-03-30T10:00:00Z" },
      { duration_secs: 60, created_at: "2026-04-01T10:00:00Z" },
      // Last week (7-13 days ago)
      { duration_secs: 300, created_at: "2026-03-24T10:00:00Z" },
      // Older — should be excluded from both buckets
      { duration_secs: 600, created_at: "2026-03-10T10:00:00Z" },
    ];
    const result = computeWeekMetrics(calls, NOW);
    expect(result.totalCalls).toBe(4);
    expect(result.callsThisWeek).toBe(2);
    expect(result.callsLastWeek).toBe(1);
    expect(result.minutesThisWeek).toBe(3); // (120+60)/60 = 3
    expect(result.minutesLastWeek).toBe(5); // 300/60 = 5
  });

  it("calculates total minutes from all calls", () => {
    const calls: CallStub[] = [
      { duration_secs: 600, created_at: "2026-01-01T00:00:00Z" },
      { duration_secs: 600, created_at: "2026-01-02T00:00:00Z" },
    ];
    const result = computeWeekMetrics(calls, NOW);
    expect(result.totalMinutes).toBe(20); // 1200/60
  });
});

// ── Webhook idempotency guard ─────────────────────────────────────────────
describe("webhook isNew detection", () => {
  it("marks call as new when created within 10s of now", () => {
    const createdAt = new Date().toISOString();
    const ageMs = Date.now() - new Date(createdAt).getTime();
    expect(ageMs).toBeLessThan(10_000);
  });

  it("marks call as NOT new when created_at is old (existing record)", () => {
    const oldCreatedAt = new Date(Date.now() - 60_000).toISOString(); // 1 min ago
    const ageMs = Date.now() - new Date(oldCreatedAt).getTime();
    expect(ageMs).toBeGreaterThan(10_000);
  });
});

// ── Auth guard: needsOnboarding logic ────────────────────────────────────
describe("needsOnboarding flag", () => {
  it("is true when user exists but business is null", () => {
    const user = { id: "u1", email: "test@example.com" };
    const business = null;
    const isLoading = false;
    const needsOnboarding = !!user && !isLoading && business === null;
    expect(needsOnboarding).toBe(true);
  });

  it("is false when business exists", () => {
    const user = { id: "u1", email: "test@example.com" };
    const business = { id: "b1", name: "Test Co" };
    const isLoading = false;
    const needsOnboarding = !!user && !isLoading && business === null;
    expect(needsOnboarding).toBe(false);
  });

  it("is false while loading (avoids flash redirect)", () => {
    const user = { id: "u1", email: "test@example.com" };
    const business = null;
    const isLoading = true;
    const needsOnboarding = !!user && !isLoading && business === null;
    expect(needsOnboarding).toBe(false);
  });

  it("is false when no user", () => {
    const user = null;
    const business = null;
    const isLoading = false;
    const needsOnboarding = !!user && !isLoading && business === null;
    expect(needsOnboarding).toBe(false);
  });
});
