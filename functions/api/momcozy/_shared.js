// Momcozy booking API: shared Airtable helpers. Reads and writes only the
// "Momcozy Bookings" base. Needs the AIRTABLE_TOKEN secret on the Pages project.
export const BASE = 'appNfNxclPlNasoSg';
export const TABLE = 'tblFXEwIYUqASgnar';
export const F = {
  mom: 'fldvxonQAHcwL3XWe', email: 'fldwv1qvTzM1YcA0q', phone: 'fldtLKL99g5pWjkvw', address: 'fld3TccXxUVMIKChA',
  area: 'fld19LJHyeQYHMlDj', slot: 'fldorF3dffRMLyDef', slot_id: 'fldYMnNHPWlvPps8O', status: 'fldvWkPSRJmIQA9It',
  who: 'fldSmEYnXFPISI4RY', dad: 'fldGDFjvmTUKT0NzK', kids: 'fldMTYSz9hfHjSisL', pay: 'fldxHrrBsxo4CjXEQ',
  scripts_ok: 'fldwN6Gz7TpKPiY6a', scripts_not_ok: 'flddvBcI5HhDyvRlO', home: 'fldcQ3GmXa9CCDmB5',
  social_ok: 'fldLQzVSBXxfzaJ9l', release_signed: 'flddxu9HNFyt4uEXP', signed_name: 'fldYcqM7idF6mRnsu',
  guardian_for: 'fldbGDJGPmcb1YhvD', signature: 'fld4bUrDPeutM37ke', signed_at: 'fldDLzPkl9L7uvxbt',
  notes: 'fldkQqVQSGScqvYRu', payment: 'fldUhtiYHWVWlTsWZ',
};
export const SLOT_IDS = ['s1', 's2', 's3', 's4', 't1', 't2'];

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
}

async function at(env, path, init = {}) {
  const r = await fetch(`https://api.airtable.com/v0/${BASE}/${TABLE}${path}`, {
    ...init, headers: { authorization: `Bearer ${env.AIRTABLE_TOKEN}`, 'content-type': 'application/json', ...(init.headers || {}) },
  });
  if (!r.ok) throw new Error(`airtable ${r.status}: ${await r.text()}`);
  return r.json();
}

// Every active (not cancelled) booking for a real slot, oldest first.
export async function activeBookings(env) {
  const formula = encodeURIComponent(`AND(OR(${SLOT_IDS.map(s => `{Slot ID}='${s}'`).join(',')}),{Status}!='Cancelled')`);
  const out = []; let offset = '';
  do {
    const page = await at(env, `?returnFieldsByFieldId=true&filterByFormula=${formula}&pageSize=100${offset ? `&offset=${offset}` : ''}`);
    out.push(...page.records); offset = page.offset || '';
  } while (offset);
  return out.sort((a, b) => a.createdTime.localeCompare(b.createdTime) || a.id.localeCompare(b.id));
}

export function takenMap(records) {
  const taken = {};
  for (const r of records) { const s = r.fields[F.slot_id]; if (s && !taken[s]) taken[s] = r.fields[F.area] || ''; }
  return taken;
}

export const create = (env, fields) => at(env, '', { method: 'POST', body: JSON.stringify({ records: [{ fields }], typecast: true, returnFieldsByFieldId: true }) });
export const patch = (env, id, fields) => at(env, '', { method: 'PATCH', body: JSON.stringify({ records: [{ id, fields }], typecast: true }) });
