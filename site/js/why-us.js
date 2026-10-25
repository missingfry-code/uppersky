/* =====================================================
   UPPERSKY MEDIA — Why us
   The emblem hero (outline draws, film fills the swooshes,
   scroll parts them around the headline), the old-way
   ledger, the promise index, pledge stamps, the redacted
   project file and the honest before/after sweep.
   Loads after app.js (GSAP, ScrollTrigger, Lenis) and kit.js.
   ===================================================== */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hero = document.querySelector('.wu-hero');

  // Reduced motion: every film on the page holds still
  if (reduce){
    document.querySelectorAll('.wu video').forEach((v) => { v.removeAttribute('autoplay'); v.pause(); });
  }

  // Without GSAP the CSS static composition is the page — release the opening pose
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined'){
    if (hero) hero.classList.remove('is-intro');
    return;
  }

  /* =====================================================
     HERO — the emblem is the window
     ===================================================== */
  if (hero && reduce) hero.classList.remove('is-intro');

  if (hero && !reduce){
    const a = hero.querySelector('.wu-swoosh--a');
    const b = hero.querySelector('.wu-swoosh--b');
    const mediaA = a.querySelector('.wu-swoosh__media');
    const mediaB = b.querySelector('.wu-swoosh__media');
    const paths = hero.querySelectorAll('.wu-swoosh__path');
    const windows = hero.querySelectorAll('.wu-swoosh__window');
    const glints = hero.querySelectorAll('.wu-swoosh__glint');
    const dims = hero.querySelectorAll('.wu-swoosh__dim');
    const lines = hero.querySelectorAll('.wu-mask > span');
    const kicker = hero.querySelector('.wu-hero__kicker');
    const copy = hero.querySelectorAll('.wu-hero__lede, .wu-hero__actions');
    const actions = hero.querySelector('.wu-hero__actions');
    const scrim = hero.querySelector('.wu-hero__scrim');
    const frame = hero.querySelectorAll('.wu-hero__top, .wu-hero__foot');
    // the intro fades the foot bar in; the scroll fades its contents out, so
    // the two timelines never fight over the same element
    const footBits = hero.querySelectorAll('.wu-hero__cue, .wu-hero__note');

    // Take over from the CSS opening pose in a single frame so nothing flashes.
    // (Set while .is-intro still holds transform:none, so GSAP parses zeros.)
    gsap.set([a, b], { x: 0, y: 0, xPercent: 0, yPercent: 0, rotation: 0, scale: 1, transformOrigin: '50% 50%' });
    gsap.set(paths, { strokeDashoffset: 1, opacity: 1 });
    gsap.set(windows, { autoAlpha: 0 });
    gsap.set([mediaA, mediaB], { scale: 1.22, transformOrigin: '50% 50%' });
    // y:0 clears the px offset GSAP parses from the CSS pose; yPercent does the hiding
    gsap.set(lines, { y: 0, yPercent: 115 });
    // opacity (not visibility) keeps the copy in the accessibility tree
    gsap.set([kicker, ...copy], { opacity: 0, y: 26 });
    gsap.set(actions, { pointerEvents: 'none' });
    gsap.set(scrim, { opacity: 0 });
    gsap.set(dims, { opacity: 0 });
    gsap.set(frame, { autoAlpha: 0 });
    hero.classList.remove('is-intro');

    /* Load — the outline draws itself in lime, then the film fills the swooshes */
    gsap.timeline({ delay: .35 })
      .to(paths, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut', stagger: .22 }, 0)
      .to(windows, { autoAlpha: 1, duration: 1.4, ease: 'power2.out', stagger: .14 }, 1.3)
      .to([mediaA, mediaB], { scale: 1, duration: 2.8, ease: 'power3.out' }, 1.3)
      .fromTo(glints, { xPercent: -160 }, { xPercent: 330, duration: 1.8, ease: 'power2.inOut', stagger: .16 }, 1.75)
      .to(paths, { opacity: .6, duration: 1.4, ease: 'power1.out' }, 2.5)
      .to(frame, { autoAlpha: 1, duration: .9, ease: 'power2.out', stagger: .12 }, 1.5);

    /* Scroll — the swooshes part like cloud around the headline. The film
       counter-moves inside each window, so the scene holds still while the
       windows slide over it. Phones part on the diagonal, desktop sideways. */
    let heroST = null;
    const mm = gsap.matchMedia();
    mm.add({ wide: '(min-width: 761px)', narrow: '(max-width: 760px)' }, (ctx) => {
      const v = ctx.conditions.wide
        ? { ax: -48, ay: 5, ar: -9, bx: 48, by: -5, br: 9, s: 1.08, dim: .38 }
        : { ax: -40, ay: -30, ar: -14, bx: 40, by: 30, br: 14, s: 1, dim: .62 };
      // the film is 1.7x the emblem; holding back ~60% of the window's travel
      // keeps the scene nearly still with a hint of parallax
      const counter = (n) => (-n / 1.7) * .62;

      // The headline plays in whole once the swooshes have parted, rather than
      // being scrubbed: a scrubbed reveal can stop half-way, leaving glyph tops
      // of the lime line floating over the film like stray marks.
      const reveal = gsap.timeline({ paused: true })
        .to(kicker, { opacity: 1, y: 0, duration: .5, ease: 'power2.out' }, 0)
        .to(lines, { yPercent: 0, duration: .8, stagger: .09, ease: 'power3.out' }, .05)
        .to(copy, { opacity: 1, y: 0, duration: .6, stagger: .1, ease: 'power2.out' }, .4)
        .set(actions, { pointerEvents: 'auto' }, .5);

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: ctx.conditions.wide ? '+=130%' : '+=110%',
          pin: true,
          scrub: .9,
          anticipatePin: 1,
          // the pin is created after app.js/kit.js triggers further down the
          // page — refresh it first so theirs include its spacing
          refreshPriority: 1,
          onUpdate: (self) => {
            if (self.progress > .34) reveal.play();
            else if (self.progress < .2) reveal.reverse();
          }
        }
      });
      tl.to(footBits, { autoAlpha: 0, duration: .16 }, 0)
        .to(a, { xPercent: v.ax, yPercent: v.ay, rotation: v.ar, scale: v.s, duration: 1, ease: 'power1.inOut' }, 0)
        .to(b, { xPercent: v.bx, yPercent: v.by, rotation: v.br, scale: v.s, duration: 1, ease: 'power1.inOut' }, 0)
        .to(mediaA, { xPercent: counter(v.ax), yPercent: counter(v.ay), rotation: -v.ar, duration: 1, ease: 'power1.inOut' }, 0)
        .to(mediaB, { xPercent: counter(v.bx), yPercent: counter(v.by), rotation: -v.br, duration: 1, ease: 'power1.inOut' }, 0)
        .to(scrim, { opacity: 1, duration: .5 }, .15)
        .to(dims, { opacity: v.dim, duration: .55 }, .15)
        .to({}, { duration: .32 }); // hold the finished frame before the pin lets go
      heroST = tl.scrollTrigger;
    });
    ScrollTrigger.sort();

    // Keyboard and screen-reader users reaching the hero copy jump to the
    // revealed frame instead of tabbing through invisible links
    hero.querySelector('.wu-hero__center').addEventListener('focusin', () => {
      if (!heroST || heroST.progress > .8) return;
      const y = heroST.start + (heroST.end - heroST.start) * .86;
      if (window.lenis) window.lenis.scrollTo(y, { immediate: true });
      else window.scrollTo(0, y);
    });

    // The films only play while the hero is on screen
    const films = [mediaA, mediaB];
    const next = document.querySelector('.wu-old');
    if (next){
      ScrollTrigger.create({
        trigger: next,
        start: 'top top',
        onEnter: () => films.forEach((f) => f.pause()),
        onLeaveBack: () => films.forEach((f) => f.play().catch(() => {}))
      });
    }
  }

  /* =====================================================
     01 — THE OLD WAY: strike the old, write the new
     ===================================================== */
  if (!reduce){
    gsap.utils.toArray('.wu-row').forEach((row) => {
      const strike = row.querySelector('.wu-row__old s');
      const old = row.querySelector('.wu-row__old');
      const arrow = row.querySelector('.wu-row__arrow');
      const fresh = row.querySelector('.wu-row__new');
      gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: row, start: 'top 84%', end: 'top 46%', scrub: .5 }
      })
        .fromTo(strike, { '--wu-strike': '0%' }, { '--wu-strike': '100%', duration: .5 }, 0)
        .fromTo(old, { color: '#0a0b0e' }, { color: '#6b6f76', duration: .5 }, 0)
        .fromTo(arrow,
          { rotation: -90, scale: .7, backgroundColor: 'rgba(212,255,61,0)', borderColor: 'rgba(10,11,14,.14)' },
          { rotation: 0, scale: 1, backgroundColor: 'rgba(212,255,61,1)', borderColor: 'rgba(212,255,61,1)', duration: .35 }, .3)
        .fromTo(fresh,
          { clipPath: 'inset(-12% 100% -12% 0%)', x: -14 },
          { clipPath: 'inset(-12% 0% -12% 0%)', x: 0, duration: .5 }, .42);
    });
  }

  /* =====================================================
     02 — FOUR PROMISES: the index follows the reader
     ===================================================== */
  const promises = document.querySelector('.wu-promises');
  if (promises){
    const items = [...promises.querySelectorAll('.wu-pindex li')];
    const count = promises.querySelector('.wu-route__count b');
    const route = promises.querySelector('.wu-route');
    const flow = promises.querySelector('.wu-promises__flow');
    promises.classList.add('wu-live');

    const setActive = (i) => {
      items.forEach((li, k) => {
        li.classList.toggle('is-active', k === i);
        li.classList.toggle('is-done', k < i);
      });
      if (count) count.textContent = String(i + 1).padStart(2, '0');
    };
    gsap.utils.toArray('.wu-promise').forEach((article, i) => {
      ScrollTrigger.create({
        trigger: article,
        start: 'top 62%',
        end: 'bottom 62%',
        onToggle: (self) => { if (self.isActive) setActive(i); }
      });
    });
    setActive(0);

    if (route && flow){
      gsap.fromTo(route, { '--p': 0 }, {
        '--p': 1, ease: 'none',
        scrollTrigger: { trigger: flow, start: 'top 62%', end: 'bottom 62%', scrub: true }
      });
    }
  }

  /* =====================================================
     03 — RADICAL TRANSPARENCY: pledges stamp in, the seal turns
     ===================================================== */
  const clear = document.querySelector('.wu-clear');
  if (clear && !reduce){
    clear.classList.add('wu-live');
    clear.querySelectorAll('.wu-pledge').forEach((pledge) => {
      ScrollTrigger.create({
        trigger: pledge,
        start: 'top 74%',
        once: true,
        onEnter: () => pledge.classList.add('is-in')
      });
    });
    const ring = clear.querySelector('.wu-seal__ring');
    if (ring){
      gsap.to(ring, {
        rotation: 220, transformOrigin: '50% 50%', ease: 'none',
        scrollTrigger: { trigger: clear, start: 'top bottom', end: 'bottom top', scrub: .6 }
      });
    }
  }

  /* =====================================================
     04 — PRIVACY: the file redacts itself, then gets stamped
     ===================================================== */
  // The shared rail inverts with mix-blend-mode, which reads off-brand violet on
  // lime — switch it to ink while this chapter sits under it (bottom-left)
  const lime = document.querySelector('.wu-private');
  const rail = document.querySelector('.story-rail');
  if (lime && rail){
    ScrollTrigger.create({
      trigger: lime,
      // the rail sits 22–40px above the viewport bottom: ink while any lime is under it
      start: 'top bottom-=22',
      end: 'bottom bottom-=40',
      toggleClass: { targets: rail, className: 'wu-rail-ink' }
    });
  }

  const file = document.querySelector('.wu-file');
  if (file && !reduce){
    const card = file.querySelector('.wu-file__card');
    const bars = file.querySelectorAll('.wu-redact');
    const stamp = file.querySelector('.wu-file__stamp');
    gsap.set(bars, { scaleX: 0, transformOrigin: '0% 50%' });
    gsap.set(stamp, { autoAlpha: 0, scale: 1.8 });
    ScrollTrigger.create({
      trigger: file,
      start: 'top 72%',
      once: true,
      onEnter: () => {
        gsap.timeline()
          .to(bars, { scaleX: 1, duration: .55, ease: 'power3.inOut', stagger: .09 })
          .to(stamp, { autoAlpha: 1, scale: 1, duration: .5, ease: 'back.out(2.4)' }, '-=.1');
      }
    });
    gsap.fromTo(card, { y: 60, rotation: -4.5 }, {
      y: -30, rotation: -1.5, ease: 'none',
      scrollTrigger: { trigger: file, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  }

  /* =====================================================
     05 — BEST LIGHT: one slow sweep shows the slider is live
     ===================================================== */
  const slider = document.querySelector('.wu-best .ba-slider');
  if (slider && !reduce){
    const knob = slider.querySelector('.ba-slider__knob');
    const pos = { p: 50 };
    let sweep = null;
    const stop = () => { if (sweep){ sweep.kill(); sweep = null; } };
    // the visitor's hand always wins over the demo
    slider.addEventListener('pointerdown', stop);
    if (knob) knob.addEventListener('keydown', stop);

    const apply = () => {
      slider.style.setProperty('--ba-pos', pos.p.toFixed(2) + '%');
      if (knob) knob.setAttribute('aria-valuenow', Math.round(pos.p));
    };
    ScrollTrigger.create({
      trigger: slider,
      start: 'top 66%',
      once: true,
      onEnter: () => {
        sweep = gsap.timeline({ onUpdate: apply, onComplete: () => { sweep = null; } })
          .to(pos, { p: 88, duration: 1.1, ease: 'power2.inOut' })
          .to(pos, { p: 14, duration: 1.6, ease: 'power2.inOut' }, '+=.35')
          .to(pos, { p: 50, duration: 1, ease: 'power2.out' }, '+=.3');
      }
    });
  }

  ScrollTrigger.refresh();
})();
