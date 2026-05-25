const AFFILIATE_KEY = 'rprx_affiliate_ref';
const TTL_DAYS = 90;

type StoredRef = { ref: string; capturedAt: number; landingPath?: string };

export function readStoredAffiliate(): StoredRef | null {
  try {
    const raw = localStorage.getItem(AFFILIATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredRef;
    const ageMs = Date.now() - parsed.capturedAt;
    if (ageMs > TTL_DAYS * 86400_000) {
      localStorage.removeItem(AFFILIATE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getStoredAffiliateRef(): string | null {
  return readStoredAffiliate()?.ref ?? null;
}

export function storeAffiliateRef(ref: string, landingPath?: string) {
  const payload: StoredRef = { ref, capturedAt: Date.now(), landingPath };
  try { localStorage.setItem(AFFILIATE_KEY, JSON.stringify(payload)); } catch {}
}
