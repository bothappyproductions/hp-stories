// POST /api/portal/logout {slug}
import { json, readBody, clearCookie, cookieDomain, cleanSlug } from './_lib.js';

export async function onRequestPost({ request }) {
  const d = await readBody(request);
  const slug = cleanSlug(d?.slug);
  if (!slug) return json({ ok: true });
  return json({ ok: true }, 200, { 'set-cookie': clearCookie(slug, cookieDomain(request)) });
}
