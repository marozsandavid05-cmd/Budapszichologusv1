/* motion.js · weboldal 4 · mozgásrendszer, CSAK GSAP-extra. Nélküle (és JS nélkül) az oldal teljes: minden tartalom CSS-ből látszik,
   rejtett kezdőállapotot kizárólag ez a fájl ad, inline, abban a pillanatban, amikor a hozzá tartozó ScrollTrigger is él.
   Nem indul: reduced motion alatt (BP.reduce, ?motion=0), GSAP hiányában, és [data-motion="off"] szekcióban.
   A GSAP-független gerinc a site.js-ben: Lenis, reveal ([data-reveal], [data-stagger]), számláló ([data-count]),
   vízszintes ház-szakasz ([data-hscroll]), hero-belépő (.h-in). A hover-állapotok CSS-ben (css/_parts/motion.css).

   Opt-in jelölések (részletek: css/_parts/motion.css fejléce):
     [data-split]          címsor soronként bukkan fel a maszk mögül (SplitText lines + mask), ="words": szavanként
     [data-clip]           kép-keret alulról nyílik, a kép közben leül (1.1 -> 1)
     [data-parallax]       kép a keretén belül úszik, érték = elmozdulás %-ban (alap 5)
     [data-drift]          lassú függőleges úszás (díszszám, szövegblokk), érték = px (alap 60)
   Automatikus: .fullimg és main .framed kép (nyitás + parallax), .hero--cover és .pane--photo fotó (parallax kifelé),
   .closer__clock (drift), a ház-szakasz fotói (vízszintes mélység a sávon belül).
   A hero végleges mozgása David döntésére vár (hero-a2 prototípus), ezért a .hero--kuszob-hoz itt nem nyúlunk. */
(function () {
  'use strict';
  var doc = document, BP = window.BP || {};
  if (!window.gsap || !window.ScrollTrigger || BP.reduce) return;
  gsap.registerPlugin(ScrollTrigger); if (window.SplitText) gsap.registerPlugin(SplitText);
  ScrollTrigger.config({ ignoreMobileResize: true });
  if (BP.lenis) BP.lenis.on('scroll', ScrollTrigger.update);
  doc.documentElement.classList.add('gsap-on');

  var off = function (el) { return !!el.closest('[data-motion="off"]'); };
  var num = function (el, attr, d) { var v = parseFloat(el.getAttribute(attr)); return isNaN(v) ? d : v; };
  var inHero = function (el) { return !!el.closest('.hero'); };
  var reveals = [];   /* egyszeri belépők: a biztonsági háló ezekre figyel */

  /* ---------- 0. szekció-belépők: [data-reveal] és [data-stagger] gyerekei. CSAK a hajtás alatti elemek kapnak rejtett
     kezdőállapotot (inline), így ami betöltéskor látszik, az nem villan. ScrollTrigger.batch: az egyszerre érkezők lépcsőzve. ---------- */
  var rvItems = [];
  [].forEach.call(doc.querySelectorAll('[data-reveal]'), function (el) { if (!off(el) && !inHero(el)) rvItems.push(el); });
  [].forEach.call(doc.querySelectorAll('[data-stagger]'), function (g) { if (off(g) || inHero(g)) return; [].forEach.call(g.children, function (c) { if (rvItems.indexOf(c) < 0) rvItems.push(c); }); });
  rvItems = rvItems.filter(function (el) { return el.getBoundingClientRect().top > innerHeight * .96; });
  if (rvItems.length) {
    gsap.set(rvItems, { opacity: 0, y: 14, transition: 'none' });
    ScrollTrigger.batch(rvItems, {
      start: 'top 90%', once: true, interval: .12,
      onEnter: function (batch) { reveals.push(gsap.to(batch, { opacity: 1, y: 0, duration: .8, ease: 'power3.out', stagger: .07, overwrite: true, clearProps: 'opacity,transform,transition' })); }
    });
  }

  /* ---------- 1. SplitText címek: sor-maszk, a hero címe betöltéskor, a többi beérkezéskor ---------- */
  function splitAll() {
    if (!window.SplitText) return;
    [].forEach.call(doc.querySelectorAll('[data-split]'), function (el) {
      if (off(el) || el.closest('.hero--kuszob')) return;
      var words = el.getAttribute('data-split') === 'words', hero = inHero(el);
      try {
        SplitText.create(el, {
          type: words ? 'words,lines' : 'lines', linesClass: 'line', wordsClass: 'word', mask: words ? 'words' : 'lines', autoSplit: true,
          onSplit: function (self) {
            el.classList.add('split');
            var targets = words ? self.words : self.lines;
            var tw = gsap.from(targets, {
              yPercent: 112, duration: hero ? 1.05 : .95, ease: 'power4.out', stagger: words ? .035 : .09, delay: hero ? .12 : 0,
              scrollTrigger: hero ? null : { trigger: el, start: 'top 88%', once: true }
            });
            reveals.push(tw); return tw;
          }
        });
      } catch (e) { el.classList.remove('split'); }
    });
  }
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(splitAll); else splitAll();

  /* ---------- 2. kép-nyitás + parallax ---------- */
  /* a kép köré vágó keret kell a parallaxhoz; ha a szülő nem vág, egy .pxw burkot kap (azonos méret, nincs layout shift) */
  function frameOf(img) {
    var p = img.parentElement, cs = getComputedStyle(p);
    if (p.classList.contains('pxw') || p.classList.contains('px') || cs.overflow !== 'visible' || cs.overflowY !== 'visible') return p;
    var w = doc.createElement('span'); w.className = 'pxw'; p.insertBefore(w, img); w.appendChild(img); return w;
  }
  var clipImgs = [], seen = new Set();
  [].forEach.call(doc.querySelectorAll('[data-clip] img, .fullimg img, main .framed img'), function (img) {
    if (seen.has(img) || off(img) || inHero(img)) return; seen.add(img); clipImgs.push(img);
  });
  clipImgs.forEach(function (img) {
    var frame = frameOf(img), par = img.hasAttribute('data-parallax') || !!img.closest('.fullimg, .framed');
    gsap.fromTo(frame, { clipPath: 'inset(16% 0% 0% 0%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)', duration: 1.25, ease: 'power3.out', clearProps: 'clipPath',
      scrollTrigger: { trigger: frame, start: 'top 88%', once: true }
    });
    if (!par) { var t = gsap.fromTo(img, { scale: 1.1 }, { scale: 1, duration: 1.5, ease: 'power3.out', scrollTrigger: { trigger: frame, start: 'top 88%', once: true } }); reveals.push(t); }
  });

  /* parallax: a kép 1.12-re nagyítva, a kereten belül ±(érték)% úszik, így sosem látszik üres szél */
  var pxImgs = [];
  [].forEach.call(doc.querySelectorAll('[data-parallax], .fullimg img, main .framed img, .hero--cover .hero__photo img, .pane--photo img'), function (img) {
    if (img.tagName !== 'IMG' || off(img) || pxImgs.indexOf(img) >= 0) return; pxImgs.push(img);
  });
  pxImgs.forEach(function (img) {
    var frame = frameOf(img), amt = Math.min(5.5, num(img, 'data-parallax', 5)), hero = inHero(img);
    gsap.set(img, { scale: 1.12, force3D: true });
    gsap.fromTo(img, { yPercent: hero ? 0 : -amt }, {
      yPercent: amt, ease: 'none',
      scrollTrigger: { trigger: frame, start: hero ? 'top top' : 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  /* ---------- 3. drift: lassú függőleges úszás (díszszám, szövegblokk) ---------- */
  [].forEach.call(doc.querySelectorAll('[data-drift], .closer__clock'), function (el) {
    if (off(el)) return;
    var d = num(el, 'data-drift', 60);
    if (el.classList.contains('closer__clock')) gsap.set(el, { xPercent: -50, yPercent: -52, x: 0, y: 0 });
    gsap.fromTo(el, { y: -d }, { y: d, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* ---------- 4. ház-szakasz: a fotók a sávon belül vízszintesen mélyülnek (a sávot a site.js mozgatja, ez csak olvassa a pozíciót) ---------- */
  [].forEach.call(doc.querySelectorAll('[data-hscroll]'), function (track) {
    if (off(track)) return;
    var imgs = [].slice.call(track.querySelectorAll('figure img')); if (!imgs.length) return;
    var setters = imgs.map(function (img) { frameOf(img); gsap.set(img, { scale: 1.1 }); return gsap.quickSetter(img, 'xPercent'); });
    var raf = null;
    function tick() {
      raf = null; var mid = innerWidth / 2;
      imgs.forEach(function (img, i) { var r = img.parentElement.getBoundingClientRect(); if (r.right < -200 || r.left > innerWidth + 200) return; setters[i](gsap.utils.clamp(-4.5, 4.5, ((r.left + r.width / 2) - mid) / innerWidth * -9)); });
    }
    var q = function () { if (!raf) raf = requestAnimationFrame(tick); };
    addEventListener('scroll', q, { passive: true }); addEventListener('resize', q); q();
    /* a site.js rAF-lerppel húzza a sávot: amíg a sáv mozog, kövessük */
    new MutationObserver(q).observe(track, { attributes: true, attributeFilter: ['style'] });
  });

  /* ---------- 5. biztonsági háló: háttér-tabban a gsap.ticker fojtódik, egy belépő sem maradhat félúton rejtve ---------- */
  function finishStuck() {
    rvItems.forEach(function (el) { if (el.style.opacity === '0' && el.getBoundingClientRect().top < innerHeight) gsap.set(el, { clearProps: 'opacity,transform,transition' }); });
    reveals.forEach(function (tw) {
      if (!tw || tw.progress() === 1) return;
      var st = tw.scrollTrigger;
      if (!st || st.progress > 0 || st.start <= (st.scroll ? st.scroll() : scrollY)) tw.progress(1);
    });
  }
  setTimeout(finishStuck, 4000);
  doc.addEventListener('visibilitychange', function () { if (!doc.hidden) setTimeout(finishStuck, 1200); });

  /* ---------- 6. refresh csak görgetés-csendben (600 ms), koaleszkálva, újrapróbálkozva ---------- */
  var lastScroll = 0, rt = null, tries = 0;
  addEventListener('scroll', function () { lastScroll = performance.now(); }, { passive: true });
  function idleRefresh() {
    clearTimeout(rt);
    rt = setTimeout(function () { if (performance.now() - lastScroll < 600 && tries++ < 40) return idleRefresh(); tries = 0; ScrollTrigger.refresh(); }, 650);
  }
  addEventListener('load', idleRefresh); if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(idleRefresh);
  [].forEach.call(doc.querySelectorAll('img[loading="lazy"]'), function (img) { if (!img.complete) img.addEventListener('load', idleRefresh, { once: true }); });
  setTimeout(idleRefresh, 2500); setTimeout(idleRefresh, 6000);
  BP.motionRefresh = idleRefresh;
  /* QA-hoz: hány görgetés-trigger jött létre (a once-triggerek lefutás után eltűnnek a getAll()-ból) */
  setTimeout(function () { BP.motionStats = { st: ScrollTrigger.getAll().length + reveals.filter(function (t) { return t && !t.scrollTrigger; }).length + rvItems.length + clipImgs.length }; }, 0);
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { setTimeout(function () { BP.motionStats = { st: ScrollTrigger.getAll().length + rvItems.length + clipImgs.length + reveals.length }; }, 50); });
})();
