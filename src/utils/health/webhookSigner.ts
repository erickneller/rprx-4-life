/**
 * HMAC signature generation for secure webhook calls.
 * Frontend reads VITE_WEBHOOK_SIGNING_SECRET; the edge function reads RPRX_WEBHOOK_SIGNING_SECRET.
 * Both must hold the same value.
 */
const SIGNING_SECRET = (import.meta as any).env?.VITE_WEBHOOK_SIGNING_SECRET || '';

export async function generateSignature(payload: string): Promise<{ signature: string; timestamp: string }> {
  const timestamp = Date.now().toString();
  if (!SIGNING_SECRET) return { signature: '', timestamp: '' };

  const encoder = new TextEncoder();
  const data = encoder.encode(`${timestamp}.${payload}`);
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(SIGNING_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, data);
  const signature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return { signature, timestamp };
}

export async function createSignedHeaders(payload: string): Promise<Record<string, string>> {
  const { signature, timestamp } = await generateSignature(payload);
  if (!signature) return {};
  return { 'x-signature': signature, 'x-timestamp': timestamp };
}
