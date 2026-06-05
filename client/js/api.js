/* ============================================================
   api.js  —  Shared API utility for Family Hub
   Handles: auth headers, base URL, error normalisation
   ============================================================ */

const API_BASE = 'http://localhost:5000/api';

/* ---------- Auth token helpers ---------- */
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

/* ---------- Redirect if not authenticated ---------- */
const requireAuth = () => {
  const token = getToken();
  const user  = getUser();
  if (!token || !user) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
};

/* ---------- Core fetch wrapper ---------- */
async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // If FormData, let browser set Content-Type (with boundary)
  if (options.body instanceof FormData) delete headers['Content-Type'];

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  // Token expired or invalid
  if (res.status === 401) {
    clearAuth();
    window.location.href = '/login.html';
    return;
  }

  let data;
  try { data = await res.json(); } catch { data = {}; }

  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

/* ---------- Named API methods ---------- */
const api = {
  /* Auth */
  login: (email, password) => apiFetch('/auth/login', {
    method: 'POST', body: JSON.stringify({ email, password })
  }),
  register: (payload) => apiFetch('/auth/register', {
    method: 'POST', body: JSON.stringify(payload)
  }),
  me: () => apiFetch('/auth/me'),

  /* Events */
  getEvents: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/events${q ? '?' + q : ''}`);
  },
  createEvent: (data) => apiFetch('/events', { method: 'POST', body: JSON.stringify(data) }),
  updateEvent: (id, data) => apiFetch(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEvent: (id) => apiFetch(`/events/${id}`, { method: 'DELETE' }),

  /* Messages */
  getMessages: (limit = 50) => apiFetch(`/messages?limit=${limit}`),

  /* Photos */
  getPhotos: () => apiFetch('/photos'),
  uploadPhoto: (formData) => apiFetch('/photos', { method: 'POST', body: formData }),
  deletePhoto: (id) => apiFetch(`/photos/${id}`, { method: 'DELETE' }),

  /* Family */
  getMembers: () => apiFetch('/family/members'),
  getFamilyInfo: () => apiFetch('/family/info'),

  /* Dashboard */
  getStats: () => apiFetch('/dashboard/stats'),
};

/* ---------- Logout ---------- */
function logout() {
  clearAuth();
  window.location.href = '/login.html';
}

/* ---------- Populate nav user info ---------- */
function populateNavUser() {
  const user = getUser();
  if (!user) return;
  const el = document.getElementById('nav-user-name');
  if (el) el.textContent = user.name;
  const fi = document.getElementById('nav-family-name');
  if (fi) fi.textContent = user.familyName || 'My Family';
}
