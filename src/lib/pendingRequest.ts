/**
 * A request the customer filled in before signing in. Kept on the device so it
 * survives a page reload or an email-confirmation round trip, then submitted
 * automatically once the customer is signed in with a company profile.
 */
export interface PendingRequest {
  table: 'rental_requests' | 'project_requests';
  row: Record<string, unknown>;
  /** Short description shown to the customer while it waits ("CAT 320 — 20 Ton"). */
  label: string;
  savedAt: number;
}

const KEY = 'sahab.pendingRequest';
const MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000;

export function savePendingRequest(p: Omit<PendingRequest, 'savedAt'>) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...p, savedAt: Date.now() }));
  } catch {
    // storage unavailable (private mode): the in-page flow still works
  }
}

export function loadPendingRequest(): PendingRequest | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as PendingRequest;
    if (!p?.table || !p.row || Date.now() - p.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

export function clearPendingRequest() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
