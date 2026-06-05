/* ============================================================
   Family Hub — Global Search (js/search.js)
   - Debounced input
   - Searches Events, Photos, Chat messages, Family members
   - Reads from localStorage (DataSource layer = backend-ready)
   - Self-injects a search bar into the page header
   - Mobile responsive (CSS in css/search.css)

   Backend migration notes:
     Replace DataSource.* with fetch('/api/...') calls.
     Each method is async-ready and returns plain arrays
     of { type, title, date, href } result objects, so a
     React component can swap localStorage for an HTTP client
     without touching the UI/search algorithm.
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------------- Utilities ---------------- */
  const Utils = {
    debounce(fn, wait = 250) {
      let t;
      return function (...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
      };
    },
    safeParse(json, fallback) {
      try { return json ? JSON.parse(json) : fallback; }
      catch { return fallback; }
    },
    escapeHtml(s) {
      return String(s ?? '').replace(/[&<>"']/g, c => (
        { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]
      ));
    },
    highlight(text, query) {
      const t = Utils.escapeHtml(text);
      if (!query) return t;
      const q = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return t.replace(new RegExp('(' + q + ')', 'ig'), '<mark>$1</mark>');
    },
    formatDate(value) {
      if (!value) return '';
      const d = new Date(value);
      if (isNaN(d.getTime())) return String(value);
      return d.toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' });
    },
  };

  /* ---------------- Data layer (swap for REST in React) ---------------- */
  const DataSource = {
    // Events created in events.html (key: fh.events)
    async getEvents() {
      return Utils.safeParse(localStorage.getItem('fh.events'), []) || [];
    },
    // Chat messages (key: fh.messages -> { channel: [{sender,text,ts}] })
    async getMessages() {
      const all = Utils.safeParse(localStorage.getItem('fh.messages'), {}) || {};
      const list = [];
      Object.entries(all).forEach(([channel, msgs]) => {
        (msgs || []).forEach(m => list.push({ ...m, channel }));
      });
      return list;
    },
    // Photos (key: fh.photos -> [{id,title,caption,url,date}])
    async getPhotos() {
      return Utils.safeParse(localStorage.getItem('fh.photos'), []) || [];
    },
    // Family members — derived from chat senders + saved user name
    async getMembers() {
      const names = new Set();
      const me = localStorage.getItem('fh.userName');
      if (me) names.add(me);
      const stored = Utils.safeParse(localStorage.getItem('fh.members'), []) || [];
      stored.forEach(n => names.add(typeof n === 'string' ? n : n.name));
      const msgs = await DataSource.getMessages();
      msgs.forEach(m => m.sender && names.add(m.sender));
      return Array.from(names).map(name => ({ name }));
    },
  };

  /* ---------------- Search engine ---------------- */
  const SearchEngine = {
    async search(query) {
      const q = (query || '').trim().toLowerCase();
      if (!q) return [];
      const [events, messages, photos, members] = await Promise.all([
        DataSource.getEvents(),
        DataSource.getMessages(),
        DataSource.getPhotos(),
        DataSource.getMembers(),
      ]);

      const results = [];

      events.forEach(e => {
        const hay = `${e.title || ''} ${e.description || ''} ${e.location || ''} ${e.category || ''}`.toLowerCase();
        if (hay.includes(q)) results.push({
          type: 'Event', title: e.title || '(untitled event)',
          date: e.startDate || e.date || '', href: 'events.html',
          subtitle: e.category || '',
        });
      });

      messages.forEach(m => {
        if ((m.text || '').toLowerCase().includes(q) || (m.sender || '').toLowerCase().includes(q)) {
          results.push({
            type: 'Message', title: m.text || '',
            date: m.ts ? new Date(m.ts).toISOString() : '',
            href: 'chat.html', subtitle: `#${m.channel || 'general'} · ${m.sender || ''}`,
          });
        }
      });

      photos.forEach(p => {
        const hay = `${p.title || ''} ${p.caption || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
        if (hay.includes(q)) results.push({
          type: 'Photo', title: p.title || p.caption || 'Photo',
          date: p.date || '', href: 'photos.html',
        });
      });

      members.forEach(mb => {
        if ((mb.name || '').toLowerCase().includes(q)) results.push({
          type: 'Member', title: mb.name, date: '', href: 'chat.html',
        });
      });

      return results.slice(0, 30);
    },
  };

  /* ---------------- UI ---------------- */
  const SearchUI = {
    mount(target) {
      if (!target || target.querySelector('.fh-search')) return;
      const wrap = document.createElement('div');
      wrap.className = 'fh-search';
      wrap.innerHTML = `
        <div class="fh-search__box">
          <span class="fh-search__icon" aria-hidden="true">🔎</span>
          <input type="search" class="fh-search__input"
                 placeholder="Search events, photos, chat, family…"
                 aria-label="Global search" autocomplete="off" />
        </div>
        <div class="fh-search__results" role="listbox" hidden></div>
      `;
      target.appendChild(wrap);

      const input = wrap.querySelector('.fh-search__input');
      const panel = wrap.querySelector('.fh-search__results');

      const run = Utils.debounce(async (q) => {
        if (!q) { panel.hidden = true; panel.innerHTML = ''; return; }
        const results = await SearchEngine.search(q);
        SearchUI.render(panel, results, q);
      }, 220);

      input.addEventListener('input', e => run(e.target.value));
      input.addEventListener('focus', () => { if (panel.innerHTML) panel.hidden = false; });
      document.addEventListener('click', e => {
        if (!wrap.contains(e.target)) panel.hidden = true;
      });
      input.addEventListener('keydown', e => {
        if (e.key === 'Escape') { input.value = ''; panel.hidden = true; }
      });
    },

    render(panel, results, query) {
      if (!results.length) {
        panel.innerHTML = `<div class="fh-search__empty">No results for “${Utils.escapeHtml(query)}”</div>`;
      } else {
        const groups = results.reduce((acc, r) => ((acc[r.type] ||= []).push(r), acc), {});
        panel.innerHTML = Object.entries(groups).map(([type, items]) => `
          <div class="fh-search__group">
            <div class="fh-search__group-title">${type}s</div>
            ${items.map(r => `
              <a class="fh-search__item" href="${r.href}">
                <span class="fh-search__badge fh-search__badge--${type.toLowerCase()}">${type}</span>
                <span class="fh-search__title">${Utils.highlight(r.title, query)}</span>
                ${r.subtitle ? `<span class="fh-search__sub">${Utils.escapeHtml(r.subtitle)}</span>` : ''}
                ${r.date ? `<span class="fh-search__date">${Utils.formatDate(r.date)}</span>` : ''}
              </a>
            `).join('')}
          </div>
        `).join('');
      }
      panel.hidden = false;
    },
  };

  /* ---------------- Bootstrap ---------------- */
  function autoMount() {
    // Preferred targets, in priority order
    const target =
      document.querySelector('[data-search-slot]') ||
      document.querySelector('header .header-status') ||
      document.querySelector('header') ||
      document.querySelector('.top-header') ||
      document.body;
    SearchUI.mount(target);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoMount);
  } else {
    autoMount();
  }

  // Expose for tests / React migration
  global.FamilyHubSearch = { Utils, DataSource, SearchEngine, SearchUI };
})(window);
