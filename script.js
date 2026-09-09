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

    if (introSeen) communityIntro.classList.add('is-repeat');

    let introFinished = false;
    const finishCommunityIntro = () => {
      if (introFinished) return;
      introFinished = true;
      communityIntro.classList.add('is-complete');
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


  /* =========================================================
     13. EVENT GALLERY CONTROLLER & REST API CLIENT
  ========================================================= */
  let galleryItems = [];
  let currentFilter = 'all';
  let activeLightboxIndex = 0;

  const galleryGrid = document.getElementById('galleryGrid');
  const galleryFilters = document.getElementById('galleryFilters');
  const galleryUploadModal = document.getElementById('galleryUploadModal');
  const openGalleryUploadBtn = document.getElementById('openGalleryUploadBtn');
  const gumClose = document.getElementById('gumClose');
  const gumBackdrop = document.getElementById('gumBackdrop');
  const gumCancelBtn = document.getElementById('gumCancelBtn');
  const galleryUploadForm = document.getElementById('galleryUploadForm');
  const gumDropzone = document.getElementById('gumDropzone');
  const gumFileInput = document.getElementById('gumFileInput');
  const gumPreview = document.getElementById('gumPreview');
  const gumPreviewImg = document.getElementById('gumPreviewImg');
  const gumRemoveImgBtn = document.getElementById('gumRemoveImgBtn');
  const gumDropzoneInner = document.getElementById('gumDropzoneInner');

  const galleryLightbox = document.getElementById('galleryLightbox');
  const glbBackdrop = document.getElementById('glbBackdrop');
  const glbClose = document.getElementById('glbClose');
  const glbPrev = document.getElementById('glbPrev');
  const glbNext = document.getElementById('glbNext');
  const glbImg = document.getElementById('glbImg');
  const glbBadge = document.getElementById('glbBadge');
  const glbDate = document.getElementById('glbDate');
  const glbLocation = document.getElementById('glbLocation');
  const glbTitle = document.getElementById('glbTitle');
  const glbCaption = document.getElementById('glbCaption');

  let uploadedBase64 = '';

  // Initial seed fallback if running statically / offline
  const fallbackGallerySeed = [{"id":"gal-1","title":"AWS Cloud Practitioner Kickoff & Roadmap","category":"workshops","categoryLabel":"Workshop","date":"2026-02-24","dateFormatted":"Feb 24, 2026","location":"Auditorium, SBJITMR","caption":"Student builders gathered for an in-depth orientation on AWS architecture, certification tracks, and building cloud fundamentals.","imageUrl":"https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80","createdAt":"2026-02-24T10:00:00.000Z"},{"id":"gal-2","title":"Hands-on GenAI with Amazon Bedrock","category":"workshops","categoryLabel":"Workshop","date":"2026-02-12","dateFormatted":"Feb 12, 2026","location":"Cloud Computing Lab 402","caption":"Deep dive into foundation models, prompt engineering, and building agentic workflows on Amazon Bedrock.","imageUrl":"https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80","createdAt":"2026-02-12T14:30:00.000Z"},{"id":"gal-3","title":"SB Jain Cloud Builder Hackathon 2026","category":"hackathons","categoryLabel":"Hackathon","date":"2026-01-20","dateFormatted":"Jan 20, 2026","location":"Innovation Center, SBJITMR","caption":"24-hour non-stop cloud challenge where student teams built scalable, serverless full-stack web applications.","imageUrl":"https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80","createdAt":"2026-01-20T09:00:00.000Z"},{"id":"gal-4","title":"Central India AWS Community Day Connect","category":"community-day","categoryLabel":"Community Day","date":"2026-01-05","dateFormatted":"Jan 05, 2026","location":"Main Seminar Hall","caption":"Keynote discussions with AWS Community Builders and industry solutions architects on career pathways in cloud and DevOps.","imageUrl":"https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80","createdAt":"2026-01-05T11:00:00.000Z"},{"id":"gal-5","title":"AWS Student Builder Group Core Team Meetup","category":"meetups","categoryLabel":"Campus Meetup","date":"2025-12-15","dateFormatted":"Dec 15, 2025","location":"Department Conference Room","caption":"Brainstorming session aligning event roadmaps, workshop schedules, and student mentor programs for the upcoming semester.","imageUrl":"https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80","createdAt":"2025-12-15T15:00:00.000Z"},{"id":"gal-6","title":"Serverless Architecture & Lambda Microservices","category":"workshops","categoryLabel":"Workshop","date":"2025-11-28","dateFormatted":"Nov 28, 2025","location":"CSE Lab 2","caption":"Practical demonstration on event-driven architecture using AWS Lambda, API Gateway, and DynamoDB.","imageUrl":"https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80","createdAt":"2025-11-28T13:30:00.000Z"}];

  async function fetchGallery() {
    try {
      const res = await fetch('/api/gallery');
      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();
      galleryItems = data.items || [];
      // Cache in localStorage for offline resilience
      localStorage.setItem('sbj_aws_gallery', JSON.stringify(galleryItems));
    } catch (err) {
      console.warn('[Gallery] Offline / API unavailable, falling back to local storage or seed data:', err);
      const cached = localStorage.getItem('sbj_aws_gallery');
      galleryItems = cached ? JSON.parse(cached) : fallbackGallerySeed;
    }
    updateFilterCounts();
    renderGallery();
  }

  function updateFilterCounts() {
    const counts = {
      all: galleryItems.length,
      workshops: 0,
      hackathons: 0,
      'community-day': 0,
      meetups: 0
    };

    galleryItems.forEach(item => {
      if (counts[item.category] !== undefined) {
        counts[item.category]++;
      }
    });

    const elAll = document.getElementById('countAll');
    const elWorkshops = document.getElementById('countWorkshops');
    const elHackathons = document.getElementById('countHackathons');
    const elCommunityDay = document.getElementById('countCommunityDay');
    const elMeetups = document.getElementById('countMeetups');

    if (elAll) elAll.textContent = counts.all;
    if (elWorkshops) elWorkshops.textContent = counts.workshops;
    if (elHackathons) elHackathons.textContent = counts.hackathons;
    if (elCommunityDay) elCommunityDay.textContent = counts['community-day'];
    if (elMeetups) elMeetups.textContent = counts.meetups;
  }

  function getFilteredItems() {
    if (currentFilter === 'all') return galleryItems;
    return galleryItems.filter(item => item.category === currentFilter);
  }

  function renderGallery() {
    if (!galleryGrid) return;
    const filtered = getFilteredItems();

    if (filtered.length === 0) {
      galleryGrid.innerHTML = `
        <div class="gallery-loading">
          <p style="font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 4px;">No photos found in this category</p>
          <span style="font-size: 13px; color: var(--txt-dim);">Click "+ Add Event Photo" to share the first moment!</span>
        </div>
      `;
      return;
    }

    galleryGrid.innerHTML = filtered.map((item, index) => {
      const escape = str => (str || '').replace(/"/g, '&quot;');
      return `
        <article class="gallery-card" data-id="${item.id}" data-index="${index}">
          <div class="gc-media">
            <img class="gc-img" src="${escape(item.imageUrl)}" alt="${escape(item.title)}" loading="lazy">
            <span class="gc-overlay-badge">${escape(item.categoryLabel || item.category)}</span>
            <span class="gc-overlay-date">${escape(item.dateFormatted || item.date)}</span>
          </div>
          <div class="gc-body">
            <span class="gc-location">📍 ${escape(item.location || 'SBJITMR Nagpur')}</span>
            <h3 class="gc-title">${escape(item.title)}</h3>
            <p class="gc-caption">${escape(item.caption || '')}</p>
            <div class="gc-footer">
              <span class="gc-view-btn">View Fullscreen ↗</span>
              <button class="gc-del-btn" data-delete-id="${item.id}" title="Delete photo" type="button" aria-label="Delete photo">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Attach click events
    galleryGrid.querySelectorAll('.gallery-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // If delete button clicked, handle delete
        const delBtn = e.target.closest('.gc-del-btn');
        if (delBtn) {
          e.stopPropagation();
          const delId = delBtn.getAttribute('data-delete-id');
          handleDeletePhoto(delId);
          return;
        }

        const idx = parseInt(card.getAttribute('data-index'), 10);
        openLightbox(idx);
      });
    });
  }

  // Filter tabs
  galleryFilters?.addEventListener('click', (e) => {
    const btn = e.target.closest('.gallery-filter-btn');
    if (!btn) return;

    galleryFilters.querySelectorAll('.gallery-filter-btn').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });

    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    currentFilter = btn.getAttribute('data-filter') || 'all';
    renderGallery();
  });

  /* ----------------------------------------------------
     LIGHTBOX VIEWER LOGIC
  ---------------------------------------------------- */
  function openLightbox(index) {
    const filtered = getFilteredItems();
    if (!filtered[index]) return;
    activeLightboxIndex = index;
    updateLightboxContent();
    galleryLightbox?.classList.add('is-open');
    galleryLightbox?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    galleryLightbox?.classList.remove('is-open');
    galleryLightbox?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function updateLightboxContent() {
    const filtered = getFilteredItems();
    const item = filtered[activeLightboxIndex];
    if (!item) return;

    if (glbImg) glbImg.src = item.imageUrl;
    if (glbBadge) glbBadge.textContent = item.categoryLabel || item.category;
    if (glbDate) glbDate.textContent = item.dateFormatted || item.date;
    if (glbLocation) glbLocation.textContent = '📍 ' + (item.location || 'SB Jain Nagpur');
    if (glbTitle) glbTitle.textContent = item.title;
    if (glbCaption) glbCaption.textContent = item.caption || '';
  }

  glbClose?.addEventListener('click', closeLightbox);
  glbBackdrop?.addEventListener('click', closeLightbox);

  glbPrev?.addEventListener('click', () => {
    const filtered = getFilteredItems();
    activeLightboxIndex = (activeLightboxIndex - 1 + filtered.length) % filtered.length;
    updateLightboxContent();
  });

  glbNext?.addEventListener('click', () => {
    const filtered = getFilteredItems();
    activeLightboxIndex = (activeLightboxIndex + 1) % filtered.length;
    updateLightboxContent();
  });

  window.addEventListener('keydown', (e) => {
    if (galleryLightbox?.classList.contains('is-open')) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') glbPrev?.click();
      if (e.key === 'ArrowRight') glbNext?.click();
    }
  });

  /* ----------------------------------------------------
     ADD / UPLOAD PHOTO MODAL LOGIC
  ---------------------------------------------------- */
  function openUploadModal() {
    galleryUploadModal?.classList.add('is-open');
    galleryUploadModal?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // Set today's date default
    const gumDate = document.getElementById('gumDate');
    if (gumDate && !gumDate.value) {
      gumDate.value = new Date().toISOString().slice(0, 10);
    }
  }

  function closeUploadModal() {
    galleryUploadModal?.classList.remove('is-open');
    galleryUploadModal?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    resetUploadForm();
  }

  function resetUploadForm() {
    galleryUploadForm?.reset();
    uploadedBase64 = '';
    if (gumPreview) gumPreview.style.display = 'none';
    if (gumDropzoneInner) gumDropzoneInner.style.display = 'block';
  }

  openGalleryUploadBtn?.addEventListener('click', openUploadModal);
  gumClose?.addEventListener('click', closeUploadModal);
  gumBackdrop?.addEventListener('click', closeUploadModal);
  gumCancelBtn?.addEventListener('click', closeUploadModal);

  // File dropzone click
  gumDropzone?.addEventListener('click', (e) => {
    if (e.target.closest('#gumRemoveImgBtn')) return;
    gumFileInput?.click();
  });

  // File input change
  gumFileInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file);
  });

  // Drag & drop
  gumDropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    gumDropzone.classList.add('drag-over');
  });

  gumDropzone?.addEventListener('dragleave', () => {
    gumDropzone.classList.remove('drag-over');
  });

  gumDropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    gumDropzone.classList.remove('drag-over');
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file);
    }
  });

  function processImageFile(file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      uploadedBase64 = ev.target.result;
      if (gumPreviewImg) gumPreviewImg.src = uploadedBase64;
      if (gumPreview) gumPreview.style.display = 'inline-block';
      if (gumDropzoneInner) gumDropzoneInner.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }

  gumRemoveImgBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    uploadedBase64 = '';
    if (gumFileInput) gumFileInput.value = '';
    if (gumPreview) gumPreview.style.display = 'none';
    if (gumDropzoneInner) gumDropzoneInner.style.display = 'block';
  });

  // Form submit
  galleryUploadForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('gumEventTitle')?.value.trim();
    const categorySelect = document.getElementById('gumCategory');
    const category = categorySelect?.value || 'workshops';
    const categoryLabel = categorySelect?.options[categorySelect.selectedIndex]?.text || 'Workshop';
    const date = document.getElementById('gumDate')?.value;
    const location = document.getElementById('gumLocation')?.value.trim();
    const caption = document.getElementById('gumCaption')?.value.trim();
    const urlInput = document.getElementById('gumUrlInput')?.value.trim();

    if (!title) {
      alert('Please enter an event title.');
      return;
    }

    const submitBtn = document.getElementById('gumSubmitBtn');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Uploading...</span>';
    }

    const payload = {
      title,
      category,
      categoryLabel,
      date,
      location,
      caption,
      imageData: uploadedBase64,
      imageUrl: urlInput || (!uploadedBase64 ? 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80' : '')
    };

    try {
      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.item) {
          galleryItems.unshift(result.item);
          localStorage.setItem('sbj_aws_gallery', JSON.stringify(galleryItems));
        }
      } else {
        throw new Error('Server responded with error');
      }
    } catch (err) {
      console.warn('[Gallery] Offline / server error, saving to local state:', err);
      // Offline fallback item
      const newItem = {
        id: 'gal-local-' + Date.now(),
        title,
        category,
        categoryLabel,
        date: date || new Date().toISOString().slice(0, 10),
        dateFormatted: date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        location: location || 'SB Jain Institute of Technology, Nagpur',
        caption,
        imageUrl: uploadedBase64 || urlInput || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString()
      };
      galleryItems.unshift(newItem);
      localStorage.setItem('sbj_aws_gallery', JSON.stringify(galleryItems));
    }

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }

    closeUploadModal();
    updateFilterCounts();
    renderGallery();
  });

  // Delete photo
  async function handleDeletePhoto(id) {
    if (!confirm('Are you sure you want to delete this event photo from the gallery?')) {
      return;
    }

    try {
      await fetch(`/api/gallery/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('[Gallery] Offline delete fallback:', err);
    }

    galleryItems = galleryItems.filter(it => it.id !== id);
    localStorage.setItem('sbj_aws_gallery', JSON.stringify(galleryItems));
    updateFilterCounts();
    renderGallery();
  }

  // Load gallery immediately
  fetchGallery();


  /* =========================================================
     GALLERY FULLPAGE OVERLAY CONTROLLER
  ========================================================= */
  const galleryFullpage = document.getElementById('galleryFullpage');
  const galleryFullpageClose = document.getElementById('galleryFullpageClose');

  function openGalleryFullpage() {
    if (!galleryFullpage) return;
    galleryFullpage.classList.add('is-open');
    galleryFullpage.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // Fetch latest gallery items
    if (typeof fetchGallery === 'function') {
      fetchGallery();
    }
  }

  function closeGalleryFullpage() {
    if (!galleryFullpage) return;
    galleryFullpage.classList.remove('is-open');
    galleryFullpage.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Open triggers: any link with .open-gallery-link or href="#gallery"
  document.querySelectorAll('a[href="#gallery"], .open-gallery-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      openGalleryFullpage();
    });
  });

  galleryFullpageClose?.addEventListener('click', closeGalleryFullpage);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && galleryFullpage?.classList.contains('is-open')) {
      // If lightbox or upload modal is open, close them first
      if (galleryLightbox?.classList.contains('is-open')) {
        closeLightbox();
        return;
      }
      if (galleryUploadModal?.classList.contains('is-open')) {
        closeUploadModal();
        return;
      }
      closeGalleryFullpage();
    }
  });

});