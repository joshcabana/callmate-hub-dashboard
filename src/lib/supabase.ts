import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Demo mode when Supabase is not configured
export const isDemoMode = !supabaseUrl || !supabaseAnonKey;

export const supabase: SupabaseClient = isDemoMode
  ? (null as unknown as SupabaseClient) // placeholder — all queries go through demo helpers
  : createClient(supabaseUrl, supabaseAnonKey);

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
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  subscription_status: string | null;
  subscription_current_period_end: string | null;
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

// ── Demo Data ──────────────────────────────────────────────────────────────

const DEMO_BUSINESS: Business = {
  id: "demo-biz-001",
  owner_id: "demo-user-001",
  name: "Smith's Auto Repair",
  phone: "+61 412 345 678",
  twilio_number: "+1 555 123 4567",
  vapi_assistant_id: "asst_demo_abc123",
  plan: "starter",
  trial_ends_at: null,
  created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  updated_at: new Date().toISOString(),
  stripe_customer_id: null,
  stripe_subscription_id: null,
  stripe_price_id: null,
  subscription_status: null,
  subscription_current_period_end: null,
};

function generateDemoCallLogs(): CallLog[] {
  const intents = ["Appointment", "Pricing Inquiry", "Follow-up", "Emergency", "General Question"];
  const names = ["Sarah Chen", "Marcus Webb", "Elena Torres", "James O'Brien", "Priya Patel", "Liam Nguyen"];
  const numbers = ["+61 400 111 222", "+61 412 333 444", "+61 403 555 666", "+1 555 987 6543", "+44 7911 123456", "+61 499 876 543"];

  return Array.from({ length: 12 }, (_, i) => {
    const hoursAgo = i * 4 + Math.floor(Math.random() * 3);
    const created = new Date(Date.now() - hoursAgo * 3600000);
    const name = names[i % names.length];
    const intent = intents[i % intents.length];
    return {
      id: `demo-log-${i}`,
      call_id: `call_${Math.random().toString(36).slice(2, 10)}`,
      business_id: DEMO_BUSINESS.id,
      caller_number: numbers[i % numbers.length],
      caller_name: name,
      callback_number: i % 3 === 0 ? numbers[i % numbers.length] : null,
      intent_detected: intent,
      summary: `${name} called regarding ${intent.toLowerCase()}. ${
        i % 2 === 0
          ? "Caller requested a callback for tomorrow morning."
          : "Issue was resolved during the call."
      }`,
      transcript: `Agent: Good morning, Smith's Auto Repair. How can I help you today?\n\n${name}: Hi, I'm calling about ${intent.toLowerCase()}.\n\nAgent: Of course! I'd be happy to help with that. Let me pull up the details for you.\n\n${name}: That would be great, thank you.\n\nAgent: ${
        i % 2 === 0
          ? "I've noted your request. Would you like us to call you back tomorrow morning?"
          : "I've got all the information you need. Is there anything else I can help with?"
      }\n\n${name}: ${i % 2 === 0 ? "Yes please, that works perfectly." : "No, that's everything. Thanks!"}\n\nAgent: Wonderful. Have a great day!`,
      recording_url: null,
      raw_payload: null,
      created_at: created.toISOString(),
    };
  });
}

function generateDemoMetrics(): DashboardMetrics {
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const now = new Date();
  const dailyCounts: { day: string; calls: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    dailyCounts.push({
      day: dayLabels[d.getDay()],
      calls: Math.floor(Math.random() * 18) + 5,
    });
  }

  const callsThisWeek = dailyCounts.reduce((s, d) => s + d.calls, 0);
  const callsLastWeek = Math.floor(callsThisWeek * (0.75 + Math.random() * 0.3));

  return {
    totalCalls: 847,
    totalMinutes: 2_134,
    callsThisWeek,
    callsLastWeek,
    minutesThisWeek: callsThisWeek * 3,
    minutesLastWeek: callsLastWeek * 3,
    dailyCounts,
  };
}

// ── Queries ────────────────────────────────────────────────────────────────

export async function fetchCallLogs(): Promise<CallLog[]> {
  if (isDemoMode) return generateDemoCallLogs();

  const { data, error } = await supabase
    .from("call_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchBusiness(): Promise<Business | null> {
  if (isDemoMode) return DEMO_BUSINESS;

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
  if (isDemoMode) return { ...DEMO_BUSINESS, name, phone: phone ?? null };

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
  if (isDemoMode) return;

  const { error } = await supabase
    .from("businesses")
    .update(updates)
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  if (isDemoMode) return generateDemoMetrics();

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
