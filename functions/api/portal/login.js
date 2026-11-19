// POST /api/portal/login  {slug?, passcode}
// With a slug: checks that portal's passcode. Without one: finds the portal the passcode belongs to.
import { json, readBody, getPortal, getPortalByPasscode, sessionCookie, cookieDomain, P, token, cleanSlug } from './_lib.js';

const slow = () => new Promise(r => setTimeout(r, 700));

export async function onRequestPost({ request, env }) {
  if (!token(env)) return json({ error: 'not_configured' }, 503);
  const d = await readBody(request);
  const code = String(d?.passcode || '').trim().toLowerCase();
  if (!code) return json({ error: 'missing_passcode' }, 400);
  try {
    let row = null;
    if (d.slug) {
      const p = await getPortal(env, cleanSlug(d.slug));
      if (p && String(p.row.fields[P.passcode] || '').trim().toLowerCase() === code && p.row.fields[P.status] !== 'Paused') row = p.row;
    } else {
      row = await getPortalByPasscode(env, code);
    }
    if (!row) { await slow(); return json({ error: 'wrong_passcode' }, 401); }
    const slug = row.fields[P.slug];
    return json({ ok: true, slug }, 200, { 'set-cookie': await sessionCookie(env, slug, row.fields[P.passcode], cookieDomain(request)) });
  } catch (e) {
    return json({ error: 'airtable_unreachable', status: e.status || 0 }, 502);
  }
}
