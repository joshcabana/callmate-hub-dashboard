import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Check .env.local for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Types ──────────────────────────────────────────────────────────
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
  raw_payload: Record<string, unknown> | null;
  created_at: string;
}

// ── Queries ────────────────────────────────────────────────────────
export async function fetchCallLogs(): Promise<CallLog[]> {
  const { data, error } = await supabase
    .from("call_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
