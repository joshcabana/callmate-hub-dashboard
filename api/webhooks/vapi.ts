import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

// Supabase Connection
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const BUSINESS_ID = process.env.BUSINESS_ID || '';

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

// Twilio Config
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';
const BUSINESS_OWNER_PHONE = process.env.BUSINESS_OWNER_PHONE || '';

const twilioClient = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN
  ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  : null;

async function sendSmsNotification(to: string, summary: string) {
  if (!twilioClient) {
    console.warn('Twilio not configured. Skipping SMS.');
    return;
  }
  const body = `CallMate AI — New Call:\n\n${summary.length > 1000 ? summary.slice(0, 997) + '...' : summary}`;
  try {
    const msg = await twilioClient.messages.create({ body, from: TWILIO_PHONE_NUMBER, to });
    console.log(`SMS sent: ${msg.sid}`);
  } catch (err) {
    console.error('SMS failed:', err);
  }
}

async function upsertCall(payload: {
  transcript: string;
  summary: string;
  recordingUrl: string;
  callerNumber: string;
  vapiCallId: string;
  durationSecs: number;
  rawPayload: Record<string, unknown>;
}): Promise<{ callId: string; isNew: boolean }> {
  if (!supabase || !BUSINESS_ID) {
    throw new Error('Missing SUPABASE config or BUSINESS_ID env var');
  }

  // Idempotent upsert on vapi_call_id
  const { data: call, error: callErr } = await supabase
    .from('calls')
    .upsert(
      {
        business_id: BUSINESS_ID,
        vapi_call_id: payload.vapiCallId,
        caller_number: payload.callerNumber,
        duration_secs: payload.durationSecs,
        status: 'completed',
      },
      { onConflict: 'vapi_call_id', ignoreDuplicates: false }
    )
    .select('id, created_at')
    .single();

  if (callErr) throw new Error(`calls upsert: ${callErr.message}`);

  const ageMs = Date.now() - new Date(call.created_at).getTime();
  const isNew = ageMs < 10_000; // freshly created vs updated

  // Upsert call_log — idempotent on call_id (one log per call)
  const { error: logErr } = await supabase
    .from('call_logs')
    .upsert(
      {
        call_id: call.id,
        business_id: BUSINESS_ID,
        caller_number: payload.callerNumber,
        transcript: payload.transcript,
        summary: payload.summary,
        raw_payload: payload.rawPayload,
      },
      { onConflict: 'call_id', ignoreDuplicates: true }
    );

  if (logErr) throw new Error(`call_logs upsert: ${logErr.message}`);

  console.log(`Upserted call ${payload.vapiCallId} (id=${call.id}, isNew=${isNew})`);
  return { callId: call.id, isNew };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Method guard first
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Auth
  const secret = process.env.VAPI_WEBHOOK_SECRET;
  const provided = req.headers['x-vapi-secret'];
  if (!secret || provided !== secret) {
    console.error('Unauthorized webhook attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { message } = req.body || {};

    if (message?.type === 'end-of-call-report') {
      const transcript = message.transcript || message.artifact?.transcript || '';
      const summary = message.summary || message.analysis?.summary || message.artifact?.summary || '';
      const recordingUrl = message.recordingUrl || message.call?.recordingUrl || message.artifact?.recordingUrl || '';
      const callerNumber = message.call?.customer?.number || message.customer?.number || 'unknown';
      const vapiCallId = message.call?.id || message.callId || `vapi-fallback-${Date.now()}`;
      const durationSecs: number =
        message.call?.endedAt && message.call?.startedAt
          ? Math.round(
              (new Date(message.call.endedAt).getTime() - new Date(message.call.startedAt).getTime()) / 1000
            )
          : (message.call?.duration ?? 0);

      const { isNew } = await upsertCall({
        transcript,
        summary,
        recordingUrl,
        callerNumber,
        vapiCallId,
        durationSecs,
        rawPayload: req.body,
      });

      // Only SMS on genuinely new calls, not retried webhooks
      if (isNew && BUSINESS_OWNER_PHONE && summary) {
        await sendSmsNotification(BUSINESS_OWNER_PHONE, summary);
      }
    } else {
      console.log('Ignoring non-terminal event type:', message?.type ?? 'unknown');
    }

    // Always 200 — prevents Vapi infinite retry loops
    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook handler error:', err);
    // Still 200 — log in Vercel, don't trigger Vapi retries
    return res.status(200).json({ status: 'error_logged' });
  }
}
