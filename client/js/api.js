/* ============================================================
   api.js  —  Shared API utility for Family Hub
   ============================================================ */

const API_URL =
  window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://family-hub-93pt.onrender.com/api';

const getToken = () => localStorage.getItem('fh_token');
const getUser  = () => { try { return JSON.parse(localStorage.getItem('fh_user')); } catch { return null; } };
const setAuth  = (token, user) => {
  localStorage.setItem('fh_token', token);
  localStorage.setItem('fh_user', JSON.stringify(user));
};
const clearAuth = () => {
  localStorage.removeItem('fh_token');
  localStorage.removeItem('fh_user');
};

const requireAuth = () => {
  const token = getToken();
  const user  = getUser();
  if (!token || !user) { window.location.href = '/login.html'; return false; }
  return true;
};

async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (options.body instanceof FormData) delete headers['Content-Type'];

  
  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (res.status === 401) { clearAuth(); window.location.href = '/login.html'; return; }

  let data;
  try { data = await res.json(); } catch { data = {}; }
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

const api = {
  /* Auth — UNCHANGED */
  login:    (email, password) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (payload)         => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  me:       ()                => apiFetch('/auth/me'),

  /* Events — UNCHANGED */
  getEvents:   (params = {}) => { const q = new URLSearchParams(params).toString(); return apiFetch(`/events${q ? '?' + q : ''}`); },
  createEvent: (data)        => apiFetch('/events', { method: 'POST', body: JSON.stringify(data) }),
  updateEvent: (id, data)    => apiFetch(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEvent: (id)          => apiFetch(`/events/${id}`, { method: 'DELETE' }),

  /* Messages — UNCHANGED */
  getMessages: (limit = 50) => apiFetch(`/messages?limit=${limit}`),

  /* Photos — MODIFIED: getPhotos accepts optional params */
  // CHANGED: was () => apiFetch('/photos')
  // NOW: accepts optional { albumId } so caller can filter
  getPhotos:   (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/photos${q ? '?' + q : ''}`);
  },
  uploadPhoto: (formData)    => apiFetch('/photos', { method: 'POST', body: formData }),
  deletePhoto: (id)          => apiFetch(`/photos/${id}`, { method: 'DELETE' }),

  /* Family — UNCHANGED */
  getMembers:   () => apiFetch('/family/members'),
  getFamilyInfo: () => apiFetch('/family/info'),

  /* Dashboard — UNCHANGED */
  getStats: () => apiFetch('/dashboard/stats'),

  /* Direct Messages — UNCHANGED (duplicates preserved as-is from original) */
  getConversations:  ()                        => apiFetch('/conversations'),
  startConversation: (memberId)                => apiFetch('/conversations/start', { method: 'POST', body: JSON.stringify({ memberId }) }),
  getDmMessages:     (conversationId, limit = 50) => apiFetch(`/messages/conversation/${conversationId}?limit=${limit}`),
  sendDmMessage:     (conversationId, content) => apiFetch(`/messages/conversation/${conversationId}`, { method: 'POST', body: JSON.stringify({ content }) }),

  // ── ADDED: Albums ──────────────────────────────────────────────────────────
  getAlbums:    ()            => apiFetch('/albums'),
  createAlbum:  (data)        => apiFetch('/albums', { method: 'POST', body: JSON.stringify(data) }),
  getAlbum:     (id)          => apiFetch(`/albums/${id}`),
  updateAlbum:  (id, data)    => apiFetch(`/albums/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAlbum:  (id)          => apiFetch(`/albums/${id}`, { method: 'DELETE' }),
  // ──────────────────────────────────────────────────────────────────────────
};

function logout() { clearAuth(); window.location.href = '/login.html'; }

function populateNavUser() {
  const user = getUser();
  if (!user) return;
  const el = document.getElementById('nav-user-name');
  if (el) el.textContent = user.name;
  const fi = document.getElementById('nav-family-name');
  if (fi) fi.textContent = user.familyName || 'My Family';
}