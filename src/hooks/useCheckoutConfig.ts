import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  GHL_CHECKOUT_URLS,
  GHL_PUBLIC_FUNNEL_URL,
  type PlanKey,
  type IntervalKey,
} from '@/lib/ghlCheckoutConfig';

const FLAG_ID = 'ghl_checkout_config';
export const CHECKOUT_CONFIG_QUERY_KEY = ['feature-flag-value', FLAG_ID] as const;

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
  if (value == null || value === '') return DEFAULT_CHECKOUT_CONFIG;
  if (typeof value !== 'string') {
    console.warn('[checkout-config] unexpected non-string value, using defaults', { type: typeof value });
    return DEFAULT_CHECKOUT_CONFIG;
  }
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
      header: {
        title:
          typeof p?.header?.title === 'string' && p.header.title.trim()
            ? p.header.title
            : DEFAULT_CHECKOUT_HEADER.title,
        description:
          typeof p?.header?.description === 'string' && p.header.description.trim()
            ? p.header.description
            : DEFAULT_CHECKOUT_HEADER.description,
      },
    };
  } catch (err) {
    console.warn('[checkout-config] failed to JSON.parse stored value, using defaults', err);
    return DEFAULT_CHECKOUT_CONFIG;
  }
}

export interface UseCheckoutConfigResult {
  config: CheckoutConfig;
  isLoading: boolean;
  isError: boolean;
  /** True when the returned config is the static fallback (DB load failed or no row). */
  isDefault: boolean;
}

export function useCheckoutConfig(): UseCheckoutConfigResult {
  const { data, isLoading, isError, isSuccess } = useQuery({
    queryKey: CHECKOUT_CONFIG_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags' as any)
        .select('value')
        .eq('id', FLAG_ID)
        .maybeSingle();
      if (error) {
        console.error('[checkout-config] load failed', error);
        throw error;
      }
      return parse((data as any)?.value);
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    refetchOnWindowFocus: true,
  });
  return {
    config: data ?? DEFAULT_CHECKOUT_CONFIG,
    isLoading,
    isError,
    isDefault: !isSuccess || data == null,
  };
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
    onSuccess: () => qc.invalidateQueries({ queryKey: CHECKOUT_CONFIG_QUERY_KEY }),
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
