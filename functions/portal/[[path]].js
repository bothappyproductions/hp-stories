// onboarding.happyproductions.video/portal/<slug> serves the same client portal app
// (works before and after portal.happyproductions.video is attached).
import { shell } from '../api/portal/_lib.js';

export async function onRequest({ request, env }) {
  return shell(env, new URL(request.url));
}
