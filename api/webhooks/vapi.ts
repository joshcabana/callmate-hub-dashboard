import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

// Supabase Direct Connection
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

// Helper: Twilio Notification
async function sendSmsNotification(to: string, summary: string) {
  if (!twilioClient) {
    console.warn('Twilio client not initialized. Skipping SMS.');
    return;
  }
  
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

// Helper: Direct Supabase Insert
async function writeToSupabase(payload: {
  transcript: string;
  summary: string;
  recordingUrl: string;
  callerNumber: string;
  vapiCallId: string;
  rawPayload: Record<string, unknown>;
}) {
  if (!supabase || !BUSINESS_ID) {
    console.error('Missing Supabase Config or Business ID.');
    return;
  }

  try {
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

    if (callError) throw new Error(`calls insert error: ${callError.message}`);

    const { error: logError } = await supabase
      .from('call_logs')
      .insert({
        call_id: callData.id,
        business_id: BUSINESS_ID,
        caller_number: payload.callerNumber,
        transcript: payload.transcript,
        summary: payload.summary,
        raw_payload: payload.rawPayload,
      });

    if (logError) throw new Error(`call_logs insert error: ${logError.message}`);

    console.log(`✅ Successfully inserted call & log for ${payload.vapiCallId}`);
  } catch (err) {
    console.error('Unexpected error during Supabase write:', err);
  }
}

// Main Serverless Function Handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // 1. Authenticate Request
    const vapiSecretHeader = req.headers['x-vapi-secret'];
    const expectedSecret = process.env.VAPI_WEBHOOK_SECRET || '';
    
    if (!vapiSecretHeader || vapiSecretHeader !== expectedSecret) {
      console.error('Unauthorized request: Invalid or missing x-vapi-secret header.');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { message } = req.body || {};

    // 2. Process valid payload
    if (message && message.type === 'end-of-call-report') {
      const transcript = message.transcript || message.artifact?.transcript || '';
      const summary = message.summary || message.analysis?.summary || message.artifact?.summary || '';
      const recordingUrl = message.recordingUrl || message.call?.recordingUrl || message.artifact?.recordingUrl || '';
      const callerNumber = message.call?.customer?.number || message.customer?.number || '';
      const vapiCallId = message.call?.id || message.callId || `vapi-${Date.now()}`;

      // Await database insertion so AWS Lambda doesn't kill execution
      await writeToSupabase({
        transcript,
        summary,
        recordingUrl,
        callerNumber,
        vapiCallId,
        rawPayload: req.body,
      });

      // Await SMS
      if (BUSINESS_OWNER_PHONE && summary) {
        await sendSmsNotification(BUSINESS_OWNER_PHONE, summary);
      }
    } else {
      console.log('Received payload type:', message?.type || 'unknown');
    }

    // 3. Return success response
    return res.status(200).send('Webhook processed successfully');
  } catch (error) {
    console.error('Error in Vapi webhook handler:', error);
    // Vapi handles 500s silently in most cases but returning 200 avoids infinite retries
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
