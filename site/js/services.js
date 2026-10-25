/* =====================================================
   UPPERSKY MEDIA — Services
   Motion for the page's crafted mockups: the missions split, the
   viewfinder locking focus, the edit suite's timecode + playhead,
   print proofs fanning out, the listing microsite scrolling in its
   browser, the reel, the departures-board flaps and the quote
   printing out. Loads after app.js (GSAP, ScrollTrigger, Lenis)
   and kit.js. Without GSAP, or with reduced motion, every mockup
   simply sits still in its finished state.
   ===================================================== */
(() => {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  if (!document.body.classList.contains('page--services')) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const pad = (n) => String(n).padStart(2, '0');
  const clear = 'transform,opacity,visibility';

  /* ---------- Two missions: the panels close in from opposite sides ---------- */
  const missions = $('.sv-missions');
  if (missions && !reduce){
    const side = window.matchMedia('(min-width: 861px)').matches;
    gsap.from('.sv-mission', {
      x: (i) => (side ? (i ? 70 : -70) : 0),
      y: side ? 0 : 50,
      autoAlpha: 0,
      duration: 1.1,
      ease: 'power3.out',
      stagger: .12,
      clearProps: clear,
      scrollTrigger: { trigger: missions, start: 'top 80%', once: true }
    });
  }

  /* ---------- Disciplines: each mockup settles in, then drifts with the scroll ---------- */
  $$('.sv-disc__visual').forEach((visual) => {
    const mock = visual.firstElementChild;
    if (reduce || !mock) return;
    gsap.from(mock, {
      autoAlpha: 0, y: 40, scale: .96,
      duration: 1.2, ease: 'power3.out', clearProps: clear,
      scrollTrigger: { trigger: visual, start: 'top 85%', once: true }
    });
    const drift = () => (window.innerWidth < 961 ? 22 : 48);
    gsap.fromTo(visual, { y: () => drift() }, {
      y: () => -drift(), ease: 'none',
      scrollTrigger: { trigger: visual, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true }
    });
  });

  /* ---------- Decorative loops play only while on screen ---------- */
  const videos = $$('video[data-sv-video]');
  videos.forEach((v) => v.addEventListener('playing', () => v.classList.add('is-playing')));
  if (!reduce && videos.length && 'IntersectionObserver' in window){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(({ target: v, isIntersecting }) => {
        if (isIntersecting) v.play().catch(() => {});
        else v.pause();
      });
    }, { threshold: .2 });
    videos.forEach((v) => io.observe(v));
  }

  /* ---------- 01 Photo: the AF point locks on, then the divider sweeps once ---------- */
  const vf = $('[data-sv-vf]');
  if (vf){
    const slider = $('.ba-slider', vf);
    const knob = $('.ba-slider__knob', vf);
    if (reduce){
      vf.classList.add('is-locked');
    } else if (slider){
      let touched = false;
      // start fully "as shot", so the edit is revealed rather than just shown
      gsap.set(slider, { '--ba-pos': '100%' });
      knob && knob.setAttribute('aria-valuenow', '100');
      slider.addEventListener('pointerdown', () => { touched = true; gsap.killTweensOf(slider); }, true);
      knob && knob.addEventListener('keydown', () => { touched = true; gsap.killTweensOf(slider); }, true);
      ScrollTrigger.create({
        trigger: vf, start: 'top 72%', once: true,
        onEnter: () => {
          vf.classList.add('is-locked');
          if (touched) return;
          gsap.to(slider, {
            '--ba-pos': '50%', duration: 1.9, delay: .55, ease: 'power3.inOut',
            onComplete: () => knob && knob.setAttribute('aria-valuenow', '50')
          });
        }
      });
    }
  }

  /* ---------- 02 Video: running timecode + playhead locked to the picture ---------- */
  const player = $('.sv-player');
  if (player && !reduce){
    const video = $('video', player);
    const tc = $('[data-sv-tc]', player);
    const tl = $('[data-sv-tl]', player);
    const FPS = 24;
    let run = 0; // seconds of picture shown since it first rolled
    const tick = (time, dt) => {
      if (video.paused) return;
      run += dt / 1000;
      const f = Math.floor((run % 1) * FPS);
      const s = Math.floor(run);
      tc.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(f)}`;
      if (video.duration) tl.style.setProperty('--p', (video.currentTime / video.duration).toFixed(4));
    };
    // 'playing' (not 'play') so the clock doesn't run while the file is still buffering
    let ticking = false;
    video.addEventListener('playing', () => { if (!ticking){ ticking = true; gsap.ticker.add(tick); } });
    video.addEventListener('pause', () => { ticking = false; gsap.ticker.remove(tick); });
  }

  /* ---------- 03 Graphics: proofs arrive stacked, then fan out ---------- */
  const print = $('.sv-print');
  if (print && !reduce){
    print.classList.add('is-stacked');
    ScrollTrigger.create({
      trigger: print, start: 'top 70%', once: true,
      onEnter: () => setTimeout(() => print.classList.remove('is-stacked'), 250)
    });
  }

  /* ---------- 04 Web: the microsite scrolls inside its window as you scroll ---------- */
  const view = $('.sv-browser__view');
  const site = $('[data-sv-site]');
  if (view && site && !reduce){
    const toast = $('.sv-browser__toast');
    gsap.to(site, {
      y: () => -Math.max(0, site.offsetHeight - view.clientHeight),
      ease: 'none',
      scrollTrigger: {
        trigger: view, start: 'top 78%', end: 'bottom 22%', scrub: .8, invalidateOnRefresh: true,
        // an enquiry lands as the visitor reaches the form
        onUpdate: (self) => toast && toast.classList.toggle('is-in', self.progress > .86)
      }
    });
  }

  /* ---------- 05 Social: reel progress bar follows the clip ---------- */
  const reel = $('.sv-phone__video');
  const bar = $('[data-sv-progress]');
  if (reel && bar && !reduce){
    let last = 0;
    reel.addEventListener('timeupdate', () => {
      if (!reel.duration) return;
      const p = reel.currentTime / reel.duration;
      // snap back on loop instead of animating the bar backwards
      bar.style.transition = p < last ? 'none' : 'transform .26s linear';
      bar.style.transform = `scaleX(${p.toFixed(3)})`;
      last = p;
    });
  }

  /* ---------- The machinery: split-flap codes riffle into place ---------- */
  const flaps = $$('[data-sv-flap]');
  if (flaps.length && !reduce){
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const spin = (flap, extra = 0) => {
      if (flap.dataset.busy) return;
      flap.dataset.busy = '1';
      const word = flap.dataset.svFlap;
      const tiles = $$('i', flap);
      let left = tiles.length;
      tiles.forEach((tile, i) => {
        let n = 5 + i * 3 + extra; // later letters settle later, like a real board
        const step = () => {
          tile.classList.remove('is-flip');
          void tile.offsetWidth; // restart the flip
          tile.classList.add('is-flip');
          if (n-- <= 0){
            tile.textContent = word[i];
            if (--left === 0) delete flap.dataset.busy;
            return;
          }
          tile.textContent = CHARS[(Math.random() * CHARS.length) | 0];
          setTimeout(step, 62);
        };
        step();
      });
    };
    ScrollTrigger.create({
      trigger: '.sv-board', start: 'top 72%', once: true,
      onEnter: () => flaps.forEach((f, k) => spin(f, k * 3))
    });
    flaps.forEach((f) => {
      const row = f.closest('.sv-board__row');
      row && row.addEventListener('pointerenter', () => spin(f));
    });
  }

  /* ---------- Packages: the quote prints, then the cards rise ---------- */
  const receipt = $('.sv-receipt');
  const paper = $('[data-sv-receipt]');
  if (receipt && paper && !reduce){
    receipt.classList.add('is-printing');
    gsap.from(paper, {
      yPercent: -100,
      duration: 2.4,
      ease: 'steps(22)', // a thermal printer feeds in jerks, not a glide
      scrollTrigger: { trigger: receipt, start: 'top 78%', once: true },
      onComplete: () => receipt.classList.remove('is-printing')
    });
  }
  const packs = $('.sv-packs');
  if (packs && !reduce){
    gsap.from('.sv-pack', {
      y: 50, autoAlpha: 0,
      duration: .9, ease: 'power3.out', stagger: .1, clearProps: clear,
      scrollTrigger: { trigger: packs, start: 'top 85%', once: true }
    });
  }
})();
