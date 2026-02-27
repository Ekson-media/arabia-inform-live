/* ============================================================
   ARABIA INFORM — Main JavaScript
   ============================================================ */

'use strict';

/* ─── Navbar scroll effect ─────────────────────────────────── */
(function() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ─── Mobile hamburger ─────────────────────────────────────── */
(function() {
  const hamburger = document.querySelector('.nav-hamburger');
  const menu = document.querySelector('.nav-menu');
  if (!hamburger || !menu) return;

  const closeMenu = () => {
    menu.classList.remove('open');
    document.body.classList.remove('no-scroll');
    hamburger.setAttribute('aria-expanded', 'false');
  };

  hamburger.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    document.body.classList.toggle('no-scroll', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });

  // Close on link click
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  // Close on outside click
  document.addEventListener('click', e => {
    if (!hamburger.contains(e.target) && !menu.contains(e.target)) closeMenu();
  });
})();

/* ─── Animated Counters ────────────────────────────────────── */
function animateCounter(el) {
  const target = parseFloat(el.dataset.target);
  const suffix = el.dataset.suffix || '';
  const prefix = el.dataset.prefix || '';
  const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;
  const duration = 2200;
  const startTime = performance.now();

  const easeOut = t => 1 - Math.pow(1 - t, 3);

  const step = (now) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const value = easeOut(progress) * target;
    el.textContent = prefix + value.toFixed(decimals) + suffix;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = prefix + target.toFixed(decimals) + suffix;
  };
  requestAnimationFrame(step);
}

/* ─── Intersection Observer for counters & fade-ups ─────────── */
(function() {
  const counterEls = document.querySelectorAll('[data-target]');
  const fadeEls = document.querySelectorAll('.fade-up');

  const counterObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.animated) {
        entry.target.dataset.animated = 'true';
        animateCounter(entry.target);
        counterObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  const fadeObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  counterEls.forEach(el => counterObs.observe(el));
  fadeEls.forEach(el => fadeObs.observe(el));
})();

/* ─── Particle Canvas (hero background) ───────────────────── */
(function() {
  const canvas = document.getElementById('hero-particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles;
  const PARTICLE_COUNT = 60;

  const resize = () => {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  };

  const initParticles = () => particles = Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 1.8 + 0.4,
    dx: (Math.random() - 0.5) * 0.3,
    dy: -(Math.random() * 0.4 + 0.1),
    alpha: Math.random() * 0.5 + 0.1,
  }));

  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,158,160,${p.alpha})`;
      ctx.fill();

      p.x += p.dx;
      p.y += p.dy;
      if (p.y < -4) { p.y = H + 4; p.x = Math.random() * W; }
      if (p.x < -4) p.x = W + 4;
      if (p.x > W + 4) p.x = -4;
    });
    requestAnimationFrame(draw);
  };

  resize();
  initParticles();
  draw();
  window.addEventListener('resize', () => { resize(); initParticles(); });
})();

/* ─── Audience Tabs ────────────────────────────────────────── */
(function() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  if (!tabBtns.length) return;

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = document.querySelector(`.tab-panel[data-panel="${target}"]`);
      if (panel) panel.classList.add('active');
    });
  });
})();

/* ─── Language Toggle ──────────────────────────────────────── */
(function() {
  const toggle = document.querySelectorAll('.lang-toggle');
  const htmlEl = document.documentElement;
  const bodyEl = document.body;

  toggle.forEach(btn => {
    btn.addEventListener('click', () => {
      const isAr = bodyEl.classList.toggle('rtl');
      htmlEl.setAttribute('lang', isAr ? 'ar' : 'en');
      htmlEl.setAttribute('dir', isAr ? 'rtl' : 'ltr');
      toggle.forEach(b => b.textContent = isAr ? 'EN' : 'عربي');
    });
  });
})();

/* ─── Progress bars animation ─────────────────────────────── */
(function() {
  const bars = document.querySelectorAll('.prog-bar-fill');
  if (!bars.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        el.style.width = el.dataset.width || '0%';
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.3 });
  bars.forEach(bar => {
    bar.dataset.width = bar.style.width;
    bar.style.width = '0%';
    obs.observe(bar);
  });
})();

/* ─── Smooth active nav link ─────────────────────────────── */
(function() {
  const links = document.querySelectorAll('.nav-link');
  const current = window.location.pathname.split('/').pop() || 'index.html';
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.includes(current)) {
      link.style.color = 'var(--teal)';
    }
  });
})();
