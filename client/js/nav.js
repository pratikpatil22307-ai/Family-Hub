/* ============================================================
   nav.js — Injects authenticated sidebar navigation
   Include AFTER api.js on every protected page
   ============================================================ */

function buildNav(activePage) {
  const user = getUser();
  if (!user) return;

  const pages = [
    { href: 'family-hub.html', key: 'dashboard', icon: '🏡', label: 'Dashboard' },
    { href: 'index.html',      key: 'calendar',  icon: '📅', label: 'Calendar' },
    { href: 'events.html',     key: 'events',    icon: '🎉', label: 'Events' },
    { href: 'photos.html',     key: 'photos',    icon: '🖼️', label: 'Photos' },
    { href: 'chat.html',       key: 'chat',      icon: '💬', label: 'Chat' },
  ];

  const navHTML = `
    <span class="nav-section-label">Menu</span>
    ${pages.map(p => `
      <a href="${p.href}" class="nav-item ${p.key === activePage ? 'active' : ''}" ${p.key === activePage ? 'aria-current="page"' : ''}>
        <span class="nav-icon">${p.icon}</span>
        <span>${p.label}</span>
      </a>`).join('')}
    <hr class="nav-divider" />
    <span class="nav-section-label">Account</span>
    <div class="nav-item nav-user-info">
      <span class="nav-icon">👤</span>
      <span id="nav-user-name">${escHtml(user.name)}</span>
    </div>
    <div class="nav-item nav-family-info" title="Family Invite Code: ${escHtml(user.inviteCode || '')}">
      <span class="nav-icon">👨‍👩‍👧‍👦</span>
      <span>${escHtml(user.familyName || 'My Family')}</span>
    </div>
    ${user.inviteCode ? `
    <div class="nav-item invite-code" onclick="copyInviteCode('${escHtml(user.inviteCode)}')" style="cursor:pointer" title="Click to copy">
      <span class="nav-icon">🔑</span>
      <span>${escHtml(user.inviteCode)}</span>
    </div>` : ''}
    <div class="nav-item logout-btn" onclick="logout()" style="cursor:pointer;color:#e74c3c">
      <span class="nav-icon">🚪</span>
      <span>Logout</span>
    </div>`;

  const sidebar = document.querySelector('.sidebar, nav.sidebar, aside.sidebar');
  if (sidebar) sidebar.innerHTML = navHTML;
}

function copyInviteCode(code) {
  navigator.clipboard.writeText(code).then(() => {
    showToast('Invite code copied: ' + code);
  });
}

function showToast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#2d3436;color:#fff;padding:10px 20px;border-radius:24px;font-size:0.9rem;z-index:9999;font-family:Nunito,sans-serif;font-weight:700;';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

function escHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
