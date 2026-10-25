# Shared page blocks

Every page in `site/` is plain static HTML. Blocks that repeat on every page live here
and are copied into each page between markers:

    <!-- include:chrome -->
    <!-- /include:chrome -->

After editing a partial, run from the repo root:

    python3 tools/sync_partials.py            # all pages
    python3 tools/sync_partials.py site/x.html

| Partial         | What it is                                                        |
|-----------------|-------------------------------------------------------------------|
| head-assets     | fonts, favicon, styles.css + kit.css, scroll-restoration script   |
| chrome          | menu tab, mobile header, drawer nav, GET STARTED, story rail      |
| footer          | cinematic colophon: consultation CTA, nav, contact, bottom bar    |
| consult-modal   | the GET STARTED modal (includes consult-form) — not on contact    |
| consult-form    | the four-leg "flight plan" consultation form + boarding pass      |
| cookie          | cookie consent banner                                             |
| scripts         | GSAP, ScrollTrigger, Lenis, app.js, kit.js                        |
