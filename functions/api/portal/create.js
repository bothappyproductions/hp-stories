// POST /api/portal/create  (called by the onboarding page the moment the intake form is sent)
// Makes the client's portal on the spot: a Portals row with a slug and passcode, a draft production
// brief seeded from their answers (hidden until a producer shares it), and a session cookie so the
// same browser lands straight in the portal after booking the kickoff call.
import { json, readBody, list, create, T, P, B, A, sessionCookie, cookieDomain, newPasscode, slugify, clip, nowIso, portalUrl, token, TEMPLATE_SLUG } from './_lib.js';

const OUTBOX = 'tblMS9K4as9Iy3vOo';
const ALLOWED = /^https:\/\/(onboarding|portal)\.happyproductions\.video$|^https:\/\/[a-z0-9-]+\.happy-onboarding-live\.pages\.dev$/;

export async function onRequestPost({ request, env, waitUntil }) {
  if (!token(env)) return json({ error: 'not_configured' }, 503);
  const origin = request.headers.get('origin') || '';
  if (origin && !ALLOWED.test(origin)) return json({ error: 'forbidden' }, 403);
  const d = await readBody(request);
  const org = clip(d?.org, 160).trim(), email = clip(d?.email, 200).trim().toLowerCase();
  if (!org || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'missing_fields' }, 400);

  try {
    const base = slugify(org);
    const existing = await list(env, T.portals, `OR(LEFT({${P.slug}}, ${base.length})='${base}', LOWER({${P.contactEmail}})='${email.replace(/'/g, "\\'")}')`);
    // Same person sending the form again (refresh, double submit): give them the portal they already have.
    const mine = existing.find(r => String(r.fields[P.contactEmail] || '').toLowerCase() === email && slugify(r.fields[P.client]) === base);
    if (mine) {
      const s = mine.fields[P.slug], pc = mine.fields[P.passcode];
      return json({ ok: true, slug: s, passcode: pc, url: portalUrl(s), existing: true }, 200, { 'set-cookie': await sessionCookie(env, s, pc, cookieDomain(request)) });
    }
    const taken = new Set(existing.map(r => r.fields[P.slug]).concat([TEMPLATE_SLUG]));
    let slug = base, n = 2; while (taken.has(slug)) slug = `${base}-${n++}`;
    const passcode = newPasscode();
    const inPerson = d.prod === 'ip';
    const answers = clip(d.answers, 90000);

    const row = await create(env, T.portals, {
      [P.client]: org, [P.slug]: slug, [P.passcode]: passcode, [P.status]: 'Onboarding',
      [P.contact]: clip(d.contact, 160), [P.contactEmail]: email,
      ...(/^https?:\/\//i.test(d.website || '') ? { [P.website]: clip(d.website, 400) } : {}),
      [P.plan]: inPerson ? 'In-person production' : 'Virtual production', [P.reportName]: org,
      [P.headline]: `Welcome to Happy Productions${d.contact ? `, ${clip(String(d.contact).split(' ')[0], 40)}` : ''}`,
      [P.intake]: answers, [P.autoQueue]: false,
      [P.internal]: `Made automatically by the onboarding page on ${new Date().toISOString().slice(0, 10)}. Add their logo and brand colors, then share the draft brief.`,
    });

    const md = briefFromAnswers(org, d);
    const brief = await create(env, T.briefs, {
      [B.title]: `${org} · First production brief`, [B.portal]: [row.id], [B.kind]: 'Production brief', [B.status]: 'Draft',
      [B.subtitle]: inPerson ? 'In-person production' : 'Virtual production, directed live over video call',
      [B.glance]: [`Client: ${org}`, `Production: ${inPerson ? 'In person, on site' : 'Virtual'}`, `Producer: Atdhe Trepça`, d.contact ? `Your point of contact: ${clip(d.contact, 80)}` : ''].filter(Boolean).join('\n'),
      [B.body]: md, [B.order]: 1,
    });
    await create(env, T.activity, {
      [A.summary]: `Portal created for ${org}`, [A.portal]: [row.id], [A.kind]: 'Portal created', [A.status]: 'Handled',
      [A.from]: clip(d.contact || email, 120), [A.at]: nowIso(), [A.brief]: [brief.id],
    });
    waitUntil(create(env, OUTBOX, {
      fldB0aDVRG4Khg0Ha: `New client portal: ${org} finished onboarding. Portal ${portalUrl(slug)} (passcode ${passcode}). Their draft brief is in Portal Briefs, hidden until you set it to Shared.`,
      fldVXFCDvMEJWEUBh: 'Atdhe', fldc8KeJBkpiwWirJ: 'FYI', fld9KmSKWai6Wwltd: `${org}|portal|created`, fldJRtkxS2VEbrLni: org,
      fldkzOtpZcBo0p66K: 'client-portal', fld3jTioWpCPtgxa0: 'Normal', fldh0Fg0rQVSh9jur: 'Queued',
    }).catch(e => console.log('outbox', e.message)));

    return json({ ok: true, slug, passcode, url: portalUrl(slug) }, 200, { 'set-cookie': await sessionCookie(env, slug, passcode, cookieDomain(request)) });
  } catch (e) {
    console.log('portal create', e.message, e.detail || '');
    return json({ error: 'airtable_unreachable', status: e.status || 0 }, 502);
  }
}

// A first-draft brief in the client's own words; the producer tightens it before sharing.
function briefFromAnswers(org, d) {
  let a = {}; try { a = JSON.parse(d.payload || '{}'); } catch (e) { a = {}; }
  const g = k => { const v = a[k]; return Array.isArray(v) ? v.join(', ') : String(v || '').trim(); };
  const sec = (h, body) => body ? `## ${h}\n\n${body}\n\n` : '';
  return [
    `This is the plan for ${org}'s first production, drafted from your onboarding answers. Your producer will go through it with you on the kickoff call.\n\n`,
    sec('What success looks like', g('fldq8PgX3ZRKEMZFi')),
    sec('Who we are talking to', g('fldsWj6IThij0ZHUs')),
    sec('Programs to feature', g('fld9ahBHcudGMqNBO')),
    sec('Who we feature', [g('fld8yfmnIm8dogvY1') && `- Featuring: ${g('fld8yfmnIm8dogvY1')}`, g('fldkWTaanj5shDVFn') && `- Comfortable on camera: ${g('fldkWTaanj5shDVFn')}`].filter(Boolean).join('\n')),
    sec('Where we film', [g('fldab7OMO0D3dZ94e'), g('fldXgGp8T3lGtDjAq')].filter(Boolean).join('\n\n')),
    sec('Moments coming up', g('fldP5AhHvEVqZZOm7')),
    sec('The challenge we are solving', g('fldjT2tmK7piWhiqr')),
    sec('Footage we can start editing', g('fldlwXfsYoHRuha2q')),
    sec('Brand', g('brand_assets_link')),
  ].join('').trim();
}
