// GET /api/portal/health -> can the portal reach its Airtable tables? (No data or secrets returned.)
import { json, list, token, T, P, TEMPLATE_SLUG } from './_lib.js';

export async function onRequestGet({ env }) {
  const which = env.PORTAL_AIRTABLE_TOKEN ? 'PORTAL_AIRTABLE_TOKEN' : env.AIRTABLE_TOKEN ? 'AIRTABLE_TOKEN' : 'none';
  if (!token(env)) return json({ ok: false, token: which });
  const out = { token: which };
  try { const r = await list(env, T.portals, `{${P.slug}}='${TEMPLATE_SLUG}'`); out.portals = r.length === 1 ? 'ok (formula by field id works)' : `found ${r.length}`; }
  catch (e) { out.portals = `error ${e.status || ''}`; }
  try { const r = await list(env, T.ledger, `AND({Client}='Baitulmaal', {Tag Status}!='Needs review')`, '&maxRecords=1'); out.ledger = `ok (${r.length})`; }
  catch (e) { out.ledger = `error ${e.status || ''}`; }
  out.ok = String(out.portals).startsWith('ok');
  return json(out);
}
