/* Admin kit. Everything is exposed on one global, AdminKit, so it cannot clash with app.js, api.js or config.js. */
(function () {
/* Admin shared script: settings, escaping, network, session, icons, badges, shell.
   Set USE_MOCK to false when the PHP admin endpoints exist. Force failures in mock mode with ?mock=NETWORK. */
const ADMIN = {
  USE_MOCK: false,
  API_BASE: (['localhost', '127.0.0.1'].includes(location.hostname) 
    ? (location.pathname.includes('/ift-project/') ? 'http://localhost/ift-project/backend' : 'http://localhost/backend') 
    : location.origin),
  TIMEOUT_MS: 8000
};
/* Join the backend root with an endpoint path, never producing a doubled slash. */
const apiUrl = (path, params = {}) => {
  const cleanPath = String(path || '').replace(/^\/+/, '');
  const qs = new URLSearchParams(params).toString();
  return ADMIN.API_BASE.replace(/\/+$/, '') + '/' + cleanPath + (qs ? '?' + qs : '');
};
const MOCK_URL = new URL('mock/admin/', document.currentScript.src).href;

/* Always escape server values before putting them in innerHTML. */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const aval = (value, fallback = '\u2014') => value === undefined || value === null || value === '' ? fallback : value;
const naira = n => '\u20A6' + Number(n).toLocaleString('en-NG');
const wait = ms => new Promise(r => setTimeout(r, ms));
const failure = (code, message) => ({ success: false, code, message });

async function fetchJson(url, options) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ADMIN.TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, credentials: 'include', signal: ctrl.signal });
    let data;
    try {
      data = await res.json();
    } catch (e) {
      if (!res.ok) return failure('NETWORK', 'Could not reach the server. Try again.');
      throw e;
    }
    if (!res.ok) {
      return data && typeof data === 'object' 
        ? { success: false, message: data.message || 'Could not reach the server. Try again.', code: res.status }
        : failure('NETWORK', 'Could not reach the server. Try again.');
    }
    return data;
  } catch (e) {
    return failure('NETWORK', 'Could not reach the server. Try again.');
  } finally { clearTimeout(timer); }
}

const adminApi = {
  async get(endpoint, mockFile, params = {}) {
    if (ADMIN.USE_MOCK) {
      await wait(400);
      if (new URLSearchParams(location.search).get('mock') === 'NETWORK') return failure('NETWORK', 'Could not reach the server. Try again.');
      return fetchJson(MOCK_URL + mockFile);
    }
    return fetchJson(apiUrl(endpoint, params));
  },
  async login(email, password) {
    if (ADMIN.USE_MOCK) {
      await wait(700);
      return { success: true, admin: { name: 'Dr. Tunde Adebayo', role: 'Hostel Administrator', email } };
    }
    return fetchJson(apiUrl('/api/auth/login'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  },
  dashboard: () => adminApi.get('/api/admin/dashboard', 'dashboard.json'),
  students: async () => adminApi.getCollection('students'),
  allocations: async () => adminApi.getCollection('allocations'),
  payments: async () => adminApi.getCollection('payments'),
  hostels: async () => adminApi.getCollection('hostels'),
  rooms: async () => adminApi.getCollection('rooms'),
  async getCollection(collection) {
    const dashboard = await adminApi.get('/api/admin/dashboard', 'dashboard.json');
    if (!dashboard.success) return dashboard;
    return {
      ...dashboard,
      [collection]: dashboard[collection] || [],
      total_records: dashboard.pagination?.totals?.[collection] || (dashboard[collection] || []).length
    };
  },
  async roomBeds(roomId) {
    if (!ADMIN.USE_MOCK) {
      const dashboard = await adminApi.get('/api/admin/dashboard', 'dashboard.json');
      if (!dashboard.success) return dashboard;
      return {
        success: true,
        beds: (dashboard.beds || []).filter(bed => Number(bed.room_id) === Number(roomId))
      };
    }
    const res = await adminApi.get('', 'room-beds.json');
    if (!res.success) return res;
    return res.rooms[roomId] ? { success: true, beds: res.rooms[roomId] } : failure('NOT_FOUND', 'Room not found.');
  }
};

/* Session in the browser is a convenience only. PHP must check the admin on every request. */
const adminSession = {
  get() { try { return JSON.parse(sessionStorage.getItem('hostel_admin')); } catch (e) { return null; } },
  set(a) { sessionStorage.setItem('hostel_admin', JSON.stringify(a)); },
  clear() { sessionStorage.removeItem('hostel_admin'); },
  require() { const a = this.get(); if (!a) { location.href = '../auth/admin-login.html'; return null; } return a; }
};

const AICONS = {
  building: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4M10 10h4M10 14h4M10 18h4"/>',
  door: '<path d="M13 4.56v16.16a1 1 0 0 1-1.24.97L5 20V5.56a2 2 0 0 1 1.5-1.94l4-1A2 2 0 0 1 13 4.56Z"/><path d="M13 4h3a2 2 0 0 1 2 2v14M2 20h3M13 20h9M10 12v.01"/>',
  bed: '<path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  check: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  x: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>'
};
const aicon = n => `<svg class="a-icon" viewBox="0 0 24 24" aria-hidden="true">${AICONS[n] || ''}</svg>`;

const ASTATUS = {
  active: ['success', 'check', 'Active'], paid: ['success', 'check', 'Paid'], allocated: ['success', 'check', 'Allocated'],
  available: ['success', 'check', 'Available'], unavailable: ['neutral', 'info', 'Unavailable'], pending: ['warning', 'clock', 'Pending'], reserved: ['warning', 'clock', 'Reserved'],
  maintenance: ['warning', 'clock', 'Maintenance'], failed: ['error', 'x', 'Failed'], cancelled: ['error', 'x', 'Cancelled'],
  full: ['neutral', 'info', 'Full'], occupied: ['neutral', 'info', 'Occupied'], expired: ['error', 'x', 'Expired'], unallocated: ['neutral', 'info', 'Unallocated']
};
function abadge(status) {
  const s = ASTATUS[status];
  return s ? `<span class="a-badge a-badge-${s[0]}">${aicon(s[1])}${s[2]}</span>` : `<span class="a-badge a-badge-neutral">${esc(status)}</span>`;
}

function aState(el, kind, message, retry) {
  el.innerHTML = `<div class="a-state ${kind}" ${kind === 'error' ? 'role="alert"' : ''}>${kind === 'loading' ? '<span class="a-spinner"></span>' : ''}<span></span>${retry ? '<button class="a-btn a-btn-ghost" data-retry>Try again</button>' : ''}</div>`;
  el.querySelector('.a-state > span:not(.a-spinner)').textContent = message;
  if (retry) el.querySelector('[data-retry]').addEventListener('click', retry);
}

function aToast(msg) {
  const t = document.createElement('div'); t.className = 'a-toast'; t.setAttribute('role', 'status'); t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 3500);
}

const ADMIN_NAV = [['dashboard', 'Dashboard', 'dashboard.html'], ['hostels', 'Hostels', 'hostels.html'], ['rooms', 'Rooms & Beds', 'rooms.html'],
  ['students', 'Students', 'students.html'], ['allocations', 'Allocations', 'allocations.html'], ['payments', 'Payments', 'payments.html'],
  ['reports', 'Reports', '#'], ['settings', 'Settings', '#']];

/* Wraps <main id="content"> with the sidebar (a drawer on mobile) and the top bar. */
function mountAdminShell({ active, title, subtitle = '', searchPlaceholder = 'Search records' }) {
  const admin = adminSession.require();
  if (!admin) return null;
  const content = document.getElementById('content');
  const app = document.createElement('div');
  app.className = 'a-app';
  app.innerHTML = `
    <aside class="a-side" id="a-side">
      <div class="a-brand"><div class="a-mark">R</div><div><strong>ROOMMATE</strong><small>Hostel Administration</small></div>
        <button class="a-close" aria-label="Close menu">${aicon('close')}</button></div>
      <nav class="a-nav" aria-label="Admin">${ADMIN_NAV.map(([k, l, h]) => `<a href="${h}" ${k === active ? 'aria-current="page"' : ''}>${esc(l)}</a>`).join('')}</nav>
      <div class="a-user"><div class="a-avatar"></div><div><strong></strong><small></small></div>
        <button aria-label="Log out" data-logout>${aicon('logout')}</button></div>
    </aside>
    <div class="a-scrim"></div>
    <div class="a-main">
      <header class="a-top">
        <button class="a-iconbtn a-menu" aria-label="Open menu" aria-controls="a-side">${aicon('menu')}</button>
        <div class="a-titles"><h1></h1><p></p></div>
        <input class="a-input a-search" type="search" aria-label="${esc(searchPlaceholder)}" placeholder="${esc(searchPlaceholder)}">
        <button class="a-iconbtn" aria-label="Notifications">${aicon('bell')}</button>
        <button class="a-iconbtn a-theme" aria-label="Switch theme" data-theme-toggle><span class="ic-moon">${aicon('moon')}</span><span class="ic-sun">${aicon('sun')}</span></button>
      </header>
    </div>`;
  app.querySelector('.a-user strong').textContent = admin.email;
  app.querySelector('.a-user small').textContent = admin.role;
  app.querySelector('.a-titles h1').textContent = title;
  app.querySelector('.a-titles p').textContent = subtitle;
  app.querySelector('.a-main').appendChild(content);
  content.classList.add('a-content');
  document.body.prepend(app);
  const toggle = o => app.classList.toggle('open', o);
  app.querySelector('.a-menu').addEventListener('click', () => toggle(true));
  app.querySelector('.a-close').addEventListener('click', () => toggle(false));
  app.querySelector('.a-scrim').addEventListener('click', () => toggle(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false); });
  app.querySelector('[data-theme-toggle]').addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-appearance') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-appearance', next);
    try { localStorage.setItem('theme-preference', next); } catch (e) {}   /* same key the public pages use */
  });
  app.querySelector('[data-logout]').addEventListener('click', () => { adminSession.clear(); location.href = '../auth/admin-login.html'; });
  return admin;
}

/* Search: every search box on the page stays in sync and calls cb(query) after a short pause. */
function bindSearch(cb) {
  const boxes = [...document.querySelectorAll('input[type=search]')];
  let t;
  boxes.forEach(b => b.addEventListener('input', () => {
    boxes.forEach(o => { if (o !== b) o.value = b.value; });
    clearTimeout(t); t = setTimeout(() => cb(b.value.trim().toLowerCase()), 200);
  }));
}
const pendingFeature = name => () => aToast(name + ' is not connected yet.');

/* Table on desktop, stacked cards on mobile, from one row definition.
   cols: [{label, cell: row => html}], widths: CSS grid columns, mobile: row => {name, badge, meta, meta2}
   opts.attrs(row) adds attributes (for clickable rows), opts.active(row) marks the selected row. cell() must escape its own text. */
function tableHtml(cols, widths, rows, mobile, opts = {}) {
  const head = '<div class="a-thead cols d-only" style="--cols:' + widths + '">' + cols.map(c => '<span>' + esc(c.label) + '</span>').join('') + '</div>';
  return head + rows.map(r => {
    const m = mobile(r);
    return '<div class="a-row cols' + (opts.active && opts.active(r) ? ' is-active' : '') + '" style="--cols:' + widths + '" ' + (opts.attrs ? opts.attrs(r) : '') + '>' +
      cols.map(c => '<span class="d-only">' + c.cell(r) + '</span>').join('') +
      '<span class="m-only m-name">' + esc(m.name) + '</span><span class="m-only m-badge">' + m.badge + '</span>' +
      '<span class="m-only m-meta">' + esc(m.meta) + '</span>' + (m.meta2 ? '<span class="m-only m-meta2">' + esc(m.meta2) + '</span>' : '') + '</div>';
  }).join('');
}
function pagerHtml(page, pages, shown, total, noun) {
  let b = '';
  if (pages > 1) {
    b = '<button class="a-btn a-btn-ghost" data-p="' + (page - 1) + '"' + (page === 1 ? ' disabled' : '') + '>Previous</button>';
    for (let i = 1; i <= pages; i++) b += '<button class="a-btn a-btn-ghost" data-p="' + i + '"' + (i === page ? ' aria-current="page"' : '') + '>' + i + '</button>';
    b += '<button class="a-btn a-btn-ghost" data-p="' + (page + 1) + '"' + (page === pages ? ' disabled' : '') + '>Next</button>';
  }
  return '<span>Showing ' + shown + ' of ' + total + ' ' + noun + '</span><div class="btns">' + b + '</div>';
}
function kpiHtml(items) {
  return '<div class="a-kpis">' + items.map(k => '<div class="a-card a-stat"><div class="a-head"><span>' + esc(k.label) + '</span></div><div class="a-value">' + esc(k.value) + '</div><div class="a-caption">' + esc(k.note || '') + '</div></div>').join('') + '</div>';
}
const summaryHtml = lines => '<div class="a-summary">' + lines.map(l => '<span>' + esc(l) + '</span>').join('') + '</div>';
const fillSelect = (id, values) => {
  const sel = document.getElementById(id), first = sel.options[0].outerHTML;
  sel.innerHTML = first + [...new Set(values)].sort().map(v => '<option>' + esc(v) + '</option>').join('');
};
/* Cells that start with = + - @ could run as formulas when the CSV is opened in Excel, so they get a leading quote. */
function downloadCsv(filename, header, rows) {
  const cell = v => { v = String(v ?? ''); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; };
  const csv = [header, ...rows].map(r => r.map(cell).join(',')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

window.AdminKit = { ADMIN, esc, aval, naira, wait, failure, fetchJson, adminApi, adminSession, aicon, abadge, aState, aToast, mountAdminShell, bindSearch, pendingFeature, tableHtml, pagerHtml, kpiHtml, summaryHtml, fillSelect, downloadCsv };
})();
