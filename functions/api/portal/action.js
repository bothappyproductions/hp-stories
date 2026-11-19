// POST /api/portal/action  {slug, action, ...}
// Every client action is logged in Portal Activity and queued as one Slack DM for the producer
// (via Slack Outbox, which the chief-of-staff lane sends at 7:30 and 16:30 ET).
// Change requests and new video requests also land in Video Requests, the editing dispatcher's queue.
import { json, readBody, guard, at, create, patch, T, P, B, V, A, R, clip, nowIso, portalUrl } from './_lib.js';

const OUTBOX = 'tblMS9K4as9Iy3vOo';
const O = { item: 'fldB0aDVRG4Khg0Ha', recipient: 'fldVXFCDvMEJWEUBh', kind: 'fldc8KeJBkpiwWirJ', key: 'fld9KmSKWai6Wwltd',
  client: 'fldJRtkxS2VEbrLni', lane: 'fldkzOtpZcBo0p66K', urgency: 'fld3jTioWpCPtgxa0', status: 'fldh0Fg0rQVSh9jur', evidence: 'fldx76RlKfuBMEH2W' };
const isUrl = s => /^https?:\/\/\S+$/i.test(String(s || '').trim());
const stamp = () => new Date().toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

async function owned(env, table, id, slugField, slug) {
  if (!/^rec[A-Za-z0-9]{14}$/.test(String(id || ''))) return null;
  try {
    const r = await at(env, table, `/${id}?returnFieldsByFieldId=true`);
    return [].concat(r.fields[slugField] || []).includes(slug) ? r : null;
  } catch (e) { return null; }
}

export async function onRequestPost({ request, env, waitUntil }) {
  const d = await readBody(request);
  if (!d) return json({ error: 'bad_request' }, 400);
  const g = await guard(env, request, d.slug);
  if (g.error) return g.error;
  const pf = g.row.fields, tf = g.tpl ? g.tpl.fields : {};
  const slug = pf[P.slug], client = pf[P.client] || slug, portalId = g.row.id;
  const from = clip(d.from || pf[P.contact] || 'Client', 120);
  const producer = pf[P.producer] || tf[P.producer] || '';
  const recipient = /nick/i.test(producer) ? 'Nick' : 'Atdhe';
  const note = clip(d.note, 8000).trim();

  const log = (kind, summary, details, links = {}) => create(env, T.activity, {
    [A.summary]: clip(summary, 250), [A.portal]: [portalId], [A.kind]: kind, [A.status]: kind.includes('approved') ? 'Handled' : 'New',
    [A.details]: details, [A.from]: from, [A.at]: nowIso(), ...links,
  });
  const notify = (kind, item, key) => create(env, OUTBOX, {
    [O.item]: clip(item, 900), [O.recipient]: recipient, [O.kind]: kind, [O.key]: `${client}|portal|${key}`,
    [O.client]: client, [O.lane]: 'client-portal', [O.urgency]: 'Normal', [O.status]: 'Queued',
    [O.evidence]: `${portalUrl(slug)} · Portal Activity`,
  }).catch(e => console.log('outbox', e.message, e.detail || ''));

  try {
    switch (d.action) {
      case 'approve_video': {
        const v = await owned(env, T.videos, d.id, V.slug, slug);
        if (!v) return json({ error: 'not_found' }, 404);
        const title = v.fields[V.title] || 'a video';
        await patch(env, T.videos, v.id, { [V.status]: 'Approved', [V.lastAction]: nowIso() });
        const a = await log('Video approved', `${client} approved "${title}" (V${v.fields[V.version] || 1})`, '', { [A.video]: [v.id] });
        waitUntil(notify('FYI', `${from} at ${client} approved "${title}" (V${v.fields[V.version] || 1}) in their portal.`, a.id));
        return json({ ok: true, status: 'Approved' });
      }
      case 'change_video': {
        if (!note) return json({ error: 'missing_note' }, 400);
        const v = await owned(env, T.videos, d.id, V.slug, slug);
        if (!v) return json({ error: 'not_found' }, 404);
        const vf = v.fields, title = vf[V.title] || 'Video', ver = vf[V.version] || 1;
        const prev = vf[V.note] ? `${vf[V.note]}\n\n` : '';
        await patch(env, T.videos, v.id, {
          [V.status]: 'Changes requested', [V.lastAction]: nowIso(), [V.note]: clip(`${prev}[${stamp()} · ${from} · V${ver}] ${note}`, 90000),
        });
        const auto = !!pf[P.autoQueue];
        const reqFields = {
          [R.request]: clip(`${client} — ${title} - revision from V${ver} (client portal)`, 250), [R.client]: client, [R.type]: 'Change',
          [R.sourceId]: `portal:${v.id}:V${ver}:${Date.now()}`, [R.sourceLink]: portalUrl(slug), [R.askedBy]: from, [R.askedAt]: nowIso(),
          [R.words]: note, [R.internal]: auto ? 'From the client portal.' : 'From the client portal. No status yet: a producer sets it to Ready to cut.',
        };
        if (vf[V.editKey]) reqFields[R.editKey] = vf[V.editKey];
        if (vf[V.monday]) reqFields[R.monday] = vf[V.monday];
        if (isUrl(vf[V.watch])) reqFields[R.frame] = vf[V.watch];
        if (auto) reqFields[R.status] = 'Ready to cut';
        const vr = await create(env, T.requests, reqFields);
        const a = await log('Change request', `${client} asked for changes to "${title}" (V${ver})`, note, { [A.video]: [v.id], [A.vrRow]: vr.id });
        waitUntil(notify('Revision notes', `${from} at ${client} asked for changes to "${title}" (V${ver}) in their portal: "${clip(note, 400)}"${auto ? '' : ' It is in Video Requests with no status, waiting for you to set Ready to cut.'}`, a.id));
        return json({ ok: true, status: 'Changes requested' });
      }
      case 'approve_brief': {
        const b = await owned(env, T.briefs, d.id, B.slug, slug);
        if (!b) return json({ error: 'not_found' }, 404);
        const title = b.fields[B.title] || 'the brief';
        await patch(env, T.briefs, b.id, { [B.status]: 'Approved', [B.approvedAt]: nowIso(), [B.approvedBy]: from });
        const a = await log('Brief approved', `${client} approved "${title}"`, '', { [A.brief]: [b.id] });
        waitUntil(notify('FYI', `${from} at ${client} approved "${title}" in their portal.`, a.id));
        return json({ ok: true, status: 'Approved' });
      }
      case 'comment_brief': {
        if (!note) return json({ error: 'missing_note' }, 400);
        const b = await owned(env, T.briefs, d.id, B.slug, slug);
        if (!b) return json({ error: 'not_found' }, 404);
        const title = b.fields[B.title] || 'the brief';
        const prev = b.fields[B.comments] ? `${b.fields[B.comments]}\n\n` : '';
        await patch(env, T.briefs, b.id, { [B.comments]: clip(`${prev}[${stamp()} · ${from}] ${note}`, 90000) });
        const a = await log('Brief comment', `${client} commented on "${title}"`, note, { [A.brief]: [b.id] });
        waitUntil(notify('Ask', `${from} at ${client} left a note on "${title}": "${clip(note, 400)}"`, a.id));
        return json({ ok: true });
      }
      case 'request_video': {
        const title = clip(d.title, 160).trim();
        if (!title) return json({ error: 'missing_title' }, 400);
        const details = [note && `What they want: ${note}`, d.format && `Format: ${clip(d.format, 60)}`, d.due && `Needed by: ${clip(d.due, 40)}`,
          d.footage && `Footage: ${clip(d.footage, 600)}`].filter(Boolean).join('\n');
        const reqFields = {
          [R.request]: clip(`${client} — ${title} (client portal request)`, 250), [R.client]: client, [R.type]: 'New',
          [R.sourceId]: `portal:new:${slug}:${Date.now()}`, [R.sourceLink]: portalUrl(slug), [R.askedBy]: from, [R.askedAt]: nowIso(),
          [R.words]: details || title, [R.internal]: 'From the client portal. No status yet: a producer checks footage and sets it to Ready to cut.',
        };
        if (isUrl(d.footage)) reqFields[R.footage] = String(d.footage).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(String(d.due || ''))) reqFields[R.due] = `${d.due}T21:00:00.000Z`;
        const vr = await create(env, T.requests, reqFields);
        const a = await log('Video request', `${client} requested a video: ${title}`, details, { [A.vrRow]: vr.id });
        waitUntil(notify('Ask', `${from} at ${client} requested a new video in their portal: "${title}". ${clip(details.replace(/\n/g, ' · '), 500)}`, a.id));
        return json({ ok: true });
      }
      case 'request_production': {
        const story = clip(note || d.story, 4000).trim();
        if (!story) return json({ error: 'missing_note' }, 400);
        const details = [`Story: ${story}`, d.kind && `Production: ${clip(d.kind, 60)}`, d.dates && `Dates: ${clip(d.dates, 200)}`,
          d.location && `Where: ${clip(d.location, 300)}`, d.people && `On camera: ${clip(d.people, 300)}`].filter(Boolean).join('\n');
        const a = await log('Production request', `${client} requested a production${d.kind ? ` (${clip(d.kind, 40)})` : ''}`, details);
        waitUntil(notify('Ask', `${from} at ${client} requested a new production in their portal. ${clip(details.replace(/\n/g, ' · '), 600)}`, a.id));
        return json({ ok: true });
      }
      default:
        return json({ error: 'unknown_action' }, 400);
    }
  } catch (e) {
    console.log('portal action', d.action, e.message, e.detail || '');
    return json({ error: 'airtable_unreachable', status: e.status || 0 }, 502);
  }
}
