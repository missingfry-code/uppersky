/* =====================================================
   UPPERSKY MEDIA — contact page
   The departure board (LA clock + a status that follows the
   flight-plan form), the hero arrival, the gate's glare and the
   direct-line reveals. Loads after app.js and kit.js.
   ===================================================== */

/* ---------- Departure board — needs no GSAP, so it lives on its own ---------- */
(() => {
  const board = document.querySelector('.ct-board');
  if (!board) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  // Split-flap: one tile per character; changed tiles riffle through glyphs, then settle
  const flap = (el, text, animate) => {
    if (!el.querySelector('.ct-tile')) el.textContent = ''; // drop the no-JS fallback text
    const run = (el.ctRun = (el.ctRun || 0) + 1);
    const chars = [...text];
    while (el.children.length < chars.length){
      const tile = document.createElement('span');
      tile.className = 'ct-tile';
      el.appendChild(tile);
    }
    while (el.children.length > chars.length) el.lastElementChild.remove();

    chars.forEach((ch, i) => {
      const tile = el.children[i];
      const sym = !/[A-Z0-9]/i.test(ch);
      tile.classList.toggle('is-sym', sym);
      if (tile.textContent === ch) return;
      if (!animate || sym){ tile.textContent = ch; return; }
      let spins = 2 + Math.floor(Math.random() * 3);
      const riffle = () => {
        if (run !== el.ctRun) return; // a newer value has taken this tile over
        tile.classList.remove('is-flip');
        void tile.offsetWidth; // restart the flip keyframes
        tile.classList.add('is-flip');
        tile.textContent = spins > 0 ? GLYPHS[(Math.random() * GLYPHS.length) | 0] : ch;
        if (spins-- > 0) setTimeout(riffle, 70);
      };
      setTimeout(riffle, i * 50);
    });
  };

  /* Route — static, drawn once */
  board.querySelectorAll('[data-ct-flap]').forEach((el) => flap(el, el.dataset.ctFlap, false));

  /* LA local time — on the board and on the "Base" line */
  let fmt = null;
  try {
    fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles', hour: '2-digit', minute: '2-digit', hour12: true
    });
  } catch (_){}
  const clockTiles = document.querySelectorAll('[data-ct-clock-tiles]');
  const clockText  = document.querySelectorAll('[data-ct-clock]');
  const ampm       = document.querySelectorAll('[data-ct-ampm]');
  const tick = (animate) => {
    const p = {};
    fmt.formatToParts(new Date()).forEach(({ type, value }) => { p[type.toLowerCase()] = value; });
    const hm = `${p.hour}:${p.minute}`;
    const period = (p.dayperiod || '').toUpperCase();
    clockTiles.forEach((el) => flap(el, hm, animate));
    ampm.forEach((el) => { el.textContent = period || 'PT'; });
    clockText.forEach((el) => { el.textContent = `${hm} ${period}`.trim(); });
  };
  if (fmt){
    tick(false);
    // LA keeps whole-hour offsets, so its minute turns over with the system clock's
    setTimeout(() => {
      tick(!reduce);
      setInterval(() => tick(!reduce), 60000);
    }, 60050 - (Date.now() % 60000));
  }

  /* Status — follows the form leg by leg, then clears for takeoff */
  const plan   = document.querySelector('.ct-gate [data-flightplan]');
  const status = board.querySelector('[data-ct-status]');
  const hero   = document.querySelector('.ct-hero');
  if (!plan || !status) return;
  const legs = [...plan.querySelectorAll('.flightform__legs li')];
  const done = plan.querySelector('[data-ff="done"]');
  const WORDS = ['CHECK-IN', 'BOARDING', 'TAXIING', 'READY'];
  let shown = '';
  const sync = () => {
    const filed = !!done && !done.hidden;
    const at = Math.max(0, legs.findIndex((li) => li.classList.contains('is-current')));
    const word = filed ? 'CLEARED' : (WORDS[at] || WORDS[0]);
    board.dataset.leg = filed ? 'done' : String(at + 1);
    if (hero) hero.classList.toggle('is-filed', filed);
    if (word === shown) return;
    flap(status, word, !!shown && !reduce);
    shown = word;
  };
  sync();
  // kit.js owns the form; we only watch the classes/attributes it flips
  new MutationObserver(sync).observe(plan, { subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] });
})();

/* ---------- Motion — the arrival, parallax, glare, reveals ---------- */
(() => {
  const html = document.documentElement;
  const release = () => html.classList.remove('ct-arriving');
  if (typeof gsap === 'undefined'){ release(); return; }

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hero = document.querySelector('.ct-hero');
  if (!hero || reduce){ release(); return; }
  const hasST = typeof ScrollTrigger !== 'undefined';

  const mediaWrap = hero.querySelector('.ct-hero__media');
  const media = hero.querySelector('.ct-hero__media img');
  const lines = hero.querySelectorAll('.ct-title .line > span');
  const ins   = hero.querySelectorAll('[data-ct-in]');
  const glow  = hero.querySelector('.ct-gate__glow');
  const bezel = hero.querySelector('.ct-bezel');
  const frame = hero.querySelector('.ct-gate__frame');
  const cells = hero.querySelectorAll('.ct-board > *');
  const path  = hero.querySelector('.ct-next__path');

  /* The arrival — photo settles, headline rises, the panel powers on.
     Starting states are set before .ct-arriving comes off, so nothing flashes. */
  // y: 0 drops the pixel offset GSAP would otherwise read from the CSS preload transform
  gsap.set(lines, { y: 0, yPercent: 110 });
  gsap.set(ins, { autoAlpha: 0, y: 22 });
  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
  if (media) tl.fromTo(media, { scale: 1.14 }, { scale: 1, duration: 2.6, ease: 'power2.out' }, 0);
  if (bezel) tl.fromTo(bezel, { y: 56, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.1, ease: 'power3.out', clearProps: 'transform' }, .3);
  if (glow)  tl.fromTo(glow, { opacity: 0 }, { opacity: .6, duration: 1.8, ease: 'power2.out' }, .5);
  if (frame) tl.fromTo(frame, { scale: 1.08, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1.2, ease: 'power3.out' }, .7);
  if (cells.length) tl.fromTo(cells, { y: 8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .5, stagger: .08, ease: 'power3.out', clearProps: 'transform' }, .85);
  tl.to(lines, { yPercent: 0, duration: 1.15, stagger: .1 }, .15)
    .to(ins, { autoAlpha: 1, y: 0, duration: .8, stagger: .07, ease: 'power3.out', clearProps: 'transform' }, .55);
  if (path){
    // the path runs across the three waypoints, or down them on phones
    const down = getComputedStyle(path).borderLeftStyle === 'dashed';
    tl.fromTo(path, down ? { scaleY: 0 } : { scaleX: 0 },
      { ...(down ? { scaleY: 1 } : { scaleX: 1 }), duration: 1.3, ease: 'power2.inOut' }, 1.1);
  }
  release();

  /* The sky drifts slower than the page */
  if (hasST && mediaWrap){
    gsap.to(mediaWrap, {
      yPercent: 12, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
    });
  }

  /* Glare — a soft highlight follows the pointer across the bezel's glass */
  if (bezel && window.matchMedia('(hover: hover) and (pointer: fine)').matches){
    let raf = 0, mx = 0, my = 0;
    bezel.addEventListener('pointermove', (e) => {
      const r = bezel.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        bezel.style.setProperty('--mx', `${mx}px`);
        bezel.style.setProperty('--my', `${my}px`);
      });
    });
  }

  if (!hasST) return;

  /* Direct lines — rows rise in one after another */
  const list = document.querySelector('.ct-lines__list');
  if (list){
    gsap.from(list.querySelectorAll('.ct-line'), {
      y: 40, autoAlpha: 0, duration: .9, stagger: .1, ease: 'power3.out', clearProps: 'transform',
      scrollTrigger: { trigger: list, start: 'top 85%', once: true }
    });
  }

  /* Privacy seal — stamps itself onto the card */
  const seal = document.querySelector('.ct-seal');
  if (seal){
    gsap.from(seal, {
      scale: .6, rotate: -40, autoAlpha: 0, duration: 1.2, ease: 'back.out(1.6)',
      scrollTrigger: { trigger: seal, start: 'top 85%', once: true }
    });
  }
})();
