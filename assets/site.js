/* ═══════════════════════════════════════════════════════════
   SITE RUNTIME — shared by every public page.

   • injects the nav, mobile menu, social rail, footer, player dock
     and video lightbox, so all pages stay identical
   • keeps the content fresh (see CONTENT STORE below)
   • liquid-glass press feedback, ambient light, analytics,
     newsletter sign-up

   A page imports what it needs and registers a render function:
     import { onData } from './assets/site.js?v=…';
     onData(DATA => { …paint the page… });
   It is called once with the freshest content available, and again
   whenever that content changes — including live, when the owner
   saves in admin.html while the page is open.
   ═══════════════════════════════════════════════════════════ */
import { CONFIG, esc, compact, hydrate, isRealPayload, ytId, ytThumb, isVertical }
  from './shared-data.js?v=20261011';

export { esc, compact, ytId, ytThumb, isVertical };
export const $  = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
export const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const TOUCH   = matchMedia('(hover: none)').matches;
const PAGE = document.body.dataset.page || '';
const connected = () => Boolean(CONFIG.supabase.enabled && CONFIG.supabase.url && CONFIG.supabase.anonKey);

/* ═══════════════════════════════════════════════════════════
   ICONS — only where they carry meaning (platforms, controls)
   ═══════════════════════════════════════════════════════════ */
const GLYPH = {
  audiomack:'<path d="M3 12h2l2-6 3 14 3-11 2 5h6"/>',
  youtube  :'<path d="M2 8.5A3 3 0 015 5.5h14a3 3 0 013 3v7a3 3 0 01-3 3H5a3 3 0 01-3-3z"/><path d="M10 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none"/>',
  spotify  :'<circle cx="12" cy="12" r="9"/><path d="M7.5 9.5c3-1 6.5-.8 9 .8M8 13c2.4-.8 5-.6 7 .7M8.6 16c1.9-.6 3.9-.4 5.5.5"/>',
  apple    :'<path d="M15.5 3.2c.2 1.3-.4 2.5-1.2 3.3-.8.9-2 1.5-3.2 1.4-.2-1.2.4-2.5 1.2-3.3.9-.9 2.2-1.4 3.2-1.4z"/><path d="M19 16.6c-.5 1.2-.8 1.7-1.4 2.7-.9 1.4-2.2 3.1-3.8 3.1-1.4 0-1.8-.9-3.7-.9s-2.3.9-3.7.9c-1.6 0-2.8-1.5-3.7-2.9C.9 15.6.6 10.9 2.2 8.4c1.1-1.7 2.9-2.7 4.6-2.7 1.7 0 2.8 1 4.2 1 1.4 0 2.2-1 4.2-1 1.5 0 3.1.8 4.2 2.3-3.7 2-3.1 7.2-.4 8.6z"/>',
  boomplay :'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.2"/>',
  instagram:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/>',
  tiktok   :'<path d="M14 3v11.5a3.5 3.5 0 11-3.5-3.5"/><path d="M14 3c.4 2.6 2.2 4.3 5 4.5"/>',
  facebook :'<path d="M14 8.5V7a1.5 1.5 0 011.5-1.5H17V2.5h-2.5A4.5 4.5 0 0010 7v1.5H7.5v3.5H10V21.5h4V12h2.6l.6-3.5z"/>',
  x        :'<path d="M4 4l11.5 16H20L8.5 4z"/><path d="M19.5 4l-6.6 7.4M11.1 12.6L4.5 20"/>',
  _default :'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/>'
};
export const glyph = id => GLYPH[id] || GLYPH._default;
export const icon = (id, cls = '') =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${glyph(id)}</svg>`;
export const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>';
const CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>';
const MARK = `<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="currentColor"/>
  <path d="M9 14v4M12.5 11v10M16 7.5v17M19.5 11v10M23 14v4" stroke="#0B0A09" stroke-width="2.1" stroke-linecap="round"/></svg>`;

const PAGES = [
  ['home',   'Home',   'index.html'],
  ['music',  'Music',  'music.html'],
  ['videos', 'Videos', 'videos.html'],
  ['shows',  'Shows',  'shows.html'],
  ['about',  'About',  'about.html'],
  ['contact','Contact','contact.html']
];

/* ═══════════════════════════════════════════════════════════
   CHROME — nav, menu, social rail, footer, dock, lightbox
   ═══════════════════════════════════════════════════════════ */
function injectChrome(){
  const links = PAGES.map(([id, label, href]) =>
    `<a class="nav__a press" href="${href}"${id === PAGE ? ' aria-current="page"' : ''}>${label}</a>`).join('');

  document.body.insertAdjacentHTML('afterbegin', `
    <a class="skip" href="#main">Skip to content</a>
    <svg width="0" height="0" style="position:absolute" aria-hidden="true">
      <filter id="lg" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.006 0.012" numOctaves="2" seed="7" result="n"/>
        <feGaussianBlur in="n" stdDeviation="2" result="nb"/>
        <feDisplacementMap in="SourceGraphic" in2="nb" scale="38" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
    </svg>
    <div class="ambient" aria-hidden="true"><img class="ambient__img" alt=""><img class="ambient__img" alt=""></div>
    <header class="nav" id="nav">
      <div class="nav__in">
        <a class="brand" href="index.html" aria-label="Tobi Simon — home">
          <span class="brand__mark">${MARK}</span><span class="brand__name">Tobi Simon</span></a>
        <nav class="nav__pill glass glass--strong glass--refract" aria-label="Main">${links}</nav>
        <a class="nav__cta btn btn--glass btn--sm glass press" href="contact.html" data-track="talk_click">Book Tobi</a>
        <button class="nav__burger glass press" id="burger" aria-label="Menu" aria-expanded="false" aria-controls="sheet">
          <span></span><span></span></button>
      </div>
    </header>
    <div class="sheet glass glass--strong" id="sheet" data-open="false">
      <nav aria-label="Mobile">${links}</nav>
      <a class="btn btn--gold press" href="contact.html" data-track="talk_click">Book Tobi</a>
    </div>
    <aside class="srail" id="srail" aria-label="Social links"></aside>`);

  document.body.insertAdjacentHTML('beforeend', `
    <footer class="foot">
      <div class="shell foot__grid">
        <div class="foot__join">
          <h2 class="foot__h">Hear it first.</h2>
          <p>New songs, videos and show dates, straight to your inbox. No spam, ever.</p>
          ${signupForm('footer')}
        </div>
        <nav class="foot__nav" aria-label="Footer">${PAGES.map(([, l, h]) => `<a href="${h}">${l}</a>`).join('')}</nav>
        <div class="foot__social" id="footSocial"></div>
      </div>
      <div class="shell foot__base">
        <span>© ${new Date().getFullYear()} Tobi Simon</span>
        <a id="footMail" href="#"></a>
      </div>
    </footer>

    <div class="dock glass glass--strong glass--refract" id="dock" data-open="false" role="region" aria-label="Now playing">
      <div class="dock__head">
        <img class="dock__art" id="dockArt" alt="">
        <div class="dock__meta"><div class="dock__t" id="dockTitle"></div><div class="dock__s" id="dockSub"></div></div>
        <button class="dock__x press" id="dockX" aria-label="Close player">${CLOSE}</button>
      </div>
      <div class="dock__frame" id="dockFrame"></div>
    </div>

    <div class="lb" id="lb" hidden>
      <div class="lb__scrim" data-close></div>
      <div class="lb__box" role="dialog" aria-modal="true" aria-label="Video">
        <div class="lb__frame" id="lbFrame"></div>
        <div class="lb__cap" id="lbCap"></div>
        <button class="lb__x glass press" data-close aria-label="Close video">${CLOSE}</button>
      </div>
    </div>
    <div class="toast glass glass--strong" id="toast" role="status"></div>`);

  const sheet = $('#sheet'), burger = $('#burger');
  const setMenu = open => {
    sheet.dataset.open = String(open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.dataset.locked = String(open);
  };
  burger.addEventListener('click', () => setMenu(sheet.dataset.open !== 'true'));
  sheet.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });

  $('#dockX').addEventListener('click', stopTrack);
  $('#lb').addEventListener('click', e => { if (e.target.closest('[data-close]')) closeVideo(); });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!$('#lb').hidden) closeVideo();
    else if (sheet.dataset.open === 'true') setMenu(false);
    else if ($('#dock').dataset.open === 'true') stopTrack();
  });

  const nav = $('#nav');
  const onScroll = () => nav.dataset.scrolled = String(scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  document.addEventListener('click', e => {
    const t = e.target.closest('[data-track]');
    if (t) track(t.dataset.track);
  });

  /* Real refraction is a Chromium-only feature (an SVG filter inside
     backdrop-filter). Everyone else keeps the blur-only glass. */
  const brands = navigator.userAgentData?.brands || [];
  if (brands.some(b => /Chrom/.test(b.brand)) && !REDUCED) document.documentElement.classList.add('lg-refract');
}

function paintChrome(DATA){
  const socials = socialLinks(DATA);
  const html = socials.map(s => `<a class="press" href="${esc(s.url)}" target="_blank" rel="noopener"
      aria-label="${esc(s.name)}" title="${esc(s.name)}">${icon(s.id)}</a>`).join('');
  $('#srail').innerHTML = html;
  $('#footSocial').innerHTML = html;
  const mail = DATA.profile?.email || '';
  $('#footMail').textContent = mail;
  $('#footMail').href = mail ? 'mailto:' + mail : '#';
}

/* every social + streaming profile that has a link, socials first */
export function socialLinks(DATA){
  const s = DATA.profile?.socials || {};
  const names = { instagram:'Instagram', tiktok:'TikTok', youtube:'YouTube', facebook:'Facebook', x:'X' };
  const out = Object.keys(names).filter(k => s[k]).map(k => ({ id:k, name:names[k], url:s[k] }));
  (DATA.platforms || []).forEach(p => {
    if (!p.url) return;
    const id = p.id === 'youtube' && s.youtube ? null : p.id;   // one YouTube icon is enough
    if (id) out.push({ id, name: p.name, url: p.url });
  });
  return out;
}

/* ═══════════════════════════════════════════════════════════
   LIQUID-GLASS PRESS — the light follows the finger, the control
   squishes, a ripple spreads from the touch point.
   ═══════════════════════════════════════════════════════════ */
function wirePress(){
  const setXY = (el, e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    return r;
  };
  document.addEventListener('pointermove', e => {
    const el = e.target.closest?.('.press');
    if (el && e.pointerType === 'mouse') setXY(el, e);
  }, { passive: true });
  document.addEventListener('pointerdown', e => {
    const el = e.target.closest?.('.press');
    if (!el || el.disabled) return;
    const r = setXY(el, e);
    el.classList.add('is-pressed');
    if (!REDUCED){
      const rip = document.createElement('span');
      rip.className = 'ripple';
      rip.style.left = (e.clientX - r.left) + 'px';
      rip.style.top  = (e.clientY - r.top) + 'px';
      el.appendChild(rip);
      rip.addEventListener('animationend', () => rip.remove());
    }
    const up = () => { el.classList.remove('is-pressed'); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); };
    addEventListener('pointerup', up);
    addEventListener('pointercancel', up);
  });
}

/* ═══════════════════════════════════════════════════════════
   AMBIENT LIGHT — the page glows in the colour of whatever cover
   is on screen. Falls back to gold when an image can't be read
   (cross-origin hosts that don't allow it).
   ═══════════════════════════════════════════════════════════ */
const ambCache = new Map();
let ambLayer = 0;
export function ambientFrom(src){
  const set = c => document.documentElement.style.setProperty('--amb-c', c);
  /* the cover itself, huge and blurred, cross-fades in behind the page */
  const layers = $$('.ambient__img');
  if (layers.length && src && layers[ambLayer].dataset.src !== src){
    ambLayer = 1 - ambLayer;
    const inc = layers[ambLayer], out = layers[1 - ambLayer];
    inc.dataset.src = src;
    inc.onload = () => { inc.dataset.on = 'true'; out.dataset.on = 'false'; };
    inc.src = src;
  }
  if (!src){ set('rgb(217 164 91)'); return; }
  if (ambCache.has(src)){ set(ambCache.get(src)); return; }
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    try{
      const c = document.createElement('canvas'); c.width = c.height = 12;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(img, 0, 0, 12, 12);
      const d = g.getImageData(0, 0, 12, 12).data;
      // weight saturated pixels so a grey border doesn't win
      let r = 0, gr = 0, b = 0, w = 0;
      for (let i = 0; i < d.length; i += 4){
        const mx = Math.max(d[i], d[i+1], d[i+2]), mn = Math.min(d[i], d[i+1], d[i+2]);
        const wt = 1 + (mx - mn) / 32;
        r += d[i] * wt; gr += d[i+1] * wt; b += d[i+2] * wt; w += wt;
      }
      r /= w; gr /= w; b /= w;
      const lift = 190 / Math.max(r, gr, b, 1);           // normalise brightness
      const col = `rgb(${Math.min(255, r * lift) | 0} ${Math.min(255, gr * lift) | 0} ${Math.min(255, b * lift) | 0})`;
      ambCache.set(src, col); set(col);
    }catch{ ambCache.set(src, 'rgb(217 164 91)'); set('rgb(217 164 91)'); }
  };
  img.onerror = () => set('rgb(217 164 91)');
  img.src = src;
}

/* ═══════════════════════════════════════════════════════════
   CONTENT STORE — why reloading always shows the latest save
   1. paint instantly from the last Supabase payload this browser
      saw (never from stale built-in defaults)
   2. fetch the live row on every load, bypassing the HTTP cache;
      re-render if it changed
   3. stay subscribed (Supabase Realtime) and re-fetch the moment
      the owner saves — open pages update without a reload
   4. also re-check when the tab regains focus, in case realtime
      isn't switched on
   ═══════════════════════════════════════════════════════════ */
const CACHE_KEY = 'ts_content_v2';
let DATA = hydrate(null);
let meta = { source: 'defaults', updatedAt: null };
let ready = false, LIVE = null, lastFetch = 0;
const subs = new Set();

export const getData = () => DATA;

export function onData(fn){
  subs.add(fn);
  if (ready) safe(fn);
}
function safe(fn){ try{ fn(DATA, meta); }catch(err){ console.error(err); } }
function emit(){
  ready = true;
  document.documentElement.dataset.loading = 'false';
  applyLive();
  safe(paintChrome);
  subs.forEach(safe);
}

function readCache(){
  try{ return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); }catch{ return null; }
}
function writeCache(v){
  try{ v ? localStorage.setItem(CACHE_KEY, JSON.stringify(v)) : localStorage.removeItem(CACHE_KEY); }catch{}
}

async function fetchContent(){
  lastFetch = Date.now();
  const res = await fetch(`${CONFIG.supabase.url}/rest/v1/site_content?id=eq.1&select=payload,updated_at`, {
    cache: 'no-store',
    headers: { apikey: CONFIG.supabase.anonKey, Authorization: 'Bearer ' + CONFIG.supabase.anonKey }
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const row = (await res.json())[0];
  if (row && isRealPayload(row.payload)){
    if (ready && row.updated_at && row.updated_at === meta.updatedAt) return;   // nothing new
    DATA = hydrate(row.payload);
    meta = { source: 'live', updatedAt: row.updated_at || null };
    writeCache({ payload: row.payload, updatedAt: meta.updatedAt });
  } else {
    // the row is empty: built-in content is the truth
    if (ready && meta.source === 'defaults') return;
    DATA = hydrate(null);
    meta = { source: 'defaults', updatedAt: null };
    writeCache(null);
  }
  emit();
}

let refetchTimer = null;
function refetchSoon(){
  clearTimeout(refetchTimer);
  refetchTimer = setTimeout(() => fetchContent().catch(err => console.warn('Refresh failed', err)), 250);
}

async function subscribeLive(){
  try{
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const sb = createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
    sb.channel('site-content')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_content' }, refetchSoon)
      .subscribe();
  }catch(err){
    console.info('Live updates unavailable — content refreshes on reload and tab focus.', err);
  }
}

async function bootContent(){
  const cached = connected() ? readCache() : null;
  if (cached && isRealPayload(cached.payload)){
    DATA = hydrate(cached.payload);
    meta = { source: 'cache', updatedAt: cached.updatedAt || null };
    emit();
  } else if (connected()){
    // first visit: hold the page briefly for real content, never longer than 3s
    document.documentElement.dataset.loading = 'true';
    setTimeout(() => { if (!ready) emit(); }, 3000);
  } else {
    emit();
    return;
  }

  try{ await fetchContent(); }
  catch(err){
    console.warn('Could not reach Supabase — showing the last saved content.', err);
    if (!ready) emit();
  }
  subscribeLive();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && Date.now() - lastFetch > 15000) refetchSoon();
  });
}

/* Live Audiomack / YouTube numbers (optional edge function). */
function applyLive(){
  if (!LIVE) return;
  (DATA.platforms || []).forEach(p => { if (p.live && typeof LIVE[p.id] === 'number') p.value = LIVE[p.id]; });
}
async function fetchLive(){
  if (!CONFIG.liveEndpoint) return;
  try{
    const res = await fetch(CONFIG.liveEndpoint);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    LIVE = await res.json();
    if (ready) emit();
  }catch(err){ console.warn('Live stats unavailable — showing saved figures.', err); }
}

/* ═══════════════════════════════════════════════════════════
   PLAYER DOCK — Audiomack (or any) embed, docked bottom-right
   ═══════════════════════════════════════════════════════════ */
let playing = null;
export function playTrack(ai, ti){
  const album = DATA.albums?.[ai];
  const t = album?.tracks?.[ti];
  if (!t) return;
  if (!t.embed){ toast('This track has no player link yet.'); return; }
  const sep = t.embed.includes('?') ? '&' : '?';
  $('#dockFrame').innerHTML = `<iframe src="${esc(t.embed + sep + 'autoplay=1')}" scrolling="no"
    allow="autoplay; encrypted-media; clipboard-write" loading="lazy" title="${esc(t.title)}"></iframe>`;
  $('#dockTitle').textContent = t.title;
  $('#dockSub').textContent = album.title + (album.year ? ' · ' + album.year : '');
  const art = $('#dockArt');
  if (album.art){ art.src = album.art; art.hidden = false; } else art.hidden = true;
  $('#dock').dataset.open = 'true';
  playing = { ai, ti };
  document.dispatchEvent(new CustomEvent('ts:playing', { detail: playing }));
}
export function stopTrack(){
  $('#dock').dataset.open = 'false';
  $('#dockFrame').innerHTML = '';
  playing = null;
  document.dispatchEvent(new CustomEvent('ts:playing', { detail: null }));
}
export const nowPlaying = () => playing;

/* ═══════════════════════════════════════════════════════════
   VIDEO LIGHTBOX — privacy-friendly YouTube embed, only loaded
   when the visitor asks for it
   ═══════════════════════════════════════════════════════════ */
export function ytEmbed(id){
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1&modestbranding=1`;
}
export function openVideo(v){
  const id = ytId(v.url);
  const box = $('#lb');
  if (id){
    $('#lbFrame').innerHTML = `<iframe src="${ytEmbed(id)}" title="${esc(v.title || 'Video')}"
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
  } else if (v.file){
    $('#lbFrame').innerHTML = `<video src="${esc(v.file)}" controls autoplay playsinline></video>`;
  } else return;
  box.dataset.vertical = String(isVertical(v) || Boolean(v.vertical));
  $('#lbCap').innerHTML = `<strong>${esc(v.title || '')}</strong>${videoWhere(v) ? `<span>${esc(videoWhere(v))}</span>` : ''}`;
  box.hidden = false;
  document.body.dataset.locked = 'true';
  if ($('#dock').dataset.open === 'true') stopTrack();   // one sound at a time
  requestAnimationFrame(() => box.dataset.open = 'true');
  $('.lb__x', box).focus();
}
export function closeVideo(){
  const box = $('#lb');
  box.dataset.open = 'false';
  document.body.dataset.locked = 'false';
  setTimeout(() => { box.hidden = true; $('#lbFrame').innerHTML = ''; }, REDUCED ? 0 : 280);
}
export function videoWhere(v){
  const when = v.date ? fmtDate(v.date, { month:'short', year:'numeric' }) : '';
  return [v.venue, v.city, when].filter(Boolean).join(', ');
}

/* One release as a coverflow card: art (or a typeset placeholder if
   the image is missing), a play control and a glass tag. */
export function releaseCard(a){
  return `<div class="card__art">
      <span class="card__ph">${esc(a.title)}</span>
      ${a.art ? `<img src="${esc(a.art)}" alt="${esc(a.title)} cover" draggable="false" onerror="this.remove()">` : ''}
      ${(a.tracks || []).length ? `<button class="card__play glass press" type="button" data-play aria-label="Play ${esc(a.title)}">${PLAY}</button>` : ''}
      <span class="card__tag glass"><span>${esc(a.kind || 'Album')}${a.year ? ' · ' + esc(a.year) : ''}</span></span>
    </div>`;
}
export const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;

/* "2026-11-14" → "14 Nov 2026"; anything else is shown as typed */
export function fmtDate(s, o = { day:'numeric', month:'short', year:'numeric' }){
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
  if (!m) return String(s || '');
  return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString('en-GB', o);
}

/* ═══════════════════════════════════════════════════════════
   TOAST
   ═══════════════════════════════════════════════════════════ */
export function toast(text){
  const t = $('#toast');
  t.textContent = text; t.dataset.show = 'true';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.dataset.show = 'false', 3400);
}

/* ═══════════════════════════════════════════════════════════
   NEWSLETTER — saved to the `subscribers` table (insert-only for
   visitors). A repeat sign-up is treated as success.
   ═══════════════════════════════════════════════════════════ */
export function signupForm(source){
  return `<form class="signup glass" data-source="${source}" novalidate>
      <label class="sr" for="su-${source}">Email address</label>
      <input id="su-${source}" class="signup__i" type="email" name="email" placeholder="you@email.com" autocomplete="email" required>
      <input class="sr" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
      <button class="btn btn--gold press" type="submit">Join</button>
    </form>
    <p class="msg" aria-live="polite"></p>`;
}
function wireSignup(){
  document.addEventListener('submit', async e => {
    const form = e.target.closest('.signup');
    if (!form) return;
    e.preventDefault();
    const msg = form.nextElementSibling;
    const email = form.email.value.trim().toLowerCase();
    if (form.website.value) return;   // a bot filled the hidden field
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)){
      msg.dataset.kind = 'bad'; msg.textContent = 'That email doesn’t look right.'; return;
    }
    const btn = form.querySelector('button');
    btn.disabled = true; msg.dataset.kind = ''; msg.textContent = 'Adding you…';
    let ok = !connected();
    if (connected()){
      try{
        const res = await fetch(CONFIG.supabase.url + '/rest/v1/subscribers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: CONFIG.supabase.anonKey,
                     Authorization: 'Bearer ' + CONFIG.supabase.anonKey, Prefer: 'return=minimal' },
          body: JSON.stringify({ email, source: form.dataset.source + ':' + PAGE })
        });
        ok = res.ok || res.status === 409;
      }catch{ ok = false; }
    }
    btn.disabled = false;
    if (ok){
      form.reset();
      msg.dataset.kind = 'ok'; msg.textContent = 'You’re on the list. Thank you!';
      track('signup');
    } else {
      msg.dataset.kind = 'bad'; msg.textContent = 'Couldn’t sign you up just now. Please try again later.';
    }
  });
}

/* ═══════════════════════════════════════════════════════════
   VISITOR STATS — anonymous: no cookies, no IP, no personal data;
   a random id in sessionStorage so one visit isn't many people.
   keepalive lets the exit event survive the page closing.
   ═══════════════════════════════════════════════════════════ */
const VISIT_START = Date.now();
function sessionId(){
  try{
    let id = sessionStorage.getItem('ts_sid');
    if (!id){
      id = crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now();
      sessionStorage.setItem('ts_sid', id);
    }
    return id;
  }catch{ return 'no-storage'; }
}
export function track(kind, extra = {}){
  if (!connected()) return;
  fetch(CONFIG.supabase.url + '/rest/v1/site_events', {
    method: 'POST', keepalive: true,
    headers: { 'Content-Type': 'application/json', apikey: CONFIG.supabase.anonKey,
               Authorization: 'Bearer ' + CONFIG.supabase.anonKey, Prefer: 'return=minimal' },
    body: JSON.stringify({ kind, session_id: sessionId(), ...extra })
  }).catch(() => {});   // analytics must never break the page
}
let leaveSent = false;
function sendLeave(){
  if (leaveSent) return;
  const seconds = Math.round((Date.now() - VISIT_START) / 1000);
  if (seconds < 1 || seconds > 3600) return;   // matches the SQL sanity range
  leaveSent = true;
  track('leave', { seconds });
}

/* ═══════════════════════════════════════════════════════════
   BOOT
   ═══════════════════════════════════════════════════════════ */
injectChrome();
wirePress();
wireSignup();
addEventListener('pagehide', sendLeave);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') sendLeave(); });
track('visit');
bootContent();
fetchLive();
