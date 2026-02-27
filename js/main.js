/* ============================================
   ARABIA INFORM — Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMobileMenu();
  initCounters();
  initHeroMetrics();
  initScrollReveal();
  initTabs();
  initFormValidation();
  initDataLines();
});

/* --- Sticky Navbar --- */
function initNavbar() {
  const header = document.querySelector('.header-wrapper');
  if (!header) return;
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* --- Mobile Menu --- */
function initMobileMenu() {
  const hamburger = document.querySelector('.nav-hamburger');
  const menu = document.querySelector('.nav-menu');
  if (!hamburger || !menu) return;

  hamburger.addEventListener('click', () => {
    menu.classList.toggle('open');
    hamburger.classList.toggle('active');
  });

  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !hamburger.contains(e.target)) {
      menu.classList.remove('open');
      hamburger.classList.remove('active');
    }
  });

  menu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      hamburger.classList.remove('active');
    });
  });
}

/* --- Animated Counters --- */
function initCounters() {
  const counters = document.querySelectorAll('[data-counter]:not(.hero-stats-card [data-counter])');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  counters.forEach(el => observer.observe(el));
}

function animateCounter(el) {
  const target = parseFloat(el.dataset.counter);
  const suffix = el.dataset.suffix || '';
  const prefix = el.dataset.prefix || '';
  const decimals = (target % 1 !== 0) ? 1 : 0;
  const duration = 800;
  const start = performance.now();

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = eased * target;

    el.textContent = prefix + (decimals ? current.toFixed(decimals) : Math.floor(current).toLocaleString()) + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

/* --- Hero Metrics Stagger --- */
function initHeroMetrics() {
  const metrics = document.querySelectorAll('.hero-metric, .stat-item');
  if (!metrics.length) return;

  setTimeout(() => {
    metrics.forEach((metric, i) => {
      setTimeout(() => {
        metric.classList.add('visible');
        const counter = metric.querySelector('[data-counter]');
        if (counter) animateCounter(counter);
      }, i * 300); // 300ms stagger matching flow architecture
    });
  }, 500); // Trigger smoothly after line renders
}

/* --- Scroll Reveal --- */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  reveals.forEach((el, i) => {
    el.style.transitionDelay = `${i % 4 * 0.1}s`;
    observer.observe(el);
  });
}

/* --- Solution Tabs --- */
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  if (!tabBtns.length) return;

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;

      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const panel = document.getElementById(target);
      if (panel) panel.classList.add('active');
    });
  });
}

/* --- Form Validation --- */
function initFormValidation() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    form.querySelectorAll('[required]').forEach(input => {
      const group = input.closest('.form-group');
      if (!input.value.trim()) {
        valid = false;
        input.style.borderColor = '#e74c3c';
        if (group) group.classList.add('error');
      } else {
        input.style.borderColor = '';
        if (group) group.classList.remove('error');
      }
    });

    const email = form.querySelector('input[type="email"]');
    if (email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      valid = false;
      email.style.borderColor = '#e74c3c';
    }

    if (valid) {
      const btn = form.querySelector('button[type="submit"]');
      if (btn) {
        const original = btn.textContent;
        btn.textContent = btn.closest('[dir="rtl"]') ? 'تم الإرسال ✓' : 'Sent Successfully ✓';
        btn.style.background = '#27ae60';
        setTimeout(() => {
          btn.textContent = original;
          btn.style.background = '';
          form.reset();
        }, 3000);
      }
    }
  });
}

/* --- Hero Data Lines --- */
function initDataLines() {
  const container = document.querySelector('.hero-data-lines');
  if (!container) return;

  for (let i = 0; i < 12; i++) {
    const line = document.createElement('div');
    line.className = 'data-line';
    line.style.top = `${Math.random() * 100}%`;
    line.style.width = `${60 + Math.random() * 140}px`;
    line.style.animationDelay = `${Math.random() * 4}s`;
    line.style.animationDuration = `${3 + Math.random() * 3}s`;
    container.appendChild(line);
  }
}

/* --- Language Toggle --- */
function switchLanguage(targetLang) {
  const currentPath = window.location.pathname;
  if (targetLang === 'ar') {
    if (!currentPath.includes('/ar/')) {
      const filename = currentPath.split('/').pop() || 'index.html';
      window.location.href = 'ar/' + filename;
    }
  } else {
    if (currentPath.includes('/ar/')) {
      const filename = currentPath.split('/').pop() || 'index.html';
      window.location.href = '../' + filename;
    }
  }
}
