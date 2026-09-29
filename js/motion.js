/* motion.js · weboldal 4 · CSAK GSAP-extra, nélküle az oldal teljes (minden tartalom CSS-ből látszik).
   - SplitText sor-maszk a [data-split] címeken
   - kép-nyitás: [data-clip] és a nagy fotók (.fullimg, .framed, .pane--photo, .hero--collage kívül) clip-path inset-ből nyílnak, egyszer
   - parallax a kereten belül: [data-parallax] és .fullimg img (scrub, csak transform)
   - idle-guardos refresh (görgetés-csendben) */
(function () {
  'use strict';
  if (!window.gsap || !window.ScrollTrigger || (window.BP && window.BP.reduce)) return;
  gsap.registerPlugin(ScrollTrigger); if (window.SplitText) gsap.registerPlugin(SplitText);
  ScrollTrigger.config({ ignoreMobileResize: true });
  if (window.BP && window.BP.lenis) window.BP.lenis.on('scroll', ScrollTrigger.update);

  function split() {
    if (!window.SplitText) return;
    document.querySelectorAll('[data-split]').forEach(function (el) {
      if (el.closest('.hero--kuszob')) return;
      try {
        var st = new SplitText(el, { type: 'lines', linesClass: 'line' }); el.classList.add('split');
        gsap.from(st.lines, { yPercent: 105, opacity: 0, duration: .9, ease: 'power3.out', stagger: .08, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
      } catch (e) {}
    });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(split); else split();

  /* kép-nyitás: alulról felfelé nyíló keret, a kép közben enyhén kicsinyedik (Motion Recipes 11 · S5) */
  var clips = [].slice.call(document.querySelectorAll('[data-clip], .fullimg, main .framed'));
  clips.forEach(function (fig) {
    if (fig.closest('.hero')) return;
    var img = fig.querySelector('img'); if (!img) return;
    var tl = gsap.timeline({ scrollTrigger: { trigger: fig, start: 'top 85%', once: true } });
    tl.fromTo(fig, { clipPath: 'inset(18% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power3.out', clearProps: 'clipPath' });
    if (!img.hasAttribute('data-parallax')) tl.fromTo(img, { scale: 1.12 }, { scale: 1, duration: 1.4, ease: 'power3.out', clearProps: 'transform' }, 0);
  });

  /* parallax a kereten belül (a kép 112% magas, a keret clip) */
  document.querySelectorAll('[data-parallax]').forEach(function (img) {
    gsap.fromTo(img, { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* refresh csak görgetés-csendben (600 ms), koaleszkálva */
  var lastScroll = 0, t = null; addEventListener('scroll', function () { lastScroll = performance.now(); }, { passive: true });
  function idleRefresh() { clearTimeout(t); t = setTimeout(function () { if (performance.now() - lastScroll < 600) return idleRefresh(); ScrollTrigger.refresh(); }, 650); }
  addEventListener('load', idleRefresh); setTimeout(idleRefresh, 2500); setTimeout(idleRefresh, 6000);
})();
