/* GFT SYNERGY — wspólne skrypty: nawigacja, reveal, koszyk (mock na localStorage) */
(function () {
  'use strict';

  /* ---------- mobile nav (pełny ekran) ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('mainnav');
  if (toggle && nav) {
    var setNavState = function (open) {
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open);
      toggle.textContent = open ? '✕' : '☰';
      document.body.classList.toggle('nav-locked', open);
    };
    toggle.addEventListener('click', function () {
      setNavState(!nav.classList.contains('open'));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { setNavState(false); }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 960) { setNavState(false); }
    });
  }

  /* ---------- reveal on scroll ---------- */
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* hero video: nie odtwarzaj przy ograniczonym ruchu */
  var heroVid = document.querySelector('.hero-video');
  if (heroVid && reduced) {
    heroVid.removeAttribute('autoplay');
    heroVid.pause();
  }
  var reveals = document.querySelectorAll('.reveal');
  if (!reduced && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- koszyk (mock) ---------- */
  var KEY = 'gftCart';

  function readCart() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch (e) { return []; }
  }
  function writeCart(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    renderBadge();
  }
  function renderBadge() {
    var n = readCart().reduce(function (s, i) { return s + i.qty; }, 0);
    document.querySelectorAll('.cart-count').forEach(function (b) {
      b.textContent = n > 0 ? String(n) : '';
    });
  }
  function addToCart(item) {
    var items = readCart();
    var hit = items.find(function (i) { return i.id === item.id && i.variant === item.variant; });
    if (hit) { hit.qty += item.qty || 1; }
    else { items.push({ id: item.id, name: item.name, variant: item.variant || '', price: item.price, img: item.img || '', qty: item.qty || 1 }); }
    writeCart(items);
  }
  function money(v) {
    return v.toLocaleString('pl-PL', { minimumFractionDigits: 0 }) + ' zł';
  }

  window.GFT = { readCart: readCart, writeCart: writeCart, addToCart: addToCart, money: money, renderBadge: renderBadge };

  /* przyciski [data-add-to-cart] — dane z data-atrybutów */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-add-to-cart]');
    if (!btn) return;
    e.preventDefault();
    var variant = '';
    var sel = document.querySelectorAll('.pdp-info select, #variants select');
    sel.forEach(function (s) {
      var v = s.options[s.selectedIndex].text.split('—')[0].trim();
      variant += (variant ? ' / ' : '') + v;
    });
    addToCart({
      id: btn.dataset.id,
      name: btn.dataset.name,
      price: parseInt(btn.dataset.price, 10),
      img: btn.dataset.img || '',
      variant: btn.dataset.variant !== undefined ? btn.dataset.variant : variant
    });
    var prev = btn.innerHTML;
    btn.innerHTML = 'Dodano do koszyka ✓';
    setTimeout(function () { btn.innerHTML = prev; }, 1600);
  });

  /* ---------- galeria PDP ---------- */
  var main = document.getElementById('mainImg');
  if (main) {
    document.querySelectorAll('.pdp-thumbs button').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('.pdp-thumbs button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        main.src = b.dataset.src;
        main.alt = b.dataset.alt;
      });
    });
  }

  /* ---------- taby (moje konto) ---------- */
  document.querySelectorAll('.acc-tabs').forEach(function (tabs) {
    tabs.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      tabs.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-selected', 'false'); });
      b.setAttribute('aria-selected', 'true');
      document.querySelectorAll('[data-tab-panel]').forEach(function (p) {
        p.hidden = p.dataset.tabPanel !== b.dataset.tab;
      });
    });
  });

  renderBadge();

  /* ---------- hero cinema: prezentacja wbudowana jako hero strony głównej ---------- */
  var cinema = document.getElementById('heroCinema');
  if (cinema) {
    var segments = [
      {
        src: 'img/feature-octamolle.mp4',
        poster: 'img/warbelt-worn.webp',
        badge: 'Octamolle',
        line: 'Montaż ładownic pod kątem — kąt jest częścią panelu, nie dodatkową warstwą.'
      },
      {
        src: 'img/feature-konfiguracja.mp4',
        poster: 'img/warbelt-layers.webp',
        badge: 'Szybka konfiguracja',
        line: 'Range belt → war belt w około 60 sekund, bez rozbierania całego pasa.'
      },
      {
        src: 'img/feature-komfort.mp4',
        poster: 'img/warbelt-front.webp',
        badge: 'Komfort noszenia',
        line: 'Rozkład nacisku na biodra to parametr projektowy — sport, służba, wojsko.'
      },
      {
        src: 'img/feature-modulowosc.mp4',
        poster: 'img/warbelt-loadout.webp',
        badge: 'Pełny loadout',
        line: 'Kabura, ładownice, worek na odzysk — w układzie, który sam wybierasz.'
      }
    ];

    var vids = [document.getElementById('hcVidA'), document.getElementById('hcVidB')];
    var timeline = document.getElementById('hcTimeline');
    var featureHost = document.getElementById('hcFeatureHost');
    var cReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var current = 0;
    var seg = 0;
    var rafId = null;

    segments.forEach(function (s, i) {
      var b = document.createElement('button');
      b.className = 'hc-chapter';
      b.type = 'button';
      b.innerHTML = '<span class="track"><span class="fill"></span></span><span class="lbl">' + s.badge + '</span>';
      b.addEventListener('click', function () { playSegment(i); });
      timeline.appendChild(b);

      var f = document.createElement('div');
      f.className = 'hc-feature-inner';
      f.innerHTML = '<span class="hc-num">' + ('0' + (i + 1)).slice(-2) + ' / 0' + segments.length + '</span><span class="hc-badge">' + s.badge + '</span><p class="hc-line">' + s.line + '</p>';
      featureHost.appendChild(f);
    });
    var chapters = timeline.querySelectorAll('.hc-chapter');
    var features = featureHost.querySelectorAll('.hc-feature-inner');

    function setActiveUI(i) {
      features.forEach(function (f, idx) { f.classList.toggle('active', idx === i); });
      chapters.forEach(function (c, idx) {
        c.classList.toggle('active', idx === i);
        c.classList.toggle('done', idx < i);
        var fill = c.querySelector('.fill');
        if (idx < i) fill.style.width = '100%';
        if (idx > i) fill.style.width = '0%';
      });
    }

    function playSegment(i) {
      seg = i;
      var next = (current + 1) % 2;
      var vNext = vids[next];
      var vPrev = vids[current];
      vNext.src = segments[i].src;
      vNext.poster = segments[i].poster;
      vNext.muted = true;
      vNext.currentTime = 0;
      var p = vNext.play();
      if (p && p.catch) p.catch(function () {});
      vNext.classList.add('active');
      vPrev.classList.remove('active');
      current = next;
      setActiveUI(i);
      if (!cReduced) tickProgress();
      var nextIdx = (i + 1) % segments.length;
      var vFuture = vids[(current + 1) % 2];
      vFuture.src = segments[nextIdx].src;
      vFuture.poster = segments[nextIdx].poster;
      vFuture.load();
    }

    function tickProgress() {
      cancelAnimationFrame(rafId);
      var v = vids[current];
      function step() {
        var dur = v.duration && isFinite(v.duration) ? v.duration : 5;
        var pct = Math.min(100, (v.currentTime / dur) * 100);
        var fill = chapters[seg].querySelector('.fill');
        fill.style.transitionDuration = '0s';
        fill.style.width = pct + '%';
        if (v.currentTime >= dur - 0.12 && dur > 0.5) {
          playSegment((seg + 1) % segments.length);
          return;
        }
        rafId = requestAnimationFrame(step);
      }
      rafId = requestAnimationFrame(step);
    }

    setActiveUI(0);
    if (cReduced) {
      // bez auto-postępu: statyczna pierwsza klatka, użytkownik przełącza rozdziały ręcznie
      vids[0].poster = segments[0].poster;
    } else {
      playSegment(0);
    }
  }
})();
