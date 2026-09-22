/* motion.js · weboldal 3 · CSAK GSAP-extra: SplitText sor-maszk a [data-split] címeken, idle-guardos refresh. Nélküle az oldal teljes. */
(function () {
  'use strict';
  if (!window.gsap || !window.ScrollTrigger || (window.BP && window.BP.reduce)) return;
  gsap.registerPlugin(ScrollTrigger); if (window.SplitText) gsap.registerPlugin(SplitText);
  ScrollTrigger.config({ ignoreMobileResize: true });
  if (window.BP && window.BP.lenis) window.BP.lenis.on('scroll', ScrollTrigger.update);
  function split() {
    if (!window.SplitText) return;
    document.querySelectorAll('[data-split]').forEach(function (el) {
      try {
        var st = new SplitText(el, { type: 'lines', linesClass: 'line' }); el.classList.add('split');
        gsap.from(st.lines, { yPercent: 105, opacity: 0, duration: .8, ease: 'power3.out', stagger: .07, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
      } catch (e) {}
    });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(split); else split();
  /* refresh csak görgetés-csendben (600 ms), koaleszkálva */
  var lastScroll = 0, t = null; addEventListener('scroll', function () { lastScroll = performance.now(); }, { passive: true });
  function idleRefresh() { clearTimeout(t); t = setTimeout(function () { if (performance.now() - lastScroll < 600) return idleRefresh(); ScrollTrigger.refresh(); }, 650); }
  addEventListener('load', idleRefresh); setTimeout(idleRefresh, 2500); setTimeout(idleRefresh, 6000);
})();
