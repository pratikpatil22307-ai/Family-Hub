/* ============================================================
   script.js  —  Family Hub Calendar
   Uses FullCalendar v6 + api.getEvents() from MongoDB.
   No localStorage, no custom month grid, no scroll effects.
   ============================================================ */

/* Category → CSS class for colour coding */
const CAT_CLASS = {
  'Vacation':      'fc-event-vacation',
  'Birthday':      'fc-event-birthday',
  'Anniversary':   'fc-event-anniversary',
  'Trip':          'fc-event-trip',
  'Get-together':  'fc-event-get-together',
  'Other':         'fc-event-other',
};

/* ── Helpers ──────────────────────────────────────────────── */

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => (
    { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]
  ));
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

function fmtTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  // Only show time if it's not midnight (all-day events stored as T00:00:00)
  if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0) return '';
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

/* ── Modal ────────────────────────────────────────────────── */

function openModal(event) {
  const ev = event.extendedProps || {};

  document.getElementById('modal-cat').textContent   = esc(ev.category || 'Event');
  document.getElementById('modal-title').textContent = esc(event.title);

  const startStr = fmtDate(ev.startDate);
  const endStr   = ev.endDate ? ' → ' + fmtDate(ev.endDate) : '';
  const timeStr  = fmtTime(ev.startDate);
  const locStr   = ev.location ? `📍 ${esc(ev.location)}` : '';
  const byStr    = ev.createdByName ? `by ${esc(ev.createdByName)}` : '';

  document.getElementById('modal-meta').innerHTML = [
    startStr + endStr ? `<span>📅 ${esc(startStr + endStr)}</span>` : '',
    timeStr  ? `<span>🕐 ${esc(timeStr)}</span>` : '',
    locStr   ? `<span>${locStr}</span>` : '',
    byStr    ? `<span style="opacity:0.7;font-size:0.8rem">${byStr}</span>` : '',
  ].filter(Boolean).join('');

  document.getElementById('modal-desc').textContent = ev.description || '';
  document.getElementById('modal-desc').style.display = ev.description ? '' : 'none';

  document.getElementById('event-modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('event-modal').style.display = 'none';
}

// Close on overlay click
document.getElementById('event-modal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// Close on Escape
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeModal();
});

/* ── Map MongoDB events → FullCalendar events ─────────────── */

function mapToFC(events) {
  return events.map(ev => {
    // startDate from MongoDB is ISO string e.g. "2025-07-15T00:00:00.000Z"
    const start = ev.startDate ? ev.startDate.substring(0, 10) : null;
    // endDate: FullCalendar end is exclusive, so add 1 day for multi-day display
    let end = null;
    if (ev.endDate) {
      const d = new Date(ev.endDate);
      d.setDate(d.getDate() + 1);
      end = d.toISOString().substring(0, 10);
    }

    return {
      id:        ev._id,
      title:     ev.title,
      start,
      end,
      allDay:    true,
      classNames: [CAT_CLASS[ev.category] || 'fc-event-other'],
      extendedProps: {
        description:   ev.description  || '',
        category:      ev.category     || 'Other',
        startDate:     ev.startDate,
        endDate:       ev.endDate      || null,
        location:      ev.location     || '',
        createdByName: ev.createdByName || '',
      },
    };
  });
}

/* ── Upcoming Events Panel ────────────────────────────────── */

function renderUpcoming(events) {
  const el = document.getElementById('upcoming-list');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = events
    .filter(ev => ev.startDate && new Date(ev.startDate) >= today)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, 5);

  if (!upcoming.length) {
    el.innerHTML = '<div class="up-empty">No upcoming events 🎉</div>';
    return;
  }

  el.innerHTML = upcoming.map(ev => {
    const dateStr = fmtDate(ev.startDate);
    const timeStr = fmtTime(ev.startDate);
    return `
      <div class="up-item">
        <div class="up-item-name">${esc(ev.title)}</div>
        <div class="up-item-meta">
          <div>${esc(dateStr)}</div>
          ${timeStr ? `<div class="up-item-time">${esc(timeStr)}</div>` : ''}
        </div>
      </div>`;
  }).join('');
}

/* ── Init FullCalendar ────────────────────────────────────── */

async function initCalendar() {
  const calEl = document.getElementById('fc-calendar');

  // Initialise with empty events; will populate after fetch
  const calendar = new FullCalendar.Calendar(calEl, {
    initialView: 'dayGridMonth',
    headerToolbar: {
      left:   'prev,next today',
      center: 'title',
      right:  'dayGridMonth,timeGridWeek,timeGridDay',
    },
    buttonText: {
      today: 'Today',
      month: 'Month',
      week:  'Week',
      day:   'Day',
    },
    height: 'auto',
    fixedWeekCount: false,
    showNonCurrentDates: true,
    navLinks: false,
    dayMaxEvents: 3,          // show "+N more" link for busy days
    eventClick: function(info) {
      info.jsEvent.preventDefault();
      openModal(info.event);
    },
    // Disable built-in date click navigating to day view (keep it clean)
    dateClick: null,
    // Performance: don't re-render on every tiny resize
    windowResizeDelay: 200,
    events: [],               // populated below
  });

  calendar.render();

  // Load events from MongoDB via existing api.getEvents()
  try {
    const events = await api.getEvents();
    const fcEvents = mapToFC(events);
    fcEvents.forEach(ev => calendar.addEvent(ev));
    renderUpcoming(events);
  } catch (err) {
    console.error('Calendar: failed to load events', err);
    document.getElementById('upcoming-list').innerHTML =
      `<div class="up-empty" style="color:#ffaaaa">Failed to load events</div>`;
  }
}

/* ── Bootstrap ────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', initCalendar);