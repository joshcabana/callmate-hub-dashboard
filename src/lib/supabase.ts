import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Check .env.local for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Types ──────────────────────────────────────────────────────────────────

export interface CallLog {
  id: string;
  call_id: string | null;
  business_id: string | null;
  caller_number: string | null;
  transcript: string | null;
  summary: string | null;
  intent_detected: string | null;
  caller_name: string | null;
  callback_number: string | null;
  recording_url: string | null;
  raw_payload: Record<string, unknown> | null;
  created_at: string;
}

export interface Call {
  id: string;
  business_id: string;
  vapi_call_id: string | null;
  caller_number: string | null;
  duration_secs: number;
  status: string;
  created_at: string;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  phone: string | null;
  twilio_number: string | null;
  vapi_assistant_id: string | null;
  plan: "starter" | "growth" | "pro";
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardMetrics {
  totalCalls: number;
  totalMinutes: number;
  callsThisWeek: number;
  callsLastWeek: number;
  minutesThisWeek: number;
  minutesLastWeek: number;
  dailyCounts: { day: string; calls: number }[];
}

// ── Queries ────────────────────────────────────────────────────────────────

export async function fetchCallLogs(): Promise<CallLog[]> {
  const { data, error } = await supabase
    .from("call_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchBusiness(): Promise<Business | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function createBusiness(name: string, phone?: string): Promise<Business> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("businesses")
    .insert({ owner_id: user.id, name, phone: phone ?? null })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateBusiness(id: string, updates: Partial<Business>): Promise<void> {
  const { error } = await supabase
    .from("businesses")
    .update(updates)
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const now = new Date();
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - 6);
  startOfThisWeek.setHours(0, 0, 0, 0);

  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

  const { data: allCalls, error } = await supabase
    .from("calls")
    .select("id, duration_secs, created_at")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const calls = allCalls ?? [];

  const thisWeekCalls = calls.filter(
    (c) => new Date(c.created_at) >= startOfThisWeek
  );
  const lastWeekCalls = calls.filter(
    (c) =>
      new Date(c.created_at) >= startOfLastWeek &&
      new Date(c.created_at) < startOfThisWeek
  );

  // Build last-7-days daily chart
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dailyMap: Record<string, number> = {};

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().split("T")[0];
    dailyMap[key] = 0;
  }

  thisWeekCalls.forEach((c) => {
    const key = c.created_at.split("T")[0];
    if (key in dailyMap) dailyMap[key]++;
  });

  const dailyCounts = Object.entries(dailyMap).map(([date, count]) => ({
    day: dayLabels[new Date(date + "T12:00:00").getDay()],
    calls: count,
  }));

  const sumMinutes = (arr: typeof calls) =>
    Math.round(arr.reduce((acc, c) => acc + (c.duration_secs ?? 0), 0) / 60);

  return {
    totalCalls: calls.length,
    totalMinutes: sumMinutes(calls),
    callsThisWeek: thisWeekCalls.length,
    callsLastWeek: lastWeekCalls.length,
    minutesThisWeek: sumMinutes(thisWeekCalls),
    minutesLastWeek: sumMinutes(lastWeekCalls),
    dailyCounts,
  };
}
