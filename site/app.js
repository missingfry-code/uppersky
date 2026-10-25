/* =====================================================
   UPPERSKY MEDIA — interactions
   GSAP + ScrollTrigger
   ===================================================== */

(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Always start a fresh page at the top — disable browser scroll restoration
  // and pin to 0 before the first paint so reloads don't dump the user mid-page.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  document.getElementById('year').textContent = new Date().getFullYear();

  /* Colophon — live LA local-time readout */
  const laClock = document.getElementById('laClock');
  if (laClock){
    const renderClock = () => {
      try {
        laClock.textContent = new Date().toLocaleTimeString('en-US', {
          timeZone: 'America/Los_Angeles',
          hour: '2-digit', minute: '2-digit', hour12: true
        }).replace(/\s?(AM|PM)$/, ' $1');
      } catch (_){}
    };
    renderClock();
    setInterval(renderClock, 30 * 1000);
  }

  // Content marked [data-reveal] is only hidden once we know GSAP is here to
  // reveal it — if the CDN fails the page still shows everything.
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('has-motion');

  /* ============ LENIS — SMOOTH SCROLL ============ */
  let lenis = null;
  if (!reduce && typeof Lenis !== 'undefined'){
    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    window.lenis = lenis;
    // Force start at top — beats both browser scroll-restoration and Lenis's own state
    lenis.scrollTo(0, { immediate: true });
  }
  // No scroll-to-top on `load`: with no loader the visitor is already scrolling
  // by then, and yanking them back to the top reads as a glitch.
  // Webfonts reflow the headings, so re-measure triggers once they land.
  if (document.fonts && document.fonts.ready){
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  /* ============ DRAWER ============ */
  const tab    = document.getElementById('menuTab');
  const burger = document.getElementById('mBurger');
  const drawer = document.getElementById('drawer');
  const scrim  = document.getElementById('drawerScrim');
  const closeB = document.getElementById('drawerClose');

  const triggers = [tab, burger].filter(Boolean);
  const linksAnim = drawer.querySelectorAll('.drawer__nav a');
  gsap.set(linksAnim, { x: -30, autoAlpha: 0 });

  let drawerOpen = false;
  function openDrawer(){
    drawerOpen = true;
    drawer.classList.add('is-open');
    scrim.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    triggers.forEach(t => t.setAttribute('aria-expanded', 'true'));
    document.body.style.overflow = 'hidden';
    // body overflow alone doesn't stop Lenis from scrolling the page underneath
    if (lenis) lenis.stop();
    window.dispatchEvent(new Event('uppersky:draweropen'));
    gsap.to(linksAnim, {
      x: 0, autoAlpha: 1,
      duration: .55, ease: 'power3.out',
      stagger: .07, delay: .15
    });
  }
  function closeDrawer(){
    drawerOpen = false;
    drawer.classList.remove('is-open');
    scrim.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    triggers.forEach(t => t.setAttribute('aria-expanded', 'false'));
    document.body.style.overflow = '';
    if (lenis) lenis.start();
    gsap.to(linksAnim, { x: -30, autoAlpha: 0, duration: .25, ease: 'power2.in' });
  }
  triggers.forEach(t => t.addEventListener('click', () => drawerOpen ? closeDrawer() : openDrawer()));
  scrim.addEventListener('click', closeDrawer);
  closeB.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawerOpen) closeDrawer(); });

  drawer.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', () => setTimeout(closeDrawer, 200));
  });

  /* ============ INTRO TIMELINE ============ */
  // The background video is static and visible from the start — don't fade it in.
  // The first scrub word is already opacity 1 via the CSS .is-active rule, so we
  // keep its entrance to a subtle settle (no full fade-in) to avoid flashing.
  const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
  intro.from('.top-cta',  { autoAlpha: 0, y: -10, duration: .6 }, 0);
  intro.from('.menu-tab', { x: -40, autoAlpha: 0, duration: .6 }, 0);
  intro.from('.m-header', { y: -30, autoAlpha: 0, duration: .6 }, 0);

  const firstWord = document.querySelector('.scrub-headers__line.is-active');
  if (firstWord){
    // Subtle "settle" without ever hiding the word — y only, opacity already 1.
    intro.from(firstWord, { y: 24, duration: 1.0, ease: 'power3.out' }, 0.1);
  }

  /* ============ GENERIC REVEALS ============ */
  document.querySelectorAll('[data-reveal]').forEach((el) => {
    gsap.to(el, {
      autoAlpha: 1, y: 0,
      duration: .9, ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        toggleClass: { targets: el, className: 'is-revealed' }
      }
    });
  });

  /* ============ STRATEGIES — staggered dots ============ */
  gsap.from('.dot', {
    scale: 0, autoAlpha: 0, duration: .6, ease: 'back.out(1.8)', stagger: .12,
    scrollTrigger: { trigger: '.dots', start: 'top 80%' }
  });

  /* ============ BIG QUOTE — word stagger ============ */
  const bq = document.querySelector('.big-quote p');
  if (bq){
    bq.innerHTML = bq.innerHTML.replace(/(\S+)/g, '<span class="w" style="display:inline-block">$1</span>');
    gsap.from('.big-quote .w', {
      y: 30, autoAlpha: 0,
      duration: .8, ease: 'power3.out', stagger: .04,
      scrollTrigger: { trigger: '.big-quote', start: 'top 82%' }
    });
  }

  /* ============ BEFORE / AFTER SLIDER ============ */
  document.querySelectorAll('.ba-slider').forEach((slider) => {
    const knob = slider.querySelector('.ba-slider__knob');
    let dragging = false;

    const setPos = (clientX) => {
      const rect = slider.getBoundingClientRect();
      const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      slider.style.setProperty('--ba-pos', pct + '%');
      if (knob) knob.setAttribute('aria-valuenow', Math.round(pct));
    };

    const onDown = (e) => {
      dragging = true;
      slider.setPointerCapture?.(e.pointerId);
      setPos(e.clientX);
      e.preventDefault();
    };
    const onMove = (e) => {
      if (!dragging) return;
      setPos(e.clientX);
    };
    const onUp = (e) => {
      if (!dragging) return;
      dragging = false;
      slider.releasePointerCapture?.(e.pointerId);
    };

    slider.addEventListener('pointerdown', onDown);
    slider.addEventListener('pointermove', onMove);
    slider.addEventListener('pointerup', onUp);
    slider.addEventListener('pointercancel', onUp);

    // Keyboard support on the knob
    if (knob){
      knob.setAttribute('role', 'slider');
      knob.setAttribute('aria-valuemin', '0');
      knob.setAttribute('aria-valuemax', '100');
      knob.setAttribute('aria-valuenow', '50');
      knob.tabIndex = 0;
      knob.addEventListener('keydown', (e) => {
        const cur = parseFloat(slider.style.getPropertyValue('--ba-pos')) || 50;
        let next = cur;
        if (e.key === 'ArrowLeft')  next = Math.max(0,   cur - 4);
        else if (e.key === 'ArrowRight') next = Math.min(100, cur + 4);
        else if (e.key === 'Home')  next = 0;
        else if (e.key === 'End')   next = 100;
        else return;
        slider.style.setProperty('--ba-pos', next + '%');
        knob.setAttribute('aria-valuenow', Math.round(next));
        e.preventDefault();
      });
    }
  });

  /* ============ PROCESS ============ */
  gsap.set('.step', { autoAlpha: 0, y: 40 });
  ScrollTrigger.create({
    trigger: '.steps',
    start: 'top 80%',
    once: true,
    onEnter: () => {
      gsap.to('.step', {
        autoAlpha: 1, y: 0,
        duration: .7, ease: 'power3.out', stagger: .12,
        onStart: () => document.querySelectorAll('.step').forEach((s, i) => {
          setTimeout(() => s.classList.add('is-revealed'), 120 * i + 200);
        })
      });
    }
  });

  /* ============ SCRUB SECTION — canvas frame sequence ============ */
  // The old <video currentTime> scrub needed the full 13MB mp4 buffered before
  // it felt responsive. A WebP frame sequence paints after ~35KB and streams
  // the rest in while the visitor reads the first headline. The canvas also has
  // frame 1 as a CSS background, so there's never a black box while it loads.
  const scrubSection = document.querySelector('.scrub-section');
  const scrubCanvas  = document.querySelector('canvas.scrub-video');
  const scrubCard    = document.querySelector('.scrub-card');
  const scrubLines   = document.querySelectorAll('.scrub-headers__line');

  if (scrubSection && scrubCanvas){
    const FRAME_COUNT = 96;
    const frameSrc = (i) => `assets/scrub/frame_${String(i + 1).padStart(3, '0')}.webp`;

    const ctx = scrubCanvas.getContext('2d');
    const frames = new Array(FRAME_COUNT).fill(null);
    let loadedCount = 0;
    let currentIndex = 0;

    const draw = (img) => {
      if (!img) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = scrubCanvas.clientWidth, ch = scrubCanvas.clientHeight;
      if (!cw || !ch) return;
      if (scrubCanvas.width !== Math.round(cw * dpr) || scrubCanvas.height !== Math.round(ch * dpr)){
        scrubCanvas.width  = Math.round(cw * dpr);
        scrubCanvas.height = Math.round(ch * dpr);
      }
      // object-fit: cover, done by hand
      const s = Math.max(scrubCanvas.width / img.width, scrubCanvas.height / img.height);
      const w = img.width * s, h = img.height * s;
      ctx.drawImage(img, (scrubCanvas.width - w) / 2, (scrubCanvas.height - h) / 2, w, h);
    };

    // Draw the nearest loaded frame at or before the wanted index
    const render = () => {
      let i = currentIndex;
      while (i > 0 && !frames[i]) i--;
      draw(frames[i] || frames[0]);
    };

    const onFrameSettled = () => {
      loadedCount++;
      if (loadedCount === FRAME_COUNT) render();
    };

    const loadFrame = (i, done) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        frames[i] = img;
        if (i === 0 || i === currentIndex) render();
        onFrameSettled();
        done && done();
      };
      img.onerror = () => { onFrameSettled(); done && done(); };
      img.src = frameSrc(i);
    };
    // Frame 1 first so the opening shot is sharp, then the rest in order —
    // firing all 96 at once starved the fonts and above-the-fold images.
    loadFrame(0, () => {
      for (let i = 1; i < FRAME_COUNT; i++) loadFrame(i);
    });

    window.addEventListener('resize', render);

    // Frames + headline words driven straight from scroll progress
    const wordCount = scrubLines.length;
    ScrollTrigger.create({
      trigger: scrubSection,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const idx = Math.min(FRAME_COUNT - 1, Math.round(self.progress * (FRAME_COUNT - 1)));
        if (idx !== currentIndex){
          currentIndex = idx;
          render();
        }
        const wIdx = Math.min(wordCount - 1, Math.floor(self.progress * wordCount));
        scrubLines.forEach((el, i) => el.classList.toggle('is-active', i === wIdx));
      }
    });

    // Reveal the side card + promise tag once we're near the end of the scrub
    const scrubTag = document.querySelector('.scrub-tag');
    ScrollTrigger.create({
      trigger: scrubSection,
      start: 'bottom bottom',
      end: 'bottom top',
      onEnter: () => {
        scrubCard && scrubCard.classList.add('is-visible');
        scrubTag  && scrubTag.classList.add('is-visible');
      },
      onLeaveBack: () => {
        scrubCard && scrubCard.classList.remove('is-visible');
        scrubTag  && scrubTag.classList.remove('is-visible');
      }
    });
  }

  /* ============ SCRUBBED PARALLAX ============ */
  if (!reduce){
    // Strategies — headline drifts up, tagline trails further
    gsap.to('.quote-head', {
      yPercent: -18, ease: 'none',
      scrollTrigger: { trigger: '.strategies', start: 'top bottom', end: 'bottom top', scrub: true }
    });
    gsap.to('.tagline', {
      yPercent: -30, ease: 'none',
      scrollTrigger: { trigger: '.strategies', start: 'top bottom', end: 'bottom top', scrub: true }
    });

    // (dots drift/rotate parallax removed — replaced by the scroll-scrubbed
    //  row-to-column fold at the bottom of this file)

    // CMS copy column lifts as it leaves
    gsap.to('.strategies__col--right', {
      yPercent: -8, ease: 'none',
      scrollTrigger: { trigger: '.strategies', start: 'top bottom', end: 'bottom top', scrub: true }
    });

    // Big quote — gentle scrubbed lift on the whole block
    gsap.to('.big-quote', {
      yPercent: -12, ease: 'none',
      scrollTrigger: { trigger: '.big-quote-section', start: 'top bottom', end: 'bottom top', scrub: true }
    });

    // Process — step number/bar pulls upward as the row crosses the viewport
    gsap.utils.toArray('.step').forEach((step, i) => {
      gsap.fromTo(step.querySelector('.step__num'),
        { yPercent: 20 },
        {
          yPercent: -20, ease: 'none',
          scrollTrigger: { trigger: step, start: 'top bottom', end: 'bottom top', scrub: true }
        }
      );
    });

  }

  /* smooth anchor scroll — through Lenis when it's running, since a native
     smooth scroll and Lenis fight each other and the page stutters */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis){
        // the drawer stops Lenis; wait for it to close before scrolling
        const go = () => lenis.scrollTo(target, { offset: -12 });
        drawerOpen ? setTimeout(go, 220) : go();
      } else {
        const top = target.getBoundingClientRect().top + window.scrollY - 12;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();

/* =====================================================
   SERVICES INDEX — accordion + cursor peek
   ===================================================== */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rows = document.querySelectorAll('.svc-row');
  if (!rows.length) return;

  /* Accordion — one open at a time */
  rows.forEach((row) => {
    const head = row.querySelector('.svc-row__head');
    head.addEventListener('click', () => {
      const opening = !row.classList.contains('is-open');
      rows.forEach((r) => {
        r.classList.remove('is-open');
        r.querySelector('.svc-row__head').setAttribute('aria-expanded', 'false');
      });
      if (opening){
        row.classList.add('is-open');
        head.setAttribute('aria-expanded', 'true');
      }
      if (typeof ScrollTrigger !== 'undefined'){
        setTimeout(() => ScrollTrigger.refresh(), 600);
      }
    });
  });

  /* Cursor-following preview image (desktop fine pointers only) */
  const peek = document.querySelector('.svc-peek');
  const list = document.querySelector('.svc-list');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (peek && list && fine && !reduce && typeof gsap !== 'undefined'){
    const img = peek.querySelector('img');
    const xTo = gsap.quickTo(peek, 'x', { duration: .5, ease: 'power3.out' });
    const yTo = gsap.quickTo(peek, 'y', { duration: .5, ease: 'power3.out' });

    list.addEventListener('pointermove', (e) => {
      xTo(e.clientX);
      yTo(e.clientY);
    });
    let peekVisible = false;
    rows.forEach((row) => {
      row.addEventListener('pointerenter', (e) => {
        const src = row.dataset.peek;
        if (src && img.getAttribute('src') !== src) img.setAttribute('src', src);
        if (!peekVisible){
          // Snap to the cursor before showing so it never flies in from a corner
          gsap.set(peek, { x: e.clientX, y: e.clientY });
          xTo(e.clientX, e.clientX);
          yTo(e.clientY, e.clientY);
          peekVisible = true;
        }
        gsap.to(peek, { autoAlpha: 1, scale: 1, rotate: 0, duration: .4, ease: 'power3.out' });
      });
    });
    list.addEventListener('pointerleave', () => {
      peekVisible = false;
      gsap.to(peek, { autoAlpha: 0, scale: .9, rotate: -3, duration: .3, ease: 'power2.in' });
    });
  }

  /* Entrance — rows rise in with a stagger */
  if (!reduce && typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined'){
    gsap.from('.svc-row', {
      y: 44, autoAlpha: 0,
      duration: .8, ease: 'power3.out', stagger: .09,
      scrollTrigger: { trigger: '.svc-list', start: 'top 82%', once: true }
    });
  }
})();

/* =====================================================
   STRATEGIES DOTS — row folds into a column on scroll
   ===================================================== */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  const dotsWrap = document.querySelector('.dots');
  const dots = gsap.utils.toArray('.dots .dot');
  if (!dotsWrap || dots.length < 2) return;

  // Distance between slots = dot diameter + flex gap (recomputed on refresh/resize)
  const off = (i) => {
    // offsetWidth ignores transforms (the entrance anim scales dots from 0)
    const d = dots[0].offsetWidth;
    const gap = parseFloat(getComputedStyle(dotsWrap).gap) || 16;
    return i * (d + gap);
  };

  // On phones the row is centered, so fold under the middle dot to keep the
  // final column centered; on desktop fold under the first (left-aligned).
  const anchor = () => (window.matchMedia('(max-width: 640px)').matches ? 1 : 0);

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: dotsWrap,
      start: 'top 85%',
      end: 'top 30%',
      scrub: true,
      invalidateOnRefresh: true
    }
  });
  dots.forEach((dot, i) => {
    tl.to(dot, { x: () => off(anchor() - i), y: () => off(i), ease: 'none' }, 0);
  });
  // Grow the wrap so the column doesn't overlap the content beneath it
  tl.to(dotsWrap, { paddingBottom: () => off(dots.length - 1), ease: 'none' }, 0);
})();

/* =====================================================
   EMBLEM — the SVG logo's two swooshes, animated
   ===================================================== */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  // Rotate each swoosh around the emblem's centre, not its own bbox
  const CENTER = '51.1 50';
  const parts = (svg) => [svg.querySelector('.emblem__a'), svg.querySelector('.emblem__b')];

  /* Header emblems turn one full revolution over the length of the page */
  gsap.to('.menu-tab__emblem, .m-header__logo .emblem', {
    rotate: 360, ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: .6 }
  });

  /* Menu tab — swooshes fly together on load, part slightly on hover */
  const tabEmblem = document.querySelector('.menu-tab__emblem');
  if (tabEmblem){
    const [a, b] = parts(tabEmblem);
    gsap.from(a, { x: -26, rotate: -60, svgOrigin: CENTER, autoAlpha: 0, duration: 1, ease: 'power3.out', delay: .2 });
    gsap.from(b, { x: 26, rotate: -60, svgOrigin: CENTER, autoAlpha: 0, duration: 1, ease: 'power3.out', delay: .3 });
    const tab = document.getElementById('menuTab');
    tab.addEventListener('mouseenter', () => {
      gsap.to(a, { x: -5, y: 3, duration: .35, ease: 'power2.out' });
      gsap.to(b, { x: 5, y: -3, duration: .35, ease: 'power2.out' });
    });
    tab.addEventListener('mouseleave', () => {
      gsap.to([a, b], { x: 0, y: 0, duration: .5, ease: 'elastic.out(1, .5)' });
    });
  }

  /* Drawer lockup — emblem draws itself in, then the wordmark rises */
  const brand = document.querySelector('.drawer__brand');
  const drawerEmblem = document.querySelector('.drawer__emblem');
  if (brand && drawerEmblem){
    const paths = parts(drawerEmblem);
    const lengths = paths.map(p => p.getTotalLength());
    const word = brand.querySelectorAll('.drawer__word span');
    const sub = brand.querySelectorAll('.drawer__sub span');
    let drawTl = null;

    window.addEventListener('uppersky:draweropen', () => {
      drawTl && drawTl.kill();
      paths.forEach((p, i) => gsap.set(p, {
        stroke: 'currentColor', strokeWidth: 1.2,
        strokeDasharray: lengths[i], strokeDashoffset: lengths[i], fillOpacity: 0,
        rotate: 0, svgOrigin: CENTER
      }));
      gsap.set(word, { yPercent: 110, autoAlpha: 0 });
      gsap.set(sub, { autoAlpha: 0 });
      drawTl = gsap.timeline({ delay: .2 })
        .to(paths, { strokeDashoffset: 0, duration: .9, ease: 'power2.inOut', stagger: .12 })
        .to(paths, { fillOpacity: 1, duration: .4, ease: 'power1.out' }, '-=.3')
        .set(paths, { stroke: 'none' })
        .to(word, { yPercent: 0, autoAlpha: 1, duration: .6, ease: 'power3.out', stagger: .04 }, .35)
        .to(sub, { autoAlpha: 1, duration: .4, stagger: .06 }, .75);
    });

    // Hover: the swooshes counter-rotate like a turbine spooling up
    brand.addEventListener('mouseenter', () => {
      if (drawTl && drawTl.isActive()) return;
      gsap.to(paths[0], { rotate: -180, svgOrigin: CENTER, duration: .9, ease: 'power3.inOut' });
      gsap.to(paths[1], { rotate: 180, svgOrigin: CENTER, duration: .9, ease: 'power3.inOut' });
    });
    brand.addEventListener('mouseleave', () => {
      gsap.to(paths, { rotate: 0, svgOrigin: CENTER, duration: .7, ease: 'power3.out' });
    });
  }
})();

/* =====================================================
   STORY — chapter rail + chapter-specific motion
   ===================================================== */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  /* The difference — "Better. Faster. More accurate. Seamless." lights up word by word */
  const whyWords = gsap.utils.toArray('.why__word');
  if (whyWords.length && !reduce){
    gsap.to(whyWords, {
      opacity: 1, ease: 'none', stagger: .5,
      scrollTrigger: { trigger: '.why__statement', start: 'top 80%', end: 'bottom 45%', scrub: true }
    });
  }

  /* The method — the + + = operators snap in between the terms */
  if (!reduce){
    gsap.from('.craft__op', {
      scale: 0, rotate: -90, autoAlpha: 0,
      duration: .6, ease: 'back.out(2)', stagger: .15,
      scrollTrigger: { trigger: '.craft__formula', start: 'top 80%', once: true }
    });
  }

  /* Rail — which chapter you're in, plus overall progress. Hidden during the
     prologue and epilogue, where the scrub cards and footer own that corner. */
  const rail = document.querySelector('.story-rail');
  const chapters = gsap.utils.toArray('[data-chapter]');
  if (!rail || chapters.length < 3) return;
  const num  = document.getElementById('railNum');
  const name = document.getElementById('railName');
  const fill = document.getElementById('railFill');
  const last = chapters.length - 1;

  const show = (i) => {
    rail.classList.toggle('is-visible', i > 0 && i < last);
    if (i === 0 || i === last) return;
    num.textContent = String(i).padStart(2, '0');
    const label = chapters[i].dataset.chapter;
    if (name.textContent !== label){
      name.textContent = label;
      name.classList.remove('is-swap');
      void name.offsetWidth; // restart the swap animation
      name.classList.add('is-swap');
    }
  };
  // Current chapter = the last one whose top has crossed 55% of the viewport.
  // Measured on every scroll rather than per-chapter toggles, so jumps (menu
  // links, back-to-top) that skip whole chapters still land on the right label.
  const current = () => {
    const line = window.innerHeight * .55;
    let i = 0;
    chapters.forEach((el, k) => { if (el.getBoundingClientRect().top <= line) i = k; });
    return i;
  };
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (self) => {
      fill.style.transform = `scaleX(${self.progress})`;
      show(current());
    },
    onRefresh: () => show(current())
  });
})();
