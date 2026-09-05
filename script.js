/**
 * SB Jain AWS Student Community - Interactive Scripts
 * Styled & architected following AWS Community Day standards
 */

document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.matchMedia('(pointer: coarse)').matches;

  /* =========================================================
     0. PREMIUM AWS COMMUNITY INTRO
  ========================================================= */
  const communityIntro = document.getElementById('communityIntro');
  const communityIntroSkip = document.getElementById('communityIntroSkip');

  if (communityIntro) {
    let introSeen = false;
    try {
      introSeen = sessionStorage.getItem('aws_sbj_intro_seen') === '1';
    } catch (error) {
      introSeen = false;
    }

    document.body.classList.add('community-intro-active');
    if (introSeen) communityIntro.classList.add('is-repeat');

    let introFinished = false;
    const finishCommunityIntro = () => {
      if (introFinished) return;
      introFinished = true;
      communityIntro.classList.add('is-complete');
      document.body.classList.remove('community-intro-active');
      document.body.classList.add('community-intro-ready');
      communityIntro.setAttribute('aria-hidden', 'true');
      try {
        sessionStorage.setItem('aws_sbj_intro_seen', '1');
      } catch (error) {
        // Session storage can be unavailable in privacy-restricted browsers.
      }
      window.setTimeout(() => communityIntro.remove(), 900);
    };

    communityIntroSkip?.addEventListener('click', finishCommunityIntro);
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') finishCommunityIntro();
    }, { once: true });

    const introDuration = reduceMotion ? 120 : (introSeen ? 850 : 3200);
    window.setTimeout(finishCommunityIntro, introDuration);
  }

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
     2. DUAL CUSTOM CURSOR (Fast & Responsive)
  ========================================================= */
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');

  if (isTouch || window.innerWidth <= 768) {
    dot?.remove();
    ring?.remove();
  } else if (dot && ring) {
    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let isVisible = false;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible) {
        ringX = mouseX;
        ringY = mouseY;
        dot.style.opacity = '1';
        ring.style.opacity = '1';
        isVisible = true;
      }

      dot.style.transform = 'translate3d(' + mouseX + 'px, ' + mouseY + 'px, 0) translate(-50%, -50%)';
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      dot.style.opacity = '0';
      ring.style.opacity = '0';
      isVisible = false;
    });

    document.addEventListener('mouseenter', (e) => {
      if (e.clientX > 0 && e.clientY > 0) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        dot.style.opacity = '1';
        ring.style.opacity = '1';
        isVisible = true;
      }
    });

    function animateRing() {
      if (isVisible) {
        ringX += (mouseX - ringX) * 0.55;
        ringY += (mouseY - ringY) * 0.55;
        ring.style.transform = 'translate3d(' + ringX + 'px, ' + ringY + 'px, 0) translate(-50%, -50%)';
      }
      requestAnimationFrame(animateRing);
    }
    requestAnimationFrame(animateRing);

    // Hover detection over interactive elements
    document.addEventListener('mouseover', (e) => {
      const hoverable = e.target.closest('a, button, input, select, .tm-card, .tm-member-card, .tm-leader-card, .pillar, .pt-card, .team-tab-btn, .faq-q');
      if (hoverable) {
        ring.classList.add('hover');
      } else {
        ring.classList.remove('hover');
      }
    });
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


  /* =========================================================
     9. TEAM MEMBER PROFILE PHOTO EDITOR & LOCALSTORAGE
  ========================================================= */
  const teamModal = document.getElementById('teamModal');
  const modalClose = document.getElementById('tmModalClose');
  const modalBackdrop = document.getElementById('tmModalBackdrop');
  const memberSelect = document.getElementById('tmMemberSelect');
  const modalTitle = document.getElementById('tmModalMemberName');
  const previewImg = document.getElementById('tmModalPreviewImg');
  const previewInitials = document.getElementById('tmModalPreviewInitials');
  const fileInput = document.getElementById('tmFileInput');
  const urlInput = document.getElementById('tmUrlInput');
  const saveBtn = document.getElementById('tmSaveBtn');
  const resetBtn = document.getElementById('tmResetBtn');
  const openEditorBtn = document.getElementById('openTeamPhotoEditorBtn');

  // Member initials lookup
  const memberInitialsMap = {
    'hod-faculty': 'AT',
    'sarang-chakole': 'SC',
    'faiz-shaikh': 'FS',
    'neeraj-khapre': 'NK',
    'devanshu-kindarlaey': 'DK',
    'nivedita-nandurkar': 'NN',
    'tanushree-saundarkar': 'TS',
    'sankalp-kadse': 'SK',
    'anshul-motghare': 'AM',
    'pranav-vispute': 'PV',
    'isha-dhok': 'ID',
    'nutan-bhoyar': 'NB',
    'krutika-dhavde': 'KD',
    'jiya-sathawane': 'JS',
    'anmol-chaubey': 'AC',
    'vaishnavi-sathone': 'VS',
    'gauri-sangewar': 'GS',
    'areeba-qureshi': 'AQ',
    'vansh-lute': 'VL',
    'pushkar-meshram': 'PM',
    'shagun-harinkhede': 'SH'
  };

  let currentMemberId = 'sarang-chakole';
  let tempPhotoData = '';

  function getStoredPhotos() {
    try {
      return JSON.parse(localStorage.getItem('aws_sbj_team_photos') || '{}');
    } catch (e) {
      return {};
    }
  }

  function setStoredPhotos(data) {
    try {
      localStorage.setItem('aws_sbj_team_photos', JSON.stringify(data));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  }

  // Render all stored photos on page cards
  function applyStoredPhotos() {
    const photos = getStoredPhotos();
    Object.keys(photos).forEach(id => {
      const avatarEl = document.getElementById('avatar-' + id);
      if (avatarEl && photos[id]) {
        const img = avatarEl.querySelector('.tm-avatar-img');
        const text = avatarEl.querySelector('.tm-avatar-text');
        if (img) {
          img.src = photos[id];
          img.style.display = 'block';
        }
        if (text) text.style.display = 'none';
      }
    });
  }

  applyStoredPhotos();

  function openModalForMember(memberId, memberName) {
    currentMemberId = memberId;
    if (memberSelect) memberSelect.value = memberId;
    if (modalTitle) modalTitle.textContent = memberName || (memberSelect ? memberSelect.options[memberSelect.selectedIndex].text : 'Member');
    
    // Check existing photo
    const photos = getStoredPhotos();
    const existing = photos[memberId];
    tempPhotoData = existing || '';

    if (existing) {
      previewImg.src = existing;
      previewImg.style.display = 'block';
      previewInitials.style.display = 'none';
      if (urlInput && existing.startsWith('http')) urlInput.value = existing;
    } else {
      previewImg.style.display = 'none';
      previewInitials.style.display = 'block';
      previewInitials.textContent = memberInitialsMap[memberId] || 'SB';
      if (urlInput) urlInput.value = '';
    }

    if (fileInput) fileInput.value = '';
    teamModal?.classList.add('is-open');
    teamModal?.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    teamModal?.classList.remove('is-open');
    teamModal?.setAttribute('aria-hidden', 'true');
  }

  // Click listener on all member cards / avatars
  document.querySelectorAll('[data-member-id]').forEach(card => {
    const avatar = card.querySelector('.tm-leader-avatar, .tm-member-avatar');
    if (avatar) {
      avatar.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = card.dataset.memberId;
        const name = card.dataset.memberName;
        openModalForMember(id, name);
      });
    }
  });

  openEditorBtn?.addEventListener('click', () => {
    openModalForMember(memberSelect ? memberSelect.value : 'sarang-chakole');
  });

  memberSelect?.addEventListener('change', () => {
    const selectedOption = memberSelect.options[memberSelect.selectedIndex];
    openModalForMember(memberSelect.value, selectedOption.text);
  });

  modalClose?.addEventListener('click', closeModal);
  modalBackdrop?.addEventListener('click', closeModal);

  // File input change -> read as base64 DataURL
  fileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size exceeds 5MB. Please choose a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        tempPhotoData = event.target.result;
        previewImg.src = tempPhotoData;
        previewImg.style.display = 'block';
        previewInitials.style.display = 'none';
        if (urlInput) urlInput.value = '';
      };
      reader.readAsDataURL(file);
    }
  });

  // URL input change
  urlInput?.addEventListener('input', (e) => {
    const url = e.target.value.trim();
    if (url) {
      tempPhotoData = url;
      previewImg.src = url;
      previewImg.style.display = 'block';
      previewInitials.style.display = 'none';
    }
  });

  // Save button
  saveBtn?.addEventListener('click', () => {
    if (!tempPhotoData) {
      alert('Please select a photo or enter an image URL first.');
      return;
    }

    const photos = getStoredPhotos();
    photos[currentMemberId] = tempPhotoData;
    setStoredPhotos(photos);

    // Update avatar on page immediately
    const avatarEl = document.getElementById('avatar-' + currentMemberId);
    if (avatarEl) {
      const img = avatarEl.querySelector('.tm-avatar-img');
      const text = avatarEl.querySelector('.tm-avatar-text');
      if (img) {
        img.src = tempPhotoData;
        img.style.display = 'block';
      }
      if (text) text.style.display = 'none';
    }

    closeModal();
  });

  // Reset button
  resetBtn?.addEventListener('click', () => {
    const photos = getStoredPhotos();
    delete photos[currentMemberId];
    setStoredPhotos(photos);

    const avatarEl = document.getElementById('avatar-' + currentMemberId);
    if (avatarEl) {
      const img = avatarEl.querySelector('.tm-avatar-img');
      const text = avatarEl.querySelector('.tm-avatar-text');
      if (img) {
        img.src = '';
        img.style.display = 'none';
      }
      if (text) text.style.display = 'block';
    }

    previewImg.style.display = 'none';
    previewInitials.style.display = 'block';
    previewInitials.textContent = memberInitialsMap[currentMemberId] || 'SB';
    tempPhotoData = '';
    if (urlInput) urlInput.value = '';
    if (fileInput) fileInput.value = '';

    closeModal();
  });


  /* =========================================================
     10. THEME SWITCHER (Light & Dark Mode)
  ========================================================= */
  const themeToggle = document.getElementById('themeToggle');
  const themeToggleMobile = document.getElementById('themeToggleMobile');
  const logoImgs = document.querySelectorAll('.snav-logo-img');

  function updateLogoForTheme(theme) {
    logoImgs.forEach(img => {
      if (theme === 'light') {
        img.src = 'images/aws-logo-dark.svg?v=2';
      } else {
        img.src = 'images/aws-logo.svg?v=2';
      }
    });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('aws_sbj_theme', theme);
    updateLogoForTheme(theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
  }

  themeToggle?.addEventListener('click', toggleTheme);
  themeToggleMobile?.addEventListener('click', toggleTheme);

  // Initialize theme from storage or preference
  const savedTheme = localStorage.getItem('aws_sbj_theme') || 'dark';
  applyTheme(savedTheme);


  /* =========================================================
     11. FULL PAGE TEAM CONTROLLER
  ========================================================= */
  const teamFullpage = document.getElementById('teamFullpage');
  const teamFpCloseBtn = document.getElementById('teamFpCloseBtn');
  const teamFpCloseIcon = document.getElementById('teamFpCloseIcon');
  const openTeamModalBtn = document.getElementById('openTeamModalBtn');
  const openPhotoEditorFromFp = document.getElementById('openPhotoEditorFromFp');

  function openTeamFullpage() {
    teamFullpage?.classList.add('is-open');
    teamFullpage?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeTeamFullpage() {
    teamFullpage?.classList.remove('is-open');
    teamFullpage?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Intercept all "Team" nav links to open the Full Page Team View
  document.querySelectorAll('a[href="#team"], .open-team-link, .open-team-btn').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      openTeamFullpage();
    });
  });

  openTeamModalBtn?.addEventListener('click', openTeamFullpage);
  teamFpCloseBtn?.addEventListener('click', closeTeamFullpage);
  teamFpCloseIcon?.addEventListener('click', closeTeamFullpage);

  // Close on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && teamFullpage?.classList.contains('is-open')) {
      closeTeamFullpage();
    }
  });

  // Open photo editor from fullpage button
  openPhotoEditorFromFp?.addEventListener('click', () => {
    openModalForMember('hod-faculty', 'Dr. Animesh Tayal (Head of Department · HOD)');
  });

  // Click listeners on all tm-ref-card items to edit photo
  document.querySelectorAll('.tm-ref-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.memberId;
      const name = card.dataset.memberName;
      if (id && name) {
        openModalForMember(id, name);
      }
    });
  });

  // Auto-open if URL hash is #team
  if (window.location.hash === '#team') {
    openTeamFullpage();
  }

  /* =========================================================
     12. EVENTS "COMING SOON" CONTROLLER
  ========================================================= */
  const eventsOverlay = document.getElementById('eventsOverlay');
  const eventsOverlayClose = document.getElementById('eventsOverlayClose');
  const eventsOverlayBackdrop = document.getElementById('eventsOverlayBackdrop');

  function openEventsOverlay() {
    eventsOverlay?.classList.add('is-open');
    eventsOverlay?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeEventsOverlay() {
    eventsOverlay?.classList.remove('is-open');
    eventsOverlay?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Intercept all "Events" links to open the Coming Soon overlay
  document.querySelectorAll('a[href="#events"], .open-events-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      openEventsOverlay();
    });
  });

  eventsOverlayClose?.addEventListener('click', closeEventsOverlay);
  eventsOverlayBackdrop?.addEventListener('click', closeEventsOverlay);

  // Close on Escape
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && eventsOverlay?.classList.contains('is-open')) {
      closeEventsOverlay();
    }
  });

  // Auto-open if URL hash is #events
  if (window.location.hash === '#events') {
    openEventsOverlay();
  }

});
