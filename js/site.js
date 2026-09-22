/* ============================================================
   Budai Pszichológus Központ · weboldal 3 · site.js
   GSAP nélkül is teljes: motion-override, reveal, Lenis, nav (rejtés, panel, mobil lap),
   hero keret-kontrakció, forgó szó, madlib-fit, regiszter (szűrő, kapcsoló, URL), story-kép,
   kollázs egér-parallax, drag-scroll sor, GYIK-kereső, űrlap (Web3Forms / mailto), tiszta URL, mérő-sáv.
   ============================================================ */
(function () {
  'use strict';
  var CONFIG = { web3formsKey: '', mailto: 'bejelentkezes@budaipszichologus.hu', phone: '+36 30 961 1364' };
  var doc = document, html = doc.documentElement, body = doc.body, BP = window.BP = window.BP || {};

  /* ---------- ?motion=1|0 override (David gépén reduced motion aktív), ?qa=1 ---------- */
  var q = new URLSearchParams(location.search);
  if (q.has('motion')) { try { sessionStorage.setItem('bp3-motion', q.get('motion')); } catch (e) {} }
  var forced = null; try { forced = sessionStorage.getItem('bp3-motion'); } catch (e) {}
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (forced === '1') reduce = false;
  if (forced === '0') reduce = true;
  if (reduce) html.classList.add('motion-off');
  if (q.has('qa')) html.classList.add('qa');
  var fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  var NAV = function () { return parseFloat(getComputedStyle(html).getPropertyValue('--nav')) || 64; };
  BP.reduce = reduce; BP.fine = fine;

  /* ---------- reveal: IO + safety ---------- */
  var revealEls = [].slice.call(doc.querySelectorAll('[data-reveal],[data-stagger]'));
  [].forEach.call(doc.querySelectorAll('[data-stagger]'), function (g) { [].forEach.call(g.children, function (c, i) { c.style.setProperty('--i', i); }); });
  function showAll() { revealEls.forEach(function (el) { el.classList.add('in'); }); }
  if (reduce || !('IntersectionObserver' in window)) showAll();
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    revealEls.forEach(function (el) { io.observe(el); });
    setTimeout(function () { revealEls.forEach(function (el) { if (el.getBoundingClientRect().top < innerHeight * 0.92) el.classList.add('in'); }); }, 1200);
  }
  setTimeout(showAll, 4000);
  var hero = doc.querySelector('.hero');
  function heroIn() { if (hero) hero.classList.add('is-in'); }
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { setTimeout(heroIn, 60); });
  setTimeout(heroIn, 900);

  /* ---------- Lenis: self-rAF, syncTouch false, reduced alatt natív ---------- */
  var lenis = null;
  if (!reduce && typeof window.Lenis !== 'undefined') {
    try { lenis = new window.Lenis({ duration: 1.1, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true, syncTouch: false }); (function lraf(t) { lenis.raf(t); requestAnimationFrame(lraf); })(0); } catch (e) { lenis = null; }
  }
  BP.lenis = lenis;

  /* ---------- nav: rejtés hiszterézissel, aktuális menüpont ---------- */
  var nav = doc.querySelector('.nav'), lastY = scrollY || 0, downAcc = 0, upAcc = 0;
  function onScroll() {
    var y = scrollY || 0, d = y - lastY;
    if (nav && !body.classList.contains('no-scroll')) {
      if (d > 0) { downAcc += d; upAcc = 0; } else if (d < 0) { upAcc -= d; downAcc = 0; }
      if (downAcc > 28 && y > 240) { if (!nav.classList.contains('is-hidden')) { nav.classList.add('is-hidden'); body.classList.add('nav-hidden'); closePanels(); } }
      else if (upAcc > 160 || y <= 240) { nav.classList.remove('is-hidden'); body.classList.remove('nav-hidden'); }
    }
    lastY = y;
  }
  addEventListener('scroll', onScroll, { passive: true });
  (function markCurrent() {
    var file = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '') || 'index';
    var inProf = /\/szakemberek\//.test(location.pathname), inBlog = /\/blog\//.test(location.pathname);
    [].forEach.call(doc.querySelectorAll('.nav__links > a, .sheet__links > a'), function (a) {
      var href = (a.getAttribute('href') || '').replace(/^\.\.\//, '').replace(/\.html$/, '');
      if (href === file || (inProf && href === 'szakembereink') || (inBlog && href === 'blog')) a.setAttribute('aria-current', 'page');
    });
  })();

  /* ---------- nav: panel (Miben segítünk) ---------- */
  var toggles = [].slice.call(doc.querySelectorAll('.nav__toggle'));
  function closePanels() { toggles.forEach(function (t) { t.setAttribute('aria-expanded', 'false'); var p = doc.getElementById(t.getAttribute('aria-controls')); if (p) p.classList.remove('is-open'); }); }
  toggles.forEach(function (t) {
    var panel = doc.getElementById(t.getAttribute('aria-controls')); if (!panel) return;
    t.addEventListener('click', function (e) { e.stopPropagation(); var open = t.getAttribute('aria-expanded') === 'true'; closePanels(); if (!open) { t.setAttribute('aria-expanded', 'true'); panel.classList.add('is-open'); } });
    panel.addEventListener('click', function (e) { e.stopPropagation(); });
  });
  doc.addEventListener('click', closePanels);

  /* ---------- nav: mobil lap fókusz-csapdával, lenis stop/start ---------- */
  var burger = doc.querySelector('.nav__burger'), sheet = doc.getElementById('sheet'), lastFocus = null;
  function focusables() { return [].slice.call(sheet.querySelectorAll('a[href],button,summary,input,select,textarea,[tabindex]:not([tabindex="-1"])')).filter(function (el) { return el.offsetParent !== null; }); }
  function openSheet() { if (!sheet) return; lastFocus = doc.activeElement; sheet.classList.add('is-open'); sheet.setAttribute('aria-hidden', 'false'); burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', 'Menü bezárása'); burger.textContent = 'Bezár'; body.classList.add('no-scroll'); if (lenis) lenis.stop(); nav && nav.classList.remove('is-hidden'); body.classList.remove('nav-hidden'); var f = focusables(); if (f.length) f[0].focus(); }
  function closeSheet() { if (!sheet || !sheet.classList.contains('is-open')) return; sheet.classList.remove('is-open'); sheet.setAttribute('aria-hidden', 'true'); burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Menü megnyitása'); burger.textContent = 'Menü'; body.classList.remove('no-scroll'); if (lenis) lenis.start(); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  if (burger && sheet) {
    burger.addEventListener('click', function () { sheet.classList.contains('is-open') ? closeSheet() : openSheet(); });
    sheet.addEventListener('keydown', function (e) { if (e.key !== 'Tab') return; var f = focusables(); if (!f.length) return; var first = f[0], last = f[f.length - 1]; if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); burger.focus(); } else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); burger.focus(); } });
    burger.addEventListener('keydown', function (e) { if (e.key === 'Tab' && !e.shiftKey && sheet.classList.contains('is-open')) { var f = focusables(); if (f.length) { e.preventDefault(); f[0].focus(); } } });
    [].forEach.call(sheet.querySelectorAll('a[href]'), function (a) { a.addEventListener('click', closeSheet); });
    addEventListener('resize', function () { if (innerWidth > 900) closeSheet(); });
  }
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closePanels(); closeSheet(); } });
  BP.closeSheet = closeSheet;

  /* ---------- SIGNATURE 1: hero keret-kontrakció (sticky + --p, rAF-lerp) ---------- */
  var keret = doc.querySelector('.hero--keret');
  if (keret && !reduce && innerWidth > 900) {
    var stage = keret.querySelector('.hero__stage'), photo = keret.querySelector('.hero__photo'), cur = 0, target = 0, raf = null;
    function calc() { var range = keret.offsetHeight - stage.offsetHeight; var top = keret.getBoundingClientRect().top; target = range > 0 ? Math.min(1, Math.max(0, (NAV() - top) / range)) : 0; }
    function frame() { cur += (target - cur) * 0.14; if (Math.abs(target - cur) < 0.0008) cur = target; photo.style.setProperty('--p', cur.toFixed(4)); if (cur !== target) raf = requestAnimationFrame(frame); else raf = null; }
    function kick() { calc(); if (!raf) raf = requestAnimationFrame(frame); }
    addEventListener('scroll', kick, { passive: true }); addEventListener('resize', kick); kick();
  }

  /* ---------- SIGNATURE 2: forgó szó (csak látható állapotban, reduced alatt statikus) ---------- */
  [].forEach.call(doc.querySelectorAll('.rot[data-words]'), function (el) {
    if (reduce) return;
    var words = el.dataset.words.split('|'), i = Math.max(0, words.indexOf(el.textContent.trim())), timer = null;
    function start() { if (timer) return; timer = setInterval(function () { el.classList.add('is-out'); setTimeout(function () { i = (i + 1) % words.length; el.textContent = words[i]; el.classList.remove('is-out'); }, 220); }, 2600); }
    function stop() { clearInterval(timer); timer = null; }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { es.forEach(function (e) { e.isIntersecting ? start() : stop(); }); }).observe(el); else start();
  });

  /* ---------- kollázs-hero: egér-parallax (csak finom pointer, mozgással) ---------- */
  var collage = doc.querySelector('.hero--collage');
  if (collage && fine && !reduce) {
    var figs = [].slice.call(collage.querySelectorAll('figure')), cx = 0, cy = 0, tx = 0, ty = 0, craf = null;
    collage.addEventListener('mousemove', function (e) { var r = collage.getBoundingClientRect(); tx = (e.clientX - r.left - r.width / 2) / 40; ty = (e.clientY - r.top - r.height / 2) / 40; if (!craf) craf = requestAnimationFrame(cframe); });
    collage.addEventListener('mouseleave', function () { tx = 0; ty = 0; if (!craf) craf = requestAnimationFrame(cframe); });
    function cframe() { cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12; figs.forEach(function (f) { f.style.setProperty('--mx', cx.toFixed(2)); f.style.setProperty('--my', cy.toFixed(2)); }); if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) craf = requestAnimationFrame(cframe); else craf = null; }
  }

  /* ---------- fotósor: húzható vízszintes görgetés (natív scroll marad az alap) ---------- */
  [].forEach.call(doc.querySelectorAll('.row-scroll'), function (row) {
    var down = false, sx = 0, sl = 0, moved = false;
    row.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = row.scrollLeft; row.classList.add('is-drag'); row.setPointerCapture(e.pointerId); });
    row.addEventListener('pointermove', function (e) { if (!down) return; var dx = e.clientX - sx; if (Math.abs(dx) > 3) moved = true; row.scrollLeft = sl - dx; });
    function up() { down = false; row.classList.remove('is-drag'); }
    row.addEventListener('pointerup', up); row.addEventListener('pointercancel', up);
    row.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
  });

  /* ---------- madlib: a select a kiválasztott opció szélességére áll ---------- */
  var fits = [];
  [].forEach.call(doc.querySelectorAll('.madlib select'), function (s) {
    var cv = doc.createElement('canvas').getContext('2d');
    function fit() { var cs = getComputedStyle(s); cv.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily; var t = s.options[s.selectedIndex] ? s.options[s.selectedIndex].text : ''; s.style.width = Math.ceil(cv.measureText(t).width + parseFloat(cs.fontSize) * 1.3) + 'px'; }
    fits.push(fit); s.addEventListener('change', fit); if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(fit); addEventListener('resize', fit); fit();
  });

  /* ---------- regiszter: szűrő (select + URL), Névsor/Arcok kapcsoló, számláló, üres állapot ---------- */
  var reg = doc.querySelector('.reg');
  if (reg) {
    var rows = [].slice.call(reg.querySelectorAll('.idx__row')), faces = [].slice.call(reg.querySelectorAll('.face'));
    var selects = [].slice.call(doc.querySelectorAll('select[data-filter]')), countEls = [].slice.call(doc.querySelectorAll('[data-reg-count]'));
    var resetBtns = [].slice.call(doc.querySelectorAll('[data-reg-reset]')), segBtns = [].slice.call(doc.querySelectorAll('button[data-view]'));
    var active = {}, KEYS = ['kinek', 'miben', 'forma', 'mod', 'nyelv', 'ar', 'szerep'];
    function match(el) { var ok = true; KEYS.forEach(function (k) { if (!active[k]) return; if ((el.dataset[k] || '').split('|').indexOf(active[k]) < 0) ok = false; }); return ok; }
    function apply(push) {
      var n = 0;
      rows.forEach(function (r) { var ok = match(r); r.classList.toggle('is-hidden', !ok); if (ok) n++; });
      faces.forEach(function (f) { f.classList.toggle('is-hidden', !match(f)); });
      countEls.forEach(function (c) { c.textContent = n; });
      reg.classList.toggle('is-empty', n === 0);
      var any = KEYS.some(function (k) { return !!active[k]; });
      resetBtns.forEach(function (b) { b.hidden = !any; });
      selects.forEach(function (s) { var v = active[s.dataset.filter] || ''; if (s.value !== v) s.value = v; });
      fits.forEach(function (f) { f(); });
      if (push && /^https?:/.test(location.protocol)) { try { var p = new URLSearchParams(); KEYS.forEach(function (k) { if (active[k]) p.set(k, active[k]); }); if (reg.dataset.view === 'arcok') p.set('nezet', 'arcok'); var qs = p.toString(); history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash); } catch (e) {} }
    }
    selects.forEach(function (s) { s.addEventListener('change', function () { active[s.dataset.filter] = s.value || null; apply(true); }); });
    resetBtns.forEach(function (b) { b.addEventListener('click', function () { active = {}; apply(true); }); });
    KEYS.forEach(function (k) { if (q.get(k)) active[k] = q.get(k); });
    var view = null; try { view = localStorage.getItem('bp3-view'); } catch (e) {}
    if (q.get('nezet')) view = q.get('nezet');
    function setView(v) { reg.dataset.view = v; segBtns.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.view === v ? 'true' : 'false'); }); try { localStorage.setItem('bp3-view', v); } catch (e) {} }
    segBtns.forEach(function (b) { b.addEventListener('click', function () { setView(b.dataset.view); apply(true); }); });
    setView(view === 'arcok' ? 'arcok' : 'nevsor');
    apply(false);
  }

  /* ---------- story: sticky kép vált a lépésnél (data-img) ---------- */
  var story = doc.querySelector('.story');
  if (story && 'IntersectionObserver' in window) {
    var imgs = [].slice.call(story.querySelectorAll('.story__media img')); if (imgs.length) imgs[0].classList.add('is-on');
    var sio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (!e.isIntersecting) return; var id = e.target.dataset.img; if (!id || reduce) return; imgs.forEach(function (im) { im.classList.toggle('is-on', im.dataset.id === id); }); }); }, { rootMargin: '-40% 0px -40% 0px' });
    [].forEach.call(story.querySelectorAll('.step[data-img]'), function (s) { sio.observe(s); });
  }

  /* ---------- GYIK: kereső + mélylink ---------- */
  var faqSearch = doc.querySelector('[data-faq-search]');
  if (faqSearch) {
    var items = [].slice.call(doc.querySelectorAll('.faq__item')), groups = [].slice.call(doc.querySelectorAll('.faq__group')), fc = doc.querySelector('[data-faq-count]');
    var norm = function (s) { return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); };
    faqSearch.addEventListener('input', function () {
      var t = norm(faqSearch.value.trim()), n = 0;
      items.forEach(function (it) { var ok = !t || norm(it.textContent).indexOf(t) >= 0; it.hidden = !ok; if (ok) n++; if (t && ok) it.open = true; });
      groups.forEach(function (g) { g.hidden = ![].some.call(g.querySelectorAll('.faq__item'), function (it) { return !it.hidden; }); });
      if (fc) fc.textContent = n;
    });
  }
  if (location.hash) { try { var tgt = doc.querySelector(location.hash); if (tgt && tgt.tagName === 'DETAILS') tgt.open = true; } catch (e) {} }

  /* ---------- űrlap: Web3Forms, kulcs nélkül mailto ---------- */
  var form = doc.querySelector('form[data-bp-form]');
  if (form) {
    var msg = form.querySelector('.form__msg'), submitBtn = form.querySelector('[type="submit"]');
    var pre = q.get('szakember'), sel = form.querySelector('select[name="szakember"]');
    if (pre && sel) [].some.call(sel.options, function (o) { if (o.value === pre) { sel.value = pre; return true; } return false; });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var hp = form.querySelector('.hp input'); if (hp && hp.value) return;
      var consent = form.querySelector('input[name="hozzajarulas"]');
      if (consent && !consent.checked) { if (msg) msg.textContent = 'Kérjük, jelölje be az adatkezelési hozzájárulást.'; consent.focus(); return; }
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var data = new FormData(form);
      if (!CONFIG.web3formsKey) {
        var lines = []; data.forEach(function (v, k) { if (k === 'botcheck' || k === 'hozzajarulas' || !v) return; lines.push(k + ': ' + v); });
        location.href = 'mailto:' + CONFIG.mailto + '?subject=' + encodeURIComponent('Időpontkérés a weboldalról') + '&body=' + encodeURIComponent(lines.join('\n'));
        if (msg) msg.textContent = 'Megnyílik a levelezője a kitöltött üzenettel. Ha nem nyílik meg, hívjon: ' + CONFIG.phone + '.';
        return;
      }
      data.append('access_key', CONFIG.web3formsKey); data.append('subject', 'Időpontkérés a weboldalról'); data.append('from_name', 'budaipszichologus.hu');
      if (submitBtn) submitBtn.disabled = true; if (msg) msg.textContent = 'Küldés folyamatban';
      fetch('https://api.web3forms.com/submit', { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json(); })
        .then(function (j) { if (!j.success) throw new Error('web3forms'); form.reset(); if (msg) msg.textContent = 'Köszönjük. Ügyfélszolgálatunk hétköznap 9 és 15 óra között visszahívja.'; })
        .catch(function () { if (msg) msg.textContent = 'Nem sikerült elküldeni. Hívjon: ' + CONFIG.phone + ', vagy írjon: ' + CONFIG.mailto; })
        .then(function () { if (submitBtn) submitBtn.disabled = false; });
    });
  }

  /* ---------- tiszta URL http(s) alatt (file:// alatt marad a .html) ---------- */
  if (/^https?:/.test(location.protocol)) {
    [].forEach.call(doc.querySelectorAll('a[href]'), function (a) {
      var h = a.getAttribute('href'); if (/^(https?:|mailto:|tel:|#)/.test(h)) return;
      var m = h.match(/^(.*?)([^\/?#]*)\.html(\?[^#]*)?(#.*)?$/); if (!m) return;
      var out = m[1] + (m[2] === 'index' ? '' : m[2]) + (m[3] || '') + (m[4] || '');
      a.setAttribute('href', out === '' ? './' : out);
    });
  }

  /* ---------- mérő-sáv (?qa=1) ---------- */
  var m = doc.querySelector('.measure');
  if (m && hero) { var measure = function () { var hh = (hero.querySelector('.hero__stage') || hero).getBoundingClientRect().height; m.textContent = 'viewport ' + innerWidth + 'x' + innerHeight + ' hero ' + Math.round(hh) + 'px ' + (hh <= innerHeight - NAV() + 1 ? 'OK' : 'TULLOG') + ' motion ' + (reduce ? 'REDUCED' : 'on') + ' gsap ' + (window.gsap ? 'ok' : 'nincs'); }; measure(); addEventListener('resize', measure); }
})();
