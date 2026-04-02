import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const VAPI_WEBHOOK_SECRET = process.env.VAPI_WEBHOOK_SECRET || '';

// ── Supabase Direct Connection ─────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const BUSINESS_ID = process.env.BUSINESS_ID || '';

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

// ── Twilio Config ──────────────────────────────────────────────────
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';
const BUSINESS_OWNER_PHONE = process.env.BUSINESS_OWNER_PHONE || '';

const twilioClient = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN 
  ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) 
  : null;

// Global Middleware
app.use(cors());
app.use(express.json());

// Security Middleware for Vapi webhooks
const verifyVapiSecret = (req: Request, res: Response, next: NextFunction) => {
  const vapiSecretHeader = req.headers['x-vapi-secret'];

  if (!vapiSecretHeader || vapiSecretHeader !== VAPI_WEBHOOK_SECRET) {
    console.error('Unauthorized request: Invalid or missing x-vapi-secret header.');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
};

// ── Twilio Notification ────────────────────────────────────────────
async function sendSmsNotification(to: string, summary: string) {
  if (!twilioClient) {
    console.warn('Twilio client not initialized (missing env config). Skipping SMS.');
    return;
  }
  
  // Format summary slightly so it's clean for SMS
  const cleanSummary = summary.length > 1000 ? summary.substring(0, 1000) + '...' : summary;
  
  try {
    const message = await twilioClient.messages.create({
      body: `Callmate AI - New Call Summary:\n\n${cleanSummary}`,
      from: TWILIO_PHONE_NUMBER,
      to,
    });
    console.log(`✅ SMS sent successfully: ${message.sid} to ${to}`);
  } catch (error) {
    console.error('❌ Failed to send Twilio SMS:', error);
  }
}

// ── Direct Supabase Insert ─────────────────────────────────────────
async function writeToSupabase(payload: {
  transcript: string;
  summary: string;
  recordingUrl: string;
  callerNumber: string;
  vapiCallId: string;
  rawPayload: Record<string, unknown>;
}) {
  if (!supabase) {
    console.warn('Supabase client not initialized. Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
    return;
  }

  if (!BUSINESS_ID) {
    console.error('BUSINESS_ID not set in .env. Cannot insert without FK reference.');
    return;
  }

  try {
    // Step 1: Insert into `calls` table (parent record)
    const { data: callData, error: callError } = await supabase
      .from('calls')
      .insert({
        business_id: BUSINESS_ID,
        vapi_call_id: payload.vapiCallId,
        caller_number: payload.callerNumber,
        status: 'completed',
      })
      .select('id')
      .single();

    if (callError) {
      console.error('Failed to insert into calls:', callError.message);
      return;
    }

    console.log(`✅ Inserted call: ${callData.id}`);

    // Step 2: Insert into `call_logs` table (child record with FK to calls.id)
    const { data: logData, error: logError } = await supabase
      .from('call_logs')
      .insert({
        call_id: callData.id,
        business_id: BUSINESS_ID,
        caller_number: payload.callerNumber,
        transcript: payload.transcript,
        summary: payload.summary,
        raw_payload: payload.rawPayload,
      })
      .select('id')
      .single();

    if (logError) {
      console.error('Failed to insert into call_logs:', logError.message);
      return;
    }

    console.log(`✅ Inserted call_log: ${logData.id}`);
    console.log('🎯 Pipeline complete: Vapi → Server → Supabase');

  } catch (err) {
    console.error('Unexpected error during Supabase write:', err);
  }
}

// ── Webhook Route ──────────────────────────────────────────────────
app.post('/api/webhooks/vapi', verifyVapiSecret, (req: Request, res: Response) => {
  // 1. Immediately return 200 OK to prevent Vapi timeout
  res.status(200).send('Webhook received successfully');

  // 2. Asynchronous Decoupling
  (async () => {
    try {
      const { message } = req.body;

      if (message && message.type === 'end-of-call-report') {
        const transcript = message.transcript || message.artifact?.transcript || '';
        const summary = message.summary || message.analysis?.summary || message.artifact?.summary || '';
        const recordingUrl = message.recordingUrl || message.call?.recordingUrl || message.artifact?.recordingUrl || '';
        const callerNumber = message.call?.customer?.number || message.customer?.number || '';
        const vapiCallId = message.call?.id || message.callId || `vapi-${Date.now()}`;

        console.log('📞 Processed End-of-Call Report.');
        console.log(`   Caller: ${callerNumber}`);
        console.log(`   Call ID: ${vapiCallId}`);

        // 1. Write to DB
        await writeToSupabase({
          transcript,
          summary,
          recordingUrl,
          callerNumber,
          vapiCallId,
          rawPayload: req.body,
        });

        // 2. Send Twilio SMS to Business Owner
        if (BUSINESS_OWNER_PHONE && summary) {
           await sendSmsNotification(BUSINESS_OWNER_PHONE, summary);
        }

      } else {
        console.log('Received payload (unhandled schema/type merely logged for info).');
      }
    } catch (error) {
      console.error('Error during async webhook processing:', error);
    }
  })();
});

// ── Health Check ───────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    supabase: supabase ? 'connected' : 'not configured',
    twilio: twilioClient ? 'configured' : 'missing',
    business_id: BUSINESS_ID ? 'set' : 'missing',
    timestamp: new Date().toISOString(),
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 CallMate Webhook Server running on http://localhost:${PORT}`);
  console.log(`   Supabase: ${supabase ? '✅ Connected' : '❌ Not configured'}`);
  console.log(`   Twilio  : ${twilioClient ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   Business: ${BUSINESS_ID ? '✅ Set' : '❌ Missing'}`);
});
