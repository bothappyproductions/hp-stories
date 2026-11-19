// GET /api/portal/data?slug=<slug>  -> everything the portal page shows, read live from Airtable.
// Blank fields on a portal fall back to the "_template" Portals row.
import { json, guard, list, T, P, B, V, A, L, bySlug, portalUrl } from './_lib.js';

const HEX = /^#[0-9a-f]{3,8}$/i;
const FONT = /^[A-Za-z0-9 ]{2,40}$/;
const att = a => (Array.isArray(a) && a[0]) ? (a[0].thumbnails?.full?.url || a[0].thumbnails?.large?.url || a[0].url) : '';
const attLarge = a => (Array.isArray(a) && a[0]) ? (a[0].thumbnails?.large?.url || a[0].url) : '';
const sel = v => (v && typeof v === 'object' && 'name' in v) ? v.name : (v || '');
const num = v => (typeof v === 'number' && isFinite(v)) ? v : 0;

export async function onRequestGet({ request, env }) {
  const slug = new URL(request.url).searchParams.get('slug') || '';
  const g = await guard(env, request, slug);
  if (g.error) return g.error;
  const f = g.row.fields, t = g.tpl ? g.tpl.fields : {};
  const pick = k => (f[k] !== undefined && f[k] !== '' && f[k] !== null) ? f[k] : t[k];
  const realSlug = f[P.slug];
  const reportName = f[P.reportName] || f[P.client] || '';

  const safe = p => p.catch(e => { console.log('portal data', e.message, e.detail || ''); return null; });
  const ledgerFormula = reportName
    ? `AND({Client}='${reportName.replace(/'/g, "\\'")}', {Tag Status}!='Needs review')`
    : '';
  const [briefs, videos, activity, posts] = await Promise.all([
    safe(list(env, T.briefs, `AND(${bySlug(B.slug, realSlug)}, OR({${B.status}}='Shared', {${B.status}}='Approved'))`)),
    safe(list(env, T.videos, `AND(${bySlug(V.slug, realSlug)}, {${V.status}}!='Hidden')`)),
    safe(list(env, T.activity, bySlug(A.slug, realSlug))),
    reportName ? safe(list(env, T.ledger, ledgerFormula)) : Promise.resolve([]),
  ]);

  const portal = {
    slug: realSlug,
    url: portalUrl(realSlug),
    client: f[P.client] || '',
    contact: f[P.contact] || '',
    website: f[P.website] || '',
    status: sel(f[P.status]),
    plan: f[P.plan] || '',
    logo: att(f[P.logo]) || '',
    brand: {
      brand: HEX.test(pick(P.brand) || '') ? pick(P.brand) : '#7E66E0',
      ink: HEX.test(pick(P.ink) || '') ? pick(P.ink) : '#1F1F1F',
      paper: HEX.test(pick(P.paper) || '') ? pick(P.paper) : '#FBF8F2',
      display: FONT.test(pick(P.display) || '') ? pick(P.display) : 'Outfit',
      body: FONT.test(pick(P.body) || '') ? pick(P.body) : 'Figtree',
    },
    welcome: { headline: pick(P.headline) || '', note: pick(P.note) || '', video: pick(P.video) || '' },
    next: { text: pick(P.next) || '', link: (f[P.next] ? f[P.nextLink] : pick(P.nextLink)) || '' },
    producer: { name: pick(P.producer) || '', email: pick(P.producerEmail) || '', phone: pick(P.producerPhone) || '' },
    frame: f[P.frame] || '',
  };

  const briefsOut = (briefs || []).map(r => {
    const b = r.fields;
    return {
      id: r.id, title: b[B.title] || 'Brief', kind: sel(b[B.kind]), status: sel(b[B.status]),
      subtitle: b[B.subtitle] || '', dates: b[B.dates] || '', location: b[B.location] || '',
      hero: att(b[B.hero]), heroes: (b[B.hero] || []).slice(0, 4).map(a => a.thumbnails?.large?.url || a.url), glance: String(b[B.glance] || '').split('\n').map(l => l.trim()).filter(Boolean).map(l => {
        const i = l.indexOf(':'); return i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : ['', l];
      }),
      body: b[B.body] || '', order: num(b[B.order]), approvedAt: b[B.approvedAt] || '', approvedBy: b[B.approvedBy] || '',
      updated: r.createdTime,
    };
  }).sort((a, b) => (a.order - b.order) || String(b.updated).localeCompare(String(a.updated)));

  const videosOut = (videos || []).map(r => {
    const v = r.fields;
    return {
      id: r.id, title: v[V.title] || 'Untitled video', status: sel(v[V.status]) || 'Ready for review',
      version: num(v[V.version]) || 1, watch: v[V.watch] || '', thumb: attLarge(v[V.thumb]), format: v[V.format] || '',
      delivered: v[V.delivered] || r.createdTime, note: v[V.note] || '', lastAction: v[V.lastAction] || '',
    };
  }).sort((a, b) => String(b.delivered).localeCompare(String(a.delivered)));

  const CLIENT_KINDS = ['Video request', 'Production request', 'Change request', 'Video approved', 'Brief approved', 'Brief comment'];
  const activityOut = (activity || []).map(r => ({
    id: r.id, summary: r.fields[A.summary] || '', kind: sel(r.fields[A.kind]), status: sel(r.fields[A.status]) || 'New',
    from: r.fields[A.from] || '', at: r.fields[A.at] || r.createdTime,
  })).filter(a => CLIENT_KINDS.includes(a.kind)).sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 40);

  // Impact Report
  const postsOut = (posts || []).map(r => {
    const p = r.fields;
    return {
      platform: sel(p[L.platform]), posted: p[L.posted] || '', url: p[L.url] || '',
      views: num(p[L.views]), reach: num(p[L.reach]), likes: num(p[L.likes]), comments: num(p[L.comments]),
      shares: num(p[L.shares]), saves: num(p[L.saves]), caption: String(p[L.caption] || '').slice(0, 140),
    };
  }).sort((a, b) => String(b.posted).localeCompare(String(a.posted)));
  const sum = k => postsOut.reduce((s, p) => s + p[k], 0);
  const byPlatform = {};
  for (const p of postsOut) {
    const o = byPlatform[p.platform] || (byPlatform[p.platform] = { posts: 0, views: 0, engagements: 0 });
    o.posts++; o.views += p.views; o.engagements += p.likes + p.comments + p.shares + p.saves;
  }
  const byMonth = {};
  for (const p of postsOut) { const m = String(p.posted).slice(0, 7); if (m) byMonth[m] = (byMonth[m] || 0) + p.views; }
  const report = {
    totals: {
      posts: postsOut.length, views: sum('views'), reach: sum('reach'),
      engagements: sum('likes') + sum('comments') + sum('shares') + sum('saves'),
      likes: sum('likes'), comments: sum('comments'), shares: sum('shares'), saves: sum('saves'),
    },
    videos: {
      delivered: videosOut.length,
      approved: videosOut.filter(v => v.status === 'Approved' || v.status === 'Posted').length,
      review: videosOut.filter(v => v.status === 'Ready for review').length,
      inEdit: videosOut.filter(v => v.status === 'Changes requested' || v.status === 'In edit').length,
    },
    byPlatform, byMonth, posts: postsOut, available: posts !== null,
  };

  return json({ portal, briefs: briefsOut, videos: videosOut, activity: activityOut, report });
}
