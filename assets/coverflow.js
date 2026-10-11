/* ═══════════════════════════════════════════════════════════
   COVERFLOW — the 3D slideshow used for releases, live clips and
   photos. One item sits face-on in the centre; neighbours fan out
   to either side, turned toward it, dimmer and further back, with
   a floor reflection under each (Chromium + Safari).

   coverflow(root, {
     items,                 array of anything
     render(item, i),       → inner HTML for one card
     onChange(i, el),       the centred item changed
     onActivate(i, e, el),  the centred item was clicked
     autoplay: ms | 0,      advance on a timer (off for reduced motion)
     start: index,
     label: 'Releases',
     intro: true            fan the cards out on first paint
   }) → { go(i), next(), prev(), index, destroy() }

   Re-render safe: calling it again on the same root tears the
   previous wiring down first.
   ═══════════════════════════════════════════════════════════ */

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ICON_L = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
const ICON_R = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';

export function coverflow(root, opts = {}){
  if (!root) return null;
  if (root._cf) root._cf.destroy();

  const items = opts.items || [];
  const n = items.length;
  const label = opts.label || 'Carousel';

  root.classList.add('cf');
  root.setAttribute('role', 'region');
  root.setAttribute('aria-roledescription', 'carousel');
  root.setAttribute('aria-label', label);
  root.tabIndex = 0;
  root.innerHTML = `
    <div class="cf__stage">
      ${items.map((it, i) => `<div class="cf__item" data-i="${i}" role="group"
          aria-roledescription="slide" aria-label="${i + 1} of ${n}">${opts.render(it, i)}</div>`).join('')}
    </div>
    ${n > 1 ? `<div class="cf__ctrl">
      <button class="cf__nav cf__nav--prev glass press" type="button" aria-label="Previous">${ICON_L}</button>
      <div class="cf__dots">${items.map((_, i) =>
        `<button class="cf__dot" type="button" data-i="${i}" aria-label="Go to ${i + 1}"></button>`).join('')}</div>
      <button class="cf__nav cf__nav--next glass press" type="button" aria-label="Next">${ICON_R}</button>
    </div>` : ''}`;

  const cards = Array.from(root.querySelectorAll('.cf__item'));
  const dots  = Array.from(root.querySelectorAll('.cf__dot'));
  const ac = new AbortController();
  const on = (el, ev, fn, o = {}) => el.addEventListener(ev, fn, { signal: ac.signal, ...o });

  let idx = Math.min(Math.max(opts.start || 0, 0), Math.max(n - 1, 0));
  let timer = null, paused = false;
  const loop = n >= 3;   // with 3+ items the fan wraps so both sides stay full

  function offset(i){
    let d = i - idx;
    if (loop){
      if (d >  n / 2) d -= n;
      if (d <= -n / 2) d += n;
    }
    return d;
  }

  function layout(){
    const w = cards[0]?.offsetWidth || 300;
    const narrow = root.clientWidth < 640;
    const side = opts.side ?? (narrow ? 1 : 3);
    cards.forEach((c, i) => {
      const d = offset(i), a = Math.abs(d), s = Math.sign(d);
      if (d === 0){
        c.style.transform = 'translate(-50%,0) translateZ(0) rotateY(0) scale(1)';
        c.style.opacity = '1';
        c.style.filter = 'none';
        c.style.zIndex = '50';
      } else {
        const x = s * (w * (narrow ? .64 : .76) + (a - 1) * w * (narrow ? .3 : .4));
        c.style.transform = `translate(calc(-50% + ${x}px),0) translateZ(${-90 - a * 70}px) rotateY(${-s * 38}deg) scale(${narrow ? .8 : .86})`;
        c.style.opacity = a > side ? '0' : String(1 - (a - 1) * .14);
        c.style.filter = `brightness(${Math.max(.32, .62 - (a - 1) * .1)})`;
        c.style.zIndex = String(50 - a);
      }
      c.dataset.pos = d === 0 ? 'active' : (a > side ? 'hidden' : 'side');
      c.setAttribute('aria-hidden', String(d !== 0));
      c.querySelectorAll('a,button,iframe,video').forEach(el => el.tabIndex = d === 0 ? 0 : -1);
    });
    dots.forEach((d, i) => d.dataset.active = String(i === idx));
  }

  function go(i){
    if (!n) return;
    const was = idx;
    idx = loop ? (i + n) % n : Math.min(Math.max(i, 0), n - 1);
    if (idx !== was){
      cards[was]?.querySelectorAll('video').forEach(v => v.pause());
      cards[was]?.querySelectorAll('iframe[data-live]').forEach(f => f.remove());
    }
    layout();
    if (idx !== was || !go.ran) opts.onChange?.(idx, cards[idx]);
    go.ran = true;
  }
  const next = () => go(idx + 1);
  const prev = () => go(idx - 1);

  /* autoplay: off for reduced motion, paused while the visitor is
     interacting or the tab is hidden */
  function stop(){ clearInterval(timer); timer = null; }
  function start(){
    stop();
    if (!opts.autoplay || REDUCED || paused || n < 2 || document.hidden) return;
    timer = setInterval(next, opts.autoplay);
  }
  const hold = () => { paused = true; stop(); };
  const release = () => { paused = false; start(); };

  on(root, 'pointerenter', hold);
  on(root, 'pointerleave', release);
  on(root, 'focusin', hold);
  on(root, 'focusout', e => { if (!root.contains(e.relatedTarget)) release(); });
  on(document, 'visibilitychange', () => document.hidden ? stop() : start());

  root.querySelector('.cf__nav--prev') && on(root.querySelector('.cf__nav--prev'), 'click', prev);
  root.querySelector('.cf__nav--next') && on(root.querySelector('.cf__nav--next'), 'click', next);
  dots.forEach(d => on(d, 'click', () => go(Number(d.dataset.i))));

  on(root, 'keydown', e => {
    if (e.target.closest('input,textarea')) return;
    if (e.key === 'ArrowLeft'){ e.preventDefault(); prev(); }
    if (e.key === 'ArrowRight'){ e.preventDefault(); next(); }
  });

  /* swipe / drag — a small threshold so a tap is still a tap.
     Listeners sit on the root, not the 3D stage: the stage plane is in
     front of the receding side cards and would swallow their clicks
     (it has pointer-events:none in site.css for the same reason). */
  let x0 = null, moved = false;
  on(root, 'pointerdown', e => { if (e.button === 0 && !e.target.closest('.cf__ctrl')){ x0 = e.clientX; moved = false; } });
  on(window, 'pointerup', e => {
    if (x0 === null) return;
    const dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) > 40){ moved = true; dx < 0 ? next() : prev(); }
  });
  on(root, 'click', e => {
    if (moved){ e.preventDefault(); e.stopPropagation(); moved = false; return; }
    const card = e.target.closest('.cf__item');
    if (!card) return;
    const i = Number(card.dataset.i);
    if (i !== idx){ e.preventDefault(); e.stopPropagation(); go(i); return; }   // a side card is navigation, not a link
    if (e.target.closest('a,button,video,iframe')) return;  // inner controls handle themselves
    opts.onActivate?.(i, e, card);
  }, { capture: true });

  on(window, 'resize', layout, { passive: true });

  const api = {
    go, next, prev,
    get index(){ return idx; },
    get card(){ return cards[idx]; },
    destroy(){ stop(); ac.abort(); root._cf = null; }
  };
  root._cf = api;

  /* optional entrance: cards start stacked in the middle and fan out */
  if (opts.intro && !REDUCED){
    root.dataset.intro = 'true';
    requestAnimationFrame(() => requestAnimationFrame(() => { root.dataset.intro = 'false'; }));
  }
  go(idx);
  start();
  return api;
}
