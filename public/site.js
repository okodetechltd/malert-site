// MAlert site: the live trip in the hero, the road that fills as you scroll,
// counters, reveals and the FAQ. No libraries; light enough for a cheap phone.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // ── Contour lines (terrain) behind the hero and the download band ──
  (function contours() {
    var g = $('#contours'); if (!g) return;
    var out = '';
    for (var i = 0; i < 16; i++) {
      var r = 50 + i * 42, pts = [];
      for (var k = 0; k <= 64; k++) {
        var a = (k / 64) * Math.PI * 2;
        var n = 1 + 0.14 * Math.sin(a * 3 + i * 0.5) + 0.08 * Math.sin(a * 5 - i * 0.3) + 0.05 * Math.cos(a * 2 + i);
        pts.push((980 + Math.cos(a) * r * n * 1.25).toFixed(1) + ' ' + (360 + Math.sin(a) * r * n).toFixed(1));
      }
      out += '<path d="M' + pts.join(' L') + 'Z"/>';
    }
    g.innerHTML = out;
  })();

  // ── Header turns solid once you leave the hero ──
  var header = $('.home .site-header');
  function onScrollHeader() { if (header) header.classList.toggle('solid', window.scrollY > 40); }

  // ── The live trip ──
  var trip = $('#trip');
  if (trip) {
    var bike = $('#bike'), A = $('#routeA'), B = $('#routeB');
    var cap = $('#trip-cap'), sos = $('#sos'), bars = $$('.progress i', trip);
    var lenA = A.getTotalLength(), lenB = B.getTotalLength();
    B.style.strokeDasharray = lenB; B.style.strokeDashoffset = lenB;
    var run = 0;

    var steps = [
      { text: 'She presses SOS.', wait: 1500 },
      { text: 'The nearest riders get a call on their phone.', wait: 2300 },
      { text: 'A rider accepts and rides to her.', path: A, len: lenA, dur: 2000 },
      { text: 'The facility sees she is coming and marks Ready.', wait: 1700 },
      { text: 'On the way to the facility.', path: B, len: lenB, dur: 3400, draw: true },
      { text: 'She arrives and gives the rider her drop-off code.', wait: 0 }
    ];

    var place = function (path, len, t) {
      var p = path.getPointAtLength(len * t);
      bike.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')');
    };
    var ease = function (t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
    var sleep = function (ms, id) { return new Promise(function (res) { setTimeout(function () { res(id === run); }, ms); }); };
    var travel = function (s, id) {
      return new Promise(function (res) {
        var t0 = performance.now();
        (function frame(now) {
          if (id !== run) return res(false);
          var t = Math.min(1, (now - t0) / s.dur), e = ease(t);
          place(s.path, s.len, e);
          if (s.draw) B.style.strokeDashoffset = lenB * (1 - e);
          if (t < 1) requestAnimationFrame(frame); else res(true);
        })(t0);
      });
    };
    var show = function (i) {
      trip.className = 'trip s' + i;
      cap.innerHTML = '<span>' + steps[i].text + '</span>';
      bars.forEach(function (b, k) { b.classList.toggle('on', k <= i); });
    };
    var finalState = function () {
      show(5); place(B, lenB, 1); B.style.strokeDashoffset = 0;
      sos.classList.add('idle');
    };

    var play = async function () {
      var id = ++run;
      sos.classList.remove('idle');
      B.style.strokeDashoffset = lenB; place(A, lenA, 0);
      if (reduce) { finalState(); return; }
      for (var i = 0; i < steps.length; i++) {
        show(i);
        var s = steps[i];
        var ok = s.path ? await travel(s, id) : await sleep(s.wait, id);
        if (!ok) return;
      }
      sos.classList.add('idle');
    };
    sos.addEventListener('click', play);

    // Start when the trip is on screen (it is, on load, for most visitors).
    if ('IntersectionObserver' in window) {
      var started = false;
      new IntersectionObserver(function (es, o) {
        if (!started && es[0].isIntersecting) { started = true; o.disconnect(); setTimeout(play, reduce ? 0 : 900); }
      }, { threshold: .4 }).observe(trip);
    } else { finalState(); }
  }

  // ── How a trip works: the road fills as you scroll ──
  var journey = $('#journey'), stops = journey ? $$('li', journey) : [];
  function onScrollJourney() {
    if (!journey) return;
    var r = journey.getBoundingClientRect(), vh = window.innerHeight;
    var p = Math.max(0, Math.min(1, (vh * 0.62 - r.top) / Math.max(1, r.height - 40)));
    if (reduce) p = 1;
    journey.style.setProperty('--p', p.toFixed(4));
    var mark = r.top + 10 + p * (r.height - 60);
    stops.forEach(function (li) { li.classList.toggle('on', li.getBoundingClientRect().top <= mark + 24); });
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { ticking = false; onScrollHeader(); onScrollJourney(); revealFallback(); });
  }, { passive: true });
  window.addEventListener('resize', onScrollJourney);
  onScrollHeader(); onScrollJourney();

  // Backup for browsers where the observer below doesn't fire.
  function revealFallback() {
    var vh = window.innerHeight;
    $$('.rv:not(.in)').forEach(function (el) { if (el.getBoundingClientRect().top < vh * 0.95) el.classList.add('in'); });
  }

  // ── Reveal on scroll, and counters ──
  var countUp = function (el) {
    var to = +el.dataset.count, t0 = performance.now(), dur = 1200;
    if (reduce) return;
    (function f(now) {
      var t = Math.min(1, (now - t0) / dur);
      el.textContent = Math.round(to * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(f);
    })(t0);
  };
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        $$('[data-count]', e.target).forEach(countUp);
        io.unobserve(e.target);
      });
    }, { threshold: .15, rootMargin: '0px 0px -8% 0px' });
    $$('.rv').forEach(function (el, i) {
      // Cards in a row come in one after another.
      if (el.classList.contains('role')) el.style.transitionDelay = ((i % 2) * 0.12) + 's';
      io.observe(el);
    });
  } else { $$('.rv').forEach(function (el) { el.classList.add('in'); }); }

  // ── FAQ: open and close smoothly ──
  $$('.faq details').forEach(function (d) {
    var sum = $('summary', d), ans = $('.ans', d);
    sum.addEventListener('click', function (e) {
      if (reduce || !ans.animate) return;
      e.preventDefault();
      if (!d.open) {
        d.open = true;
        ans.animate([{ height: '0px', opacity: 0 }, { height: ans.scrollHeight + 'px', opacity: 1 }], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' });
      } else {
        var a = ans.animate([{ height: ans.scrollHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 240, easing: 'ease-in' });
        a.onfinish = function () { d.open = false; };
      }
    });
  });
})();
