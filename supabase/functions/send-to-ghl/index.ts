import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature, x-timestamp, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function isValidString(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= maxLength;
}
function isValidOptionalNumber(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === 'number' && !isNaN(value) && isFinite(value));
}
function isValidOptionalString(value: unknown, maxLength: number): boolean {
  return value === undefined || value === null || (typeof value === 'string' && value.length <= maxLength);
}
function isValidOptionalBoolean(value: unknown): boolean {
  return value === undefined || value === null || typeof value === 'boolean';
}
function isValidOptionalStringArray(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (!Array.isArray(value)) return false;
  return value.every((item) => typeof item === 'string' && item.length <= 100);
}

interface AssessmentPayload {
  name: string;
  email: string;
  phone: string;
  persona: string;
  age?: number;
  sex?: string;
  bmi?: number;
  healthFlags: {
    smoker?: boolean;
    exerciseFrequency?: string;
    screeningGaps?: string[];
    insuranceGaps?: string[];
  };
  scores: { current: number; improvement: number; readiness: string };
}

function validatePayload(data: unknown): AssessmentPayload | null {
  if (!data || typeof data !== 'object') return null;
  const payload = data as Record<string, unknown>;

  if (!isValidString(payload.name, 100)) return null;
  if (!isValidString(payload.email, 255)) return null;
  if (!isValidString(payload.phone, 20)) return null;
  if (!isValidString(payload.persona, 50)) return null;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(payload.email as string)) return null;

  if (!isValidOptionalNumber(payload.age)) return null;
  if (!isValidOptionalString(payload.sex, 20)) return null;
  if (!isValidOptionalNumber(payload.bmi)) return null;

  if (!payload.healthFlags || typeof payload.healthFlags !== 'object') return null;
  const healthFlags = payload.healthFlags as Record<string, unknown>;
  if (!isValidOptionalBoolean(healthFlags.smoker)) return null;
  if (!isValidOptionalString(healthFlags.exerciseFrequency, 50)) return null;
  if (!isValidOptionalStringArray(healthFlags.screeningGaps)) return null;
  if (!isValidOptionalStringArray(healthFlags.insuranceGaps)) return null;

  if (!payload.scores || typeof payload.scores !== 'object') return null;
  const scores = payload.scores as Record<string, unknown>;
  if (typeof scores.current !== 'number' || isNaN(scores.current)) return null;
  if (typeof scores.improvement !== 'number' || isNaN(scores.improvement)) return null;
  if (!isValidString(scores.readiness, 50)) return null;

  return {
    name: (payload.name as string).trim().slice(0, 100),
    email: (payload.email as string).trim().toLowerCase().slice(0, 255),
    phone: (payload.phone as string).trim().slice(0, 20),
    persona: (payload.persona as string).trim().slice(0, 50),
    age: typeof payload.age === 'number' ? Math.min(Math.max(0, payload.age), 150) : undefined,
    sex: typeof payload.sex === 'string' ? payload.sex.trim().slice(0, 20) : undefined,
    bmi: typeof payload.bmi === 'number' ? Math.min(Math.max(0, payload.bmi), 100) : undefined,
    healthFlags: {
      smoker: typeof healthFlags.smoker === 'boolean' ? healthFlags.smoker : undefined,
      exerciseFrequency: typeof healthFlags.exerciseFrequency === 'string' ? healthFlags.exerciseFrequency.trim().slice(0, 50) : undefined,
      screeningGaps: Array.isArray(healthFlags.screeningGaps) ? healthFlags.screeningGaps.map((s) => String(s).slice(0, 100)).slice(0, 10) : undefined,
      insuranceGaps: Array.isArray(healthFlags.insuranceGaps) ? healthFlags.insuranceGaps.map((s) => String(s).slice(0, 100)).slice(0, 10) : undefined,
    },
    scores: {
      current: Math.min(Math.max(0, scores.current as number), 100),
      improvement: Math.min(Math.max(0, scores.improvement as number), 100),
      readiness: (scores.readiness as string).trim().slice(0, 50),
    },
  };
}

async function verifySignature(payload: string, signature: string, timestamp: string, secret: string): Promise<boolean> {
  const now = Date.now();
  const requestTime = parseInt(timestamp, 10);
  if (isNaN(requestTime) || Math.abs(now - requestTime) > 5 * 60 * 1000) return false;

  const encoder = new TextEncoder();
  const data = encoder.encode(`${timestamp}.${payload}`);
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, data);
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return signature === expectedSignature;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const webhookUrl = Deno.env.get('RPRX_GHL_WEBHOOK_URL');
    const signingSecret = Deno.env.get('RPRX_WEBHOOK_SIGNING_SECRET');

    if (!webhookUrl) {
      console.error('Webhook URL not configured');
      return new Response(JSON.stringify({ error: 'Service configuration error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const rawBody = await req.text();

    if (signingSecret) {
      const signature = req.headers.get('x-signature');
      const timestamp = req.headers.get('x-timestamp');
      if (!signature || !timestamp) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const isValid = await verifySignature(rawBody, signature, timestamp, signingSecret);
      if (!isValid) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    let parsedPayload: any;
    try {
      parsedPayload = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid request format' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let ghlPayload: Record<string, unknown>;

    if (parsedPayload && parsedPayload.trigger === 'email_snapshot') {
      // Snapshot email trigger — lighter validation
      const name = typeof parsedPayload.name === 'string' ? parsedPayload.name.trim().slice(0, 100) : '';
      const email = typeof parsedPayload.email === 'string' ? parsedPayload.email.trim().toLowerCase().slice(0, 255) : '';
      const phone = typeof parsedPayload.phone === 'string' ? parsedPayload.phone.trim().slice(0, 20) : '';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        return new Response(JSON.stringify({ error: 'Invalid request data' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const snap = parsedPayload.snapshot || {};
      const nameParts = name.split(' ');
      ghlPayload = {
        trigger: 'email_snapshot',
        contact: {
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email,
          phone,
        },
        customFields: {
          persona: typeof parsedPayload.persona === 'string' ? parsedPayload.persona.slice(0, 50) : '',
          primaryHorseman: snap.primary_horseman ?? '',
          secondaryHorseman: snap.secondary_horseman ?? '',
          readinessScore: snap.readiness_score ?? null,
          readinessLabel: snap.readiness_label ?? '',
          recommendedTrack: snap.recommended_track ?? '',
          recommendedTrackName: snap.recommended_track_name ?? '',
          quickWins: Array.isArray(snap.quick_wins) ? snap.quick_wins.join(' | ') : '',
        },
      };
      console.log('Processing snapshot email:', { persona: ghlPayload.customFields });
    } else {
      const payload = validatePayload(parsedPayload);
      if (!payload) {
        return new Response(JSON.stringify({ error: 'Invalid request data' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      console.log('Processing assessment:', { persona: payload.persona, hasScores: !!payload.scores });

      const nameParts = payload.name.split(' ');
      ghlPayload = {
        contact: {
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: payload.email,
          phone: payload.phone,
        },
        customFields: {
          persona: payload.persona,
          age: payload.age,
          sex: payload.sex,
          bmi: payload.bmi,
          currentScore: payload.scores.current,
          improvementPotential: payload.scores.improvement,
          readinessTier: payload.scores.readiness,
          smoker: payload.healthFlags.smoker,
          exerciseFrequency: payload.healthFlags.exerciseFrequency,
          screeningGaps: payload.healthFlags.screeningGaps?.join(', ') || '',
          insuranceGaps: payload.healthFlags.insuranceGaps?.join(', ') || '',
        },
      };
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ghlPayload),
    });

    if (!response.ok) {
      console.error('GoHighLevel webhook failed:', response.status);
      return new Response(JSON.stringify({ error: 'Failed to process request' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }


    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Function error:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(JSON.stringify({ error: 'Failed to process request' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
