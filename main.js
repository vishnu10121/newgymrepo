/* ============================================================
   RAJGym — main.js
   Handles: Nav scroll effect, Hamburger menu, Scroll reveal,
            Counter animations, Active nav link
   ============================================================ */

// ── Wait for DOM ──────────────────────────────────────────────
const API_BASE = 'https://rajgym-11si.onrender.com';
document.addEventListener('DOMContentLoaded', () => {

  // ── 1. NAV SCROLL EFFECT ─────────────────────────────────────
  const nav = document.getElementById('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    });
  }

  // ── 2. HAMBURGER MENU ────────────────────────────────────────
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open');
    });

    // Close when any mobile link is clicked
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
      }
    });
  }

  // ── 3. SCROLL REVEAL (Intersection Observer) ─────────────────
  const revealEls = document.querySelectorAll('.reveal');

  if (revealEls.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    revealEls.forEach(el => observer.observe(el));
  }

  // ── 4. COUNTER ANIMATIONS ────────────────────────────────────
  //  Works for both hero-stat-num and .about-stat .num
  function animateCounter(el, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16); // ~60fps
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        start = target;
        clearInterval(timer);
      }
      // Format: numbers >= 1000 get k+, else just integer
      if (target >= 1000) {
        el.textContent = (start / 1000).toFixed(start < target ? 1 : 1) + 'k+';
      } else {
        el.textContent = Math.floor(start) + (el.dataset.suffix || '');
      }
    }, 16);
  }

  // Hero stat counters
  const heroStats = document.querySelectorAll('.hero-stat-num[data-target]');
  if (heroStats.length > 0) {
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = parseInt(entry.target.getAttribute('data-target'));
          animateCounter(entry.target, target);
          statsObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    heroStats.forEach(el => statsObserver.observe(el));
  }

  // About section stat counters
  const aboutNums = document.querySelectorAll('.about-stat .num');
  if (aboutNums.length > 0) {
    const aboutObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const text  = entry.target.textContent.trim();
          const num   = parseFloat(text.replace(/[^0-9.]/g, ''));
          const isK   = text.includes('k');
          const hasPct = text.includes('%');
          const hasPlus = text.includes('+');

          let display = 0;
          const timer = setInterval(() => {
            display += isK ? 0.05 : hasPct ? 1 : 2;
            if (display >= num) {
              display = num;
              clearInterval(timer);
            }
            entry.target.textContent =
              display.toFixed(isK ? 1 : 0) +
              (isK ? 'k' : '') +
              (hasPlus ? '+' : '') +
              (hasPct ? '%' : '');
          }, 30);

          aboutObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });

    aboutNums.forEach(el => aboutObs.observe(el));
  }

  // ── 5. ACTIVE NAV LINK (highlight current page) ───────────────
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('#nav .nav-links a, .mobile-menu a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // ── 6. SMOOTH SCROLL for anchor links ─────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 72;
        const top  = target.getBoundingClientRect().top + window.scrollY - navH;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

});

// ── TOAST NOTIFICATION UTILITY ───────────────────────────────────
// Usage: showToast('Success message', 'success')  or  showToast('Error!', 'error')
window.showToast = function(message, type = 'success', duration = 4000) {
  // Remove existing toast
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-xmark'}"></i>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });

  // Auto remove
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, duration);
};