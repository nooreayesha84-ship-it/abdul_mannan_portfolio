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

  /* ---------- Two-level navigation: Home overview + detail pages ---------- */
  const navbar = document.getElementById('navbar');
  const pageContainers = Array.from(document.querySelectorAll('[data-page]')).filter(el =>
    el.classList.contains('page-home') || el.classList.contains('page-detail')
  );
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));
  const navIndicator = document.getElementById('navIndicator');
  const navLinksList = document.getElementById('navLinks');
  const validPageNames = pageContainers.map(el => el.getAttribute('data-page'));

  function moveIndicator(link) {
    if (!link || !navIndicator || !navLinksList) return;
    const listRect = navLinksList.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    navIndicator.style.left = `${linkRect.left - listRect.left}px`;
    navIndicator.style.width = `${linkRect.width}px`;
  }

  function navName(link) {
    return link.dataset.nav || (link.getAttribute('href') || '').replace('#', '');
  }

  function setActiveNav(name) {
    let matched = null;
    navLinks.forEach(link => {
      const isMatch = navName(link) === name;
      link.classList.toggle('active', isMatch);
      if (isMatch) matched = link;
    });
    if (matched) moveIndicator(matched);
  }

  function revealNow(container) {
    if (!container) return;
    container.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  }

  function showPage(name, opts) {
    opts = opts || {};
    if (!validPageNames.includes(name)) name = 'home';

    pageContainers.forEach(el => {
      el.hidden = el.getAttribute('data-page') !== name;
    });

    const shown = document.querySelector(`.page-home[data-page="${name}"], .page-detail[data-page="${name}"]`);
    revealNow(shown);
    setActiveNav(name);

    if (!opts.preserveScroll) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }

    try {
      const hash = `#${name}`;
      if (location.hash !== hash) history.pushState(null, '', hash);
    } catch (e) {
      /* history API unavailable — navigation still works without URL updates */
    }

    closeMenu();
  }

  function scrollToId(id) {
    const target = document.getElementById(id);
    if (!target) return;
    const offset = navbar.offsetHeight;
    const top = target.getBoundingClientRect().top + window.pageYOffset - offset + 1;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  document.querySelectorAll('[data-page]').forEach(el => {
    if (el.classList.contains('page-home') || el.classList.contains('page-detail')) return;
    el.addEventListener('click', (e) => {
      e.preventDefault();
      showPage(el.getAttribute('data-page'));
    });
  });

  document.querySelectorAll('[data-scroll]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const id = el.getAttribute('data-scroll');
      const alreadyHome = document.querySelector('.page-home').hidden === false;
      if (alreadyHome) {
        scrollToId(id);
      } else {
        showPage('home', { preserveScroll: true });
        requestAnimationFrame(() => requestAnimationFrame(() => scrollToId(id)));
      }
      setActiveNav('contact');
      closeMenu();
    });
  });

  // Home is one cohesive page: the active nav item follows the current route
  // only (Home vs. a detail page). Scrolling through Home's own preview
  // sections (Skills, Projects, Reviews, Contact, etc.) must never change
  // which navbar item is highlighted — only clicking a nav item does.

  // Initial routing: every fresh load/refresh always starts at Home, from the top.
  showPage('home');

  window.addEventListener('popstate', () => {
    const name = (location.hash || '').replace('#', '');
    showPage(validPageNames.includes(name) ? name : 'home', { preserveScroll: true });
  });

  window.addEventListener('load', () => {
    const activeLink = document.querySelector('.nav-link.active') || navLinks[0];
    moveIndicator(activeLink);
  });
  window.addEventListener('resize', () => {
    const activeLink = document.querySelector('.nav-link.active');
    moveIndicator(activeLink);
  });

  /* ---------- Scroll reveal animation ---------- */
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

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

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

  /* ---------- Stat counters (restart every time they scroll into view) ---------- */
  const statNumbers = document.querySelectorAll('.stat-number');
  const statAnimTokens = new WeakMap();

  const countObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseFloat(el.getAttribute('data-count'));
        const decimals = parseInt(el.getAttribute('data-decimal') || '0', 10);
        const duration = 1000;
        const start = performance.now();

        // Invalidate any in-flight animation for this element so re-entering
        // the viewport restarts cleanly instead of racing a previous run.
        const token = (statAnimTokens.get(el) || 0) + 1;
        statAnimTokens.set(el, token);
        el.textContent = decimals > 0 ? (0).toFixed(decimals) : '0';

        function tick(now) {
          if (statAnimTokens.get(el) !== token) return;
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const value = target * eased;
          el.textContent = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
          if (progress < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
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
  const reviewsTriggers = document.querySelectorAll('.reviews-trigger');
  const reviewsModal = document.getElementById('reviewsModal');
  const reviewsClose = document.getElementById('reviewsClose');
  const reviewsTrack = document.getElementById('reviewsTrack');
  const reviewsPrev = document.getElementById('reviewsPrev');
  const reviewsNext = document.getElementById('reviewsNext');
  const reviewsCounter = document.getElementById('reviewsCounter');

  if (reviewsTriggers.length && reviewsModal) {
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

    reviewsTriggers.forEach(btn => btn.addEventListener('click', openReviews));
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

  /* ---------- How I Work — process step accordion ---------- */
  const processSteps = document.querySelectorAll('.process-step');
  processSteps.forEach(step => {
    step.addEventListener('click', () => {
      const isOpen = step.classList.contains('open');
      processSteps.forEach(s => s.classList.remove('open'));
      if (!isOpen) step.classList.add('open');
    });
  });

  /* ---------- Case study modal — real, documented project details only ---------- */
  const caseData = {
    thesafereport: {
      title: 'TheSafeReport | Emergency Incident Management',
      sub: 'SaaS/CRM · AI · Public Safety · Web & Mobile',
      images: [
        { src: 'projects/thesafereport/thumbnail.png', alt: 'TheSafeReport marketing overview: website dashboard and mobile app mockups' },
        { src: 'projects/thesafereport/landing-page.png', alt: 'TheSafeReport public landing page with safety information and emergency notice' },
        { src: 'projects/thesafereport/overview-dashboard.png', alt: 'TheSafeReport overview dashboard with report totals and recent reports table' },
        { src: 'projects/thesafereport/mobile-flow.png', alt: 'TheSafeReport mobile app screens for confidential incident reporting' },
        { src: 'projects/thesafereport/analytics.png', alt: 'TheSafeReport analytics dashboard with incident type, severity, and time-of-day charts' },
        { src: 'projects/thesafereport/pattern-map.png', alt: 'TheSafeReport pattern-recognition map with incident location pins' },
        { src: 'projects/thesafereport/analytics-ai-prediction.png', alt: 'TheSafeReport AI trend-prediction engine forecasting incident hotspots and risk scores' },
        { src: 'projects/thesafereport/analytics-device-browser.png', alt: 'TheSafeReport analytics: device type, operating system, browser, and scan log breakdowns' },
        { src: 'projects/thesafereport/mobile-app-screens.png', alt: 'TheSafeReport mobile app: confidential incident report, sign-in, and password reset screens' },
        { src: 'projects/thesafereport/play-store-listing.png', alt: 'TheSafeReport Google Play Store listing with app screenshots' },
        { src: 'projects/thesafereport/app-store-listing.png', alt: 'TheSafeReport App Store listing with app screenshots' },
        { src: 'projects/thesafereport/client-success-story.png', alt: 'TheSafeReport client success story featuring the project founder and development team' }
      ],
      sections: [
        { h: 'The Problem', p: 'Public-safety organizations needed a single system to manage the full lifecycle of incident reports, from initial submission through triage, escalation, and compliance record-keeping.' },
        { h: 'The Solution', p: 'A three-portal incident management platform serving reporters, organizations, and administrators, with AI-assisted triage to route and prioritize incoming reports automatically, delivered as both a web app and a mobile app.' },
        { h: 'Key Features', list: [
          'Anonymous and authenticated incident reporting, with an identity-hidden toggle',
          'AI-powered (OpenAI-powered) risk prediction and auto-escalation',
          'Three-portal architecture for reporters, organizations, and administrators',
          'Analytics dashboards covering incident type, severity, and time-of-day trends',
          'Geographic pattern-recognition map of incident locations',
          'Evidence tracking, compliance exports, and real-time emergency dispatch integration',
          'iOS and Android mobile apps with OTP-based password reset',
          'AI Triage', 'Multi-Portal Architecture', 'Compliance Exports', 'Real-Time Dispatch', 'Mobile Apps'
        ] },
        { h: 'Technologies', tech: ['Python', 'Django', 'HTML', 'CSS', 'JavaScript', 'OpenAI', 'SOC 3', 'SMTP', 'Google Places', 'Google Maps'] },
        { h: 'Outcome', p: 'Built for public-safety organizations to manage the complete incident lifecycle in one system, from anonymous report to real-time dispatch.' }
      ]
    },
    airtable: {
      title: 'Airtable Compliance Workflow System',
      sub: 'Automation · Compliance Tracking',
      images: [
        { src: 'projects/airtable-compliance/thumbnail.png', alt: 'Airtable Compliance Workflow System: import, validation and tracking pipeline diagram' },
        { src: 'projects/airtable-compliance/overview.png', alt: 'Compliance Overview dashboard with overdue, due-soon, and up-to-date stat cards' },
        { src: 'projects/airtable-compliance/kanban.png', alt: 'Compliance Tracking Kanban board with review and remediation stages' },
        { src: 'projects/airtable-compliance/illustration.png', alt: 'Illustrative diagram of the Airtable-based compliance workflow' }
      ],
      sections: [
        { h: 'The Problem', p: 'Tracking many entities and lodgements across various compliance deadlines had no single, reliable system, so deadlines were easy to miss without automated tracking and reminders.' },
        { h: 'The Solution', p: 'A custom Airtable-based compliance workflow: bulk data validated, transformed and loaded into structured Airtable tables for Entities, Lodgements and Compliance, tracked through a multi-stage review-and-remediation Kanban board.' },
        { h: 'Key Features', list: [
          'Excel import with a validate → transform → load pipeline (170+ rows, zero errors)',
          'Compliance Overview dashboard tracking Overdue / Due in 30 Days / Due in 1–12 Months / Up to Date',
          '11-stage Kanban tracking board from Not Started through Remediation to Completed',
          'Scheduled recurring calendar reminders',
          'Automated email notifications',
          'Data Import / ETL'
        ] },
        { h: 'Technologies', tech: ['Airtable', 'Automation', 'Kanban'] },
        { h: 'Outcome', p: 'A single source of truth for compliance tracking, replacing manual spreadsheet chasing with automated reminders and a clear review pipeline, reflected in Nick’s review of the "Custom Airtable Task Flow Automation" project.' }
      ]
    },
    zapier: {
      title: 'Zapier Sales Funnel Automation Setup',
      sub: 'Automation · AI-Assisted Lead Response',
      images: [
        { src: 'projects/zapier-sales-funnel/thumbnail.png', alt: 'Sales Funnel Automation Workflow using Zapier: lead trigger, ChatGPT, and Google Drive output' },
        { src: 'projects/zapier-sales-funnel/workflow-diagram.png', alt: 'Flat workflow diagram of the current automation and the planned LinkedIn lead-gen extension' }
      ],
      sections: [
        { h: 'The Problem', p: 'New lead inquiries needed a fast, consistent first response instead of relying on manual follow-up.' },
        { h: 'The Solution', p: 'A Zapier-orchestrated sales funnel: new lead inquiries trigger an automated workflow that drafts a response with ChatGPT and saves the formatted output to Google Drive, with a documented roadmap for a future LinkedIn lead-generation extension.' },
        { h: 'Key Features', list: [
          'New Lead Inquiry trigger into a Zapier automation',
          'ChatGPT-generated response drafting',
          'Formatted output saved automatically to Google Docs/Drive',
          'Planned LinkedIn lead-gen automation with filters and nurture-sequence branching',
          'Google Drive', 'Automation'
        ] },
        { h: 'Technologies', tech: ['Zapier', 'OpenAI', 'LinkedIn', 'SMTP'] },
        { h: 'Outcome', p: 'Automated the first-response step of the sales funnel and laid out a clear roadmap for extending automation into LinkedIn lead generation.' }
      ]
    },
    ecommerce: {
      title: 'Modern E-Commerce UI/UX',
      sub: 'Web · UI/UX Design',
      images: [
        { src: 'projects/modern-ecommerce/thumbnail.png', alt: 'Modern e-commerce storefront UI for a diesel parts retailer, shown on a tablet mockup' }
      ],
      sections: [
        { h: 'The Problem', p: 'An automotive/diesel parts retailer needed a modern, easy-to-navigate storefront where customers could quickly find parts for their specific vehicle.' },
        { h: 'The Solution', p: 'A clean e-commerce interface with vehicle-specific filtering so customers can browse parts matched to their exact vehicle, backed by clear product categories and a strong promotional hero section.' },
        { h: 'Key Features', list: [
          'Shop-by-vehicle filtering by Year / Make / Engine',
          'Organized product categories',
          'Promotional hero banners with clear calls to action',
          'Dealer-facing "Become a Dealer" pathway',
          'UI/UX Design', 'E-Commerce', 'Responsive Web Design'
        ] },
        { h: 'Technologies', tech: ['Figma', 'HTML', 'CSS', 'JavaScript', 'PWA'] },
        { h: 'Outcome', p: 'A focused, vehicle-first shopping experience built for parts customers.' }
      ]
    },
    netvigil: {
      title: 'NetVigil: Network Monitoring System',
      sub: 'Backend · Infrastructure Monitoring',
      images: [
        { src: 'projects/netvigil/thumbnail.png', alt: 'NetVigil network monitoring dashboard shown in light and dark mode with traffic and bandwidth charts' },
        { src: 'projects/netvigil/devices.png', alt: 'NetVigil devices page with device health status and device type distribution charts' },
        { src: 'projects/netvigil/settings.png', alt: 'NetVigil settings page: company information, user management, and security integrations in light and dark mode' }
      ],
      sections: [
        { h: 'The Problem', p: 'IT teams needed real-time visibility into network health, including device status, bandwidth usage, and alerts, from a single dashboard.' },
        { h: 'The Solution', p: 'A network monitoring system tracking managed devices, their live status, and traffic/bandwidth trends, with light and dark dashboard views and a device directory with health and type breakdowns.' },
        { h: 'Key Features', list: [
          'Total / Active / Inactive device counts and today’s alerts at a glance',
          'Network traffic and bandwidth usage charts',
          'Device management list with IP, status, and last-active tracking',
          'Device health-status and device-type distribution views',
          'Light and dark dashboard modes',
          'Backend Development', 'Monitoring', 'Infrastructure'
        ] },
        { h: 'Technologies', tech: ['Node.js', 'React.js', 'OneSignal', 'DigitalOcean', 'IP Tracking', 'HIPAA'] },
        { h: 'Outcome', p: 'Centralized, real-time visibility into network infrastructure health for faster issue detection.' }
      ]
    },
    metertracking: {
      title: 'Mobile App Meter Monitoring & Meter Tracking',
      sub: 'Mobile App · Utility Meter Tracking & Monitoring',
      images: [
        { src: 'projects/meter-tracking/thumbnail.png', alt: 'Meter Monitor mobile app: dashboard with utility usage charts and meter reading history screens' }
      ],
      sections: [
        { h: 'The Problem', p: 'Utility meter readings need to be tracked and logged efficiently, including situations where internet access is unavailable.' },
        { h: 'The Solution', p: 'A user-friendly cross-platform mobile application built with Flutter for iOS and Android, designed for reliable meter tracking, monitoring, and logging. It includes offline caching so users can continue recording and accessing meter data without an internet connection, with data maintained locally until connectivity is available.' },
        { h: 'Key Features', list: [
          'Utility meter tracking and monitoring',
          'Meter reading logging and record management',
          'Offline caching and local data access',
          'Reliable data handling without constant internet connectivity',
          'Cross-platform iOS and Android support',
          'Simple, user-friendly mobile interface',
          'Mobile App Development'
        ] },
        { h: 'Technologies', tech: ['Python', 'Flutter'] },
        { h: 'Outcome', p: 'Delivered a practical cross-platform meter monitoring solution that makes utility data tracking and logging easier, including reliable offline access.' }
      ]
    },
    windowsprintautomation: {
      title: 'Windows Print Automation Service',
      sub: 'Automation · Windows Background Service',
      images: [
        { src: 'projects/windows-print-automation/overview.png', alt: 'Windows Print Automation Service diagram: master input folder routing files to black-and-white, color, and office hotfolders across printer clusters' },
        { src: 'projects/windows-print-automation/hotfolder-diagram.png', alt: 'Windows Print Automation Service diagram: master input folder distributing files to black-and-white, color, and priority hotfolders and printers' }
      ],
      sections: [
        { h: 'The Problem', p: 'Manually distributing print jobs across multiple printers is time-consuming and prone to duplicate prints, especially when different printers handle different job types.' },
        { h: 'The Solution', p: 'A Windows background service that automates print job distribution across multiple printers. It monitors spooler queues and moves the oldest files from a central master folder to the appropriate printer hot folder whenever a printer is idle.' },
        { h: 'Key Features', list: [
          'Automated print job distribution across multiple printers',
          'Spooler queue monitoring with idle-printer detection',
          'Moves the oldest files from a central master folder to the correct printer hot folder',
          'Configurable JSON/INI settings',
          'Duplicate-print prevention',
          'Activity and error logs',
          'Delivered as a compiled executable with source code and setup instructions',
          'Automation', 'Programming'
        ] },
        { h: 'Technologies', tech: ['Python', 'JSON'] },
        { h: 'Outcome', p: 'Delivered a working Windows print automation service with configurable hotfolder routing, duplicate-print prevention, and complete setup documentation, ready for deployment as a compiled executable or from source.' }
      ]
    },
    geojsondirectus: {
      title: 'GeoJSON Cleanup & Directus API',
      sub: 'Data Engineering · GeoJSON · Directus API',
      images: [
        { src: 'projects/geojson-directus/thumbnail.png', alt: 'Directus API dashboard showing cleaned Roads, Points of Interest, and Admin Boundaries collections with REST API endpoints' }
      ],
      sections: [
        { h: 'The Problem', p: 'Geospatial road and related GeoJSON layers needed to be cleaned, validated, and standardized before they could be reliably used through a structured API.' },
        { h: 'The Solution', p: 'Cleaned and validated GeoJSON road and related layers, standardized the data to WGS-84, removed duplicates, and loaded the results into Directus, with REST and optional GraphQL endpoints for accessing the data.' },
        { h: 'Key Features', list: [
          'GeoJSON data cleaning and validation for road and related layers',
          'Standardization to the WGS-84 coordinate system',
          'Duplicate removal',
          'Data loaded into Directus',
          'REST API endpoints, with optional GraphQL support',
          'Documentation, testing, and handover included',
          'Database Programming'
        ] },
        { h: 'Technologies', tech: ['Python', 'PostgreSQL', 'API', 'JSON'] },
        { h: 'Outcome', p: 'Delivered a clean, standardized, and de-duplicated GeoJSON dataset accessible through a documented REST (and optional GraphQL) API in Directus, handed over with testing and documentation.' }
      ]
    },
    microbot: {
      title: 'Microbot: Smart Microcontroller Automation System',
      sub: 'IoT · Embedded Systems Automation',
      images: [
        { src: 'projects/microbot/hardware-prototype-1.png', alt: 'Microbot heterogeneous MCU and FPGA proto-system with sensor array, motion control, and display module' },
        { src: 'projects/microbot/automation-dashboard.png', alt: 'Microbot automation dashboard with device start/stop controls and parameter sliders' },
        { src: 'projects/microbot/analytics-dashboard.png', alt: 'Microbot system analytics dashboard with device health status and monthly activity trend' },
        { src: 'projects/microbot/microcontrollers-page.png', alt: 'Microbot microcontrollers page listing MCU units, group overview, and firmware deployment' },
        { src: 'projects/microbot/devices-page.png', alt: 'Microbot device management page listing connected smart devices and their status' },
        { src: 'projects/microbot/settings-page.png', alt: 'Microbot system settings page with network configuration and notification preferences' },
        { src: 'projects/microbot/hardware-prototype-2.png', alt: 'Microbot proto-system breadboard with microcontroller units, temp sync, and actuator drive' }
      ],
      sections: [
        { h: 'The Problem', p: 'Embedded and microcontroller-based devices needed to be monitored and controlled in real time from one place instead of managing each device separately.' },
        { h: 'The Solution', p: 'An IoT system that monitors, controls, and manages embedded devices in real time through a centralized dashboard.' },
        { h: 'Key Features', list: [
          'Real-time monitoring of connected microcontroller units and devices',
          'Centralized dashboard for controlling and managing devices',
          'Device analytics, including health status and activity trends',
          'Configurable system settings and device registration',
          'Frontend Development', 'Data Visualization', 'Interaction Design'
        ] },
        { h: 'Technologies', tech: ['Python', 'Flask'] },
        { h: 'Outcome', p: 'Delivered a centralized IoT dashboard for monitoring, controlling, and managing embedded microcontroller devices in real time.' }
      ]
    },
    aijiraautomation: {
      title: 'AI-Powered JIRA Workflow Automation App',
      sub: 'Jira Forge App · AI-Assisted Ticket Review',
      images: [
        { src: 'projects/ai-jira-automation/overview.png', alt: 'AI-Powered JIRA Workflow Automation App diagram: AI engine analyzing Jira tickets with feedback, configurable workflow settings, and AWS Lambda/DynamoDB cloud services' }
      ],
      sections: [
        { h: 'The Problem', p: 'Reviewing Jira ticket quality and clarity manually is time-consuming, and teams needed consistent, AI-assisted feedback directly inside their existing Jira workflow.' },
        { h: 'The Solution', p: 'A Jira Forge app that uses customer-provided OpenAI, Anthropic, or AWS Bedrock keys to review ticket quality, add feedback and clarity scores, and support manual reviews, with secure settings and workflow configuration. A companion Node.js/Express API running on AWS Lambda and DynamoDB handles subscriptions, Stripe billing events, and GDPR account deletion.' },
        { h: 'Key Features', list: [
          'AI-assisted review of Jira ticket quality and clarity',
          'Automatic feedback and clarity scoring on tickets',
          'Support for manual ticket reviews',
          'Customer-provided AI keys (OpenAI, Anthropic, or AWS Bedrock)',
          'Secure settings and workflow configuration',
          'Subscription management and Stripe billing event handling',
          'GDPR-compliant account deletion',
          'Automation'
        ] },
        { h: 'Technologies', tech: ['Python', 'Jira Forge', 'Node.js', 'Express', 'AWS Lambda', 'DynamoDB', 'Stripe', 'OpenAI/Anthropic/AWS Bedrock'] },
        { h: 'Outcome', p: 'Delivered a Jira Forge app that brings AI-assisted ticket review directly into Jira workflows, backed by a companion API for subscriptions, billing, and account management.' }
      ]
    },
    terminaltravels: {
      title: 'Terminal Travels',
      sub: 'Luxury Travel Platform · Booking & Itineraries',
      images: [
        { src: 'projects/terminal-travels/homepage.png', alt: 'Terminal Travels homepage with luxury stays, elite access, and exclusive rewards sections' },
        { src: 'projects/terminal-travels/device-mockups.png', alt: 'Terminal Travels shown across desktop, laptop, tablet, and phone with elite access, rewards, and hotel booking screens' }
      ],
      sections: [
        { h: 'The Problem', p: 'Travelers looking for premium trips and hotels needed a single platform to plan and book curated, high-end travel experiences instead of piecing together options from multiple sources.' },
        { h: 'The Solution', p: 'A luxury travel platform for planning and booking premium trips and hotels, featuring curated itineraries, exclusive hotel options, intuitive navigation, and personalization.' },
        { h: 'Key Features', list: [
          'Planning and booking of premium trips and hotels',
          'Curated travel itineraries',
          'Exclusive hotel options',
          'Intuitive site navigation',
          'Personalized user experience',
          'API Integration', 'Web Development', 'Database Management'
        ] },
        { h: 'Technologies', tech: ['PHP', 'JavaScript', 'WordPress', 'HTML5'] },
        { h: 'Outcome', p: 'Delivered a luxury travel platform that makes it easy to discover, plan, and book curated premium trips and hotel stays.' }
      ]
    },
    testsphere: {
      title: 'TestSphere',
      sub: 'QA Platform · Test & Bug Tracking',
      images: [
        { src: 'projects/testsphere/dashboard.png', alt: 'TestSphere dashboard with tests passed/failed, active bugs, test coverage, and recent test cases' },
        { src: 'projects/testsphere/test-cases.png', alt: 'TestSphere test cases page with status, priority, environment, and assigned tester filters' },
        { src: 'projects/testsphere/bugs.png', alt: 'TestSphere bugs page with severity-tagged bugs, status, and assigned testers' },
        { src: 'projects/testsphere/reports.png', alt: 'TestSphere reports page with test cycle summaries and PDF/CSV export options' },
        { src: 'projects/testsphere/settings.png', alt: 'TestSphere settings page with team roles, integrations, and workflow notifications' }
      ],
      sections: [
        { h: 'The Problem', p: 'QA teams testing mobile apps, web apps, and games needed a single platform to manage test cases, track bugs, and see testing progress at a glance.' },
        { h: 'The Solution', p: 'A QA platform for mobile, web, and game testing that manages test cases, tracks bugs, and provides a pass/fail dashboard with tester assignments.' },
        { h: 'Key Features', list: [
          'Test case management for mobile, web, and game QA',
          'Bug tracking with severity tagging and screenshots',
          'Pass/fail dashboard with test coverage charts',
          'Tester assignment and role management',
          'PDF and CSV report exports',
          'API Integration', 'Data Visualization', 'Backend Development'
        ] },
        { h: 'Technologies', tech: ['Node.js', 'Django'] },
        { h: 'Outcome', p: 'Delivered a QA platform that brings test case management, bug tracking, and reporting together in one dashboard for mobile, web, and game testing teams.' }
      ]
    },
    homesphere: {
      title: 'HomeSphere: Smart Home IoT Control',
      sub: 'Smart Home IoT · Mobile Dashboard',
      images: [
        { src: 'projects/homesphere/app-dashboard.png', alt: 'HomeSphere mobile app dashboard with lighting, AC/thermostat, security cameras, door locks, and energy consumption analytics' },
        { src: 'projects/homesphere/hardware-ecosystem.png', alt: 'HomeSphere smart home hardware ecosystem: central hub, smart lighting, security camera, smart plug, and sensor pod' },
        { src: 'projects/homesphere/prototyping.png', alt: 'HomeSphere Arduino and microcontroller prototyping setup with relays, breadboards, and wiring diagrams' }
      ],
      sections: [
        { h: 'The Problem', p: 'Homeowners with multiple smart devices, lighting, climate, cameras, and locks, needed one mobile dashboard to see real-time status and control everything in one place.' },
        { h: 'The Solution', p: 'A smart-home dashboard that controls lighting, climate, cameras, and locks, with real-time status, quick actions, and energy analytics in a glassmorphism, mobile-first interface.' },
        { h: 'Key Features', list: [
          'Control of lighting, climate, cameras, and locks from one dashboard',
          'Real-time device status',
          'Quick actions for common controls',
          'Energy consumption analytics',
          'Glassmorphism UI design',
          'Mobile-first responsive layout',
          'Microcontroller', 'Prototyping'
        ] },
        { h: 'Technologies', tech: ['Python', 'Flutter', 'C++', 'Arduino', 'AWS Lambda', 'React Native', 'MicroPython'] },
        { h: 'Outcome', p: 'Delivered a mobile-first smart-home dashboard for controlling lighting, climate, cameras, and locks with real-time status and energy analytics.' }
      ]
    },
    cryptobotai: {
      title: 'CryptoBot AI',
      sub: 'Automated Crypto Trading · MEXC & KCEX',
      images: [
        { src: 'projects/cryptobot-ai/login.png', alt: 'CryptoBot AI sign-in screen for the automated trading platform' },
        { src: 'projects/cryptobot-ai/trading-dashboard.png', alt: 'CryptoBot AI trading dashboard showing active bots, connected MEXC and KCEX exchanges, and open trades' },
        { src: 'projects/cryptobot-ai/activity-logs.png', alt: 'CryptoBot AI activity logs showing bot actions and take-profit/stop-loss events' }
      ],
      sections: [
        { h: 'The Problem', p: 'Manually placing trades and managing take-profit and stop-loss levels across exchanges is time-consuming and hard to do consistently.' },
        { h: 'The Solution', p: 'An AI-powered crypto trading bot for MEXC and KCEX that automatically places trades and applies configured take-profit and stop-loss settings, with TradingView support.' },
        { h: 'Key Features', list: [
          'Automated trading',
          'Configurable take-profit and stop-loss settings',
          'MEXC and KCEX exchange support',
          'TradingView support'
        ] },
        { h: 'Technologies', tech: ['Python', 'Django'] },
        { h: 'Outcome', p: 'Delivered an automated trading bot that places trades and manages take-profit/stop-loss across MEXC and KCEX with TradingView support.' }
      ]
    },
    cryptotradingplatform: {
      title: 'Crypto Trading Platform',
      sub: 'Cryptocurrency Exchange · Wallet & Order Management',
      images: [
        { src: 'projects/crypto-trading-platform/trade-view.png', alt: 'Crypto Trading Platform trade view with live chart, order book, and buy/sell BTC controls' },
        { src: 'projects/crypto-trading-platform/wallet.png', alt: 'Crypto Trading Platform wallet page showing USDT balance, margin, and assets allocation' },
        { src: 'projects/crypto-trading-platform/markets.png', alt: 'Crypto Trading Platform markets page with market cap dominance charts and coin rankings' }
      ],
      sections: [
        { h: 'The Problem', p: 'Buying, selling, and managing digital assets securely requires reliable order tracking, wallet management, and visibility into platform revenue.' },
        { h: 'The Solution', p: 'A secure cryptocurrency platform for buying, selling, and managing digital assets, with real-time order tracking, wallet management, and revenue monitoring.' },
        { h: 'Key Features', list: [
          'Crypto trading (buy/sell)',
          'Real-time order tracking',
          'Wallet management',
          'Revenue dashboard'
        ] },
        { h: 'Technologies', tech: ['Python', 'Django', 'AWS'] },
        { h: 'Outcome', p: 'Delivered a secure crypto trading platform with real-time order tracking, wallet management, and a revenue dashboard.' }
      ]
    },
    nonprofitleadgen: {
      title: 'Non-Profit SaaS Global Lead Gen',
      sub: 'Lead Generation · Nonprofit & Impact Organizations',
      images: [
        { src: 'projects/nonprofit-lead-gen/overview.png', alt: 'Non-Profit SaaS Global Lead Gen diagram: targeted outreach, research and discovery, data validation, and CRM sync producing qualified impact leads with organization, email, and LinkedIn details' }
      ],
      sections: [
        { h: 'The Problem', p: 'ReportsAI, a B2B SaaS serving nonprofits and impact organizations, needed verified contacts at relevant NGOs, INGOs, and donor-funded organizations to support global lead generation.' },
        { h: 'The Solution', p: 'Conducted research-driven global lead generation for ReportsAI, identifying relevant professionals across NGOs, INGOs, and donor-funded organizations, and providing verified contact details and organization information.' },
        { h: 'Key Features', list: [
          'Lead research',
          'Contact verification',
          'LinkedIn and email data',
          'Organization details',
          'Ethical data practices'
        ] },
        { h: 'Technologies', tech: ['Python', 'Excel', 'SaaS'] },
        { h: 'Outcome', p: 'Delivered verified leads with contact and organization details for relevant professionals across NGOs, INGOs, and donor-funded organizations.' }
      ]
    },
    langchainworkflow: {
      title: 'LangChain Workflow',
      sub: 'LangChain · Debt Checker Automation',
      images: [
        { src: 'projects/langchain-workflow/debt-agent-workflow.png', alt: 'LangChain Debt Agent workflow builder with CSV lookup, name/ID accumulator, conversational parsing, and payment plan generation nodes' }
      ],
      sections: [
        { h: 'The Problem', p: "Checking a person's debt records from customer data required a way to look up records by name and ID instead of searching CSV data manually." },
        { h: 'The Solution', p: "A LangChain-based Debt Checker workflow that uses a person's name and assigned ID to check debt records from customer data loaded via CSV." },
        { h: 'Key Features', list: [
          'Name and ID-based debt checking',
          'CSV data input'
        ] },
        { h: 'Technologies', tech: ['Python', 'LangChain'] },
        { h: 'Outcome', p: "Delivered a LangChain workflow that checks a person's debt records from CSV customer data using their name and assigned ID." }
      ]
    },
    medranolandscaping: {
      title: 'Medrano Landscaping',
      sub: 'Job Management & Career Portal',
      images: [
        { src: 'projects/medrano-landscaping/job-listings.png', alt: 'Medrano Landscaping job listings page showing job status, client, and assigned worker' },
        { src: 'projects/medrano-landscaping/job-details.png', alt: 'Medrano Landscaping job details page with job notes, location map, and estimated price' },
        { src: 'projects/medrano-landscaping/job-activity-logs.png', alt: 'Medrano Landscaping job activity logs showing job notes, pricing, and status changes' },
        { src: 'projects/medrano-landscaping/invoice-detail.png', alt: 'Medrano Landscaping invoice detail page with billing information and payment status' },
        { src: 'projects/medrano-landscaping/admin-profile.png', alt: 'Medrano Landscaping admin profile with statistics overview and recent jobs' }
      ],
      sections: [
        { h: 'The Problem', p: 'Medrano Landscaping Inc. needed a way for applicants to register, view job openings, apply, and manage their applications online, backed by secure authentication.' },
        { h: 'The Solution', p: 'A web-based job management and career portal for Medrano Landscaping Inc. Applicants can register, sign in, view job openings, apply, and manage applications, with secure authentication and a responsive design.' },
        { h: 'Key Features', list: [
          'Applicant authentication',
          'Job listings',
          'Job applications',
          'Application management',
          'Responsive interface'
        ] },
        { h: 'Technologies', tech: ['Python', 'Django', 'REST API', 'HTML5', 'CSS'] },
        { h: 'Outcome', p: 'Delivered a job management and career portal for Medrano Landscaping Inc. with applicant authentication, job listings, and application management.' }
      ]
    },
    nextgengtn: {
      title: 'NextGen GTN™',
      sub: 'Educational Platform · Commercialization Intelligence',
      images: [
        { src: 'projects/nextgen-gtn/thumbnail.png', alt: 'NextGen GTN homepage: Understanding Commercialization Through Patients + Profitability' },
        { src: 'projects/nextgen-gtn/courses-overview.png', alt: 'NextGen GTN courses and audience segments: Executive Leadership, Market Access, Patient Services, and more' }
      ],
      sections: [
        { h: 'The Problem', p: 'Pharmaceutical commercialization involves interconnected areas such as patient access, forecasting, finance, GTN, affordability, and launch readiness, but these areas can be difficult to understand as one connected system.' },
        { h: 'The Solution', p: 'An educational and commercialization intelligence platform that connects patient access, commercialization strategy, financial performance, and GTN concepts through educational content, frameworks, and practical learning resources.' },
        { h: 'Key Features', list: [
          'Educational content around Gross-to-Net and pharmaceutical commercialization',
          'Patient access and profitability-focused frameworks',
          'Commercialization Alignment Labs',
          'Launch readiness and risk-management concepts',
          'Forecasting and commercialization performance resources',
          'E-books, frameworks, webinars, and educational resources',
          'Educational Platform', 'Commercialization Intelligence', 'Interactive Learning', 'Content Management'
        ] },
        { h: 'Technologies', tech: ['Python', 'Django', 'React.js', 'GCP', 'OpenAI', 'Whisper AI'] },
        { h: 'Outcome', p: 'Built a centralized digital learning experience for understanding the relationship between patient access, commercialization, and financial performance.' }
      ]
    },
    scofarelax: {
      title: 'Scofa Relax',
      sub: 'Audio Streaming · Sleep & Relaxation',
      images: [
        { src: 'projects/scofa-relax/thumbnail.jpg', alt: 'Scofa Relax app logo: sleep and relaxation platform' },
        { src: 'projects/scofa-relax/live-app.png', alt: 'Scofa Relax live site: Sounds & Music, Relaxation, Stories, and Articles' }
      ],
      sections: [
        { h: 'The Problem', p: 'People looking for better sleep and relaxation often need different types of calming content, such as sounds, music, meditation, and stories, rather than relying on a single type of audio experience.' },
        { h: 'The Solution', p: 'A digital relaxation and sleep platform that brings calming sounds, music, meditations, stories, and sleep-focused content together in one experience, allowing users to create personalized relaxation environments.' },
        { h: 'Key Features', list: [
          'Large library of calming sounds and music',
          'Guided meditations and relaxation content',
          'Adult and children’s sleep stories',
          'Personalized saved mixes',
          'Nature, weather, wildlife, ASMR, and ambient soundscapes',
          'Sleep and relaxation articles',
          'Household/sub-account support',
          'Audio Streaming', 'Personalized Mixes', 'Content Management', 'Responsive Web Experience'
        ] },
        { h: 'Technologies', tech: ['Python', 'Django', 'React.js', 'GCP', 'Stripe', 'Cloud Bucket', 'CDN', 'RevenueCat'] },
        { h: 'Outcome', p: 'Built a focused digital experience that brings multiple forms of relaxation and sleep content together in one accessible platform.' }
      ]
    },
    hometownpostsite: {
      title: 'The HomeTown Post',
      sub: 'SaaS · Web App · Event Discovery & Management · Reno–Sparks–Truckee, NV/CA',
      images: [
        { src: 'projects/hometownpost-site/thumbnail.png', alt: 'The HomeTown Post live homepage with local event listings' },
        { src: 'projects/hyperlocal-event-discovery/thumbnail.png', alt: 'The HomeTown Post: marketing overview across dashboard, admin panel, and public homepage' },
        { src: 'projects/hyperlocal-event-discovery/dashboard.png', alt: 'The HomeTown Post admin dashboard showing live event and user metrics' },
        { src: 'projects/hyperlocal-event-discovery/events-feed.png', alt: 'The HomeTown Post public events feed with nearby event cards' },
        { src: 'projects/hyperlocal-event-discovery/event-detail.png', alt: 'Public event detail page with ticket info, dates, and venue map' },
        { src: 'projects/hyperlocal-event-discovery/settings-radius.png', alt: 'Admin settings page for configuring the default GPS search radius' },
        { src: 'projects/hyperlocal-event-discovery/venues-management.png', alt: 'The HomeTown Post admin dashboard: venues management page' },
        { src: 'projects/hyperlocal-event-discovery/events-management.png', alt: 'The HomeTown Post admin dashboard: events management page with approval status' },
        { src: 'projects/hometownpost-site/venues.png', alt: 'The HomeTown Post Events by Venue page listing local venues' },
        { src: 'projects/hometownpost-site/event-flyer-1.jpg', alt: 'The HomeTown Post event listing: Fireside Pizza happy hour flyer' },
        { src: 'projects/hometownpost-site/event-flyer-2.jpg', alt: 'The HomeTown Post event listing: community blood donation drive flyer' },
        { src: 'projects/hometownpost-site/event-flyer-3.jpg', alt: 'The HomeTown Post event listing: Pele Utu tiki bar happy hour flyer' },
        { src: 'projects/hometownpost-site/event-flyer-4.jpg', alt: 'The HomeTown Post event listing: King of Pop skate night flyer' },
        { src: 'projects/hometownpost-site/event-flyer-5.jpg', alt: 'The HomeTown Post event listing: live concert flyer' },
        { src: 'projects/hometownpost-site/event-flyer-6.jpg', alt: 'The HomeTown Post event listing: Fireside Pizza family meal deal flyer' }
      ],
      sections: [
        { h: 'The Problem', p: 'Local event promotion in the Reno–Truckee region was scattered across disconnected channels, making it hard for residents to discover nearby events and for organizers to reach an audience.' },
        { h: 'The Solution', p: '"The HomeTown Post": a centralized, self-serve event discovery platform where organizers publish listings directly, residents browse by location, and businesses can pay to promote events. Tagline: "Explore. Manage. Discover."' },
        { h: 'Key Features', list: [
          'Auto-location detection with adjustable radius filtering (1–100 miles)',
          'Self-serve, paid event promotion with Stripe billing integration',
          'Venue directory with featured-venue listings across multiple cities',
          'Event categories, sponsored/featured events, and an admin moderation queue',
          'Event posting and listing management for organizers',
          'Saved events',
          'Location-based distance and directions',
          'Geo-targeted weekly HTML newsletters showing location-specific events',
          'Admin dashboard with live totals for events, users, and categories',
          'Categories covering music, food, festivals, sports, community events, and more',
          'PostgreSQL', 'Geolocation',
          'Event Management', 'Location-Based Discovery', 'Venue Listings', 'Email Subscriptions'
        ] },
        { h: 'Technologies', tech: ['Python', 'Django', 'React.js', 'DigitalOcean', 'Stripe', 'Geofencing'] },
        { h: 'Outcome', p: 'Delivered as a self-sustaining destination for local event promotion, replacing scattered, ad-hoc promotion with one platform residents, organizers, and businesses all use.' }
      ]
    },
    ticketpool: {
      title: 'TicketPool',
      sub: 'Event Ticketing · Stripe Payments · QR Check-In',
      images: [
        { src: 'projects/ticketpool/thumbnail.png', alt: 'TicketPool homepage: effortless access to concerts, conferences, and live events' },
        { src: 'projects/ticketpool/event-listing-1.png', alt: 'TicketPool event listing: aerial view of a concert stage and crowd' },
        { src: 'projects/ticketpool/event-listing-2.jpg', alt: 'TicketPool event listing: indoor concert with a large crowd' },
        { src: 'projects/ticketpool/event-listing-3.jpg', alt: 'TicketPool event listing: tour poster and show details' },
        { src: 'projects/ticketpool/event-listing-4.jpeg', alt: 'TicketPool event listing: concert poster and ticket details' }
      ],
      sections: [
        { h: 'The Problem', p: 'Event organisers need a simple way to create, publish, promote, and manage events while giving attendees an easy way to discover events and purchase tickets online.' },
        { h: 'The Solution', p: 'A complete event ticketing platform connecting event organisers and attendees through event discovery, online ticket sales, event management, secure payments, mobile check-in, and event analytics.' },
        { h: 'Key Features', list: [
          'Event discovery and browsing',
          'Event creation and publishing',
          'Multiple ticket types including VIP, Early Bird, General Admission, and free tickets',
          'Online ticket purchasing',
          'Stripe-powered payment functionality',
          'QR-code based attendee check-in',
          'Ticket sales and event analytics',
          'Organiser and attendee accounts',
          'Event, venue, schedule, and ticket management'
        ] },
        { h: 'Technologies', tech: ['PHP', 'Laravel', 'React.js', 'AWS', 'S3 Bucket', 'Flutter', 'Stripe'] },
        { h: 'Outcome', p: 'Built a complete digital ticketing experience that allows organisers to manage events while giving attendees a streamlined way to discover and purchase tickets.' }
      ]
    },
    cognisleep: {
      title: 'CogniSleep',
      sub: 'CBT-I Sleep Program · Interactive Web Application',
      images: [
        { src: 'projects/cognisleep/thumbnail.png', alt: 'CogniSleep homepage: get the sleep you deserve' },
        { src: 'projects/cognisleep/program-overview.png', alt: 'CogniSleep program overview: 6 sessions, easy to follow yet scientifically effective' }
      ],
      sections: [
        { h: 'The Problem', p: 'People experiencing insomnia need a structured and evidence-based approach that helps them understand their sleep patterns and develop healthier sleep behaviours.' },
        { h: 'The Solution', p: 'A structured 6-week digital sleep-improvement platform based on Cognitive Behavioral Therapy for Insomnia (CBT-I), combining sleep tracking, guided learning, sleep techniques, and physician-assisted guidance.' },
        { h: 'Key Features', list: [
          '6-week structured sleep improvement program',
          'Daily online sleep diary',
          'Guided weekly learning sessions',
          'Dr. Cogni physician-assisted experience',
          'CBT-I based sleep techniques',
          'Sleep efficiency calculator',
          'Personalized sleep guidance',
          'Educational sleep and insomnia resources'
        ] },
        { h: 'Technologies', tech: ['Python', 'Django', 'HTML', 'CSS', 'JavaScript', 'Stripe', 'HIPAA'] },
        { h: 'Outcome', p: 'Built an interactive digital platform that guides users through a structured sleep-improvement program by combining sleep tracking, educational content, and guided therapeutic techniques.' }
      ]
    },
    cardshowalerts: {
      title: 'Card Show Alerts',
      sub: 'Location-Based Discovery · Email Notifications',
      images: [
        { src: 'projects/cardshowalerts/thumbnail.png', alt: 'Card Show Alerts homepage: find card shows near you' }
      ],
      sections: [
        { h: 'The Problem', p: 'Sports and Pokémon card collectors often have to search across different sources to find upcoming card shows in their area, making it difficult to discover relevant events and stay updated.' },
        { h: 'The Solution', p: 'A location-focused card-show discovery platform that helps collectors find sports and Pokémon card shows near them, filter events based on their preferences, and receive personalized alerts.' },
        { h: 'Key Features', list: [
          'Sports card and Pokémon card show discovery',
          'Location-based show search',
          'State-based filtering',
          'Table-count filtering',
          'Start and end date filtering',
          'Detailed event and venue information',
          'Personalized alerts based on ZIP code',
          'Weekly email notifications',
          'Local show discovery'
        ] },
        { h: 'Technologies', tech: ['Python', 'Django', 'HTML', 'CSS', 'JavaScript', 'DigitalOcean', 'SMTP'] },
        { h: 'Outcome', p: 'Built a centralized discovery platform that helps collectors find relevant card shows near them and stay updated through personalized alerts.' }
      ]
    }
  };

  const caseTriggers = document.querySelectorAll('.case-study-trigger');
  const caseModal = document.getElementById('caseModal');

  if (caseTriggers.length && caseModal) {
    const caseClose = document.getElementById('caseClose');
    const caseTitle = document.getElementById('caseTitle');
    const caseSub = document.getElementById('caseSub');
    const caseBody = document.getElementById('caseBody');
    let lastCaseFocus = null;
    let currentCaseImages = [];
    let currentImageIndex = 0;

    function showCaseImage(idx) {
      if (!currentCaseImages.length) return;
      const clamped = Math.max(0, Math.min(idx, currentCaseImages.length - 1));
      currentImageIndex = clamped;
      const mainImg = document.getElementById('caseMainImage');
      const img = currentCaseImages[clamped];
      if (!mainImg || !img) return;
      mainImg.src = img.src;
      mainImg.alt = img.alt || '';
      caseBody.querySelectorAll('.case-thumb').forEach(t => {
        t.classList.toggle('active', parseInt(t.getAttribute('data-idx'), 10) === clamped);
      });
      const activeThumb = caseBody.querySelector('.case-thumb.active');
      if (activeThumb) activeThumb.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }

    function renderGallery(images) {
      if (!images || !images.length) return '';
      const main = images[0];
      const thumbs = images.length > 1
        ? `<div class="case-thumbs" role="tablist" aria-label="Project screenshots">${images.map((img, i) =>
            `<button type="button" class="case-thumb${i === 0 ? ' active' : ''}" data-idx="${i}" aria-label="View screenshot ${i + 1}"><img src="${img.src}" alt="" loading="lazy"></button>`
          ).join('')}</div>`
        : '';
      return `<div class="case-gallery"><img class="case-image" id="caseMainImage" src="${main.src}" alt="${main.alt || ''}" loading="lazy">${thumbs}</div>`;
    }

    function renderCase(key) {
      const data = caseData[key];
      if (!data) return;
      caseTitle.textContent = data.title;
      caseSub.textContent = data.sub;
      currentCaseImages = data.images || [];
      currentImageIndex = 0;
      const galleryHtml = renderGallery(data.images);
      caseBody.innerHTML = galleryHtml + data.sections.map(section => {
        let inner = '';
        if (section.p) inner += `<p>${section.p}</p>`;
        if (section.list) inner += `<ul>${section.list.map(item => `<li>${item}</li>`).join('')}</ul>`;
        if (section.tech) inner += `<div class="case-tech-list">${section.tech.map(t => `<span>${t}</span>`).join('')}</div>`;
        return `<div class="case-section"><h3>${section.h}</h3>${inner}</div>`;
      }).join('');

      if (data.images && data.images.length > 1) {
        caseBody.querySelectorAll('.case-thumb').forEach(thumb => {
          thumb.addEventListener('click', () => {
            showCaseImage(parseInt(thumb.getAttribute('data-idx'), 10));
          });
        });
      }
    }

    const defaultTitle = document.title;

    function openCase(key) {
      lastCaseFocus = document.activeElement;
      renderCase(key);
      caseModal.hidden = false;
      requestAnimationFrame(() => caseModal.classList.add('visible'));
      document.body.style.overflow = 'hidden';
      caseClose.focus();
      const data = caseData[key];
      if (data) document.title = `${data.title} | Abdul Mannan`;
    }

    function closeCase() {
      caseModal.classList.remove('visible');
      document.body.style.overflow = '';
      setTimeout(() => {
        caseModal.hidden = true;
      }, 250);
      if (lastCaseFocus) lastCaseFocus.focus();
      document.title = defaultTitle;
    }

    caseTriggers.forEach(btn => {
      btn.addEventListener('click', () => openCase(btn.getAttribute('data-case')));
    });
    caseClose.addEventListener('click', closeCase);
    caseModal.addEventListener('click', (e) => {
      if (e.target === caseModal) closeCase();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !caseModal.hidden) closeCase();
    });
    document.addEventListener('keydown', (e) => {
      if (caseModal.hidden) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        showCaseImage(currentImageIndex + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        showCaseImage(currentImageIndex - 1);
      }
    });
  }

  /* ---------- Contact chat: send a typed message via WhatsApp or Email ---------- */
  const CONTACT_CHANNELS = {
    whatsapp: {
      number: '923392227172'
    },
    email: {
      address: 'mannanmaan1425@gmail.com'
    }
  };

  const DEFAULT_CHAT_MESSAGE = 'Hi Abdul, I came across your portfolio and I’d like to discuss a potential project. Could we connect to go over the details?';

  const chatOpenBtn = document.getElementById('chatOpenBtn');
  const chatModal = document.getElementById('chatModal');

  if (chatOpenBtn && chatModal) {
    const chatClose = document.getElementById('chatClose');
    const chatForm = document.getElementById('chatForm');
    const chatMessage = document.getElementById('chatMessage');
    const chatNote = document.getElementById('chatNote');
    const chatSendWhatsapp = document.getElementById('chatSendWhatsapp');
    const chatSendEmail = document.getElementById('chatSendEmail');
    let lastChatFocus = null;

    function isWhatsAppConfigured() {
      const number = CONTACT_CHANNELS.whatsapp.number;
      return Boolean(number) && /^\d{6,}$/.test(number);
    }

    function isEmailConfigured() {
      const address = CONTACT_CHANNELS.email.address;
      return Boolean(address) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address);
    }

    function showChatNote(text, isWarning) {
      chatNote.textContent = text;
      chatNote.classList.toggle('chat-note-warning', Boolean(isWarning));
    }

    function openChat() {
      lastChatFocus = document.activeElement;
      chatModal.hidden = false;
      requestAnimationFrame(() => chatModal.classList.add('visible'));
      document.body.style.overflow = 'hidden';
      showChatNote('Choose WhatsApp or Email. Either one opens with your message pre-filled.', false);
      chatMessage.value = DEFAULT_CHAT_MESSAGE;
      chatMessage.focus();
      chatMessage.select();
    }

    function closeChat() {
      chatModal.classList.remove('visible');
      document.body.style.overflow = '';
      setTimeout(() => {
        chatModal.hidden = true;
      }, 250);
      if (lastChatFocus) lastChatFocus.focus();
    }

    chatOpenBtn.addEventListener('click', openChat);
    chatClose.addEventListener('click', closeChat);
    chatModal.addEventListener('click', (e) => {
      if (e.target === chatModal) closeChat();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !chatModal.hidden) closeChat();
    });

    chatForm.addEventListener('submit', (e) => e.preventDefault());

    chatSendWhatsapp.addEventListener('click', () => {
      const message = chatMessage.value.trim();
      if (!message) return;

      if (!isWhatsAppConfigured()) {
        showChatNote('WhatsApp isn’t configured yet. Add a number in script.js to enable sending.', true);
        return;
      }

      const url = `https://wa.me/${CONTACT_CHANNELS.whatsapp.number}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank', 'noopener');
      chatMessage.value = '';
      closeChat();
    });

    chatSendEmail.addEventListener('click', () => {
      const message = chatMessage.value.trim();
      if (!message) return;

      if (!isEmailConfigured()) {
        showChatNote('Email isn’t configured yet. Add an address in script.js to enable sending.', true);
        return;
      }

      const subject = encodeURIComponent('Project Inquiry via Portfolio');
      const body = encodeURIComponent(message);
      const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(CONTACT_CHANNELS.email.address)}&su=${subject}&body=${body}`;
      window.open(url, '_blank', 'noopener');
      chatMessage.value = '';
      closeChat();
    });
  }

  /* ---------- Arrow-key section navigation (Home page only) ----------
     Manual scrolling never changes the active nav item (Home stays
     highlighted) — only Left/Right arrow keys step through the Home
     page's sections in order and update the highlight to match. */
  const ARROW_NAV_ORDER = ['home', 'skills', 'persona', 'work', 'architecture', 'reviews', 'contact'];
  let arrowNavIndex = 0;

  function scrollToSpy(name) {
    const target = document.querySelector(`[data-spy="${name}"]`);
    if (!target) return;
    const offset = navbar.offsetHeight;
    const top = target.getBoundingClientRect().top + window.pageYOffset - offset + 1;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  function isHomeShown() {
    const homeEl = document.querySelector('.page-home');
    return Boolean(homeEl) && !homeEl.hidden;
  }

  function isAnyModalOpen() {
    return Boolean(
      (reviewsModal && !reviewsModal.hidden) ||
      (caseModal && !caseModal.hidden) ||
      (chatModal && !chatModal.hidden)
    );
  }

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (!isHomeShown() || isAnyModalOpen()) return;

    const activeTag = document.activeElement && document.activeElement.tagName;
    if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') return;

    arrowNavIndex = e.key === 'ArrowRight'
      ? Math.min(arrowNavIndex + 1, ARROW_NAV_ORDER.length - 1)
      : Math.max(arrowNavIndex - 1, 0);

    const name = ARROW_NAV_ORDER[arrowNavIndex];
    scrollToSpy(name);
    setActiveNav(name);
  });

});
