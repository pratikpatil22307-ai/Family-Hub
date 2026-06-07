/* ================================================================
   dms.js  —  Direct Messages  (REST-only, zero Socket.IO)
   Depends on: api.js  (must load before this file)

   API calls used:
     api.getConversations()               GET /api/conversations
     api.startConversation(memberId)      POST /api/conversations/start
     api.getMembers()                     GET /api/family/members
     api.getDmMessages(conversationId)    GET /api/messages/conversation/:id
     api.sendDmMessage(conversationId, content)
                                          POST /api/messages/conversation/:id
================================================================ */

/* ── State ─────────────────────────────────────────────────── */
let conversations   = [];   // cached list from GET /api/conversations
let activeConvoId   = null; // _id string of the currently open thread
let activeConvoName = '';   // display name for the other participant
let familyMembers   = [];   // for the "new DM" member-picker modal
let pollTimer = null;
let lastMessageCount = 0;
/* ── Tiny DOM helper ────────────────────────────────────────── */
const $ = (id) => document.getElementById(id);

/* ================================================================
   INIT  —  called once from dms.html after requireAuth()
================================================================ */
async function initDMs() {
  const user = getUser();
  if (!user) return;

  $('header-family-name').textContent = user.familyName || 'Family';

  await loadConversations();
}

/* ================================================================
   CONVERSATION LIST
================================================================ */
async function loadConversations() {
  // Show skeleton while loading
  $('dm-list-scroll').innerHTML = `
    <div class="dm-loading">
      <div class="skel" style="height:46px;border-radius:10px"></div>
      <div class="skel" style="height:46px;border-radius:10px"></div>
      <div class="skel" style="height:46px;border-radius:10px"></div>
    </div>`;

  try {
    conversations = await api.getConversations();
    renderConvoList();
  } catch (err) {
    console.error('[loadConversations]', err);
    $('dm-list-scroll').innerHTML =
      `<div class="dm-list-empty"><span class="empty-icon">⚠️</span>Failed to load chats.</div>`;
  }
}

function renderConvoList() {
  const scroll = $('dm-list-scroll');

  if (!conversations.length) {
    scroll.innerHTML = `
      <div class="dm-list-empty">
        <span class="empty-icon">💌</span>
        No conversations yet.<br>Start one below!
      </div>`;
    return;
  }

  // Newest activity first
  const sorted = [...conversations].sort(
    (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
  );

  scroll.innerHTML = sorted.map((c) => {
    const other = c.participants[0];
    if (!other) return '';

    const avatarInner = other.avatar
      ? `<img src="${esc(other.avatar)}" alt="${esc(other.name)}" />`
      : avatarInitials(other.name);

    const time = c.lastMessageAt
      ? new Date(c.lastMessageAt).toLocaleTimeString('en-IN', {
          hour: '2-digit', minute: '2-digit',
        })
      : '';

    const isActive = c._id === activeConvoId;

    return `
      <div class="convo-item ${isActive ? 'active' : ''}"
           onclick="openConvo('${esc(c._id)}', '${esc(other.name)}')">
        <div class="convo-avatar">${avatarInner}</div>
        <div class="convo-info">
          <div class="convo-name">${esc(other.name)}</div>
          <div class="convo-time">${time ? 'Active: ' + time : 'New conversation'}</div>
        </div>
      </div>`;
  }).join('');
}

/* ================================================================
   OPEN A CONVERSATION
   1. Set active state + highlight sidebar item
   2. Build the chat panel HTML (header + empty message area + input)
   3. Fetch messages from backend  →  render them all
================================================================ */
async function openConvo(convoId, partnerName) {
  activeConvoId   = convoId;
  activeConvoName = partnerName;

  // Highlight the selected item in the sidebar list
  renderConvoList();

  // Stamp out the right-hand panel with a loading state
  $('dm-chat-panel').innerHTML = `
    <div class="dm-chat-header">
      <div class="convo-avatar" style="width:34px;height:34px;font-size:0.78rem">
        ${avatarInitials(partnerName)}
      </div>
      <span class="dm-chat-header-name">${esc(partnerName)}</span>
    </div>

    <div class="dm-messages" id="dm-messages">
      <div class="dm-system-msg">Loading messages…</div>
    </div>

    <div class="dm-input-row">
      <input  type="text"
              class="dm-input"
              id="dm-input"
              placeholder="Message ${esc(partnerName)}…" />
      <button class="dm-send-btn" id="dm-send-btn" title="Send">➤</button>
    </div>`;

  // Wire up the send handlers on the freshly created elements
  $('dm-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendDm();
    }
  });
  $('dm-send-btn').addEventListener('click', sendDm);

  // ── Fetch messages from MongoDB via REST ──────────────────
  let msgs;
  try {
    msgs = await api.getDmMessages(convoId);
  } catch (err) {
    console.error('[openConvo] getDmMessages failed', err);
    // Clear loading text, show error
    const el = $('dm-messages');
    el.innerHTML = '';
    appendSystemMsg('Could not load messages. Please try again.');
    $('dm-input').focus();
    return;
  }

  // ── Clear the loading indicator ───────────────────────────
  const msgsEl = $('dm-messages');
  msgsEl.innerHTML = '';

  // ── Render every message returned by the server ───────────
 if (!msgs.length) {
  appendSystemMsg('No messages yet. Say hello! 👋');
} else {
  msgs.forEach((m) => appendDmMessage(m));
}

lastMessageCount = msgs.length;

scrollToBottom();
$('dm-input').focus();

if (pollTimer) clearInterval(pollTimer);

pollTimer = setInterval(pollMessages, 5000);
}

/* ================================================================
   SEND A MESSAGE
   1. POST content to backend
   2. Use the saved message object the server returns
   3. Append that object to the message area
================================================================ */
async function sendDm() {
  const inputEl = $('dm-input');
  const sendBtn = $('dm-send-btn');
  if (!inputEl || !activeConvoId) return;

  const content = inputEl.value.trim();
  if (!content) return;

  // Disable UI while the request is in flight
  inputEl.disabled = true;
  sendBtn.disabled = true;
  inputEl.value    = '';

  let saved;
  try {
    saved = await api.sendDmMessage(activeConvoId, content);
  } catch (err) {
    console.error('[sendDm]', err);
    // Give the user their text back so they can retry
    inputEl.value = content;
    showToast('Failed to send — please try again.');
    inputEl.disabled = false;
    sendBtn.disabled = false;
    inputEl.focus();
    return;
  }

  // Append the message object returned by the server
 appendDmMessage(saved);

lastMessageCount++;

scrollToBottom();

  // Re-enable input
  inputEl.disabled = false;
  sendBtn.disabled = false;
  inputEl.focus();

  // Refresh the sidebar so lastMessageAt time label updates
  await loadConversations();
}

/* ================================================================
   MESSAGE BUBBLE RENDERING
================================================================ */
function appendDmMessage(msg) {
  const me   = getUser();
  const isMe =
    String(msg.sender)   === String(me._id) ||
    String(msg.sender?._id) === String(me._id);

  const time = new Date(msg.timestamp || Date.now())
    .toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const wrap = document.createElement('div');
  wrap.className = `dm-msg-wrap ${isMe ? 'me' : 'them'}`;
  wrap.innerHTML = `
    ${!isMe ? `<span class="dm-sender-label">${esc(msg.senderName || '')}</span>` : ''}
    <div class="dm-bubble ${isMe ? 'me' : 'them'}">${esc(msg.content)}</div>
    <span class="dm-msg-time">${time}</span>`;

  $('dm-messages').appendChild(wrap);
}

function appendSystemMsg(text) {
  const div = document.createElement('div');
  div.className   = 'dm-system-msg';
  div.textContent = text;
  $('dm-messages').appendChild(div);
}

function scrollToBottom() {
  const el = $('dm-messages');
  if (el) el.scrollTop = el.scrollHeight;
}

/* ================================================================
   NEW DM MODAL  —  pick a family member to start a thread
================================================================ */
async function openNewDmModal() {
  $('new-dm-modal').classList.add('show');
  $('member-pick-list').innerHTML =
    `<div class="member-pick-loading">Loading members…</div>`;

  try {
    familyMembers = await api.getMembers();
    const me     = getUser();
    const others = familyMembers.filter((m) => m._id !== me._id);

    if (!others.length) {
      $('member-pick-list').innerHTML =
        `<div class="member-pick-loading">No other family members found.</div>`;
      return;
    }

    $('member-pick-list').innerHTML = others.map((m) => `
      <div class="member-pick-item"
           onclick="startDm('${esc(m._id)}', '${esc(m.name)}')">
        <div class="member-pick-avatar">${avatarInitials(m.name)}</div>
        <span class="member-pick-name">${esc(m.name)}</span>
      </div>`).join('');
  } catch (err) {
    $('member-pick-list').innerHTML =
      `<div class="member-pick-loading">Failed to load members.</div>`;
  }
}

function closeNewDmModal() {
  $('new-dm-modal').classList.remove('show');
}

async function startDm(memberId, memberName) {
  closeNewDmModal();
  try {
    const convo = await api.startConversation(memberId);

    // Merge into local list if not already there
    if (!conversations.find((c) => c._id === convo._id)) {
      conversations.push(convo);
    }

    renderConvoList();
    openConvo(convo._id, memberName);
  } catch (err) {
    showToast('Could not start conversation: ' + (err.message || 'error'));
  }
}

// Close modal when clicking the dark backdrop
document.addEventListener('click', (e) => {
  if (e.target === $('new-dm-modal')) closeNewDmModal();
});

/* ================================================================
   UTILITIES
================================================================ */
function avatarInitials(name) {
  return String(name || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function showToast(msg) {
  let t = $('dm-toast');
  if (!t) {
    t = document.createElement('div');
    t.id        = 'dm-toast';
    t.className = 'dm-toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

function esc(s) {
  return String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}
async function pollMessages() {
  if (!activeConvoId) return;

  try {
    const msgs = await api.getDmMessages(activeConvoId);

    // Only update if message count changed
    if (msgs.length !== lastMessageCount) {
      const container = document.getElementById('dm-messages');

      container.innerHTML = '';

      msgs.forEach(msg => appendDmMessage(msg));

      lastMessageCount = msgs.length;

      scrollToBottom();
    }

  } catch (err) {
    console.error('Polling failed:', err);
  }
}