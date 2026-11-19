// Host routing. portal.happyproductions.video/<slug> serves the client portal app;
// every other host (onboarding.happyproductions.video, previews) passes straight through untouched.
import { shell } from './api/portal/_lib.js';

export async function onRequest(ctx) {
  try {
    const url = new URL(ctx.request.url);
    if (!url.hostname.startsWith('portal.')) return ctx.next();
    const p = url.pathname;
    if (p.startsWith('/api/') || p.startsWith('/portal-app/')) return ctx.next();
    if (p === '/robots.txt') return new Response('User-agent: *\nDisallow: /\n', { headers: { 'content-type': 'text/plain' } });
    return await shell(ctx.env, url);
  } catch (e) {
    return ctx.next();
  }
}
