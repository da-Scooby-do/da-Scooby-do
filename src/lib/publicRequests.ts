import { supabase } from '@/lib/supabase';

function newId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  // Older browsers without randomUUID: build a v4 uuid from random bytes.
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/**
 * Inserts a rental/project request without reading the row back: visitors
 * have no SELECT access to requests, so `.insert().select()` is rejected by
 * RLS. The server-generated reference is fetched via `request_reference_for`.
 */
export async function submitPublicRequest<T extends Record<string, unknown>>(
  table: 'rental_requests' | 'project_requests',
  row: T,
): Promise<T & { id: string; request_reference: string; created_at: string }> {
  const id = newId();
  const { error } = await supabase.from(table).insert({ ...row, id });
  if (error) throw error;

  const { data: reference } = await supabase.rpc('request_reference_for', {
    p_kind: table === 'rental_requests' ? 'rental' : 'project',
    p_id: id,
  });

  return { ...row, id, request_reference: (reference as string | null) || '', created_at: new Date().toISOString() };
}
