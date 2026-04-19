import { supabase } from '@/integrations/supabase/client';

/**
 * Parse CSV text into an array of row objects.
 * Handles quoted fields, escaped quotes ("") and newlines inside quoted cells.
 */
export function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const cells: string[][] = [];
  let row: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; }
        else { inQuotes = false; }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { row.push(cur); cur = ''; }
      else if (ch === '\n') { row.push(cur); cells.push(row); row = []; cur = ''; }
      else if (ch === '\r') { /* skip */ }
      else cur += ch;
    }
  }
  if (cur.length > 0 || row.length > 0) {
    row.push(cur);
    cells.push(row);
  }

  // Drop trailing empty rows
  while (cells.length > 0 && cells[cells.length - 1].every(c => c === '')) cells.pop();

  if (cells.length === 0) return { headers: [], rows: [] };

  const headers = cells[0];
  const rows: Record<string, string>[] = [];
  for (let r = 1; r < cells.length; r++) {
    const obj: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      obj[headers[c]] = cells[r][c] ?? '';
    }
    rows.push(obj);
  }
  return { headers, rows };
}

/**
 * Coerce CSV string values into JS types best-effort:
 * - "" → null
 * - "true"/"false" → boolean
 * - numeric strings → number
 * - strings starting with { or [ → JSON.parse
 */
export function coerceRow(row: Record<string, string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === '' || v === null || v === undefined) {
      out[k] = null;
      continue;
    }
    const trimmed = v.trim();
    if (trimmed === 'true') { out[k] = true; continue; }
    if (trimmed === 'false') { out[k] = false; continue; }
    if (trimmed === 'null') { out[k] = null; continue; }
    if (/^-?\d+$/.test(trimmed)) { out[k] = parseInt(trimmed, 10); continue; }
    if (/^-?\d*\.\d+$/.test(trimmed)) { out[k] = parseFloat(trimmed); continue; }
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try { out[k] = JSON.parse(trimmed); continue; } catch { /* fall through */ }
    }
    out[k] = v;
  }
  return out;
}

export async function importTableViaEdge(
  tableName: string,
  rows: Record<string, unknown>[],
  mode: 'upsert' | 'replace'
): Promise<{ rowsProcessed: number }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const res = await fetch(
    `https://${projectId}.supabase.co/functions/v1/admin-data-import`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ table: tableName, rows, mode }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Import failed');
  }
  return await res.json();
}
