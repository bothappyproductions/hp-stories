// GET /api/momcozy/slots -> {"taken": {"s4": "North Jersey", ...}}, read live from Airtable.
import { activeBookings, takenMap, json } from './_shared.js';

export async function onRequestGet({ env }) {
  if (!env.AIRTABLE_TOKEN) return json({ error: 'not_configured' }, 503);
  try { return json({ taken: takenMap(await activeBookings(env)), live: true }); }
  catch (e) { return json({ error: 'airtable_unreachable' }, 502); }
}
