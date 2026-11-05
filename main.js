/**
 * Atharva Mahamuni Portfolio — Orchestration & Motion Graphics
 * Handles hero entrance, scroll reveals, active nav tracking,
 * stats count-up physics, and card pointer-spotlight coordinates.
 */

(function () {
  'use strict';

  window.__anim = true;
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Hero Stagger Choreography
  var heroKids = document.querySelectorAll('.hero-text > *');
  heroKids.forEach(function (el, i) {
    el.style.transitionDelay = (i * 50) + 'ms';
  });

  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      root.classList.add('ready');
    });
  });

  // 2. Scroll Reveal Observers
  var targets = document.querySelectorAll(
    '.section .eyebrow, .section h2, .job, .card, .edu, .band .eyebrow, .skills > div, .contact > *, .discovery-panel > *'
  );

  targets.forEach(function (el) {
    el.classList.add('reveal');
    var sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
    el.style.transitionDelay = Math.min(sib, 5) * 60 + 'ms';
  });

  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) {
      el.classList.add('in');
    });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          el.classList.add('in');
          io.unobserve(el);
          el.addEventListener('transitionend', function clr(ev) {
            if (ev.target !== el || ev.propertyName !== 'opacity') return;
            el.style.transitionDelay = '';
            el.removeEventListener('transitionend', clr);
          });
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    targets.forEach(function (el) {
      io.observe(el);
    });
  }

  // 3. Header Shadow + Active Nav Highlight
  var nav = document.querySelector('.nav');
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('scrolled', window.scrollY > 12);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  var links = {};
  document.querySelectorAll('.nav nav a[href^="#"]').forEach(function (a) {
    links[a.getAttribute('href').slice(1)] = a;
  });

  if ('IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var a = links[entry.target.id];
        if (!a) return;
        if (entry.isIntersecting) {
          Object.keys(links).forEach(function (k) {
            links[k].classList.remove('active');
          });
          a.classList.add('active');
        }
      });
    }, { rootMargin: '-40% 0px -45% 0px' });

    document.querySelectorAll('main section[id]').forEach(function (s) {
      so.observe(s);
    });
  }

  // 4. Pointer-following spotlight on cards
  var cards = document.querySelectorAll('.card');
  cards.forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var rect = card.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', x + 'px');
      card.style.setProperty('--mouse-y', y + 'px');
    });
  });

  // 5. Statistics Count-up Spring Physics
  // DOM text remains exact final value (4, 10, 3) for screen readers and test assertions.
  if (!reduce) {
    document.querySelectorAll('.stats dt').forEach(function (dt) {
      var end = parseInt(dt.textContent, 10);
      if (!end) return;
      var t0 = null;
      dt.setAttribute('data-count', '0');
      dt.classList.add('counting');

      function step(t) {
        if (!t0) t0 = t;
        var p = Math.min((t - t0) / 1000, 1);
        // Ease-out cubic: 1 - (1 - p)^3
        var val = Math.round(end * (1 - Math.pow(1 - p, 3)));
        dt.setAttribute('data-count', String(val));
        if (p < 1) {
          requestAnimationFrame(step);
        } else {
          dt.classList.remove('counting');
          dt.removeAttribute('data-count');
        }
      }

      setTimeout(function () {
        requestAnimationFrame(step);
      }, 400);
    });
  }
})();
