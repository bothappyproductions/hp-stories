// Client portal: shared helpers. Reads and writes ONLY the "Agency Agent" Airtable base
// (never Happy Productions Main Base). Token: PORTAL_AIRTABLE_TOKEN, else AIRTABLE_TOKEN.
// Team edits portal content in the Portals / Portal Briefs / Portal Videos tables;
// this code just renders it. Field IDs (not names) so renaming a column never breaks a portal.

export const BASE = 'appfRWVuUInEfhINj';
export const T = {
  portals: 'tbl86UtJ3c7rZMga8',
  briefs: 'tblJaUv4q9m1BuvUL',
  videos: 'tblulDFqX31Y2F2iP',
  activity: 'tblHSTE8hRpvtjudR',
  requests: 'tblypQxSKyIhMwifg', // Video Requests (the editing dispatcher's queue)
  ledger: 'tblAs54E7s8G1ygyA',   // Post Ledger (Impact Report numbers)
};

export const P = { // Portals
  client: 'fld9D3PTSKp2IJXeh', slug: 'fldLUwZCyNdOIAhIQ', passcode: 'fldkSJANF9yHAUL0H', status: 'fldin0UnY5OZr0mmA',
  contact: 'fldfDYOMnH8xstavE', contactEmail: 'fldG8HkUE98ndAE8i', website: 'fldHqTHp3Zrdzs3F0',
  producer: 'fldFyPwxWKKTDxU4N', producerEmail: 'fldGcrY3GQsDmU4hy', producerPhone: 'fldnpa0bx1fMGjKk4',
  logo: 'fldIJzPiHehfFGEN7', brand: 'fldHPcK9Nji6q9kJr', ink: 'fldMbgZUCIfFlt4dZ', paper: 'fld5rXuMjyt7u9UkU',
  display: 'fld07Bdr3xdWNtkDy', body: 'fldm6WQuSDIkPEess', headline: 'flddgx6xUt9USaX93', note: 'fldOH6UGXe2DKv6El',
  video: 'fldtWHIgfLYE4D6c9', next: 'flde5a0HHrckv9QSo', nextLink: 'fldlStUuCI4qPQmvE', plan: 'fld0b1PDcOUweWXHq',
  frame: 'fld0zwuBhHsGIXtKy', reportName: 'fldFKzQ7bTQ772OlX', autoQueue: 'fldIOXXrmfnorpiuv',
  intake: 'fld4VprWn5YtMOmd7', internal: 'fldGJtiJS46RP1vrM',
};
export const B = { // Portal Briefs
  title: 'fldayNLuiQLoiIe8N', portal: 'flduPb51vEBe5G5SC', kind: 'fldk45yprkSZgpH3k', status: 'fldu6oWyYIfnlXA21',
  subtitle: 'fldGWihZ0gQPgKge6', dates: 'fldq4ptjiziBUTcaD', location: 'fld9avOQ06ovsehiV', hero: 'fldTAKuLCFAMySswB',
  glance: 'fld48NX0A7JLHtQB2', body: 'fldXzIeioO56OgVbP', order: 'fldEdu5GSdhfkeHmQ', approvedAt: 'fldiwy81krppyQwFp',
  approvedBy: 'fldLYssO0LT6iLtVH', comments: 'fldKOTAWM3yTi2eBO', slug: 'fldf0x6z0a7yYZ6sh',
};
export const V = { // Portal Videos
  title: 'fldic3KH3b9xYv2cY', portal: 'fldkHcR2FdAo7ZGd8', editKey: 'fld1Wi9r3lRLXzuYg', status: 'fldcoTlQwvYXeGyU4',
  version: 'fldNHxlyf6DAdPxiY', watch: 'fldmeoBrluoakvcro', thumb: 'fldY7AoBqcsbP4j7U', format: 'fldTUIpS87AaoyflJ',
  delivered: 'flds4tUHqel7LAuuP', note: 'fldylI2VqjdG3oXBE', lastAction: 'fldhciziBYtw92cCv', monday: 'fldu4erEVglUnLZ6x',
  slug: 'fldaNUi4OfVJe9jir',
};
export const A = { // Portal Activity
  summary: 'fldqFuCCLVMg4QMEG', portal: 'fldMrKHKEhZYO6ZkP', kind: 'flddpIaj99zxwBA8q', status: 'flduvKxBcsArMqfne',
  details: 'fldEzjc6yFrPsG0qi', from: 'fldwLRcxNEm5XDHkl', video: 'fldyGbcKHBG6rAIDb', brief: 'fldastTnVtfnBLcTU',
  vrRow: 'fldOHJUlEDnPJ2sDX', at: 'fldl94WxO01DGP7wb', slug: 'fldGA7s6lNixNoJ1g',
};
export const R = { // Video Requests
  request: 'fldWB94xVQtmCUAdh', client: 'fldSAVKPF4nUCqzoi', type: 'flduFQLRzjWke8rMy', sourceId: 'fld9RdMzsApH7JJFJ',
  sourceLink: 'fldBAsHXpeJAKBPFw', askedBy: 'fldYJrfyDE8Xa3IDg', askedAt: 'fldJJgWcyM9SlAW9J', due: 'fldNbNNaqM039q5O9',
  words: 'fldQQIFDPtHtAceMX', monday: 'fldWKFbKifNCpczTO', editKey: 'fldoZOJYKpVbtOv1i', status: 'fldZYNdQhBpw2wdjv',
  frame: 'flditFPlWguikhAjh', internal: 'fldzRZHkHDCAnXGZ0', footage: 'fldil0vgCggjVx20H',
};
export const L = { // Post Ledger
  post: 'fld3DHKBZ4hDQE1Ay', platform: 'fldupW9VZpCEu0FbY', posted: 'fldilncgsSWbP7dWQ', url: 'fldZ54qhyFJo7BD8L',
  views: 'fldaobmWittduGZPq', reach: 'fldj3WCy551Fv3sc8', likes: 'fldmCj2VYNk7CB0ep', comments: 'fldMLmzgUgigECkE4',
  shares: 'fldzylt4G7WafXF1d', saves: 'fldNg9rxFfjC08oU5', caption: 'fldmJT8qJfR9cg1h2', tag: 'fldevlds2hUaO7kDU',
};

export const TEMPLATE_SLUG = '_template';

export function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex', ...headers },
  });
}

export const token = env => env.PORTAL_AIRTABLE_TOKEN || env.AIRTABLE_TOKEN || '';

export async function at(env, table, path = '', init = {}) {
  const r = await fetch(`https://api.airtable.com/v0/${BASE}/${table}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${token(env)}`, 'content-type': 'application/json', ...(init.headers || {}) },
  });
  if (!r.ok) {
    const e = new Error(`airtable ${r.status}`); e.status = r.status; e.detail = (await r.text()).slice(0, 300); throw e;
  }
  return r.json();
}

// Every record matching a formula (field IDs returned).
export async function list(env, table, formula, extra = '') {
  const out = []; let offset = '';
  do {
    const q = `?returnFieldsByFieldId=true&pageSize=100${formula ? `&filterByFormula=${encodeURIComponent(formula)}` : ''}${extra}${offset ? `&offset=${offset}` : ''}`;
    const page = await at(env, table, q);
    out.push(...page.records); offset = page.offset || '';
  } while (offset);
  return out;
}

export const create = (env, table, fields) =>
  at(env, table, '', { method: 'POST', body: JSON.stringify({ records: [{ fields }], typecast: true, returnFieldsByFieldId: true }) }).then(r => r.records[0]);
export const patch = (env, table, id, fields) =>
  at(env, table, '', { method: 'PATCH', body: JSON.stringify({ records: [{ id, fields }], typecast: true, returnFieldsByFieldId: true }) }).then(r => r.records[0]);

export const cleanSlug = s => String(s || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 60);
const q = s => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

// Lookup-field match: the record's linked portal has this slug.
export const bySlug = (fieldId, slug) => `FIND('|${q(slug)}|', '|' & ARRAYJOIN({${fieldId}}, '|') & '|')`;

export async function getPortal(env, slug) {
  slug = cleanSlug(slug);
  if (!slug || slug === TEMPLATE_SLUG) return null;
  const rows = await list(env, T.portals, `OR({${P.slug}}='${q(slug)}',{${P.slug}}='${TEMPLATE_SLUG}')`);
  const row = rows.find(r => r.fields[P.slug] === slug);
  if (!row) return null;
  const tpl = rows.find(r => r.fields[P.slug] === TEMPLATE_SLUG);
  return { row, tpl };
}

export async function getPortalByPasscode(env, code) {
  code = String(code || '').trim().toLowerCase();
  if (code.length < 6) return null;
  const rows = await list(env, T.portals, `LOWER({${P.passcode}})='${q(code)}'`);
  return rows.find(r => r.fields[P.slug] && r.fields[P.slug] !== TEMPLATE_SLUG && r.fields[P.status] !== 'Paused') || null;
}

// ---- sessions: HMAC-signed cookie per portal; changing the passcode in Airtable ends every session ----
const enc = new TextEncoder();
async function key(env) {
  const raw = await crypto.subtle.digest('SHA-256', enc.encode(`hp-portal-v1|${env.PORTAL_SECRET || ''}|${token(env)}`));
  return crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
async function sign(env, msg) { return b64u(await crypto.subtle.sign('HMAC', await key(env), enc.encode(msg))); }
export const cookieName = slug => `hpp_${cleanSlug(slug).replace(/-/g, '_')}`;
const DAYS = 120;

// One session works on both portal.happyproductions.video and onboarding.happyproductions.video/portal.
export function cookieDomain(request) {
  const h = new URL(request.url).hostname;
  return /(^|\.)happyproductions\.video$/.test(h) ? '; Domain=happyproductions.video' : '';
}

export async function sessionCookie(env, slug, passcode, domain = '') {
  const exp = Math.floor(Date.now() / 1000) + DAYS * 86400;
  const sig = await sign(env, `${slug}|${exp}|${String(passcode).toLowerCase()}`);
  return `${cookieName(slug)}=${exp}.${sig}; Path=/; Max-Age=${DAYS * 86400}; HttpOnly; Secure; SameSite=Lax${domain}`;
}
export const clearCookie = (slug, domain = '') => `${cookieName(slug)}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax${domain}`;

// Where portals live. Flip PORTAL_HOST_LIVE to true once portal.happyproductions.video is attached
// to the Pages project; until then links point at the onboarding domain's /portal path (which keeps working after).
export const PORTAL_HOST_LIVE = false;
export const portalUrl = slug => PORTAL_HOST_LIVE ? `https://portal.happyproductions.video/${slug}` : `https://onboarding.happyproductions.video/portal/${slug}`;

export async function authed(env, request, slug, passcode) {
  const m = (request.headers.get('cookie') || '').match(new RegExp(`(?:^|;\\s*)${cookieName(slug)}=([^;]+)`));
  if (!m) return false;
  const [exp, sig] = m[1].split('.');
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  const want = await sign(env, `${slug}|${exp}|${String(passcode || '').toLowerCase()}`);
  if (want.length !== sig.length) return false;
  let diff = 0; for (let i = 0; i < want.length; i++) diff |= want.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

// What the passcode screen may show before anyone signs in: name, logo and colors only.
function lockFace(p) {
  const f = p.row.fields, t = p.tpl ? p.tpl.fields : {};
  const pick = k => f[k] || t[k] || '';
  const hex = v => /^#[0-9a-f]{3,8}$/i.test(v || '') ? v : '';
  const font = v => /^[A-Za-z0-9 ]{2,40}$/.test(v || '') ? v : '';
  const a = f[P.logo];
  return {
    client: f[P.client] || '',
    logo: Array.isArray(a) && a[0] ? (a[0].thumbnails?.large?.url || a[0].url) : '',
    brand: { brand: hex(pick(P.brand)) || '#7E66E0', ink: hex(pick(P.ink)) || '#1F1F1F', paper: hex(pick(P.paper)) || '#FBF8F2', display: font(pick(P.display)) || 'Outfit', body: font(pick(P.body)) || 'Figtree' },
  };
}

// Load a portal and check the visitor's session in one go.
export async function guard(env, request, slug) {
  if (!token(env)) return { error: json({ error: 'not_configured' }, 503) };
  let p;
  try { p = await getPortal(env, slug); } catch (e) { return { error: json({ error: 'airtable_unreachable', status: e.status || 0 }, 502) }; }
  if (!p || p.row.fields[P.status] === 'Paused') return { error: json({ error: 'not_found' }, 404) };
  const ok = await authed(env, request, p.row.fields[P.slug], p.row.fields[P.passcode]);
  if (!ok) return { error: json({ error: 'locked', ...lockFace(p) }, 401) };
  return p;
}

// Passcodes like "olive-harbor-4821": easy to read aloud, hard to guess.
const WORDS = 'amber anchor apple aspen atlas autumn bamboo basil beacon birch bloom breeze brook cedar cherry cloud clover cobalt comet coral cotton crane daisy delta dune ember fern fig flint forest garden ginger glow harbor hazel honey indigo iris island ivy jade jasmine juniper kite lagoon lantern lark laurel lemon lilac linen lotus maple marble meadow mint moss nectar north oak ocean olive orchard pearl pepper pine plum poppy prairie quartz rain reed ridge river robin rose saffron sage salt sierra silver sky sparrow spring spruce star stone summer sun swift thyme tide tulip valley velvet violet willow wind wren'.split(' ');
export function newPasscode() {
  const r = crypto.getRandomValues(new Uint32Array(3));
  return `${WORDS[r[0] % WORDS.length]}-${WORDS[r[1] % WORDS.length]}-${String(1000 + (r[2] % 9000))}`;
}

export function slugify(name) {
  return String(name || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'client';
}

export async function readBody(request) {
  const ct = request.headers.get('content-type') || '';
  try {
    if (ct.includes('application/json')) return await request.json();
    return Object.fromEntries(new URLSearchParams(await request.text()));
  } catch (e) { return null; }
}

export const clip = (s, n = 5000) => String(s == null ? '' : s).slice(0, n);
export const nowIso = () => new Date().toISOString();

// The portal page itself (one static app; it reads the slug from the address and loads data from /api/portal/data).
export async function shell(env, url) {
  const r = await env.ASSETS.fetch(new URL('/portal-app/', url));
  return new Response(r.body, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache', 'x-robots-tag': 'noindex, nofollow', 'referrer-policy': 'same-origin' },
  });
}
