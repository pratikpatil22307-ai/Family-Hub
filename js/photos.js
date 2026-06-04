/**
 * =============================================================
 * FAMILY HUB — PHOTO ALBUMS PAGE
 * photos.js
 *
 * Responsibilities:
 *  1. DATA  — Albums array (single source of truth)
 *  2. STATE — Which album is open, lightbox index, etc.
 *  3. RENDER — Build DOM elements from data
 *  4. EVENTS — Clicks, keyboard shortcuts, sidebar toggle
 *
 * No frameworks, no build step. Pure ES5-compatible JS
 * (with a few ES6+ conveniences like const/let and arrow fns).
 * =============================================================
 */


/* =============================================================
   1. DATA — Albums & Photos
   Each album has:
     id        {number}   — unique identifier
     title     {string}   — display name
     date      {string}   — human-readable date range
     cover     {string}   — URL of the cover image (shown in album grid)
     photos    {Array}    — list of photo objects

   Each photo has:
     id        {number}   — unique identifier within the album
     src       {string}   — full-size image URL
     thumb     {string}   — thumbnail URL (same or smaller version)
     caption   {string}   — short description shown in lightbox
============================================================= */
var ALBUMS = [
  {
    id: 1,
    title: "Summer Vacation",
    date: "July 2024",
    cover: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
    photos: [
      { id: 1,  src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&q=85", thumb: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=75", caption: "Golden hour at the beach" },
      { id: 2,  src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=85", thumb: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=75", caption: "Mountain summit at dawn" },
      { id: 3,  src: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=900&q=85", thumb: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=75", caption: "Calm lake reflection" },
      { id: 4,  src: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=900&q=85", thumb: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&q=75", caption: "Green valley hike" },
      { id: 5,  src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=900&q=85", thumb: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&q=75", caption: "Early morning trail" },
      { id: 6,  src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=900&q=85", thumb: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=400&q=75", caption: "Campfire under the stars" },
      { id: 7,  src: "https://images.unsplash.com/photo-1517760444937-f6397edcbbcd?w=900&q=85", thumb: "https://images.unsplash.com/photo-1517760444937-f6397edcbbcd?w=400&q=75", caption: "Beach volleyball game" },
      { id: 8,  src: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=900&q=85", thumb: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=400&q=75", caption: "Surfing at sunset" }
    ]
  },

  {
    id: 2,
    title: "Birthday Celebrations",
    date: "March 2024",
    cover: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600&q=80",
    photos: [
      { id: 1,  src: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=900&q=85", thumb: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&q=75", caption: "Birthday cake moment" },
      { id: 2,  src: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=900&q=85", thumb: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&q=75", caption: "Party balloons" },
      { id: 3,  src: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&q=85", thumb: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=75", caption: "Family all together" },
      { id: 4,  src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=85", thumb: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=75", caption: "Unwrapping gifts" },
      { id: 5,  src: "https://images.unsplash.com/photo-1620037677085-5b1e2eb94b19?w=900&q=85", thumb: "https://images.unsplash.com/photo-1620037677085-5b1e2eb94b19?w=400&q=75", caption: "Confetti surprise" },
      { id: 6,  src: "https://images.unsplash.com/photo-1559181567-c3190bead4e0?w=900&q=85", thumb: "https://images.unsplash.com/photo-1559181567-c3190bead4e0?w=400&q=75", caption: "Strawberry layer cake" }
    ]
  },

  {
    id: 3,
    title: "School Memories",
    date: "Sep 2023 – Jun 2024",
    cover: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80",
    photos: [
      { id: 1,  src: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=900&q=85", thumb: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=75", caption: "First day of school" },
      { id: 2,  src: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=900&q=85", thumb: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=400&q=75", caption: "Graduation ceremony" },
      { id: 3,  src: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=900&q=85", thumb: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&q=75", caption: "Science fair project" },
      { id: 4,  src: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=900&q=85", thumb: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&q=75", caption: "Classroom fun" },
      { id: 5,  src: "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=900&q=85", thumb: "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=400&q=75", caption: "Sports day" },
      { id: 6,  src: "https://images.unsplash.com/photo-1544717305-996b815c338c?w=900&q=85", thumb: "https://images.unsplash.com/photo-1544717305-996b815c338c?w=400&q=75", caption: "Art class project" },
      { id: 7,  src: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=900&q=85", thumb: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=400&q=75", caption: "Reading corner" }
    ]
  },

  {
    id: 4,
    title: "Holidays & Festivals",
    date: "Dec 2023",
    cover: "https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=600&q=80",
    photos: [
      { id: 1,  src: "https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=900&q=85", thumb: "https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=400&q=75", caption: "Holiday lights evening" },
      { id: 2,  src: "https://images.unsplash.com/photo-1482517967863-00e15c9b44be?w=900&q=85", thumb: "https://images.unsplash.com/photo-1482517967863-00e15c9b44be?w=400&q=75", caption: "Festival fireworks" },
      { id: 3,  src: "https://images.unsplash.com/photo-1543589077-47d81606c1bf?w=900&q=85", thumb: "https://images.unsplash.com/photo-1543589077-47d81606c1bf?w=400&q=75", caption: "Festive decorations" },
      { id: 4,  src: "https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=900&q=85", thumb: "https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=400&q=75", caption: "Family traditions" },
      { id: 5,  src: "https://images.unsplash.com/photo-1606787620819-8bdf0c44c293?w=900&q=85", thumb: "https://images.unsplash.com/photo-1606787620819-8bdf0c44c293?w=400&q=75", caption: "Holiday feast" },
      { id: 6,  src: "https://images.unsplash.com/photo-1548032885-b5e38734688a?w=900&q=85", thumb: "https://images.unsplash.com/photo-1548032885-b5e38734688a?w=400&q=75", caption: "Snow day fun" },
      { id: 7,  src: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&q=85", thumb: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=75", caption: "New Year countdown" },
      { id: 8,  src: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=900&q=85", thumb: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&q=75", caption: "Cookie baking day" }
    ]
  },

  {
    id: 5,
    title: "Weekend Adventures",
    date: "2024",
    cover: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=80",
    photos: [
      { id: 1,  src: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=900&q=85", thumb: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&q=75", caption: "Sunrise forest hike" },
      { id: 2,  src: "https://images.unsplash.com/photo-1533240332313-0db49b459ad6?w=900&q=85", thumb: "https://images.unsplash.com/photo-1533240332313-0db49b459ad6?w=400&q=75", caption: "Kayaking together" },
      { id: 3,  src: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=900&q=85", thumb: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&q=75", caption: "Camping setup" },
      { id: 4,  src: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=900&q=85", thumb: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=75", caption: "Wild forest path" }
    ]
  },

  {
    id: 6,
    title: "Backyard & Home",
    date: "2023 – 2024",
    cover: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80",
    photos: [
      { id: 1,  src: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=85", thumb: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=75", caption: "Garden in bloom" },
      { id: 2,  src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=85", thumb: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=75", caption: "Sunday brunch table" },
      { id: 3,  src: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=900&q=85", thumb: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&q=75", caption: "Homemade pancakes" },
      { id: 4,  src: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=900&q=85", thumb: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=75", caption: "Fresh from the oven" },
      { id: 5,  src: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=900&q=85", thumb: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=75", caption: "Family breakfast" }
    ]
  }
];

/* Hardcoded family member count (in a real app, from an API) */
var FAMILY_MEMBERS = 5;


/* =============================================================
   2. STATE
   A single object tracks everything that can change.
   Never mutate DOM without going through renderXxx().
============================================================= */
var state = {
  currentAlbumId: null,   // null = album list view; number = album detail view
  lightboxOpen:   false,
  lightboxIndex:  0,      // which photo in the current album is shown
  sidebarOpen:    false   // tablet/mobile sidebar toggle
};


/* =============================================================
   3. DOM REFERENCES
   Grab every element once on load; reuse throughout.
============================================================= */
var dom = {
  sidebar:        document.getElementById("sidebar"),
  menuToggle:     document.getElementById("menu-toggle"),
  breadcrumb:     document.getElementById("breadcrumb"),

  viewAlbums:     document.getElementById("view-albums"),
  viewPhotos:     document.getElementById("view-photos"),

  statsRow:       document.getElementById("stats-row"),
  albumGrid:      document.getElementById("album-grid"),

  albumDetailTitle: document.getElementById("album-detail-title"),
  albumDetailDesc:  document.getElementById("album-detail-desc"),
  photoGrid:        document.getElementById("photo-grid"),
  backBtn:          document.getElementById("back-btn"),

  lightbox:         document.getElementById("lightbox"),
  lightboxBackdrop: document.getElementById("lightbox-backdrop"),
  lightboxClose:    document.getElementById("lightbox-close"),
  lightboxPrev:     document.getElementById("lightbox-prev"),
  lightboxNext:     document.getElementById("lightbox-next"),
  lightboxImage:    document.getElementById("lightbox-image"),
  lightboxCaption:  document.getElementById("lightbox-caption"),
  lightboxCounter:  document.getElementById("lightbox-counter")
};


/* =============================================================
   4. HELPER FUNCTIONS
   Small, reusable utilities.
============================================================= */

/**
 * Creates a DOM element with optional class, text content, and attributes.
 * @param {string} tag        - e.g. "div", "img", "button"
 * @param {string} [className]
 * @param {string} [text]     - innerText
 * @param {Object} [attrs]    - key/value attribute pairs
 * @returns {HTMLElement}
 */
function createElement(tag, className, text, attrs) {
  var el = document.createElement(tag);
  if (className) el.className = className;
  if (text)      el.textContent = text;
  if (attrs) {
    for (var key in attrs) {
      if (attrs.hasOwnProperty(key)) {
        el.setAttribute(key, attrs[key]);
      }
    }
  }
  return el;
}

/**
 * Returns the total photo count across all albums.
 * @returns {number}
 */
function getTotalPhotos() {
  return ALBUMS.reduce(function(sum, album) {
    return sum + album.photos.length;
  }, 0);
}

/**
 * Finds an album by its id.
 * @param {number} id
 * @returns {Object|undefined}
 */
function findAlbumById(id) {
  return ALBUMS.find(function(album) {
    return album.id === id;
  });
}

/**
 * Shows one view and hides the other.
 * @param {"albums"|"photos"} viewName
 */
function switchView(viewName) {
  if (viewName === "albums") {
    dom.viewAlbums.removeAttribute("hidden");
    dom.viewPhotos.setAttribute("hidden", "");
  } else {
    dom.viewAlbums.setAttribute("hidden", "");
    dom.viewPhotos.removeAttribute("hidden");
  }
}


/* =============================================================
   5. RENDER FUNCTIONS
   Each builds a section of the UI from data.
============================================================= */

/* ── 5a. Statistics Row ─────────────────────────────────── */
/**
 * Builds and injects the three stat cards into #stats-row.
 */
function renderStats() {
  var totalAlbums  = ALBUMS.length;
  var totalPhotos  = getTotalPhotos();
  var totalMembers = FAMILY_MEMBERS;

  var statsData = [
    { icon: "📁", label: "Total Albums",  value: totalAlbums,  colorClass: "stat-card__icon--albums"  },
    { icon: "🖼️", label: "Total Photos",  value: totalPhotos,  colorClass: "stat-card__icon--photos"  },
    { icon: "👨‍👩‍👧‍👦", label: "Family Members", value: totalMembers, colorClass: "stat-card__icon--members" }
  ];

  /* Clear existing content */
  dom.statsRow.innerHTML = "";

  statsData.forEach(function(stat) {
    /* .stat-card wrapper */
    var card = createElement("div", "stat-card");
    card.setAttribute("role", "figure");
    card.setAttribute("aria-label", stat.label + ": " + stat.value);

    /* Coloured icon square */
    var iconBox = createElement("div", "stat-card__icon " + stat.colorClass, stat.icon);
    iconBox.setAttribute("aria-hidden", "true");

    /* Text block */
    var body   = createElement("div",  "stat-card__body");
    var number = createElement("span", "stat-card__number", String(stat.value));
    var label  = createElement("span", "stat-card__label",  stat.label);

    body.appendChild(number);
    body.appendChild(label);

    card.appendChild(iconBox);
    card.appendChild(body);

    dom.statsRow.appendChild(card);
  });
}


/* ── 5b. Album Grid ─────────────────────────────────────── */
/**
 * Builds and injects album cards into #album-grid.
 * Each card is clickable and opens the album detail view.
 */
function renderAlbumGrid() {
  /* Clear existing content */
  dom.albumGrid.innerHTML = "";

  ALBUMS.forEach(function(album) {
    var photoCount = album.photos.length;

    /* ── Card container ── */
    var card = createElement("article", "album-card");
    card.setAttribute("role", "listitem");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", album.title + ", " + photoCount + " photos");
    /* Store album id for the click handler */
    card.dataset.albumId = String(album.id);

    /* ── Cover image wrapper ── */
    var coverWrap = createElement("div", "album-card__cover-wrap");

    var img = createElement("img", "album-card__cover");
    img.src     = album.cover;
    img.alt     = album.title + " cover photo";
    img.loading = "lazy";

    /* Gradient overlay */
    var overlay = createElement("div", "album-card__cover-overlay");
    overlay.setAttribute("aria-hidden", "true");

    /* Photo count badge */
    var badge = createElement("span", "album-card__badge", photoCount + " photos");
    badge.setAttribute("aria-hidden", "true"); /* already in aria-label */

    coverWrap.appendChild(img);
    coverWrap.appendChild(overlay);
    coverWrap.appendChild(badge);

    /* ── Card body (title + meta) ── */
    var body  = createElement("div",  "album-card__body");
    var title = createElement("h3",   "album-card__title", album.title);
    var meta  = createElement("div",  "album-card__meta");

    var dateSpan  = createElement("span", null, album.date);
    var dot       = createElement("span", "album-card__dot");
    dot.setAttribute("aria-hidden", "true");
    var countSpan = createElement("span", null, photoCount + " photos");

    meta.appendChild(dateSpan);
    meta.appendChild(dot);
    meta.appendChild(countSpan);

    body.appendChild(title);
    body.appendChild(meta);

    /* ── Assemble card ── */
    card.appendChild(coverWrap);
    card.appendChild(body);

    /* ── Click & keyboard handler ── */
    function openThisAlbum(e) {
      openAlbum(album.id);
    }
    card.addEventListener("click",   openThisAlbum);
    card.addEventListener("keydown", function(e) {
      /* Open on Enter or Space key */
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openThisAlbum(e);
      }
    });

    dom.albumGrid.appendChild(card);
  });
}


/* ── 5c. Photo Grid ─────────────────────────────────────── */
/**
 * Builds the photo grid for a given album.
 * @param {Object} album - the album object from ALBUMS
 */
function renderPhotoGrid(album) {
  /* Clear existing photos */
  dom.photoGrid.innerHTML = "";

  album.photos.forEach(function(photo, index) {
    /* ── Cell wrapper ── */
    var cell = createElement("div", "photo-cell");
    cell.setAttribute("role", "listitem");
    cell.setAttribute("tabindex", "0");
    cell.setAttribute("aria-label", "Photo " + (index + 1) + ": " + photo.caption);
    cell.dataset.photoIndex = String(index);

    /* ── Thumbnail image ── */
    var img = createElement("img", "photo-cell__image");
    img.src     = photo.thumb;
    img.alt     = photo.caption;
    img.loading = "lazy";

    /* ── Hover overlay with caption ── */
    var overlay = createElement("div", "photo-cell__overlay");
    overlay.setAttribute("aria-hidden", "true");
    var caption = createElement("span", "photo-cell__caption", photo.caption);
    overlay.appendChild(caption);

    /* ── Assemble ── */
    cell.appendChild(img);
    cell.appendChild(overlay);

    /* ── Click & keyboard handler ── */
    function openThisPhoto(e) {
      openLightbox(index);
    }
    cell.addEventListener("click",   openThisPhoto);
    cell.addEventListener("keydown", function(e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openThisPhoto(e);
      }
    });

    dom.photoGrid.appendChild(cell);
  });
}


/* ── 5d. Breadcrumb ─────────────────────────────────────── */
/**
 * Updates the breadcrumb trail in the topbar.
 * @param {string|null} albumTitle - pass null to show only "Photos"
 */
function renderBreadcrumb(albumTitle) {
  dom.breadcrumb.innerHTML = "";

  /* "Photos" segment — always first */
  var photosItem = createElement("li", "topbar__breadcrumb-item");

  if (albumTitle) {
    /* Make "Photos" a clickable link when inside an album */
    var photosLink = createElement("a", null, "Photos");
    photosLink.href = "#";
    photosLink.addEventListener("click", function(e) {
      e.preventDefault();
      closeAlbum();
    });
    photosItem.appendChild(photosLink);
  } else {
    photosItem.textContent = "Photos";
    photosItem.classList.add("topbar__breadcrumb-item--active");
  }
  dom.breadcrumb.appendChild(photosItem);

  /* Separator + album name when inside an album */
  if (albumTitle) {
    var sep = createElement("li", "topbar__breadcrumb-sep");
    sep.textContent = "›";
    sep.setAttribute("aria-hidden", "true");

    var albumItem = createElement("li", "topbar__breadcrumb-item topbar__breadcrumb-item--active");
    albumItem.textContent = albumTitle;

    dom.breadcrumb.appendChild(sep);
    dom.breadcrumb.appendChild(albumItem);
  }
}


/* =============================================================
   6. VIEW CONTROLLERS
   openAlbum, closeAlbum, openLightbox, closeLightbox
============================================================= */

/* ── 6a. Open an album ─────────────────────────────────── */
/**
 * Switches from the album grid to the photo grid for the given album.
 * @param {number} albumId
 */
function openAlbum(albumId) {
  var album = findAlbumById(albumId);
  if (!album) return;

  /* Update state */
  state.currentAlbumId = albumId;

  /* Update album detail heading */
  dom.albumDetailTitle.textContent = album.title;
  dom.albumDetailDesc.textContent  = album.photos.length + " photos · " + album.date;

  /* Render photos */
  renderPhotoGrid(album);

  /* Update breadcrumb */
  renderBreadcrumb(album.title);

  /* Switch view */
  switchView("photos");

  /* Scroll to top of content area */
  dom.viewPhotos.scrollIntoView({ behavior: "smooth", block: "start" });
}


/* ── 6b. Close album (go back to list) ──────────────────── */
/**
 * Returns to the album grid view.
 */
function closeAlbum() {
  /* Reset state */
  state.currentAlbumId = null;

  /* Update breadcrumb */
  renderBreadcrumb(null);

  /* Switch view */
  switchView("albums");

  /* Scroll to top */
  dom.viewAlbums.scrollIntoView({ behavior: "smooth", block: "start" });
}


/* ── 6c. Open lightbox ─────────────────────────────────── */
/**
 * Opens the lightbox overlay for the photo at `index`
 * in the currently open album.
 * @param {number} index
 */
function openLightbox(index) {
  var album = findAlbumById(state.currentAlbumId);
  if (!album) return;

  /* Clamp index to valid range */
  state.lightboxIndex = Math.max(0, Math.min(index, album.photos.length - 1));
  state.lightboxOpen  = true;

  /* Render the photo */
  renderLightboxPhoto(album);

  /* Show the lightbox */
  dom.lightbox.removeAttribute("hidden");

  /* Prevent body scroll while lightbox is open */
  document.body.style.overflow = "hidden";

  /* Focus the close button for accessibility */
  dom.lightboxClose.focus();
}


/* ── 6d. Close lightbox ─────────────────────────────────── */
/**
 * Hides the lightbox overlay.
 */
function closeLightbox() {
  state.lightboxOpen = false;

  dom.lightbox.setAttribute("hidden", "");

  /* Restore body scroll */
  document.body.style.overflow = "";
}


/* ── 6e. Navigate lightbox ─────────────────────────────── */
/**
 * Moves to the previous or next photo in the lightbox.
 * @param {number} direction - +1 for next, -1 for previous
 */
function navigateLightbox(direction) {
  var album = findAlbumById(state.currentAlbumId);
  if (!album) return;

  var newIndex = state.lightboxIndex + direction;

  /* Clamp: don't wrap around (wrapping can be confusing) */
  if (newIndex < 0 || newIndex >= album.photos.length) return;

  state.lightboxIndex = newIndex;
  renderLightboxPhoto(album);
}


/* ── 6f. Render current photo in lightbox ─────────────── */
/**
 * Updates the image, caption, counter and button states
 * for the current lightbox photo.
 * @param {Object} album
 */
function renderLightboxPhoto(album) {
  var photo = album.photos[state.lightboxIndex];
  var total = album.photos.length;

  /* Set image */
  dom.lightboxImage.src = photo.src;
  dom.lightboxImage.alt = photo.caption;

  /* Set caption */
  dom.lightboxCaption.textContent = photo.caption || "";

  /* Counter: "3 / 8" */
  dom.lightboxCounter.textContent = (state.lightboxIndex + 1) + " / " + total;

  /* Disable nav buttons at boundaries */
  dom.lightboxPrev.disabled = (state.lightboxIndex === 0);
  dom.lightboxNext.disabled = (state.lightboxIndex === total - 1);
}


/* =============================================================
   7. SIDEBAR TOGGLE (tablet & mobile)
============================================================= */

/**
 * Opens or closes the sidebar on tablet/mobile.
 */
function toggleSidebar() {
  state.sidebarOpen = !state.sidebarOpen;

  if (state.sidebarOpen) {
    dom.sidebar.classList.add("sidebar--open");
    dom.menuToggle.setAttribute("aria-expanded", "true");
  } else {
    dom.sidebar.classList.remove("sidebar--open");
    dom.menuToggle.setAttribute("aria-expanded", "false");
  }
}

/**
 * Closes the sidebar (called when clicking main content on mobile).
 */
function closeSidebar() {
  if (state.sidebarOpen) {
    state.sidebarOpen = false;
    dom.sidebar.classList.remove("sidebar--open");
    dom.menuToggle.setAttribute("aria-expanded", "false");
  }
}


/* =============================================================
   8. EVENT LISTENERS
============================================================= */

/* ── Back button (album → list) ─── */
dom.backBtn.addEventListener("click", closeAlbum);

/* ── Mobile sidebar toggle ─── */
dom.menuToggle.addEventListener("click", function(e) {
  e.stopPropagation(); /* prevent immediately re-closing */
  toggleSidebar();
});

/* ── Close sidebar when clicking main content on mobile ─── */
document.getElementById("main-content").addEventListener("click", function() {
  closeSidebar();
});

/* ── Lightbox controls ─── */
dom.lightboxClose.addEventListener("click", closeLightbox);
dom.lightboxBackdrop.addEventListener("click", closeLightbox);
dom.lightboxPrev.addEventListener("click", function() { navigateLightbox(-1); });
dom.lightboxNext.addEventListener("click", function() { navigateLightbox(+1); });

/* ── Keyboard navigation ─── */
document.addEventListener("keydown", function(e) {
  if (!state.lightboxOpen) return;

  switch (e.key) {
    case "Escape":
      closeLightbox();
      break;
    case "ArrowLeft":
      navigateLightbox(-1);
      break;
    case "ArrowRight":
      navigateLightbox(+1);
      break;
  }
});

/* ── Touch/swipe support in lightbox ─── */
(function() {
  var touchStartX = 0;

  dom.lightbox.addEventListener("touchstart", function(e) {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  dom.lightbox.addEventListener("touchend", function(e) {
    var delta = e.changedTouches[0].screenX - touchStartX;
    var THRESHOLD = 50; /* px */

    if (delta > THRESHOLD)  navigateLightbox(-1); /* swipe right = prev */
    if (delta < -THRESHOLD) navigateLightbox(+1); /* swipe left  = next */
  }, { passive: true });
}());


/* =============================================================
   9. INITIALISE
   Called once on page load to render the initial album list view.
============================================================= */
function init() {
  /* Render stats and album grid */
  renderStats();
  renderAlbumGrid();
  renderBreadcrumb(null);

  /* Make sure correct view is visible */
  switchView("albums");

  /* Console confirmation for developers */
  console.log(
    "[Family Hub] Photo Albums loaded — " +
    ALBUMS.length + " albums, " +
    getTotalPhotos() + " photos."
  );
}

/* Kick everything off */
init();
