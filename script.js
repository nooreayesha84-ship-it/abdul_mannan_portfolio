// ==========================================================
// Abdul Mannan — Portfolio interactions
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Theme toggle (Light default, Dark via localStorage) ---------- */
  const themeToggle = document.getElementById('themeToggle');
  const root = document.documentElement;

  // Re-assert the stored theme here too. This is redundant with the inline
  // <head> script (which exists purely to avoid a flash of the wrong theme),
  // but if that inline script ever gets stripped by a restrictive preview
  // environment, the toggle still ends up in the correct, functional state.
  if (!root.hasAttribute('data-theme')) {
    let stored = null;
    try {
      stored = localStorage.getItem('theme');
    } catch (e) {
      /* localStorage unavailable */
    }
    root.setAttribute('data-theme', stored === 'dark' ? 'dark' : 'light');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = root.getAttribute('data-theme') === 'dark';
      const next = isDark ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try {
        localStorage.setItem('theme', next);
      } catch (e) {
        /* localStorage unavailable (e.g. private browsing) — theme still applies for this session */
      }
    });
  } else {
    console.warn('Theme toggle button (#themeToggle) was not found in the page.');
  }

  /* ---------- Mobile nav toggle ---------- */
  const menuToggle = document.getElementById('menuToggle');
  const navMenu = document.getElementById('navMenu');

  function closeMenu() {
    menuToggle.classList.remove('active');
    navMenu.classList.remove('active');
    menuToggle.setAttribute('aria-expanded', 'false');
  }

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      const isActive = navMenu.classList.toggle('active');
      menuToggle.classList.toggle('active', isActive);
      menuToggle.setAttribute('aria-expanded', String(isActive));
    });
  }

  /* ---------- Smooth scroll with navbar offset ---------- */
  const navbar = document.getElementById('navbar');

  document.querySelectorAll('[data-link]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      const offset = navbar.offsetHeight;
      const top = target.getBoundingClientRect().top + window.pageYOffset - offset + 1;
      window.scrollTo({ top, behavior: 'smooth' });
      closeMenu();
    });
  });

  /* ---------- Active nav link + sliding indicator ---------- */
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));
  const navIndicator = document.getElementById('navIndicator');
  const navLinksList = document.getElementById('navLinks');
  const sections = navLinks
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  function moveIndicator(link) {
    if (!link || !navIndicator || !navLinksList) return;
    const listRect = navLinksList.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    navIndicator.style.left = `${linkRect.left - listRect.left}px`;
    navIndicator.style.width = `${linkRect.width}px`;
  }

  function setActiveLink(id) {
    let matched = null;
    navLinks.forEach(link => {
      const isMatch = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('active', isMatch);
      if (isMatch) matched = link;
    });
    if (matched) moveIndicator(matched);
  }

  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveLink(entry.target.getAttribute('id'));
        }
      });
    },
    { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
  );

  sections.forEach(section => navObserver.observe(section));

  // Initialize indicator position after layout settles
  window.addEventListener('load', () => {
    const activeLink = document.querySelector('.nav-link.active') || navLinks[0];
    moveIndicator(activeLink);
  });
  window.addEventListener('resize', () => {
    const activeLink = document.querySelector('.nav-link.active');
    moveIndicator(activeLink);
  });

  /* ---------- Scroll reveal animation ---------- */
  const revealEls = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('visible'), i * 60);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealEls.forEach(el => revealObserver.observe(el));

  /* ---------- Project filtering ---------- */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');
  const emptyMsg = document.getElementById('emptyMsg');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      let visibleCount = 0;

      projectCards.forEach(card => {
        const categories = (card.getAttribute('data-category') || '').split(' ');
        const match = filter === 'all' || categories.includes(filter);
        card.style.display = match ? '' : 'none';
        if (match) visibleCount++;
      });

      if (emptyMsg) emptyMsg.hidden = visibleCount !== 0;
    });
  });

  /* ---------- Stat counters ---------- */
  const statNumbers = document.querySelectorAll('.stat-number');

  const countObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseFloat(el.getAttribute('data-count'));
        const decimals = parseInt(el.getAttribute('data-decimal') || '0', 10);
        const duration = 1400;
        const start = performance.now();

        function tick(now) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const value = target * eased;
          el.textContent = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
          if (progress < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
        obs.unobserve(el);
      });
    },
    { threshold: 0.4 }
  );

  statNumbers.forEach(el => countObserver.observe(el));

  /* ---------- Navbar shadow on scroll + back-to-top ---------- */
  const backToTop = document.getElementById('backToTop');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
    if (backToTop) backToTop.classList.toggle('visible', window.scrollY > 500);
  });

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Reviews modal ---------- */
  const reviewsBtn = document.getElementById('reviewsBtn');
  const reviewsModal = document.getElementById('reviewsModal');
  const reviewsClose = document.getElementById('reviewsClose');
  const reviewsTrack = document.getElementById('reviewsTrack');
  const reviewsPrev = document.getElementById('reviewsPrev');
  const reviewsNext = document.getElementById('reviewsNext');
  const reviewsCounter = document.getElementById('reviewsCounter');

  if (reviewsBtn && reviewsModal) {
    const reviewCards = reviewsModal.querySelectorAll('.review-card');
    const totalReviews = reviewCards.length;
    let currentReview = 0;
    let lastFocusedEl = null;

    function updateReviewsTrack() {
      reviewsTrack.style.transform = `translateX(-${currentReview * 100}%)`;
      reviewsCounter.textContent = `${currentReview + 1} / ${totalReviews}`;
    }

    function showReview(index) {
      currentReview = (index + totalReviews) % totalReviews;
      updateReviewsTrack();
    }

    function openReviews() {
      lastFocusedEl = document.activeElement;
      reviewsModal.hidden = false;
      // Force layout so the transition runs, then trigger it
      requestAnimationFrame(() => reviewsModal.classList.add('visible'));
      document.body.style.overflow = 'hidden';
      showReview(0);
      reviewsClose.focus();
    }

    function closeReviews() {
      reviewsModal.classList.remove('visible');
      document.body.style.overflow = '';
      setTimeout(() => {
        reviewsModal.hidden = true;
      }, 250);
      if (lastFocusedEl) lastFocusedEl.focus();
    }

    reviewsBtn.addEventListener('click', openReviews);
    reviewsClose.addEventListener('click', closeReviews);
    reviewsPrev.addEventListener('click', () => showReview(currentReview - 1));
    reviewsNext.addEventListener('click', () => showReview(currentReview + 1));

    // Click outside the panel closes the modal
    reviewsModal.addEventListener('click', (e) => {
      if (e.target === reviewsModal) closeReviews();
    });

    // Escape key closes the modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !reviewsModal.hidden) closeReviews();
    });
  }

});
