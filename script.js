/**
 * SB Jain AWS Student Community - Interactive Scripts
 * Styled & architected following AWS Community Day standards
 */

document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(pointer: coarse)').matches;

  /* =========================================================
     1. LIVE COUNTDOWN TIMER
  ========================================================= */
  // Target date for the upcoming SB Jain AWS Community flagship gathering
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 45); // 45 days from now by default
  targetDate.setHours(9, 0, 0, 0);

  const cdDays = document.querySelector('[data-key="d"]');
  const cdHours = document.querySelector('[data-key="h"]');
  const cdMins = document.querySelector('[data-key="m"]');
  const cdSecs = document.querySelector('[data-key="s"]');

  function pad(n) {
    return String(Math.max(0, n)).padStart(2, '0');
  }

  function updateCountdown() {
    const now = new Date().getTime();
    const diff = targetDate.getTime() - now;

    if (diff <= 0) {
      if (cdDays) cdDays.textContent = '00';
      if (cdHours) cdHours.textContent = '00';
      if (cdMins) cdMins.textContent = '00';
      if (cdSecs) cdSecs.textContent = '00';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    if (cdDays) cdDays.textContent = pad(days);
    if (cdHours) cdHours.textContent = pad(hours);
    if (cdMins) cdMins.textContent = pad(mins);
    if (cdSecs) cdSecs.textContent = pad(secs);
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  /* =========================================================
     2. DUAL CUSTOM CURSOR
  ========================================================= */
  if (!isTouch && !reduceMotion) {
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');

    if (dot && ring) {
      let mouseX = window.innerWidth / 2;
      let mouseY = window.innerHeight / 2;
      let ringX = mouseX;
      let ringY = mouseY;
      let isVisible = false;

      window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (!isVisible) {
          dot.classList.add('ready');
          ring.classList.add('ready');
          isVisible = true;
        }
        dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
      }, { passive: true });

      function animateRing() {
        ringX += (mouseX - ringX) * 0.16;
        ringY += (mouseY - ringY) * 0.16;
        ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
        requestAnimationFrame(animateRing);
      }
      requestAnimationFrame(animateRing);

      const hoverables = document.querySelectorAll('a, button, input, .sp-card2, .tm-card, .pt-card, .pillar');
      hoverables.forEach(el => {
        el.addEventListener('mouseenter', () => ring.classList.add('hover'));
        el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
      });
    }
  }

  /* =========================================================
     3. FLOATING RISING PARTICLES
  ========================================================= */
  const particlesContainer = document.getElementById('particles');
  if (particlesContainer && !reduceMotion) {
    const count = 24;
    for (let i = 0; i < count; i++) {
      const span = document.createElement('span');
      span.style.left = `${Math.random() * 100}%`;
      span.style.animationDuration = `${6 + Math.random() * 10}s`;
      span.style.animationDelay = `${Math.random() * 8}s`;
      span.style.width = `${2 + Math.random() * 3}px`;
      span.style.height = span.style.width;
      particlesContainer.appendChild(span);
    }
  }

  /* =========================================================
     4. SCROLL REVEAL OBSERVER
  ========================================================= */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(el => revealObserver.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-visible'));
  }

  /* =========================================================
     5. MOBILE NAVIGATION TOGGLE
  ========================================================= */
  const nav = document.querySelector('.snav');
  const toggle = document.querySelector('.snav-toggle');
  const mobileNav = document.getElementById('snav-mobile-menu');

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      if (mobileNav) mobileNav.setAttribute('aria-hidden', String(!isOpen));
    });

    const mobileLinks = nav.querySelectorAll('.snav-mobile a');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        if (mobileNav) mobileNav.setAttribute('aria-hidden', 'true');
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        if (mobileNav) mobileNav.setAttribute('aria-hidden', 'true');
      }
    });
  }

  /* =========================================================
     6. FAQ ACCORDION
  ========================================================= */
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const btn = item.querySelector('.faq-q');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      faqItems.forEach(other => other.classList.remove('active'));
      if (!isActive) item.classList.add('active');
    });
  });

  /* =========================================================
     7. COMMUNITY BADGE GENERATOR
  ========================================================= */
  const badgeNameInput = document.getElementById('badgeName');
  const badgeRoleInput = document.getElementById('badgeRole');
  const badgePreviewName = document.getElementById('badgePreviewName');
  const badgePreviewRole = document.getElementById('badgePreviewRole');

  if (badgeNameInput && badgePreviewName) {
    badgeNameInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      badgePreviewName.textContent = val || 'Your Name';
    });
  }

  if (badgeRoleInput && badgePreviewRole) {
    badgeRoleInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      badgePreviewRole.textContent = val || 'Student Builder';
    });
  }

  /* =========================================================
     8. TEAM DEPARTMENT FILTER TABS
  ========================================================= */
  const teamTabBtns = document.querySelectorAll('.team-tab-btn');
  const teamDepts = document.querySelectorAll('[data-team-dept]');

  teamTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      teamTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      teamDepts.forEach(dept => {
        if (filter === 'all' || dept.dataset.teamDept === filter) {
          dept.classList.remove('is-hidden');
          dept.style.display = 'block';
        } else {
          dept.classList.add('is-hidden');
          dept.style.display = 'none';
        }
      });
    });
  });

});