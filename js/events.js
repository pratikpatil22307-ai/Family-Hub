/* ============================================================
   Family Hub — shared logic
   Modules: storage, identity, events, calendar, chat
   ============================================================ */
/* ---------- Storage helpers ---------- */
const KEY = {
  USER_ID: 'fh.userId',
  USER_NAME: 'fh.userName',
  EVENTS: 'fh.events',
  MESSAGES: 'fh.messages',
  CHANNEL: 'fh.activeChannel',
};
const load = (k, fallback) => {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
};
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
/* ---------- Identity ---------- */
function getUserId() {
  let id = localStorage.getItem(KEY.USER_ID);
  if (!id) { id = uid(); localStorage.setItem(KEY.USER_ID, id); }
  return id;
}
function getUserName() {
  let name = localStorage.getItem(KEY.USER_NAME);
  if (!name) {
    name = prompt('Welcome to Family Hub! What is your name?')?.trim() || 'Family Member';
    localStorage.setItem(KEY.USER_NAME, name);
  }
  return name;
}
function setUserName(name) { localStorage.setItem(KEY.USER_NAME, name); }
/* ---------- Navbar ---------- */
function renderNav(active) {
  const name = getUserName();
  const links = [
    { href: 'index.html', key: 'calendar', icon: '📅', label: 'Calendar' },
    { href: 'events.html', key: 'events', icon: '🎉', label: 'Events' },
    { href: 'chat.html', key: 'chat', icon: '💬', label: 'Chat' },
  ];
  return `
    <nav class="nav glass">
      <div class="brand"><span class="logo">🏡</span><span>Family Hub</span></div>
      <div class="links">
        ${links.map(l => `<a href="${l.href}" class="${l.key === active ? 'active' : ''}">${l.icon} ${l.label}</a>`).join('')}
      </div>
      <div class="user" title="Click to rename" onclick="renameUser()">👤 ${escapeHtml(name)}</div>
    </nav>`;
}
function renameUser() {
  const next = prompt('Your name:', getUserName())?.trim();
  if (next) { setUserName(next); location.reload(); }
}
/* ---------- Utilities ---------- */
const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));
const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};
const toISO = (d) => d.toISOString().slice(0, 10);
const sameDay = (a, b) => a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
function dateRange(startIso, endIso) {
  const out = [];
  if (!startIso) return out;
  const s = new Date(startIso + 'T00:00:00');
  const e = endIso ? new Date(endIso + 'T00:00:00') : s;
  for (let d = new Date(s); d <= e; d.setDate(d.getDate()+1)) out.push(toISO(d));
  return out;
}
/* ============================================================
   EVENTS
   ============================================================ */
function getEvents() { return load(KEY.EVENTS, []); }
function saveEvents(list) { save(KEY.EVENTS, list); }
function createEvent(data) {
  const events = getEvents();
  events.push({
    id: uid(),
    title: data.title,
    description: data.description || '',
    category: data.category,
    subCategory: data.subCategory || '',
    startDate: data.startDate,
    endDate: data.endDate || data.startDate,
    location: data.location || '',
    createdBy: getUserId(),
    createdByName: getUserName(),
    status: 'pending',
    votes: { going: [], maybe: [], not: [] },
    createdAt: Date.now(),
  });
  saveEvents(events);
}
function deleteEvent(id) {
  saveEvents(getEvents().filter(e => e.id !== id));
}
function confirmEvent(id) {
  const events = getEvents();
  const e = events.find(x => x.id === id);
  if (e) { e.status = e.status === 'confirmed' ? 'pending' : 'confirmed'; saveEvents(events); }
}
function voteEvent(id, choice) {
  const me = getUserId();
  const events = getEvents();
  const e = events.find(x => x.id === id);
  if (!e) return;
  ['going','maybe','not'].forEach(k => { e.votes[k] = e.votes[k].filter(u => u.id !== me); });
  e.votes[choice].push({ id: me, name: getUserName() });
  saveEvents(events);
}
function myVote(e) {
  const me = getUserId();
  for (const k of ['going','maybe','not']) if (e.votes[k].some(u => u.id === me)) return k;
  return null;
}
/* ============================================================
   EVENTS PAGE
   ============================================================ */
function initEventsPage() {
  document.getElementById('nav').innerHTML = renderNav('events');
  getUserName();
  // Category subselect (Trip)
  const catSel = document.getElementById('category');
  const subWrap = document.getElementById('sub-wrap');
  const subSel = document.getElementById('subCategory');
  catSel.addEventListener('change', () => {
    if (catSel.value === 'Trip') { subWrap.style.display = ''; } else { subWrap.style.display = 'none'; subSel.value = ''; }
  });
  document.getElementById('event-form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const f = ev.target;
    if (!f.title.value.trim() || !f.startDate.value) return;
    createEvent({
      title: f.title.value.trim(),
      description: f.description.value.trim(),
      category: f.category.value,
      subCategory: f.subCategory.value,
      startDate: f.startDate.value,
      endDate: f.endDate.value,
      location: f.location.value.trim(),
    });
    f.reset();
    subWrap.style.display = 'none';
    renderEvents();
  });
  document.getElementById('search').addEventListener('input', renderEvents);
  document.getElementById('filter-cat').addEventListener('change', renderEvents);
  window.addEventListener('storage', (e) => { if (e.key === KEY.EVENTS) renderEvents(); });
  renderEvents();
}
function renderEvents() {
  const list = document.getElementById('event-list');
  const q = (document.getElementById('search').value || '').toLowerCase();
  const cat = document.getElementById('filter-cat').value;
  const me = getUserId();
  const events = getEvents()
    .filter(e => !cat || e.category === cat)
    .filter(e => !q || e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q))
    .sort((a,b) => (a.startDate || '').localeCompare(b.startDate || ''));
  // Most voted
  let topId = null, topCount = 0;
  events.forEach(e => { const c = e.votes.going.length; if (c > topCount) { topCount = c; topId = e.id; } });
  if (!events.length) { list.innerHTML = `<div class="empty glass">No events yet — create one! 🎉</div>`; return; }
  list.innerHTML = events.map(e => {
    const mine = myVote(e);
    const isCreator = e.createdBy === me;
    const cd = e.status === 'confirmed' ? countdown(e.startDate) : '';
    return `
    <div class="event-card ${e.status === 'confirmed' ? 'confirmed' : ''}">
      <div class="event-top">
        <div>
          <div class="event-title">${escapeHtml(e.title)}</div>
          <div class="event-meta">
            <span>📆 ${fmtDate(e.startDate)}${e.endDate && e.endDate !== e.startDate ? ' → ' + fmtDate(e.endDate) : ''}</span>
            ${e.location ? `<span>📍 ${escapeHtml(e.location)}</span>` : ''}
            <span>👤 ${escapeHtml(e.createdByName || 'Family')}</span>
          </div>
        </div>
        <div class="badges">
          <span class="badge">${escapeHtml(e.category)}${e.subCategory ? ' · ' + escapeHtml(e.subCategory) : ''}</span>
          ${e.status === 'confirmed' ? '<span class="badge confirmed">✓ Confirmed</span>' : ''}
          ${e.id === topId && topCount > 0 ? '<span class="badge top">🏆 Most voted</span>' : ''}
        </div>
      </div>
      ${e.description ? `<div class="event-desc">${escapeHtml(e.description)}</div>` : ''}
      ${cd ? `<div class="countdown">⏳ ${cd}</div>` : ''}
      <div class="vote-row">
        <button class="vote-btn ${mine==='going'?'active':''}" onclick="vote('${e.id}','going')">👍 Going (${e.votes.going.length})</button>
        <button class="vote-btn ${mine==='maybe'?'active':''}" onclick="vote('${e.id}','maybe')">🤔 Maybe (${e.votes.maybe.length})</button>
        <button class="vote-btn ${mine==='not'?'active':''}" onclick="vote('${e.id}','not')">👎 Not (${e.votes.not.length})</button>
      </div>
      ${isCreator ? `
        <div class="event-actions">
          <button class="btn btn-sm btn-primary" onclick="onConfirm('${e.id}')">${e.status==='confirmed'?'↺ Unconfirm':'✓ Confirm event'}</button>
          <button class="btn btn-sm btn-danger" onclick="onDelete('${e.id}')">🗑 Delete</button>
        </div>` : ''}
    </div>`;
  }).join('');
}
function vote(id, c) { voteEvent(id, c); renderEvents(); }
function onConfirm(id) { confirmEvent(id); renderEvents(); }
function onDelete(id) { if (confirm('Delete this event?')) { deleteEvent(id); renderEvents(); } }
function countdown(iso) {
  const t = new Date(iso + 'T00:00:00').getTime() - Date.now();
  if (t <= 0) return 'Happening now / past';
  const days = Math.ceil(t / 86400000);
  return `${days} day${days===1?'':'s'} to go`;
}
/* ============================================================
   CALENDAR PAGE
   ============================================================ */
let calState = { year: 0, month: 0, selected: null };
function initCalendarPage() {
  document.getElementById('nav').innerHTML = renderNav('calendar');
  getUserName();
  const now = new Date();
  calState.year = now.getFullYear();
  calState.month = now.getMonth();
  calState.selected = toISO(now);
  document.getElementById('prev').onclick = () => { shiftMonth(-1); };
  document.getElementById('next').onclick = () => { shiftMonth(1); };
  document.getElementById('today').onclick = () => {
    const n = new Date(); calState.year = n.getFullYear(); calState.month = n.getMonth();
    calState.selected = toISO(n); renderCalendar();
  };
  window.addEventListener('storage', (e) => { if (e.key === KEY.EVENTS) renderCalendar(); });
  renderCalendar();
}
function shiftMonth(delta) {
  calState.month += delta;
  if (calState.month < 0) { calState.month = 11; calState.year--; }
  if (calState.month > 11) { calState.month = 0; calState.year++; }
  renderCalendar();
}
function renderCalendar() {
  const grid = document.getElementById('cal-grid');
  const title = document.getElementById('cal-title');
  const { year, month } = calState;
  const first = new Date(year, month, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  title.textContent = first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  // Map iso date -> { pending: count, confirmed: count, events: [] }
  const dayMap = {};
  getEvents().forEach(e => {
    dateRange(e.startDate, e.endDate).forEach(iso => {
      if (!dayMap[iso]) dayMap[iso] = { pending: 0, confirmed: 0, events: [] };
      dayMap[iso][e.status] += 1;
      dayMap[iso].events.push(e);
    });
  });
  const dows = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  let html = dows.map(d => `<div class="cal-dow">${d}</div>`).join('');
  const today = new Date();
  const cells = 42;
  for (let i = 0; i < cells; i++) {
    const dayNum = i - startDow + 1;
    let cellDate, other = false;
    if (dayNum < 1) { cellDate = new Date(year, month - 1, prevDays + dayNum); other = true; }
    else if (dayNum > daysInMonth) { cellDate = new Date(year, month + 1, dayNum - daysInMonth); other = true; }
    else { cellDate = new Date(year, month, dayNum); }
    const iso = toISO(cellDate);
    const info = dayMap[iso];
    const isToday = sameDay(cellDate, today);
    const isSel = iso === calState.selected;
    const cls = [
      'cal-cell',
      other ? 'other' : '',
      isToday ? 'today' : '',
      isSel ? 'selected' : '',
      info && info.confirmed ? 'confirmed' : (info && info.pending ? 'pending' : ''),
    ].filter(Boolean).join(' ');
    const tip = info ? info.events.map(e => e.title).join(' • ') : '';
    const dots = info ? info.events.slice(0,4).map(()=>'<span class="cal-dot"></span>').join('') : '';
    html += `<div class="${cls}" data-iso="${iso}" title="${escapeHtml(tip)}">
      <div class="cal-day">${cellDate.getDate()}</div>
      <div class="cal-dots">${dots}</div>
    </div>`;
  }
  grid.innerHTML = html;
  grid.querySelectorAll('.cal-cell').forEach(el => {
    el.addEventListener('click', () => { calState.selected = el.dataset.iso; renderCalendar(); });
  });
  renderDayPanel();
}
function renderDayPanel() {
  const panel = document.getElementById('day-panel');
  const iso = calState.selected;
  const events = getEvents().filter(e => dateRange(e.startDate, e.endDate).includes(iso));
  const heading = `<h2>📌 ${fmtDate(iso)}</h2>`;
  if (!events.length) { panel.innerHTML = heading + `<div class="muted">No events on this day.</div>`; return; }
  panel.innerHTML = heading + events.map(e => `
    <div class="event-mini">
      <div class="title">${escapeHtml(e.title)} <span class="badge">${escapeHtml(e.category)}</span></div>
      <div class="meta">${e.status === 'confirmed' ? '✓ Confirmed' : '⏳ Pending'} · 👤 ${escapeHtml(e.createdByName || 'Family')}</div>
      <div class="votes">
        <span>👍 ${e.votes.going.map(u=>escapeHtml(u.name)).join(', ') || '—'}</span>
        <span>🤔 ${e.votes.maybe.map(u=>escapeHtml(u.name)).join(', ') || '—'}</span>
        <span>👎 ${e.votes.not.map(u=>escapeHtml(u.name)).join(', ') || '—'}</span>
      </div>
    </div>`).join('');
}
/* ============================================================
   CHAT
   ============================================================ */
const CHANNELS = ['general','vacation-planning','random'];
let chatPoll = null;
let typingTimer = null;
function getMessages() { return load(KEY.MESSAGES, {}); }
function saveMessages(m) { save(KEY.MESSAGES, m); }
function getChannel() { return localStorage.getItem(KEY.CHANNEL) || 'general'; }
function setChannel(c) { localStorage.setItem(KEY.CHANNEL, c); }
function initChatPage() {
  document.getElementById('nav').innerHTML = renderNav('chat');
  getUserName();
  renderChannels();
  renderMembers();
  renderMessages(true);
  document.getElementById('chat-form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;
    const channel = getChannel();
    const all = getMessages();
    if (!all[channel]) all[channel] = [];
    all[channel].push({ id: uid(), sender: getUserName(), senderId: getUserId(), text, ts: Date.now() });
    saveMessages(all);
    input.value = '';
    renderMessages(true);
    setTyping(false);
  });
  document.getElementById('chat-input').addEventListener('input', () => {
    setTyping(true);
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => setTyping(false), 1500);
  });
  document.querySelectorAll('.emoji-row button').forEach(b => {
    b.addEventListener('click', () => {
      const input = document.getElementById('chat-input');
      input.value += b.textContent;
      input.focus();
    });
  });
  document.getElementById('clear-chat').addEventListener('click', () => {
    if (!confirm('Clear all messages in #' + getChannel() + '?')) return;
    const all = getMessages(); all[getChannel()] = []; saveMessages(all); renderMessages(true);
  });
  window.addEventListener('storage', (e) => {
    if (e.key === KEY.MESSAGES) { renderMessages(true); renderMembers(); }
  });
  // Light polling for typing pseudo-indicator demo + safety
  chatPoll = setInterval(() => renderMessages(false), 1500);
}
function renderChannels() {
  const wrap = document.getElementById('channels');
  const cur = getChannel();
  wrap.innerHTML = CHANNELS.map(c => `
    <div class="chan ${c===cur?'active':''}" data-c="${c}"># ${c}</div>
  `).join('');
  wrap.querySelectorAll('.chan').forEach(el => {
    el.addEventListener('click', () => { setChannel(el.dataset.c); renderChannels(); renderMessages(true); updateChannelName(); });
  });
  updateChannelName();
}
function updateChannelName() {
  const el = document.getElementById('chan-name');
  if (el) el.textContent = getChannel();
}
function renderMembers() {
  const wrap = document.getElementById('members');
  const all = getMessages();
  const names = new Set([getUserName()]);
  Object.values(all).forEach(arr => arr.forEach(m => names.add(m.sender)));
  wrap.innerHTML = Array.from(names).map(n => `
    <div class="member"><span class="avatar">${escapeHtml(initials(n))}</span><span>${escapeHtml(n)}</span></div>
  `).join('');
}
const initials = (n) => n.split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase();
let lastRenderedCount = -1;
function renderMessages(forceScroll) {
  const box = document.getElementById('chat-msgs');
  const channel = getChannel();
  const msgs = (getMessages()[channel] || []);
  if (msgs.length === lastRenderedCount && !forceScroll) return;
  lastRenderedCount = msgs.length;
  const me = getUserId();
  box.innerHTML = msgs.map(m => `
    <div class="msg ${m.senderId === me ? 'self' : ''}">
      ${m.senderId !== me ? `<span class="avatar">${escapeHtml(initials(m.sender))}</span>` : ''}
      <div class="bubble">
        <div class="meta"><strong>${escapeHtml(m.sender)}</strong><span>${new Date(m.ts).toLocaleString([], {hour:'2-digit',minute:'2-digit',month:'short',day:'numeric'})}</span></div>
        <div class="text">${escapeHtml(m.text)}</div>
      </div>
    </div>
  `).join('') || `<div class="empty">No messages yet. Say hi! 👋</div>`;
  if (forceScroll) box.scrollTop = box.scrollHeight;
}
function setTyping(on) {
  const el = document.getElementById('typing');
  el.textContent = on ? `${getUserName()} is typing…` : '';
}