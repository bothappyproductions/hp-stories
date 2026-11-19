/* Happy Productions client portal.
   One page for every client: it reads the slug from the address, asks for the passcode if needed,
   then renders whatever the team has put in Airtable (Portals, Portal Briefs, Portal Videos, Post Ledger).
   Addresses: portal.happyproductions.video/<slug>  or  onboarding.happyproductions.video/portal/<slug> */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const HP_MARK = '/media/hp-mark.png';
const HP_PHONE = '(475) 223-0430';

const onPortalHost = location.hostname.startsWith('portal.');
const parts = location.pathname.split('/').filter(Boolean);
const SLUG = (onPortalHost ? parts[0] : (parts[0] === 'portal' ? parts[1] : '')) || '';
const ROOT = onPortalHost ? '/' : '/portal/';
const app = $('#app');
let D = null; // portal data
let filter = 'all';

const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
};

/* ---------------- tiny markdown (Airtable rich text) ---------------- */
function inline(s) {
  const keep = [];
  s = s.replace(/\\([\\`*_{}\[\]()#+\-.!>|~])/g, (m, c) => { keep.push(esc(c)); return `\u0000${keep.length - 1}\u0000`; });
  s = esc(s);
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/!\[([^\]]*)\]\((https?:[^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');
  s = s.replace(/\[([^\]]+)\]\((#[\w/-]*)\)/g, '<a href="$2">$1</a>');
  s = s.replace(/\[([^\]]+)\]\((https?:[^)\s]+|mailto:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/__([^_]+)__/g, '<strong>$1</strong>');
  s = s.replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>').replace(/(^|[\s(])_([^_\s][^_]*)_/g, '$1<em>$2</em>');
  s = s.replace(/~~([^~]+)~~/g, '<s>$1</s>');
  s = s.replace(/(^|[\s(])(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
  return s.replace(/\u0000(\d+)\u0000/g, (m, i) => keep[+i]);
}
function md(src) {
  const lines = String(src || '').replace(/\r/g, '').split('\n');
  let out = '', para = [], list = null, quote = [], lastH = '';
  const flushP = () => { if (para.length) { out += `<p>${inline(para.join(' '))}</p>`; para = []; } };
  const flushL = () => { if (list) { out += `<${list.t}${list.x ? ' class="x"' : ''}>${list.items.join('')}</${list.t}>`; list = null; } };
  const flushQ = () => { if (quote.length) { out += `<blockquote>${md(quote.join('\n'))}</blockquote>`; quote = []; } };
  const flush = () => { flushP(); flushL(); flushQ(); };
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    let m;
    if (/^>\s?/.test(line)) { flushP(); flushL(); quote.push(line.replace(/^>\s?/, '')); continue; } else flushQ();
    if (!line.trim()) { flushP(); flushL(); continue; }
    if ((m = line.match(/^(#{1,4})\s+(.*)$/))) {
      flush(); const lvl = Math.min(Math.max(m[1].length, 2), 3); lastH = m[2];
      out += `<h${lvl}>${inline(m[2])}</h${lvl}>`; continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) { flush(); out += '<hr>'; continue; }
    if ((m = line.match(/^\s*([-*+]|\d+[.)])\s+(.*)$/))) {
      flushP(); const t = /\d/.test(m[1]) ? 'ol' : 'ul';
      if (!list || list.t !== t) { flushL(); list = { t, items: [], x: t === 'ul' && /^(never|don.?t|avoid|what we won.?t)/i.test(lastH) }; }
      let body = m[2], cls = '';
      const task = body.match(/^\[( |x)\]\s+(.*)$/i);
      if (task) { cls = ' class="task"'; body = `<input type="checkbox" disabled${task[1].toLowerCase() === 'x' ? ' checked' : ''}>${inline(task[2])}`; }
      else body = inline(body);
      list.items.push(`<li${cls}>${body}</li>`); continue;
    }
    flushL(); para.push(line.trim());
  }
  flush();
  return out;
}

/* ---------------- brand ---------------- */
function lum(hex) {
  let h = hex.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return .2126 * r + .7152 * g + .0722 * b;
}
function loadFont(name) {
  if (!name || $(`link[data-font="${name}"]`)) return;
  const fam = name.trim().replace(/ /g, '+');
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.dataset.font = name;
  l.href = `https://fonts.googleapis.com/css2?family=${fam}:wght@400;500;600;700&display=swap`;
  l.onerror = () => { l.onerror = null; l.href = `https://fonts.googleapis.com/css2?family=${fam}&display=swap`; };
  document.head.appendChild(l);
}
function applyBrand(b) {
  const r = document.documentElement.style;
  r.setProperty('--brand', b.brand); r.setProperty('--ink', b.ink); r.setProperty('--paper', b.paper);
  const L = lum(b.brand), Li = lum(b.ink);
  r.setProperty('--on-brand', (1.05 / (L + .05)) >= ((L + .05) / (Li + .05)) ? '#ffffff' : b.ink);
  r.setProperty('--surface', `color-mix(in srgb, ${b.ink} 5%, ${b.paper})`);
  r.setProperty('--display', `"${b.display}", system-ui, sans-serif`); r.setProperty('--body', `"${b.body}", system-ui, sans-serif`);
  loadFont(b.display); if (b.body !== b.display) loadFont(b.body);
}

/* ---------------- api ---------------- */
async function api(path, opts = {}) {
  const r = await fetch(`/api/portal/${path}`, { credentials: 'same-origin', ...opts, headers: { 'content-type': 'application/json', ...(opts.headers || {}) } });
  let body = {}; try { body = await r.json(); } catch (e) { /* not json */ }
  return { status: r.status, ok: r.ok, body };
}
const post = (path, data) => api(path, { method: 'POST', body: JSON.stringify(data) });

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 3800);
}

// Ask once per device who is acting, so the producer sees a name on every approval.
function whoAmI() {
  const k = `hpp_me_${SLUG}`; const known = store.get(k);
  if (known) return Promise.resolve(known);
  return new Promise(res => {
    const dlg = $('#who'), inp = $('#who-name');
    inp.value = D?.portal?.contact || '';
    dlg.onclose = () => {
      const v = inp.value.trim();
      if (dlg.returnValue === 'ok' && v) { store.set(k, v); res(v); } else res(null);
    };
    dlg.showModal(); setTimeout(() => inp.select(), 50);
  });
}

/* ---------------- boot ---------------- */
async function boot() {
  if (!SLUG) return renderLanding();
  const r = await api(`data?slug=${encodeURIComponent(SLUG)}`);
  if (r.status === 401) { if (r.body.brand) applyBrand(r.body.brand); return renderLock(r.body.client || '', r.body.logo || ''); }
  if (r.status === 404) return renderMissing();
  if (!r.ok) return renderTrouble();
  D = r.body;
  document.title = `${D.portal.client} · Client portal`;
  applyBrand(D.portal.brand);
  const qs = new URLSearchParams(location.search);
  if (qs.get('welcome')) { toast("You're booked. Bookmark this page: it's your portal."); history.replaceState(null, '', location.pathname + location.hash); }
  route();
}
window.addEventListener('hashchange', () => { if (D) route(); });

function route() {
  const h = location.hash.replace(/^#\/?/, '');
  const [view, id] = h.split('/');
  const views = { videos: viewVideos, briefs: id ? () => viewBrief(id) : viewBriefs, requests: viewRequests, report: viewReport };
  const fn = views[view] || viewHome;
  const cur = views[view] ? view : 'home';
  app.innerHTML = frame(cur, fn());
  bind(cur);
  if (!id) window.scrollTo({ top: 0, behavior: 'auto' });
}

/* ---------------- frame ---------------- */
const waiting = () => (D.videos || []).filter(v => v.status === 'Ready for review');
function frame(cur, inner) {
  const p = D.portal; const n = waiting().length;
  const tab = (k, label, extra = '') => `<a href="#${k === 'home' ? '' : k}"${cur === k ? ' aria-current="page"' : ''}>${label}${extra}</a>`;
  return `
  <header class="top"><div class="wrap">
    <a class="brandmark" href="#">${p.logo ? `<img src="${esc(p.logo)}" alt="${esc(p.client)}">` : `<b>${esc(p.client)}</b>`}</a>
    <nav class="nav" aria-label="Portal">
      ${tab('home', 'Home')}${tab('videos', 'Videos', n ? `<span class="count" aria-label="${n} waiting for review">${n}</span>` : '')}
      ${tab('briefs', 'Briefs')}${tab('requests', 'Requests')}${tab('report', 'Impact Report')}
    </nav>
    <a class="hp" href="https://www.happyproductions.me" target="_blank" rel="noopener"><img src="${HP_MARK}" alt="Happy Productions"><span>Happy Productions</span></a>
  </div></header>
  <main><div class="wrap">${inner}</div></main>
  <footer class="site"><div class="wrap">
    <span>Your producer: <strong>${esc(p.producer.name || 'Happy Productions')}</strong>${p.producer.email ? ` · <a href="mailto:${esc(p.producer.email)}">${esc(p.producer.email)}</a>` : ''}${p.producer.phone ? ` · <a href="tel:${esc(p.producer.phone.replace(/[^\d+]/g, ''))}">${esc(p.producer.phone)}</a>` : ''}</span>
    <span><button class="btn-quiet btn" id="signout" type="button">Sign out on this device</button></span>
  </div></footer>`;
}

/* ---------------- tiles ---------------- */
const ICON = {
  play: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 1.8v12.4L14 8z" fill="currentColor"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  ext: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M8 4H4v12h12v-4M11 3h6v6M17 3l-8 8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
const STATUS_LABEL = { 'Ready for review': 'Waiting for you', 'Changes requested': 'Changes sent', 'In edit': 'In edit', Approved: 'Approved', Posted: 'Live' };
const fmtDate = s => { const d = new Date(s); return isNaN(d) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };
const fmtNum = n => n >= 1e6 ? `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M` : n >= 1e4 ? `${Math.round(n / 1e3)}K` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(n);

function tile(v, opts = {}) {
  const wide = /16\s*:\s*9|horizontal|landscape/i.test(v.format);
  const meta = [`V${v.version}`, v.format, fmtDate(v.delivered)].filter(Boolean).join(' · ');
  const thumb = !v.thumb ? `<span class="ph">${esc(v.title)}</span>`
    : wide ? `<img class="bg" src="${esc(v.thumb)}" alt="" loading="lazy"><img class="fg" src="${esc(v.thumb)}" alt="" loading="lazy">`
    : `<img src="${esc(v.thumb)}" alt="" loading="lazy">`;
  const watch = v.watch ? `<a class="tile-thumb" href="${esc(v.watch)}" target="_blank" rel="noopener" aria-label="Watch ${esc(v.title)}">` : '<div class="tile-thumb">';
  const done = v.status === 'Approved' || v.status === 'Posted';
  return `<article class="tile${wide ? ' wide' : ''}" data-id="${esc(v.id)}">
    ${watch}${thumb}<span class="status" data-s="${esc(v.status)}"><i></i>${esc(STATUS_LABEL[v.status] || v.status)}</span>${v.watch ? `<span class="play">${ICON.play}</span>` : ''}${v.watch ? '</a>' : '</div>'}
    <div class="stamp"><span>${ICON.check}</span></div>
    <h3>${esc(v.title)}</h3>
    <p class="meta">${esc(meta)}</p>
    ${opts.compact ? '' : `
    ${v.status === 'Changes requested' && v.note ? `<p class="note-line">${esc(v.note.split('\n\n').pop())}</p>` : ''}
    <div class="acts">
      ${v.watch ? `<a class="btn" href="${esc(v.watch)}" target="_blank" rel="noopener">Watch video</a>` : ''}
      ${done ? '' : `<button class="btn btn-brand" data-act="approve">Approve</button>`}
      <button class="btn btn-quiet" data-act="ask">Ask for changes</button>
    </div>
    <form class="ask" hidden>
      <label class="sr" for="ask-${esc(v.id)}">What should change?</label>
      <textarea id="ask-${esc(v.id)}" placeholder="What should change? Timecodes help, e.g. 0:12 use the wide shot of the school." required></textarea>
      <div class="row"><button class="btn btn-quiet" type="button" data-act="cancel">Cancel</button><button class="btn btn-brand" type="submit">Send to my editor</button></div>
    </form>`}
  </article>`;
}

/* ---------------- views ---------------- */
function embed(url) {
  if (!url) return '';
  let m;
  if (/\.(mp4|webm|mov)(\?|$)/i.test(url)) return `<video src="${esc(url)}" controls playsinline preload="metadata"></video>`;
  if ((m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{6,})/))) return `<iframe src="https://www.youtube-nocookie.com/embed/${m[1]}?rel=0" title="Welcome video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  if ((m = url.match(/vimeo\.com\/(\d+)/))) return `<iframe src="https://player.vimeo.com/video/${m[1]}" title="Welcome video" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  if ((m = url.match(/loom\.com\/share\/([\w]+)/))) return `<iframe src="https://www.loom.com/embed/${m[1]}" title="Welcome video" allowfullscreen></iframe>`;
  return '';
}

function viewHome() {
  const p = D.portal, w = waiting(), vids = D.videos || [];
  const media = embed(p.welcome.video);
  const thumbs = vids.filter(v => v.thumb).slice(0, 3);
  const right = media ? `<div class="welcome-media">${media}</div>`
    : thumbs.length === 3 ? `<div class="collage" aria-hidden="true">${thumbs.map(v => `<img src="${esc(v.thumb)}" alt="">`).join('')}</div>` : '';
  const brief = (D.briefs || [])[0];
  const t = D.report.totals;
  const queue = w.length
    ? `<section class="queue"><div class="queue-head"><h2><span class="n">${w.length}</span> ${w.length === 1 ? 'video is' : 'videos are'} waiting for your review</h2><a class="btn" href="#videos">Review videos</a></div>
       <div class="strip${REDUCE ? '' : ' enter'}">${w.slice(0, 12).map(v => tile(v, { compact: true })).join('')}</div></section>`
    : vids.length ? `<section class="queue"><div class="queue-head"><h2>You're all caught up</h2><a class="btn" href="#videos">See all ${vids.length} videos</a></div></section>` : '';
  return `
  <section class="hero">
    <div>
      <h1>${esc(p.welcome.headline || `Welcome, ${p.client}`)}</h1>
      ${p.welcome.note ? `<div class="note md">${md(p.welcome.note)}</div>` : ''}
      ${p.next.text ? `<div class="next"><p>${esc(p.next.text)}</p>${p.next.link ? `<a class="btn btn-brand" href="${esc(p.next.link)}" target="_blank" rel="noopener">Open</a>` : ''}</div>` : ''}
    </div>
    ${right}
  </section>
  ${queue}
  <section class="pair">
    <div class="panel">
      <h3>${brief ? esc(brief.title) : 'Your production brief'}</h3>
      <p class="muted">${brief ? esc([brief.kind, brief.dates, brief.location].filter(Boolean).join(' · ')) : 'The plan for your next production shows up here before anyone picks up a camera.'}</p>
      ${brief ? `<span class="pill${brief.status === 'Approved' ? ' ok' : ''}">${brief.status === 'Approved' ? 'Approved' : 'Ready for your eyes'}</span><a class="btn go" href="#briefs/${esc(brief.id)}">Open brief</a>` : `<a class="btn go" href="#requests">Request a production</a>`}
    </div>
    <div class="panel">
      <h3>Your impact so far</h3>
      ${t.posts ? `<div class="mini-stats"><div><b>${fmtNum(t.views)}</b><span>views</span></div><div><b>${fmtNum(t.engagements)}</b><span>engagements</span></div><div><b>${vids.length}</b><span>videos delivered</span></div></div>`
        : `<div class="mini-stats"><div><b>${vids.length}</b><span>videos delivered</span></div><div><b>${D.report.videos.approved}</b><span>approved</span></div><div><b>${D.report.videos.inEdit}</b><span>in edit</span></div></div>`}
      <a class="btn go" href="#report">Open Impact Report</a>
    </div>
  </section>`;
}

function viewVideos() {
  const vids = D.videos || [];
  const groups = {
    all: vids,
    waiting: vids.filter(v => v.status === 'Ready for review'),
    changes: vids.filter(v => v.status === 'Changes requested' || v.status === 'In edit'),
    approved: vids.filter(v => v.status === 'Approved' || v.status === 'Posted'),
  };
  const list = groups[filter] || vids;
  const chip = (k, label) => `<button class="chip" data-filter="${k}" aria-pressed="${filter === k}">${label} (${groups[k].length})</button>`;
  return `
  <div class="view-head"><div><h1>Videos</h1><p>Watch each cut and leave notes on the exact second in Frame.io, then approve it here or ask for changes. Edits are unlimited, and revisions come back within three business days.</p></div>
    <div class="chips" role="group" aria-label="Filter videos">${chip('all', 'All')}${chip('waiting', 'Waiting for you')}${chip('changes', 'In edit')}${chip('approved', 'Approved')}</div></div>
  ${list.length ? `<div class="grid">${list.map(v => tile(v)).join('')}</div>`
    : `<div class="empty"><b>${vids.length ? 'Nothing here right now' : 'Your first videos are on their way'}</b>${vids.length ? 'Try another filter.' : 'Every cut lands here the moment your editor finishes it.'}</div>`}`;
}

function viewBriefs() {
  const bs = D.briefs || [];
  return `<div class="view-head"><div><h1>Briefs</h1><p>The plan for each production: the story, who's on camera, where we film and what we deliver. Approve it, or leave a note for your producer.</p></div></div>
  ${bs.length ? `<ul class="brief-list">${bs.map(b => `<li><a href="#briefs/${esc(b.id)}"><div><h2>${esc(b.title)}</h2><p class="sub">${esc([b.kind, b.dates, b.location].filter(Boolean).join(' · '))}</p></div>
    <span class="pill${b.status === 'Approved' ? ' ok' : ''}">${b.status === 'Approved' ? 'Approved' : 'Ready for your eyes'}</span></a></li>`).join('')}</ul>`
    : `<div class="empty"><b>No briefs yet</b>Your producer shares the plan for your first production here after your kickoff call.</div>`}`;
}

function viewBrief(id) {
  const b = (D.briefs || []).find(x => x.id === id);
  if (!b) return `<div class="empty"><b>That brief isn't here</b><a href="#briefs">See all briefs</a></div>`;
  const glance = [...b.glance];
  if (b.dates && !glance.some(g => /date|when/i.test(g[0]))) glance.unshift(['When', b.dates]);
  if (b.location && !glance.some(g => /where|location|route/i.test(g[0]))) glance.splice(1, 0, ['Where', b.location]);
  const approved = b.status === 'Approved';
  return `<article class="brief">
    <a class="btn btn-quiet back no-print" href="#briefs">All briefs</a>
    ${(b.heroes || []).length > 1 ? `<figure class="brief-strip">${b.heroes.map(u => `<img src="${esc(u)}" alt="">`).join('')}</figure>` : b.hero ? `<figure class="brief-hero"><img src="${esc(b.hero)}" alt=""></figure>` : ''}
    <p class="kind">${esc(b.kind || 'Brief')}</p>
    <h1>${esc(b.title)}</h1>
    ${b.subtitle ? `<p class="lede">${esc(b.subtitle)}</p>` : ''}
    ${glance.length ? `<dl class="glance">${glance.map(([k, v]) => `<div>${k ? `<dt>${esc(k)}</dt>` : ''}<dd>${inline(v)}</dd></div>`).join('')}</dl>` : ''}
    <div class="md">${md(b.body)}</div>
    <div class="approve-bar${approved ? ' ok' : ''}" data-id="${esc(b.id)}">
      <p>${approved ? `Approved${b.approvedBy ? ` by ${esc(b.approvedBy)}` : ''}${b.approvedAt ? ` on ${fmtDate(b.approvedAt)}` : ''}` : 'Does this plan look right?'}</p>
      <button class="btn btn-quiet" data-act="print" type="button">Save as PDF</button>
      <button class="btn" data-act="comment" type="button">Leave a note</button>
      ${approved ? '' : '<button class="btn btn-brand" data-act="approve-brief" type="button">Approve this brief</button>'}
    </div>
    <form class="comment-box no-print" hidden>
      <label class="f">Your note to your producer<textarea required placeholder="Anything to add, change or ask about this plan."></textarea></label>
      <div><button class="btn btn-brand" type="submit">Send note</button></div>
    </form>
  </article>`;
}

function viewRequests() {
  const acts = D.activity || [];
  return `<div class="view-head"><div><h1>Requests</h1><p>Ask for a new video from footage we already have, or a whole new production. Your producer picks it up and replies within one business day.</p></div></div>
  <div class="forms">
    <form class="form-card" id="req-video">
      <h2>Request a video</h2>
      <label class="f">What's the video about?<input type="text" name="title" required maxlength="160" placeholder="e.g. Giving Tuesday thank-you to our donors"></label>
      <label class="f">Tell us more<small>The story, the message, where it will be posted.</small><textarea name="note"></textarea></label>
      <div class="seg" role="radiogroup" aria-label="Format">${['Vertical 9:16', 'Horizontal 16:9', 'Both'].map((o, i) => `<label><input type="radio" name="format" value="${o}"${i === 0 ? ' checked' : ''}>${o}</label>`).join('')}</div>
      <div class="two">
        <label class="f">Needed by<small>Optional</small><input type="date" name="due"></label>
        <label class="f">Footage link<small>Optional: Drive, Dropbox, anything</small><input type="url" name="footage" placeholder="https://"></label>
      </div>
      <button class="btn btn-brand" type="submit">Send request</button>
    </form>
    <form class="form-card" id="req-prod">
      <h2>Request a production</h2>
      <div class="seg" role="radiogroup" aria-label="Kind of production">${['Virtual session', 'In-person shoot'].map((o, i) => `<label><input type="radio" name="kind" value="${o}"${i === 0 ? ' checked' : ''}>${o}</label>`).join('')}</div>
      <label class="f">What story should we capture?<textarea name="note" required placeholder="A program, an event, a person whose story should be told."></textarea></label>
      <div class="two">
        <label class="f">When<small>Dates or a window</small><input type="text" name="dates"></label>
        <label class="f">Where<small>City or site</small><input type="text" name="location"></label>
      </div>
      <label class="f">Who's on camera?<small>Optional</small><input type="text" name="people"></label>
      <button class="btn btn-brand" type="submit">Send request</button>
    </form>
  </div>
  <section class="log"><h2>Your recent requests</h2>
    ${acts.length ? `<ol>${acts.map(a => `<li><div>${esc(a.summary)}<br><small>${esc([a.from, fmtDate(a.at)].filter(Boolean).join(' · '))}</small></div><span class="tag${a.status === 'Handled' ? ' done' : ''}">${a.status === 'Handled' ? 'Done' : 'Received'}</span></li>`).join('')}</ol>`
      : '<p class="muted">Nothing yet. Anything you send shows up here.</p>'}
  </section>`;
}

function viewReport() {
  const r = D.report, t = r.totals, v = r.videos;
  const months = Object.keys(r.byMonth).sort().slice(-12);
  const max = Math.max(1, ...months.map(m => r.byMonth[m]));
  const W = 900, H = 220, bw = Math.min(56, (W / Math.max(months.length, 1)) * .62), step = W / Math.max(months.length, 1);
  const label = m => new Date(`${m}-15`).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  const chart = months.length ? `<svg viewBox="0 -24 ${W} ${H + 48}" role="img" aria-label="Views per month">${months.map((m, i) => {
    const h = Math.max(2, (r.byMonth[m] / max) * H), x = i * step + (step - bw) / 2;
    return `<rect class="bar" x="${x}" y="${H - h}" width="${bw}" height="${h}" rx="4"/><text class="val" x="${x + bw / 2}" y="${H - h - 8}" text-anchor="middle">${fmtNum(r.byMonth[m])}</text><text x="${x + bw / 2}" y="${H + 20}" text-anchor="middle">${label(m)}</text>`;
  }).join('')}</svg>` : '';
  const plats = Object.entries(r.byPlatform).sort((a, b) => b[1].views - a[1].views);
  const pmax = Math.max(1, ...plats.map(p => p[1].views));
  const top = [...r.posts].sort((a, b) => b.views - a.views).slice(0, 10);
  const asOf = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  return `<div class="view-head"><div><h1>Impact Report</h1><p>How your stories are doing on the Are You Happy channels, and what we've delivered together. As of ${esc(asOf)}.</p></div>
    <div class="no-print" style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="csv" type="button"${r.posts.length ? '' : ' disabled'}>Download CSV</button><button class="btn btn-brand" data-act="print" type="button">Save as PDF</button></div></div>
  <div class="kpis">
    <div><b>${fmtNum(t.views)}</b><span>views</span></div>
    <div><b>${fmtNum(t.reach)}</b><span>people reached</span></div>
    <div><b>${fmtNum(t.engagements)}</b><span>likes, comments, shares and saves</span></div>
    <div><b>${t.posts}</b><span>posts published</span></div>
    <div><b>${v.delivered}</b><span>videos delivered${v.approved ? `, ${v.approved} approved` : ''}</span></div>
  </div>
  ${r.posts.length ? `
  ${chart ? `<section class="chart"><h2>Views by month</h2>${chart}</section>` : ''}
  <section class="tbl"><h2>By platform</h2><div class="bars">${plats.map(([k, o]) => `<div class="b"><span>${esc(k)}</span><span class="track"><span class="fill" style="width:${(o.views / pmax * 100).toFixed(1)}%"></span></span><span class="n">${fmtNum(o.views)}</span></div>`).join('')}</div></section>
  <section class="tbl"><h2>Top posts</h2><table><thead><tr><th>Posted</th><th>Platform</th><th class="r">Views</th><th class="r">Engagements</th><th></th></tr></thead><tbody>
    ${top.map(p => `<tr><td>${esc(new Date(p.posted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))}</td><td>${esc(p.platform)}</td><td class="r">${p.views.toLocaleString()}</td><td class="r">${(p.likes + p.comments + p.shares + p.saves).toLocaleString()}</td><td>${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener">Open post</a>` : ''}</td></tr>`).join('')}
  </tbody></table></section>`
  : `<div class="empty" style="margin-top:32px"><b>Your numbers fill in as videos go live</b>Once your videos are posted, views, reach and engagement show up here, ready to share with your board.</div>`}`;
}

/* ---------------- interactions ---------------- */
function bind(cur) {
  $('#signout')?.addEventListener('click', async () => { await post('logout', { slug: SLUG }); location.reload(); });
  $$('.chip[data-filter]').forEach(c => c.addEventListener('click', () => { filter = c.dataset.filter; route(); }));
  $$('[data-act="print"]').forEach(b => b.addEventListener('click', () => window.print()));
  $('[data-act="csv"]')?.addEventListener('click', downloadCsv);

  $$('.tile').forEach(t => {
    const id = t.dataset.id, v = D.videos.find(x => x.id === id), form = $('.ask', t);
    $('[data-act="approve"]', t)?.addEventListener('click', async e => {
      const from = await whoAmI(); if (!from) return;
      const b = e.currentTarget; b.disabled = true;
      const r = await post('action', { slug: SLUG, action: 'approve_video', id, from });
      if (!r.ok) { b.disabled = false; return toast("That didn't go through. Check your connection and try again."); }
      v.status = 'Approved';
      t.classList.add('celebrate');
      toast(`Approved: ${v.title}`);
      setTimeout(() => route(), REDUCE ? 300 : 1500);
    });
    $('[data-act="ask"]', t)?.addEventListener('click', () => { form.hidden = false; $('textarea', form).focus(); });
    $('[data-act="cancel"]', t)?.addEventListener('click', () => { form.hidden = true; });
    form?.addEventListener('submit', async e => {
      e.preventDefault();
      const note = $('textarea', form).value.trim(); if (!note) return;
      const from = await whoAmI(); if (!from) return;
      const btn = $('[type=submit]', form); btn.disabled = true; btn.textContent = 'Sending…';
      const r = await post('action', { slug: SLUG, action: 'change_video', id, note, from });
      if (!r.ok) { btn.disabled = false; btn.textContent = 'Send to my editor'; return toast("That didn't go through. Check your connection and try again."); }
      v.status = 'Changes requested'; v.note = `${v.note ? `${v.note}\n\n` : ''}${note}`;
      toast('Sent to your editor. The new version lands here when it is ready.');
      route();
    });
  });

  const bar = $('.approve-bar');
  if (bar) {
    const id = bar.dataset.id, b = D.briefs.find(x => x.id === id), box = $('.comment-box');
    $('[data-act="approve-brief"]', bar)?.addEventListener('click', async e => {
      const from = await whoAmI(); if (!from) return;
      e.currentTarget.disabled = true;
      const r = await post('action', { slug: SLUG, action: 'approve_brief', id, from });
      if (!r.ok) { e.currentTarget.disabled = false; return toast("That didn't go through. Check your connection and try again."); }
      b.status = 'Approved'; b.approvedBy = from; b.approvedAt = new Date().toISOString();
      toast('Brief approved. Your producer has been told.');
      route();
    });
    $('[data-act="comment"]', bar)?.addEventListener('click', () => { box.hidden = false; $('textarea', box).focus(); });
    box?.addEventListener('submit', async e => {
      e.preventDefault();
      const note = $('textarea', box).value.trim(); if (!note) return;
      const from = await whoAmI(); if (!from) return;
      const btn = $('[type=submit]', box); btn.disabled = true;
      const r = await post('action', { slug: SLUG, action: 'comment_brief', id, note, from });
      btn.disabled = false;
      if (!r.ok) return toast("That didn't go through. Check your connection and try again.");
      $('textarea', box).value = ''; box.hidden = true; toast('Note sent to your producer.');
    });
  }

  const sendForm = (sel, action, ok) => $(sel)?.addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.currentTarget; const data = Object.fromEntries(new FormData(f).entries());
    const from = await whoAmI(); if (!from) return;
    const btn = $('[type=submit]', f); btn.disabled = true; btn.textContent = 'Sending…';
    const r = await post('action', { slug: SLUG, action, from, ...data });
    btn.disabled = false; btn.textContent = 'Send request';
    if (!r.ok) return toast(r.body.error === 'missing_title' || r.body.error === 'missing_note' ? 'Add a few words about what you need, then send.' : "That didn't go through. Check your connection and try again.");
    f.reset(); toast(ok);
    D.activity.unshift({ summary: action === 'request_video' ? `${D.portal.client} requested a video: ${data.title}` : `${D.portal.client} requested a production (${data.kind})`, from, at: new Date().toISOString(), status: 'New' });
    route();
  });
  sendForm('#req-video', 'request_video', 'Request sent. Your producer replies within one business day.');
  sendForm('#req-prod', 'request_production', 'Request sent. Your producer will reach out to plan it.');
}

function downloadCsv() {
  const rows = [['Posted', 'Platform', 'Views', 'Reach', 'Likes', 'Comments', 'Shares', 'Saves', 'URL']]
    .concat(D.report.posts.map(p => [p.posted, p.platform, p.views, p.reach, p.likes, p.comments, p.shares, p.saves, p.url]));
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `${D.portal.slug}-impact-report.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/* ---------------- lock, landing, errors ---------------- */
function lockForm({ title, hint, withSlug }) {
  app.innerHTML = `<div class="lock"><form id="unlock" autocomplete="off">
    <h1>${esc(title)}</h1>
    <p class="hint">${hint}</p>
    <label class="sr" for="code">Passcode</label>
    <input id="code" type="text" inputmode="text" autocapitalize="none" spellcheck="false" placeholder="e.g. olive-harbor-4821" required>
    <p class="err" id="err" role="alert"></p>
    <button class="btn btn-brand" type="submit">Open portal</button>
    <p class="by"><img src="${HP_MARK}" alt="">Happy Productions · Lost your passcode? Call ${HP_PHONE}</p>
  </form></div>`;
  const inp = $('#code'); inp.focus();
  $('#unlock').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('#unlock button'); btn.disabled = true; $('#err').textContent = '';
    const r = await post('login', withSlug ? { slug: SLUG, passcode: inp.value } : { passcode: inp.value });
    btn.disabled = false;
    if (r.ok && r.body.slug) {
      if (withSlug) return boot();
      location.href = (onPortalHost ? '/' : '/portal/') + r.body.slug;
      return;
    }
    $('#err').textContent = r.status === 401 ? "That passcode doesn't match. Check your welcome email and try again." : 'The portal is not reachable right now. Try again in a minute.';
    inp.select();
  });
}
function renderLock(client, logo) {
  document.title = `${client || 'Client'} portal`;
  lockForm({ title: client ? `${client} portal` : 'Your client portal', hint: 'Enter the passcode from your welcome email. You only need to do this once on each device.', withSlug: true });
  if (logo) $('#unlock').insertAdjacentHTML('afterbegin', `<img class="lock-logo" src="${esc(logo)}" alt="${esc(client)}">`);
}
function renderLanding() {
  document.title = 'Client portal · Happy Productions';
  lockForm({ title: 'Open your client portal', hint: 'Enter the passcode from your welcome email and we will take you to your videos, briefs and reports.', withSlug: false });
}
function renderMissing() {
  app.innerHTML = `<div class="lock"><div style="max-width:440px;display:flex;flex-direction:column;gap:16px"><h1>This portal address doesn't exist</h1>
    <p class="hint">Check the link in your welcome email, or open your portal with your passcode.</p><a class="btn btn-brand" href="${ROOT}">Open with my passcode</a></div></div>`;
}
function renderTrouble() {
  app.innerHTML = `<div class="lock"><div style="max-width:440px;display:flex;flex-direction:column;gap:16px"><h1>Your portal didn't load</h1>
    <p class="hint">Something on our side is down. Try again in a minute, or call your producer at ${HP_PHONE}.</p><button class="btn btn-brand" onclick="location.reload()">Try again</button></div></div>`;
}

boot().catch(() => renderTrouble());
})();
