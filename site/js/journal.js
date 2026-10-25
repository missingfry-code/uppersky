/* =====================================================
   UPPERSKY MEDIA — Journal
   Index: masthead fit, topic filters, card entrances.
   Articles: reading progress, table of contents, share
   links, inline film. Loads after app.js + kit.js.
   Filters, progress, contents and sharing all work without
   GSAP; only the transitions need it.
   ===================================================== */

(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof gsap !== 'undefined';
  const hasST = hasGsap && typeof ScrollTrigger !== 'undefined';
  const motion = hasGsap && !reduce;
  const refresh = () => { if (hasST) ScrollTrigger.refresh(); };

  // One polite live region for "Link copied", "Showing 2 stories" etc.
  const status = document.createElement('p');
  status.className = 'visually-hidden';
  status.setAttribute('aria-live', 'polite');
  document.body.appendChild(status);
  const announce = (msg) => { status.textContent = ''; setTimeout(() => { status.textContent = msg; }, 60); };

  // Everything that tracks the scroll position shares one rAF-throttled loop
  const watchers = [];
  let queued = false;
  const tick = () => { queued = false; watchers.forEach((fn) => fn()); };
  const queue = () => { if (!queued){ queued = true; requestAnimationFrame(tick); } };
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);

  /* =====================================================
     MASTHEAD — set JOURNAL edge to edge, like a print cover
     ===================================================== */
  const word = document.querySelector('.jr-mast__word');
  if (word){
    const box = word.closest('.jr-mast');
    const fit = () => {
      word.style.fontSize = '';
      const base = parseFloat(getComputedStyle(word).fontSize);
      const w = word.offsetWidth;
      if (!w || !box.clientWidth) return;
      // cap by height so short landscape screens keep the cover lines in view
      const size = Math.min(base * (box.clientWidth / w), window.innerHeight * .5);
      word.style.fontSize = `${size.toFixed(1)}px`;
    };
    fit();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { fit(); refresh(); });
    let t;
    let lastW = window.innerWidth;
    window.addEventListener('resize', () => {
      // mobile URL bars resize the height on scroll; only refit on width changes
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      clearTimeout(t);
      t = setTimeout(() => { fit(); refresh(); }, 150);
    });
  }

  /* =====================================================
     STORY CARDS — rise in as the grid arrives
     ===================================================== */
  const entrances = [];
  const cardsIn = () => {
    if (!motion || !hasST) return;
    document.querySelectorAll('.jr-grid').forEach((grid) => {
      const items = grid.querySelectorAll('.jr-card:not([hidden])');
      if (!items.length) return;
      entrances.push(gsap.from(items, {
        y: 48, autoAlpha: 0, duration: .9, stagger: .1, ease: 'power3.out',
        clearProps: 'transform,opacity,visibility',
        scrollTrigger: { trigger: grid, start: 'top 85%', once: true }
      }));
    });
  };

  /* =====================================================
     TOPIC FILTERS — All · Trends · Marketing · Aviation · Playbooks
     ===================================================== */
  const filters = document.querySelector('.jr-filters');
  const grid = document.getElementById('jrGrid');
  if (filters && grid){
    const chips = [...filters.querySelectorAll('[data-filter]')];
    const cards = [...grid.querySelectorAll('.jr-card')];
    const empty = document.querySelector('.jr-empty');
    let current = 'all';
    let swapTl = null;

    // odd count in the two-up grid: let the last visible card run full width
    const pairUp = () => {
      const vis = cards.filter((c) => !c.hidden);
      cards.forEach((c) => c.classList.toggle('is-wide', vis.length % 2 === 1 && c === vis[vis.length - 1]));
    };
    const fits = (card, f) => f === 'all' || (card.dataset.cats || '').split(' ').includes(f);
    const labelOf = (f) => chips.find((c) => c.dataset.filter === f)?.dataset.label || f;

    const apply = (f, animated) => {
      current = f;
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.filter === f)));
      const show = cards.filter((c) => fits(c, f));
      const swap = () => {
        cards.forEach((c) => { c.hidden = !show.includes(c); });
        if (empty) empty.hidden = show.length > 0;
        pairUp();
        refresh();
      };
      const n = show.length;
      announce(f === 'all' ? `Showing all ${n} stories` : `Showing ${n} ${n === 1 ? 'story' : 'stories'} in ${labelOf(f)}`);

      // a pending scroll entrance would re-hide cards the filter just showed
      entrances.splice(0).forEach((tw) => { tw.scrollTrigger?.kill(); tw.progress(1); });

      if (!animated){ swap(); return; }
      if (swapTl) swapTl.kill();
      const leaving = cards.filter((c) => !c.hidden);
      swapTl = gsap.timeline()
        .to(leaving, { autoAlpha: 0, y: 14, duration: .24, ease: 'power2.in', stagger: .03 })
        .add(swap)
        .fromTo(show, { autoAlpha: 0, y: 30 },
          { autoAlpha: 1, y: 0, duration: .65, ease: 'power3.out', stagger: .08, clearProps: 'transform,opacity,visibility' });
    };

    filters.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-filter]');
      if (!chip || chip.dataset.filter === current) return;
      apply(chip.dataset.filter, motion);
    });

    pairUp();

    // Article category links land here as blog.html?topic=trends
    const topic = new URLSearchParams(window.location.search).get('topic');
    if (topic && topic !== 'all' && chips.some((c) => c.dataset.filter === topic)) apply(topic, false);
  }

  cardsIn();

  /* =====================================================
     READING PROGRESS — thin lime bar across the top
     ===================================================== */
  const article = document.querySelector('.jr-article');
  const bar = document.querySelector('.jr-progress__fill');
  const left = document.querySelector('[data-minutes-left]');
  if (article && bar){
    const minutes = parseInt(article.dataset.minutes, 10) || 0;
    let lastLeft = '';
    watchers.push(() => {
      const r = article.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 1;
      bar.style.transform = `scaleX(${p.toFixed(4)})`;
      if (left && minutes){
        const txt = p > .97 ? 'Finished — thanks for reading' : `${Math.max(1, Math.ceil(minutes * (1 - p)))} min left`;
        if (txt !== lastLeft){ left.textContent = txt; lastLeft = txt; }
      }
    });
  }

  /* =====================================================
     CONTENTS — highlight the section being read; jump with
     an offset that clears the fixed chrome
     ===================================================== */
  const toc = document.querySelector('.jr-toc');
  if (toc){
    const links = [...toc.querySelectorAll('a[href^="#"]')];
    const heads = links.map((a) => document.getElementById(a.getAttribute('href').slice(1)));
    let active = -2;
    watchers.push(() => {
      const line = window.innerHeight * .35;
      let idx = -1;
      heads.forEach((h, i) => { if (h && h.getBoundingClientRect().top <= line) idx = i; });
      if (idx === active) return;
      active = idx;
      links.forEach((a, i) => {
        a.classList.toggle('is-active', i === idx);
        if (i === idx) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      });
    });

    // Capture phase, so app.js's generic anchor handler (12px offset) never sees it
    toc.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const target = document.getElementById(a.getAttribute('href').slice(1));
      if (!target) return;
      e.preventDefault();
      e.stopPropagation();
      const offset = -110;
      if (window.lenis) window.lenis.scrollTo(target, { offset });
      else {
        const top = target.getBoundingClientRect().top + window.scrollY + offset;
        window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
      }
      history.replaceState(null, '', a.getAttribute('href'));
      // keyboard and screen-reader users continue reading from the heading
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }, true);
  }

  /* =====================================================
     SHARE — copy link, LinkedIn, email
     ===================================================== */
  const shareBtns = document.querySelectorAll('[data-share]');
  if (shareBtns.length){
    const url = window.location.href.split('#')[0];
    const og = (p) => document.querySelector(`meta[property="og:${p}"]`)?.content || '';
    const title = og('title') || document.title;
    const desc = og('description') || document.querySelector('meta[name="description"]')?.content || '';

    document.querySelectorAll('[data-share="linkedin"]').forEach((a) => {
      a.href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    });
    document.querySelectorAll('[data-share="email"]').forEach((a) => {
      a.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${desc}\n\n${url}`)}`;
    });

    const copy = async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (_){
        // older browsers / non-secure origins: the hidden-textarea route
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
        document.body.appendChild(ta);
        ta.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch (__){}
        ta.remove();
        return ok;
      }
    };

    document.querySelectorAll('[data-share="copy"]').forEach((btn) => {
      const label = btn.querySelector('.jr-share__txt');
      const idle = label ? label.textContent : '';
      let timer;
      btn.addEventListener('click', async () => {
        const ok = await copy(url);
        if (!ok){ window.prompt('Copy this link:', url); return; }
        clearTimeout(timer);
        btn.classList.add('is-copied');
        if (label) label.textContent = 'Copied';
        announce('Link copied to clipboard');
        if (motion) gsap.fromTo(btn, { scale: .94 }, { scale: 1, duration: .5, ease: 'back.out(3)', clearProps: 'transform' });
        timer = setTimeout(() => {
          btn.classList.remove('is-copied');
          if (label) label.textContent = idle;
        }, 2200);
      });
    });
  }

  /* =====================================================
     INLINE FILM — pause control, still under reduced motion,
     and no decoding while it's off screen
     ===================================================== */
  document.querySelectorAll('[data-jr-video]').forEach((fig) => {
    const video = fig.querySelector('video');
    const toggle = fig.querySelector('.jr-video-toggle');
    if (!video) return;
    let wanted = !reduce;
    const sync = () => {
      if (!toggle) return;
      toggle.dataset.state = wanted ? 'playing' : 'paused';
      toggle.querySelector('.jr-video-toggle__txt').textContent = wanted ? 'Pause film' : 'Play film';
    };
    if (!wanted){ video.removeAttribute('autoplay'); video.pause(); }
    sync();
    toggle?.addEventListener('click', () => {
      wanted = !wanted;
      if (wanted) video.play().catch(() => {});
      else video.pause();
      sync();
    });
    if ('IntersectionObserver' in window){
      new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && wanted) video.play().catch(() => {});
        else video.pause();
      }, { threshold: .15 }).observe(fig);
    }
  });

  queue();
  window.addEventListener('load', queue);
})();
