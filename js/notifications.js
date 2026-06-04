/* ================================================================
   FAMILY HUB — notifications.js
   
   Notification Center — fully standalone module.
   Plugs into any Family Hub page that includes it.

   HOW IT WORKS:
   ─────────────
   1. Notifications are objects stored as a JSON array in
      localStorage under the key "fh.notifications".

   2. On every page load we "sync" — we read the current
      events from localStorage and create notifications for
      anything that is new or upcoming.

   3. The bell icon + badge live in the <header>.
      Clicking the bell toggles a dropdown panel.

   4. Users can mark individual items as read, or clear all.
   ================================================================ */


/* ================================================================
   1.  STORAGE KEY & HELPERS
================================================================ */

const NOTIF_KEY = 'fh.notifications';   // where we store notifications
const EVENTS_KEY = 'fh.events';          // matches events.js KEY.EVENTS
const MESSAGES_KEY = 'fh.messages';      // matches events.js KEY.MESSAGES

/**
 * Load a value from localStorage; return `fallback` if missing/invalid.
 * @param {string} key
 * @param {*} fallback
 */
function nLoad(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Save any value as JSON to localStorage.
 * @param {string} key
 * @param {*} value
 */
function nSave(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Generate a short unique ID (no dependencies).
 * @returns {string}
 */
function nUid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}


/* ================================================================
   2.  NOTIFICATION DATA MODEL
   Each notification object looks like this:
   {
     id:          string,   — unique identifier
     type:        string,   — 'event' | 'birthday' | 'chat' | 'photo'
     title:       string,   — bold heading shown in the panel
     description: string,   — supporting detail text
     timestamp:   number,   — Date.now() when created
     read:        boolean,  — false = unread (shows blue dot)
     sourceId:    string,   — id of the source item (event id, etc.)
   }
================================================================ */

/**
 * Read all notifications from localStorage.
 * @returns {Array}
 */
function getAllNotifications() {
  return nLoad(NOTIF_KEY, []);
}

/**
 * Persist the notification array to localStorage.
 * @param {Array} list
 */
function saveAllNotifications(list) {
  nSave(NOTIF_KEY, list);
}

/**
 * Add a single new notification.
 * Prevents duplicates using the sourceId field so we don't
 * spam the user every time the page refreshes.
 *
 * @param {Object} notif  — partial object; id & timestamp added here
 * @param {string} notif.type
 * @param {string} notif.title
 * @param {string} notif.description
 * @param {string} notif.sourceId   — unique key for dedup check
 */
function addNotification({ type, title, description, sourceId }) {
  const list = getAllNotifications();

  // ── Deduplication: don't add the same notification twice ──
  const alreadyExists = list.some(n => n.sourceId === sourceId);
  if (alreadyExists) return;

  list.unshift({                       // unshift = add to front (newest first)
    id:          nUid(),
    type,
    title,
    description,
    timestamp:   Date.now(),
    read:        false,
    sourceId,
  });

  // Keep a maximum of 50 notifications to avoid bloating localStorage
  saveAllNotifications(list.slice(0, 50));
}

/**
 * Mark a single notification as read.
 * @param {string} id
 */
function markAsRead(id) {
  const list = getAllNotifications().map(n =>
    n.id === id ? { ...n, read: true } : n
  );
  saveAllNotifications(list);
  renderNotificationPanel();  // re-render immediately
  updateBadge();
}

/**
 * Mark ALL notifications as read at once.
 */
function markAllAsRead() {
  const list = getAllNotifications().map(n => ({ ...n, read: true }));
  saveAllNotifications(list);
  renderNotificationPanel();
  updateBadge();
}

/**
 * Delete every notification (clear all).
 */
function clearAllNotifications() {
  saveAllNotifications([]);
  renderNotificationPanel();
  updateBadge();
}

/**
 * Count how many notifications are still unread.
 * @returns {number}
 */
function unreadCount() {
  return getAllNotifications().filter(n => !n.read).length;
}


/* ================================================================
   3.  SYNC — Generate notifications from events data
   Called on page load to create notifications for:
     • Upcoming events (within 7 days)
     • Confirmed events
     • Upcoming birthdays (hardcoded for demo + birthday events)
     • New chat messages (last 24 h from others)
   ================================================================ */

/**
 * Main sync function — reads events + messages and creates
 * notifications for anything noteworthy.
 * Safe to call multiple times; deduplication prevents repeats.
 */
function syncNotificationsFromStorage() {
  syncEventNotifications();
  syncBirthdayNotifications();
  syncChatNotifications();
}

/**
 * Create notifications for upcoming and newly-confirmed events.
 */
function syncEventNotifications() {
  const events = nLoad(EVENTS_KEY, []);
  const now    = new Date();

  events.forEach(ev => {
    const startDate = ev.startDate ? new Date(ev.startDate + 'T00:00:00') : null;
    if (!startDate) return;

    const daysUntil = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));

    // ── Confirmed event notification ──
    if (ev.status === 'confirmed') {
      addNotification({
        type:        'event',
        title:       `✅ Event confirmed: ${ev.title}`,
        description: daysUntil > 0
          ? `Happening in ${daysUntil} day${daysUntil === 1 ? '' : 's'} · ${ev.location || formatDate(ev.startDate)}`
          : `Happening today! · ${ev.location || ''}`,
        sourceId: `event-confirmed-${ev.id}`,
      });
    }

    // ── Upcoming event (within 7 days, not yet confirmed) ──
    if (ev.status !== 'confirmed' && daysUntil >= 0 && daysUntil <= 7) {
      addNotification({
        type:        'event',
        title:       `📅 Upcoming: ${ev.title}`,
        description: `In ${daysUntil} day${daysUntil === 1 ? '' : 's'} · ${ev.category}${ev.location ? ' · ' + ev.location : ''}`,
        sourceId: `event-upcoming-${ev.id}`,
      });
    }

    // ── Birthday category event ──
    if (ev.category === 'Birthday' && daysUntil >= 0 && daysUntil <= 14) {
      addNotification({
        type:        'birthday',
        title:       `🎂 Birthday soon: ${ev.title}`,
        description: `${daysUntil === 0 ? 'Today!' : `In ${daysUntil} day${daysUntil === 1 ? '' : 's'}`} · Created by ${ev.createdByName || 'Family'}`,
        sourceId: `event-birthday-${ev.id}`,
      });
    }
  });

  // ── Static birthday reminders (demo data from the dashboard) ──
  const staticBirthdays = [
    { name: 'Alice',      daysUntil: 3,  id: 'static-alice'   },
    { name: 'Grandpa Joe',daysUntil: 11, id: 'static-gpa-joe' },
    { name: 'Aunt Mary',  daysUntil: 25, id: 'static-aunt-mary'},
  ];
  staticBirthdays.forEach(b => {
    addNotification({
      type:        'birthday',
      title:       `🎂 ${b.name}'s birthday is coming up!`,
      description: `In ${b.daysUntil} day${b.daysUntil === 1 ? '' : 's'} — don't forget to send wishes! 🎉`,
      sourceId:    b.id,
    });
  });
}

/**
 * Scan chat messages from the last 24 hours (sent by others)
 * and create a bundled "new messages" notification per channel.
 */
function syncChatNotifications() {
  const allMessages = nLoad(MESSAGES_KEY, {});
  const myId        = localStorage.getItem('fh.userId');
  const cutoff      = Date.now() - 24 * 60 * 60 * 1000;   // 24 h ago

  // Group recent messages by channel
  Object.entries(allMessages).forEach(([channel, msgs]) => {
    if (!Array.isArray(msgs)) return;

    // Messages from others in the last 24 h
    const recent = msgs.filter(m => m.senderId !== myId && m.ts >= cutoff);
    if (!recent.length) return;

    // Build a short preview (latest message)
    const latest   = recent[recent.length - 1];
    const preview  = latest.text.length > 50
      ? latest.text.slice(0, 50) + '…'
      : latest.text;

    // Use a time-bucketed sourceId so this refreshes once per hour
    const hourBucket = Math.floor(Date.now() / (1000 * 60 * 60));

    addNotification({
      type:        'chat',
      title:       `💬 New messages in #${channel}`,
      description: `${latest.sender}: "${preview}"`,
      sourceId:    `chat-${channel}-${hourBucket}`,
    });
  });
}

/**
 * Birthday notifications are already handled inside syncEventNotifications.
 * This is a placeholder for any extra birthday logic you might add later.
 */
function syncBirthdayNotifications() {
  // See syncEventNotifications — birthday category events are handled there
}


/* ================================================================
   4.  UI HELPERS
================================================================ */

/**
 * Format an ISO date string (YYYY-MM-DD) to a readable short date.
 * @param {string} iso
 * @returns {string}
 */
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Format a Unix timestamp to a relative time string ("2h ago", "just now").
 * @param {number} ts  — Date.now() value
 * @returns {string}
 */
function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);

  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return formatDate(new Date(ts).toISOString().slice(0, 10));
}

/**
 * Map a notification type to an emoji icon.
 * @param {string} type
 * @returns {string}
 */
function notifIcon(type) {
  return {
    event:    '📅',
    birthday: '🎂',
    chat:     '💬',
    photo:    '📷',
  }[type] || '🔔';
}


/* ================================================================
   5.  RENDER — Build the notification dropdown HTML
================================================================ */

/**
 * Render (or re-render) all items inside the notification panel.
 * Called after any state change (mark read, clear, etc.)
 */
function renderNotificationPanel() {
  const panel = document.getElementById('notif-panel');
  if (!panel) return;   // panel not in DOM yet (shouldn't happen)

  const list = getAllNotifications();

  if (list.length === 0) {
    // ── Empty state ──
    panel.querySelector('.notif-list').innerHTML = `
      <div class="notif-empty">
        <div class="notif-empty-icon">🔔</div>
        <div class="notif-empty-title">All caught up!</div>
        <div class="notif-empty-sub">No notifications right now.</div>
      </div>`;
    return;
  }

  // ── Notification items ──
  const itemsHTML = list.map(n => `
    <div class="notif-item ${n.read ? 'notif-item--read' : 'notif-item--unread'}"
         data-id="${n.id}">
      <!-- Left: type icon -->
      <div class="notif-icon-wrap notif-icon-wrap--${n.type}">
        <span class="notif-type-icon">${notifIcon(n.type)}</span>
      </div>

      <!-- Middle: text -->
      <div class="notif-body">
        <div class="notif-title">${escapeNotif(n.title)}</div>
        <div class="notif-desc">${escapeNotif(n.description)}</div>
        <div class="notif-time">${timeAgo(n.timestamp)}</div>
      </div>

      <!-- Right: unread dot / mark-read button -->
      <div class="notif-actions">
        ${!n.read
          ? `<button class="notif-read-btn"
                     onclick="markAsRead('${n.id}')"
                     title="Mark as read">●</button>`
          : `<span class="notif-read-check" title="Read">✓</span>`
        }
      </div>
    </div>
  `).join('');

  panel.querySelector('.notif-list').innerHTML = itemsHTML;
}

/**
 * Escape special HTML characters to prevent XSS when inserting
 * notification text into innerHTML.
 * @param {string} s
 * @returns {string}
 */
function escapeNotif(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}


/* ================================================================
   6.  BADGE — the red unread-count bubble on the bell icon
================================================================ */

/**
 * Update the number shown in the notification badge.
 * Hides the badge entirely when count is 0.
 */
function updateBadge() {
  const badge = document.getElementById('notif-badge');
  if (!badge) return;

  const count = unreadCount();

  if (count === 0) {
    badge.style.display = 'none';
    badge.textContent   = '';
  } else {
    badge.style.display = 'flex';
    badge.textContent   = count > 99 ? '99+' : String(count);
  }
}


/* ================================================================
   7.  INJECT HTML — bell icon + dropdown panel into the header
================================================================ */

/**
 * Inject the notification bell + panel into the existing
 * Family Hub header element.
 *
 * The bell sits between the existing header content and the
 * right-hand "4 members online" status indicator.
 *
 * We use insertAdjacentHTML to avoid disrupting existing elements.
 */
function injectNotificationUI() {
  const header = document.querySelector('header');
  if (!header) return;

  // Don't inject twice (in case this is called more than once)
  if (document.getElementById('notif-bell-wrap')) return;

  // The full bell + panel HTML block
  const html = `
    <!-- =====================================================
         NOTIFICATION CENTER
         bell-wrap positions the badge and panel correctly.
    ===================================================== -->
    <div id="notif-bell-wrap" class="notif-bell-wrap" role="region" aria-label="Notifications">

      <!-- Bell button -->
      <button id="notif-bell-btn"
              class="notif-bell-btn"
              aria-haspopup="true"
              aria-expanded="false"
              aria-controls="notif-panel"
              title="Notifications">
        <!-- Bell SVG icon -->
        <svg class="notif-bell-svg" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round"
             aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>

        <!-- Unread count badge (hidden when 0) -->
        <span id="notif-badge" class="notif-badge" aria-live="polite" style="display:none"></span>
      </button>

      <!-- ─── Dropdown Panel ─── -->
      <div id="notif-panel"
           class="notif-panel glass-notif"
           role="dialog"
           aria-modal="false"
           aria-label="Notification panel"
           hidden>

        <!-- Panel header row -->
        <div class="notif-panel-header">
          <span class="notif-panel-title">🔔 Notifications</span>
          <div class="notif-panel-actions">
            <button class="notif-action-btn" onclick="markAllAsRead()" title="Mark all as read">
              ✓ All read
            </button>
            <button class="notif-action-btn notif-action-btn--danger" onclick="clearAllNotifications()" title="Clear all">
              🗑 Clear
            </button>
          </div>
        </div>

        <!-- Scrollable list of notifications — filled by renderNotificationPanel() -->
        <div class="notif-list" role="list"></div>

      </div>
      <!-- end #notif-panel -->

    </div>
    <!-- end #notif-bell-wrap -->
  `;

  // Insert the bell just before the existing .header-status div
  // so it sits neatly on the right side of the header
  const statusDiv = header.querySelector('.header-status');
  if (statusDiv) {
    statusDiv.insertAdjacentHTML('beforebegin', html);
  } else {
    // Fallback: append to header
    header.insertAdjacentHTML('beforeend', html);
  }
}


/* ================================================================
   8.  TOGGLE — open / close the dropdown panel
================================================================ */

/** Whether the panel is currently visible */
let notifPanelOpen = false;

/**
 * Toggle the notification panel open or closed.
 * Also marks all visible items as read after a short delay
 * to mimic real notification UX.
 */
function toggleNotifPanel() {
  const panel  = document.getElementById('notif-panel');
  const btn    = document.getElementById('notif-bell-btn');
  if (!panel || !btn) return;

  notifPanelOpen = !notifPanelOpen;

  if (notifPanelOpen) {
    // Show
    panel.removeAttribute('hidden');
    panel.classList.add('notif-panel--open');
    btn.setAttribute('aria-expanded', 'true');
    btn.classList.add('notif-bell-btn--active');
    renderNotificationPanel();    // fresh render when opening
  } else {
    // Hide
    closeNotifPanel();
  }
}

/**
 * Close the panel (without toggling — used by outside-click handler).
 */
function closeNotifPanel() {
  const panel = document.getElementById('notif-panel');
  const btn   = document.getElementById('notif-bell-btn');
  if (!panel) return;

  notifPanelOpen = false;
  panel.setAttribute('hidden', '');
  panel.classList.remove('notif-panel--open');
  if (btn) {
    btn.setAttribute('aria-expanded', 'false');
    btn.classList.remove('notif-bell-btn--active');
  }
}


/* ================================================================
   9.  EVENT LISTENERS — wire up button clicks and outside-click
================================================================ */

/**
 * Attach all event listeners after the DOM is ready.
 * Called from initNotifications().
 */
function attachNotifListeners() {
  // Bell button → toggle panel
  const bellBtn = document.getElementById('notif-bell-btn');
  if (bellBtn) {
    bellBtn.addEventListener('click', (e) => {
      e.stopPropagation();    // prevent the outside-click handler firing immediately
      toggleNotifPanel();
    });
  }

  // Click anywhere outside the panel → close it
  document.addEventListener('click', (e) => {
    if (!notifPanelOpen) return;
    const wrap = document.getElementById('notif-bell-wrap');
    if (wrap && !wrap.contains(e.target)) {
      closeNotifPanel();
    }
  });

  // Escape key → close panel
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && notifPanelOpen) closeNotifPanel();
  });

  // Listen for localStorage changes from other tabs / pages
  // (e.g. a new event created on events.html refreshes notifications here)
  window.addEventListener('storage', (e) => {
    if (e.key === EVENTS_KEY || e.key === MESSAGES_KEY) {
      syncNotificationsFromStorage();
      updateBadge();
      if (notifPanelOpen) renderNotificationPanel();
    }
  });
}


/* ================================================================
   10.  PUBLIC INIT — call this once per page
================================================================ */

/**
 * Initialize the entire notification system.
 * Call this after the DOM is ready (e.g. at the end of <body>
 * or inside a DOMContentLoaded handler).
 *
 * Usage:  initNotifications();
 */
function initNotifications() {
  injectNotificationUI();        // 1. Add bell + panel to the header
  syncNotificationsFromStorage();// 2. Create notifications from events/chat
  renderNotificationPanel();     // 3. Render initial list
  updateBadge();                 // 4. Show correct unread count on bell
  attachNotifListeners();        // 5. Wire up all click/keyboard handlers
}

/* ── Auto-refresh badge every 60 seconds ── */
setInterval(() => {
  syncNotificationsFromStorage();
  updateBadge();
  if (notifPanelOpen) renderNotificationPanel();
}, 60_000);
