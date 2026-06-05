/* ================================================================
   FAMILY HUB — mobile-nav.js

   Shared mobile navigation controller.
   Handles the hamburger button, sidebar slide-in/out,
   backdrop, body-scroll lock, and outside-click close.

   HOW TO USE:
   ──────────
   1. Add  <script src="js/mobile-nav.js" defer></script>
      at the bottom of every page's <body> (after page scripts).

   2. The script auto-initialises on DOMContentLoaded.
      No manual call needed.

   3. The script injects the hamburger <button> into the
      existing <header> automatically — no HTML changes needed.

   4. The script injects the backdrop <div> into <body>
      automatically — no HTML changes needed.

   WHAT IT DOES PER PAGE:
   ──────────────────────
   family-hub.html  → finds  header  +  nav.sidebar
   events.html      → finds  .nav    +  nav.sidebar  (injected by events.js)
   chat.html        → finds  header  +  nav.sidebar
   photos.html      → finds  header.topbar  (already has hamburger; we enhance it)
   index.html       → finds  header.top-header  (calendar, basic)
================================================================ */


/* ================================================================
   SECTION 1 — UTILITIES
================================================================ */

/**
 * Find the page's sidebar element.
 * Different pages use slightly different selectors.
 * Returns the first match found, or null.
 */
function findSidebar() {
  return (
    document.querySelector('nav.sidebar')    ||   // family-hub, chat, events
    document.querySelector('aside.sidebar')  ||   // photos
    document.querySelector('.sidebar')            // fallback
  );
}

/**
 * Find the page's primary header element.
 * Returns the first match found, or null.
 */
function findHeader() {
  return (
    document.querySelector('header.topbar')    ||   // photos page inner topbar
    document.querySelector('header.top-header')||   // index/calendar page
    document.querySelector('header')               // family-hub, chat, events
  );
}


/* ================================================================
   SECTION 2 — STATE
================================================================ */

/** Whether the sidebar is currently open */
let sidebarOpen = false;

/** Reference to the injected backdrop element */
let backdropEl = null;

/** Reference to the injected hamburger button */
let hamburgerEl = null;

/** Reference to the sidebar element */
let sidebarEl = null;


/* ================================================================
   SECTION 3 — OPEN / CLOSE SIDEBAR
================================================================ */

/**
 * Open the sidebar: slide it in, show backdrop, lock body scroll.
 */
function openSidebar() {
  if (!sidebarEl) return;
  sidebarOpen = true;

  /* 1. Slide the sidebar in */
  sidebarEl.classList.add('sidebar--open');

  /* 2. Show the backdrop */
  if (backdropEl) {
    backdropEl.style.display = 'block';
    /* Force a reflow so the CSS transition fires */
    void backdropEl.offsetWidth;
    backdropEl.classList.add('sidebar-backdrop--visible');
  }

  /* 3. Lock body scroll so only the sidebar scrolls */
  document.body.classList.add('sidebar-is-open');

  /* 4. Animate hamburger → X */
  if (hamburgerEl) {
    hamburgerEl.classList.add('hamburger-btn--open');
    hamburgerEl.setAttribute('aria-expanded', 'true');
    hamburgerEl.setAttribute('aria-label', 'Close navigation');
  }
}

/**
 * Close the sidebar: slide it out, hide backdrop, restore body scroll.
 */
function closeSidebar() {
  if (!sidebarEl) return;
  sidebarOpen = false;

  /* 1. Slide the sidebar out */
  sidebarEl.classList.remove('sidebar--open');

  /* 2. Fade out and hide backdrop */
  if (backdropEl) {
    backdropEl.classList.remove('sidebar-backdrop--visible');

    /* Wait for the CSS fade to finish (280 ms) before display:none */
    setTimeout(() => {
      if (!sidebarOpen) {            /* double-check it wasn't re-opened */
        backdropEl.style.display = 'none';
      }
    }, 300);
  }

  /* 3. Restore body scroll */
  document.body.classList.remove('sidebar-is-open');

  /* 4. Animate X → hamburger */
  if (hamburgerEl) {
    hamburgerEl.classList.remove('hamburger-btn--open');
    hamburgerEl.setAttribute('aria-expanded', 'false');
    hamburgerEl.setAttribute('aria-label', 'Open navigation');
  }
}

/**
 * Toggle between open and closed states.
 */
function toggleSidebar() {
  if (sidebarOpen) {
    closeSidebar();
  } else {
    openSidebar();
  }
}


/* ================================================================
   SECTION 4 — CREATE & INJECT UI ELEMENTS
================================================================ */

/**
 * Build the hamburger <button> and inject it into the header.
 *
 * Layout result:
 *   [hamburger] [title / brand]    [bell] [status]
 *
 * We insert the button as the FIRST child of the header so it
 * sits on the far left, mirroring Discord / Notion / Slack.
 */
function injectHamburger() {
  const header = findHeader();
  if (!header) return null;

  /* Don't inject twice */
  if (header.querySelector('.hamburger-btn')) return header.querySelector('.hamburger-btn');

  /* ── Build the button ── */
  const btn = document.createElement('button');
  btn.className    = 'hamburger-btn';
  btn.type         = 'button';
  btn.setAttribute('aria-label',    'Open navigation');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'mobile-sidebar');

  /* Three bars — CSS animates them into an X when .hamburger-btn--open is added */
  btn.innerHTML = `
    <span class="hamburger-btn__bar" aria-hidden="true"></span>
    <span class="hamburger-btn__bar" aria-hidden="true"></span>
    <span class="hamburger-btn__bar" aria-hidden="true"></span>
  `;

  /* Click: toggle the sidebar */
  btn.addEventListener('click', (e) => {
    e.stopPropagation();   /* prevent the outside-click handler firing immediately */
    toggleSidebar();
  });

  /* Insert as the FIRST child of the header */
  header.insertBefore(btn, header.firstChild);

  return btn;
}

/**
 * Build the backdrop <div> and append it to <body>.
 * Clicking the backdrop closes the sidebar.
 */
function injectBackdrop() {
  /* Don't inject twice */
  const existing = document.getElementById('sidebar-backdrop');
  if (existing) return existing;

  const backdrop = document.createElement('div');
  backdrop.id        = 'sidebar-backdrop';
  backdrop.className = 'sidebar-backdrop';
  backdrop.setAttribute('aria-hidden', 'true');

  /* Click anywhere on the backdrop → close sidebar */
  backdrop.addEventListener('click', () => closeSidebar());

  document.body.appendChild(backdrop);
  return backdrop;
}


/* ================================================================
   SECTION 5 — EVENT LISTENERS
================================================================ */

/**
 * Wire up keyboard (Escape) and window-resize handlers.
 */
function attachGlobalListeners() {

  /* Escape key → close sidebar */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebarOpen) {
      closeSidebar();
    }
  });

  /* Window resize → auto-close sidebar when expanding to desktop */
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && sidebarOpen) {
      closeSidebar();
    }
  });

  /*
   * Close sidebar when a nav link INSIDE it is clicked.
   * This gives the "navigate & auto-close" UX of Discord/Notion.
   * We listen on the sidebar for any <a> click.
   */
  if (sidebarEl) {
    sidebarEl.addEventListener('click', (e) => {
      /* Only act on actual navigation links (not nav-section-labels etc.) */
      const link = e.target.closest('a[href]');
      if (link && window.innerWidth <= 768) {
        /*
         * Close immediately (don't wait for animation) so the
         * next page loads with a clean state.
         */
        closeSidebar();
      }
    });
  }
}


/* ================================================================
   SECTION 6 — PHOTOS PAGE SPECIAL HANDLING
   photos.html already has its own hamburger button (#menu-toggle)
   injected by photos.js.  We connect our logic to it instead of
   creating a duplicate button.
================================================================ */

/**
 * Returns true when we're on the photos page.
 * Detected by the presence of the existing #menu-toggle button.
 */
function isPhotosPage() {
  return !!document.getElementById('menu-toggle');
}

/**
 * On the photos page, wire our openSidebar/closeSidebar logic
 * to the existing #menu-toggle button and the photos sidebar.
 */
function enhancePhotosPage() {
  const existingToggle = document.getElementById('menu-toggle');
  if (!existingToggle) return;

  /* Replace the original click handler with our unified one */
  const clone = existingToggle.cloneNode(true);   /* cloneNode removes old listeners */
  existingToggle.parentNode.replaceChild(clone, existingToggle);

  clone.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSidebar();
  });

  hamburgerEl = clone;   /* point our state to the existing button */
}


/* ================================================================
   SECTION 7 — EVENTS PAGE SPECIAL HANDLING
   events.html renders its nav via  renderNav()  inside events.js
   using innerHTML. The <nav class="nav glass"> is the top bar,
   not a side navigation. The sidebar concept doesn't apply here.
   We skip sidebar injection but still handle the top nav.
================================================================ */

/**
 * Returns true when we're on the events page.
 */
function isEventsPage() {
  return !!document.getElementById('event-form');
}


/* ================================================================
   SECTION 8 — CALENDAR PAGE (index.html)
   index.html has a very simple layout: just a header + main.
   There is no sidebar. We inject a minimal "back to hub" link.
================================================================ */

/**
 * Returns true when we're on the calendar page.
 */
function isCalendarPage() {
  return !!document.getElementById('calendarContainer');
}


/* ================================================================
   SECTION 9 — INITIALISE
================================================================ */

/**
 * Main init function.
 * Called automatically when the DOM is ready.
 */
function initMobileNav() {

  /* ── Events page: no sidebar to manage ── */
  if (isEventsPage()) {
    /* Events page uses a top nav bar (not a sidebar).
       The top-nav is already mobile-friendly via events.css.
       Nothing to do here. */
    return;
  }

  /* ── Calendar page: no sidebar ── */
  if (isCalendarPage()) {
    /* Very simple page layout; no sidebar exists. */
    return;
  }

  /* ── Find the sidebar ── */
  sidebarEl = findSidebar();
  if (!sidebarEl) return;   /* nothing to do if no sidebar found */

  /* Give sidebar an ID for ARIA  aria-controls  reference */
  if (!sidebarEl.id) {
    sidebarEl.id = 'mobile-sidebar';
  }

  /* ── Backdrop ── */
  backdropEl = injectBackdrop();

  /* ── Photos page: reuse existing toggle button ── */
  if (isPhotosPage()) {
    enhancePhotosPage();
  } else {
    /* ── All other pages: inject the hamburger ── */
    hamburgerEl = injectHamburger();
  }

  /* ── Global keyboard + resize listeners ── */
  attachGlobalListeners();
}

/* ── Boot when DOM is ready ── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileNav);
} else {
  /* DOMContentLoaded already fired (script loaded with defer) */
  initMobileNav();
}
