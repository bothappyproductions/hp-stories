// POST /api/momcozy/book (form-encoded booking from the page).
// Refuses a slot that is already taken. Saves the booking straight to Airtable, then
// re-checks: if two moms hit the same slot at the same moment, only the earlier one keeps it.
import { activeBookings, takenMap, create, patch, json, F, SLOT_IDS } from './_shared.js';

const TEXT = ['mom', 'email', 'phone', 'address', 'area', 'slot', 'slot_id', 'who', 'kids', 'scripts_ok', 'scripts_not_ok',
  'home', 'signed_name', 'guardian_for', 'signature', 'notes', 'payment'];

export async function onRequestPost({ request, env }) {
  if (!env.AIRTABLE_TOKEN) return json({ error: 'not_configured' }, 503);
  let d;
  try { d = Object.fromEntries(new URLSearchParams(await request.text())); } catch (e) { return json({ error: 'bad_request' }, 400); }
  if (!d.mom || !d.email || !d.slot_id) return json({ error: 'missing_fields' }, 400);
  const real = SLOT_IDS.includes(d.slot_id);

  try {
    if (real) {
      const taken = takenMap(await activeBookings(env));
      if (taken[d.slot_id] !== undefined) return json({ error: 'slot_taken', taken }, 409);
    }
    const fields = {};
    for (const k of TEXT) if (d[k]) fields[F[k]] = String(d[k]).slice(0, 90000);
    fields[F.pay] = Number(d.pay) || 0;
    fields[F.dad] = d.dad === 'true';
    fields[F.social_ok] = d.social_ok === 'true';
    fields[F.release_signed] = d.release_signed === 'true';
    fields[F.signed_at] = [d.signed_at, d.release_version].filter(Boolean).join(' · ');
    fields[F.status] = 'Requested';
    const made = (await create(env, fields)).records[0];

    if (real) {
      // Race check: the earliest active booking for this slot wins.
      const same = (await activeBookings(env)).filter(r => r.fields[F.slot_id] === d.slot_id);
      if (same.length && same[0].id !== made.id) {
        await patch(env, made.id, { [F.status]: 'Cancelled', [F.slot_id]: `${d.slot_id}-lost`, [F.notes]: `Lost the slot to an earlier booking a moment before. ${d.notes || ''}`.trim() });
        return json({ error: 'slot_taken', taken: takenMap(await activeBookings(env)) }, 409);
      }
    }
    return json({ ok: true, id: made.id });
  } catch (e) {
    return json({ error: 'airtable_unreachable' }, 502);
  }
}
