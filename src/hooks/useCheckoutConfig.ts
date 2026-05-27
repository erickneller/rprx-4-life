import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  GHL_CHECKOUT_URLS,
  GHL_PUBLIC_FUNNEL_URL,
  type PlanKey,
  type IntervalKey,
} from '@/lib/ghlCheckoutConfig';

const FLAG_ID = 'ghl_checkout_config';

export type CheckoutMode = 'url' | 'embed';
export interface CheckoutSlot {
  mode: CheckoutMode;
  value: string;
}

export interface CheckoutHeader {
  title: string;
  description: string;
}

export interface CheckoutConfig {
  partner: Record<IntervalKey, CheckoutSlot>;
  pro: Record<IntervalKey, CheckoutSlot>;
  publicFunnel: string;
  header: CheckoutHeader;
}

function defaultSlot(plan: PlanKey, interval: IntervalKey): CheckoutSlot {
  const url = GHL_CHECKOUT_URLS[plan][interval];
  return { mode: 'url', value: url.includes('REPLACE_') ? '' : url };
}

export const DEFAULT_CHECKOUT_HEADER: CheckoutHeader = {
  title: 'Upgrade your plan',
  description: "Secure checkout powered by GoHighLevel. You'll stay logged in here — your access updates automatically.",
};

export const DEFAULT_CHECKOUT_CONFIG: CheckoutConfig = {
  partner: { month: defaultSlot('partner', 'month'), year: defaultSlot('partner', 'year') },
  pro: { month: defaultSlot('pro', 'month'), year: defaultSlot('pro', 'year') },
  publicFunnel: GHL_PUBLIC_FUNNEL_URL,
  header: DEFAULT_CHECKOUT_HEADER,
};

function parse(value: unknown): CheckoutConfig {
  if (typeof value !== 'string' || !value) return DEFAULT_CHECKOUT_CONFIG;
  try {
    const p = JSON.parse(value);
    const slot = (s: any, fallback: CheckoutSlot): CheckoutSlot => ({
      mode: s?.mode === 'embed' ? 'embed' : 'url',
      value: typeof s?.value === 'string' ? s.value : fallback.value,
    });
    return {
      partner: {
        month: slot(p?.partner?.month, DEFAULT_CHECKOUT_CONFIG.partner.month),
        year: slot(p?.partner?.year, DEFAULT_CHECKOUT_CONFIG.partner.year),
      },
      pro: {
        month: slot(p?.pro?.month, DEFAULT_CHECKOUT_CONFIG.pro.month),
        year: slot(p?.pro?.year, DEFAULT_CHECKOUT_CONFIG.pro.year),
      },
      publicFunnel:
        typeof p?.publicFunnel === 'string' && p.publicFunnel
          ? p.publicFunnel
          : DEFAULT_CHECKOUT_CONFIG.publicFunnel,
    };
  } catch {
    return DEFAULT_CHECKOUT_CONFIG;
  }
}

export function useCheckoutConfig() {
  const { data, isLoading } = useQuery({
    queryKey: ['feature-flag', FLAG_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags' as any)
        .select('value')
        .eq('id', FLAG_ID)
        .maybeSingle();
      if (error) throw error;
      return parse((data as any)?.value);
    },
    staleTime: 60_000,
  });
  return { config: data ?? DEFAULT_CHECKOUT_CONFIG, isLoading };
}

export function useUpdateCheckoutConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (config: CheckoutConfig) => {
      const { error } = await supabase
        .from('feature_flags' as any)
        .upsert(
          {
            id: FLAG_ID,
            enabled: true,
            value: JSON.stringify(config),
            updated_at: new Date().toISOString(),
          } as any,
          { onConflict: 'id' },
        );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feature-flag', FLAG_ID] }),
  });
}

/**
 * Validate an embed snippet — only iframe/script tags whose src points at
 * approved GHL/RPRx domains are allowed. Returns null when valid, else a reason.
 */
const ALLOWED_HOST_RE = /(^|\.)?(link\.rprx4life\.com|leadconnectorhq\.com|msgsndr\.com)$/i;

export function validateEmbedSnippet(html: string): string | null {
  if (!html.trim()) return null; // empty is allowed (means "not configured")
  // Reject anything other than iframe/script tags.
  const tagRe = /<\s*([a-zA-Z0-9-]+)\b[^>]*>/g;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(html)) !== null) {
    const tag = m[1].toLowerCase();
    if (tag !== 'iframe' && tag !== 'script') {
      return `Tag <${tag}> is not allowed. Only <iframe> and <script> tags are permitted.`;
    }
  }
  // Every src= must point at an allowed host.
  const srcRe = /\bsrc\s*=\s*["']([^"']+)["']/gi;
  let s: RegExpExecArray | null;
  while ((s = srcRe.exec(html)) !== null) {
    try {
      const u = new URL(s[1], 'https://placeholder.local');
      if (u.protocol !== 'https:' && u.protocol !== 'http:') {
        return `Disallowed URL scheme in src: ${s[1]}`;
      }
      if (!ALLOWED_HOST_RE.test(u.hostname)) {
        return `Disallowed host in src: ${u.hostname}. Allowed: link.rprx4life.com, *.leadconnectorhq.com, *.msgsndr.com.`;
      }
    } catch {
      return `Invalid src URL: ${s[1]}`;
    }
  }
  return null;
}
