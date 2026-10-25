/* =====================================================
   UPPERSKY MEDIA — Process page
   The departure board flips into place, the manifesto's
   highlighter and strike-through follow the lit words, and
   the flight path draws itself as you scroll: the emblem
   flies the tip of the line and each leg checks in.
   Loads after app.js + kit.js (GSAP, ScrollTrigger, Lenis).
   ===================================================== */
(() => {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad = (n) => String(n).padStart(2, '0');

  /* ---------- Departure board — split-flap settle on load ---------- */
  const board = document.querySelector('.pr-board');
  if (board && !reduce){
    const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const scramble = (text, settled) => {
      let out = '';
      for (let k = 0; k < text.length; k++){
        const c = text[k];
        out += k < settled || !/[a-z0-9]/i.test(c) ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      return out;
    };
    gsap.from(board, { y: -16, autoAlpha: 0, duration: .9, ease: 'power3.out', delay: .45 });
    board.querySelectorAll('[data-flap]').forEach((el, i) => {
      const text = el.textContent;
      const flip = { p: 0 };
      let last = 0;
      el.textContent = scramble(text, 0);
      gsap.to(flip, {
        p: 1, duration: .7 + text.length * .035, delay: .65 + i * .14, ease: 'power1.inOut',
        onUpdate: () => {
          // ~18 flips a second reads as mechanical; every frame reads as noise
          const now = performance.now();
          if (now - last < 55) return;
          last = now;
          el.textContent = scramble(text, Math.floor(flip.p * text.length));
        },
        onComplete: () => { el.textContent = text; }
      });
    });
  }

  /* ---------- Manifesto — highlighter + strike ride the lit words ---------- */
  // kit.js lights [data-lit] words with a scrubbed stagger (.25 apart, .5 each)
  // between 'top 82%' and 'bottom 48%'. Mirroring that timeline on the same
  // trigger lands each mark just after its word lights, at any screen size.
  if (!reduce){
    const follow = (target, prop, from, to) => {
      const block = target.closest('[data-lit]');
      const words = block ? [...block.querySelectorAll('.lit')] : [];
      const k = words.indexOf(target.querySelector('.lit'));
      if (k < 0) return;
      const tl = gsap.timeline({
        scrollTrigger: { trigger: block, start: 'top 82%', end: 'bottom 48%', scrub: true }
      });
      tl.to({}, { duration: .5 + .25 * (words.length - 1) }, 0)
        .fromTo(target, { [prop]: from }, { [prop]: to, duration: .6, ease: 'none' }, .25 * k + .3);
    };
    document.querySelectorAll('.pr-mark').forEach((el) => follow(el, '--mark', '0%', '100%'));
    document.querySelectorAll('.pr-strike').forEach((el) => follow(el, '--strike', 0, 1));
  }

  /* ---------- Flight path — the route draws, the legs check in ---------- */
  const route = document.querySelector('[data-route]');
  if (route){
    const track    = route.querySelector('.pr-route__track');
    const fill     = route.querySelector('.pr-route__fill');
    const plane    = route.querySelector('.pr-route__plane');
    const legs     = [...route.querySelectorAll('.pr-leg')];
    const arrival  = route.querySelector('.pr-arrival');
    const nodes    = [...legs.map((l) => l.querySelector('.pr-leg__node')), arrival.querySelector('.pr-arrival__node')];
    const fmc      = document.querySelector('.pr-fmc');
    const rows     = fmc ? [...fmc.querySelectorAll('[data-fmc-leg]')] : [];
    const fmcNum   = fmc && fmc.querySelector('[data-fmc-num]');
    const fmcName  = fmc && fmc.querySelector('[data-fmc-name]');
    const fmcLabel = fmc && fmc.querySelector('.pr-fmc__label');
    const STATUS   = { upcoming: 'Scheduled', current: 'In progress', done: 'Cleared' };
    let stops = [];
    let at = -1;

    // Node centre relative to the route. offsetTop ignores transforms, so the
    // [data-reveal] lift on nearby elements can't throw the measurement off.
    const centre = (node) => {
      let y = node.offsetHeight / 2;
      for (let el = node; el && el !== route; el = el.offsetParent) y += el.offsetTop;
      return y;
    };

    // The track runs from the first node's centre to the arrival node's centre;
    // each stop is where a node sits along it (0 → 1).
    const measure = () => {
      const c = nodes.map(centre);
      const len = Math.max(1, c[c.length - 1] - c[0]);
      track.style.top = c[0] + 'px';
      track.style.bottom = 'auto';
      track.style.height = len + 'px';
      stops = c.map((y) => (y - c[0]) / len);
    };

    const paint = (p) => {
      let i = 0;
      stops.forEach((s, k) => { if (p >= s - .004) i = k; });
      if (i === at) return;
      at = i;
      legs.forEach((leg, k) => {
        const state = k < i ? 'done' : k === i ? 'current' : 'upcoming';
        leg.classList.toggle('is-done', state === 'done');
        leg.classList.toggle('is-current', state === 'current');
        leg.querySelector('.pr-leg__status').textContent = STATUS[state];
        if (rows[k]){
          rows[k].classList.toggle('is-done', state === 'done');
          rows[k].classList.toggle('is-current', state === 'current');
          rows[k].querySelector('em').textContent = STATUS[state];
        }
      });
      const landed = i >= legs.length;
      arrival.classList.toggle('is-arrived', landed);
      if (fmc){
        fmc.classList.toggle('is-arrived', landed);
        fmcLabel.textContent = landed ? 'Status' : 'Active leg';
        fmcNum.textContent = landed ? 'Arr' : pad(i + 1);
        fmcName.textContent = landed ? 'Arrived' : legs[i].dataset.name;
        if (!reduce){
          gsap.fromTo([fmcNum, fmcName], { yPercent: 60, autoAlpha: 0 },
            { yPercent: 0, autoAlpha: 1, duration: .45, stagger: .05, ease: 'power3.out', overwrite: true });
        }
      }
    };

    route.classList.add('is-live');
    measure();
    ScrollTrigger.addEventListener('refreshInit', measure);

    // The tip of the line sits on the 60% mark of the viewport the whole way down
    const span = { trigger: track, start: 'top 60%', end: 'bottom 60%' };
    if (reduce){
      // No travelling marker: the whole route shows, and legs still check in as you read
      route.classList.add('is-still');
      ScrollTrigger.create({
        ...span,
        onUpdate: (self) => paint(self.progress),
        onRefresh: (self) => paint(self.progress)
      });
    } else {
      const icon = plane.querySelector('svg');
      const tl = gsap.timeline({
        defaults: { ease: 'none', duration: 1 },
        scrollTrigger: { ...span, scrub: .6, invalidateOnRefresh: true },
        onUpdate: () => paint(tl.progress())
      });
      tl.fromTo(fill, { scaleY: 0 }, { scaleY: 1 }, 0)
        .fromTo(plane, { y: 0 }, { y: () => track.offsetHeight }, 0)
        .fromTo(icon, { rotate: 0 }, { rotate: 360 }, 0);
    }
    paint(0);
  }

  /* ---------- FAQ — answers change the page height, so re-measure below ---------- */
  let refreshTimer;
  document.querySelectorAll('.pr-faq details').forEach((d) => {
    d.addEventListener('toggle', () => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 80);
    });
  });
})();
