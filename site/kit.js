/* =====================================================
   UPPERSKY MEDIA — kit
   Shared behaviour for every page: the flight-plan consultation
   form + modal, cookie consent, page-hero intro, scroll-lit type
   and image parallax. Loads after app.js, which sets up GSAP,
   ScrollTrigger and Lenis.
   ===================================================== */

const hasGsap = () => typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const animate = () => hasGsap() && !reduceMotion;

/* =====================================================
   FLIGHT PLAN — four-leg consultation form
   ===================================================== */
(() => {
  const pad = (n) => String(n).padStart(2, '0');

  // No backend yet: hand the finished request to the visitor's email app
  const mailtoFor = (to, d) => {
    const subject = `Free consultation — ${d.mission || 'Enquiry'}${d.name ? ' · ' + d.name : ''}`;
    const body = [
      'FLIGHT PLAN — free consultation request',
      '',
      `Mission:   ${d.mission || '—'}`,
      `Aircraft:  ${d.aircraft || '—'}`,
      `Timeline:  ${d.timeline || '—'}`,
      '',
      `Name:      ${d.name}`,
      `Email:     ${d.email}`,
      `Phone:     ${d.phone || '—'}`,
      `Company:   ${d.company || '—'}`,
      '',
      d.message ? `Notes:\n${d.message}` : ''
    ].join('\n');
    return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  document.querySelectorAll('[data-flightplan]').forEach((root) => {
    const form  = root.querySelector('form');
    const steps = [...form.querySelectorAll('.flightform__step')];
    const legs  = [...form.querySelectorAll('.flightform__legs li')];
    const back  = form.querySelector('[data-ff="back"]');
    const next  = form.querySelector('[data-ff="next"]');
    const send  = form.querySelector('[data-ff="submit"]');
    const count = form.querySelector('[data-ff="count"]');
    const error = form.querySelector('.flightform__error');
    const done  = root.querySelector('[data-ff="done"]');
    let at = 0;

    const show = (i, dir = 1) => {
      const from = steps[at];
      const to = steps[i];
      at = i;
      steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
      legs.forEach((l, k) => {
        l.classList.toggle('is-current', k === i);
        l.classList.toggle('is-done', k < i);
      });
      count.textContent = pad(i + 1);
      back.hidden = i === 0;
      next.hidden = i === steps.length - 1;
      send.hidden = i !== steps.length - 1;
      // the emblem flies along the route, turning a quarter per leg
      form.style.setProperty('--ff-progress', `${4 + (i / (steps.length - 1)) * 92}%`);
      form.style.setProperty('--ff-spin', `${i * 90}deg`);

      if (from === to) return;
      if (animate()){
        gsap.fromTo(to, { autoAlpha: 0, x: 28 * dir },
          { autoAlpha: 1, x: 0, duration: .5, ease: 'power3.out', clearProps: 'transform,opacity,visibility' });
        gsap.fromTo(to.querySelectorAll('.mission, .ff-field, .chip, .flightform__label, .flightform__privacy'),
          { y: 14, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: .45, stagger: .04, delay: .05, ease: 'power3.out', clearProps: 'transform,opacity,visibility' });
      }
      // keyboard users land in the first field; skip on touch so no keyboard pops up
      const first = to.querySelector('.ff-input');
      if (first && window.matchMedia('(pointer: fine)').matches){
        setTimeout(() => first.focus({ preventScroll: true }), 80);
      }
    };

    const fieldOk = (input) => {
      const ok = input.checkValidity();
      input.closest('.ff-field')?.classList.toggle('is-invalid', !ok);
      return ok;
    };

    const valid = (i) => {
      const step = steps[i];
      let ok = true;
      const required = step.querySelector('input[type="radio"][required]');
      if (required){
        ok = [...step.querySelectorAll(`input[name="${required.name}"]`)].some((r) => r.checked);
      }
      step.querySelectorAll('.ff-input[required], .ff-input[type="email"]').forEach((input) => {
        if (!fieldOk(input)) ok = false;
      });
      const hint = step.querySelector('.flightform__hint');
      if (hint) hint.hidden = ok;
      if (!ok && animate()) gsap.fromTo(step, { x: -10 }, { x: 0, duration: .6, ease: 'elastic.out(1, .3)' });
      return ok;
    };

    const land = (d, mode) => {
      done.querySelectorAll('[data-pass]').forEach((el) => { el.textContent = d[el.dataset.pass] || '—'; });
      const note = done.querySelector('[data-pass-note]');
      note.textContent = mode === 'mail' ? note.dataset.noteMail : note.dataset.noteSent;
      done.querySelector('.pass__fallback').hidden = mode !== 'mail';
      form.hidden = true;
      done.hidden = false;
      done.focus({ preventScroll: true });
      if (animate()){
        gsap.from(done.querySelector('.pass'), { y: 44, rotate: -2, autoAlpha: 0, duration: .9, ease: 'power3.out' });
        gsap.from(done.querySelectorAll('.pass__grid > div'), { y: 12, autoAlpha: 0, duration: .5, stagger: .06, delay: .3, ease: 'power3.out' });
      }
    };

    next.addEventListener('click', () => { if (valid(at)) show(at + 1, 1); });
    back.addEventListener('click', () => show(at - 1, -1));

    // picking a mission is the answer — move on without an extra click
    form.querySelectorAll('input[name="mission"]').forEach((radio) => {
      radio.addEventListener('change', () => setTimeout(() => { if (at === 0) show(1, 1); }, 320));
    });

    form.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || e.target.tagName === 'TEXTAREA') return;
      if (at < steps.length - 1){ e.preventDefault(); next.click(); }
    });

    form.addEventListener('input', (e) => {
      const field = e.target.closest('.ff-field.is-invalid');
      if (field && e.target.checkValidity()) field.classList.remove('is-invalid');
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      // every leg has to hold up, not just the last one
      for (let i = 0; i < steps.length; i++){
        if (!valid(i)){ show(i, -1); return; }
      }
      const data = Object.fromEntries(new FormData(form));
      const endpoint = form.dataset.endpoint;
      send.disabled = true;
      error.hidden = true;
      try {
        if (endpoint){
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(data)
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          land(data, 'sent');
        } else {
          window.location.href = mailtoFor(form.dataset.to, data);
          land(data, 'mail');
        }
      } catch (_){
        error.hidden = false;
      } finally {
        send.disabled = false;
      }
    });

    show(0);
  });
})();

/* =====================================================
   CONSULT MODAL — any [data-consult] link opens it
   ===================================================== */
(() => {
  const modal = document.getElementById('consultModal');
  const inline = !modal && document.querySelector('[data-flightplan]');
  if (!modal && !inline) return;

  // Pages with the form inline (contact) scroll to it instead of opening a modal;
  // a wrapper marked [data-consult-target] (e.g. the card around it) wins
  if (inline){
    const target = document.querySelector('[data-consult-target]') || inline;
    document.addEventListener('click', (e) => {
      if (!e.target.closest('[data-consult]')) return;
      e.preventDefault();
      if (window.lenis) window.lenis.scrollTo(target, { offset: -90 });
      else target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return;
  }

  const panel = modal.querySelector('.consult-modal__panel');
  const video = modal.querySelector('video');
  let closing = false;

  const open = () => {
    if (modal.open) return;
    modal.showModal();
    document.documentElement.classList.add('modal-open');
    if (window.lenis) window.lenis.stop();
    if (video) video.play().catch(() => {});
    if (animate()){
      gsap.fromTo(panel, { y: 48, scale: .98, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: .7, ease: 'power3.out' });
      gsap.from(modal.querySelectorAll('.consult-modal__aside-in > *, .flightform__head > *'),
        { y: 18, autoAlpha: 0, duration: .6, stagger: .05, delay: .15, ease: 'power3.out' });
    }
  };

  const close = () => {
    if (!modal.open || closing) return;
    closing = true;
    const finish = () => { modal.close(); closing = false; };
    if (animate()) gsap.to(panel, { y: 28, autoAlpha: 0, duration: .3, ease: 'power2.in', onComplete: finish });
    else finish();
  };

  modal.addEventListener('close', () => {
    document.documentElement.classList.remove('modal-open');
    if (window.lenis) window.lenis.start();
    if (video) video.pause();
    if (hasGsap()) gsap.set(panel, { clearProps: 'all' });
  });
  modal.addEventListener('cancel', (e) => { e.preventDefault(); close(); });   // Esc
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); }); // backdrop
  modal.querySelectorAll('[data-consult-close]').forEach((b) => b.addEventListener('click', close));

  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-consult]')) return;
    e.preventDefault();
    open();
  });
})();

/* =====================================================
   COOKIE CONSENT — stored locally, announced as an event
   ===================================================== */
(() => {
  const banner = document.getElementById('cookieBanner');
  if (!banner) return;
  const KEY = 'usm-consent';
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch (_){ return null; } };
  const write = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (_){} };

  const prefs  = banner.querySelector('#cookiePrefs');
  const toggle = banner.querySelector('[data-cookie="prefs"]');
  const save   = banner.querySelector('[data-cookie="save"]');
  const accept = banner.querySelector('[data-cookie="accept"]');
  const boxes  = {
    analytics: banner.querySelector('input[name="analytics"]'),
    marketing: banner.querySelector('input[name="marketing"]')
  };

  // Analytics scripts should listen for this and load only when allowed
  const announce = (c) => {
    window.uppersky = Object.assign(window.uppersky || {}, { consent: c });
    window.dispatchEvent(new CustomEvent('uppersky:consent', { detail: c }));
  };

  const setPrefsOpen = (open) => {
    prefs.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    save.hidden = !open;
    accept.hidden = open;
  };

  const show = (withPrefs = false) => {
    const c = read();
    if (c){ boxes.analytics.checked = !!c.analytics; boxes.marketing.checked = !!c.marketing; }
    setPrefsOpen(withPrefs);
    banner.hidden = false;
    if (animate()) gsap.fromTo(banner, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .6, ease: 'power3.out' });
  };

  const hide = () => {
    const finish = () => { banner.hidden = true; };
    if (animate()) gsap.to(banner, { y: 20, autoAlpha: 0, duration: .3, ease: 'power2.in', onComplete: finish });
    else finish();
  };

  const decide = (analytics, marketing) => {
    const c = { essential: true, analytics, marketing, at: new Date().toISOString() };
    write(c);
    announce(c);
    hide();
  };

  banner.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cookie]');
    if (!btn) return;
    const act = btn.dataset.cookie;
    if (act === 'accept') decide(true, true);
    else if (act === 'essential') decide(false, false);
    else if (act === 'save') decide(boxes.analytics.checked, boxes.marketing.checked);
    else if (act === 'prefs') setPrefsOpen(prefs.hidden);
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-cookie-open]')) return;
    e.preventDefault();
    show(true);
  });

  const saved = read();
  if (saved) announce(saved);
  else setTimeout(() => show(), 1400);
})();

/* =====================================================
   PAGE MOTION — hero intro, scroll-lit words, parallax
   ===================================================== */
(() => {
  if (!hasGsap()) return;

  /* Page hero — photo settles, headline lines rise out of their masks */
  const hero = document.querySelector('.page-hero');
  if (hero && !reduceMotion){
    const media = hero.querySelector('.page-hero__media');
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    if (media) tl.from(media, { scale: 1.14, duration: 2.4, ease: 'power2.out' }, 0);
    tl.from(hero.querySelectorAll('.page-hero__title .line > span'), { yPercent: 110, duration: 1.15, stagger: .1 }, .15)
      .from(hero.querySelectorAll('.page-hero__crumb, .page-hero__foot > *'),
        { y: 18, autoAlpha: 0, duration: .8, stagger: .08, ease: 'power3.out' }, .55);
    if (media){
      gsap.to(media, {
        yPercent: 14, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
      });
    }
  }

  /* [data-lit] — wrap each word, then light them one by one as the block scrolls */
  const splitWords = (root) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) if (walker.currentNode.nodeValue.trim()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const frag = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)){ frag.appendChild(document.createTextNode(part)); return; }
        const span = document.createElement('span');
        span.className = 'lit';
        span.textContent = part;
        frag.appendChild(span);
      });
      node.replaceWith(frag);
    });
  };
  document.querySelectorAll('[data-lit]').forEach((block) => {
    splitWords(block);
    if (reduceMotion) return;
    gsap.to(block.querySelectorAll('.lit'), {
      opacity: 1, ease: 'none', stagger: .25,
      scrollTrigger: { trigger: block, start: 'top 82%', end: 'bottom 48%', scrub: true }
    });
  });

  /* [data-parallax] — the image drifts inside its frame (it's 118% tall, see kit.css) */
  if (!reduceMotion){
    gsap.utils.toArray('[data-parallax]').forEach((frame) => {
      const media = frame.querySelector(':scope > img, :scope > video');
      if (!media) return;
      gsap.fromTo(media, { yPercent: -15 }, {
        yPercent: 0, ease: 'none',
        scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  }
})();
