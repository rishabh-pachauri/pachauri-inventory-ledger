/* =============================================
   DATA: Initial Inventory
============================================= */
const initialItems = [
  { id:1,  person:"Dinesh Pachauri", desc:"Double Bottle Box",         qty:46, unit:"Per Box",         price:16,   status:"Pending", ackBy:"", notes:"", date:"2026-08-10" },
  { id:2,  person:"Dinesh Pachauri", desc:"Double Beer Mug Box",       qty:51, unit:"Per Box",         price:11,   status:"Pending", ackBy:"", notes:"", date:"2026-08-10" },
  { id:3,  person:"Dinesh Pachauri", desc:"Modak Box",                 qty:13, unit:"Pack of 6",       price:23,   status:"Pending", ackBy:"", notes:"", date:"2026-08-10" },
  { id:4,  person:"Dinesh Pachauri", desc:"Modak Jar Cartoon",         qty:10, unit:"72 Pcs/Cartoon",  price:972,  status:"Pending", ackBy:"", notes:"", date:"2026-08-10" },
  { id:5,  person:"Dinesh Pachauri", desc:"Salsa Jar Cartoon",         qty:5,  unit:"48 Pcs/Cartoon",  price:864,  status:"Pending", ackBy:"", notes:"", date:"2026-08-10" },
  { id:6,  person:"Dinesh Pachauri", desc:"Fragile Tape",              qty:1,  unit:"sqft",            price:140,  status:"Pending", ackBy:"", notes:"", date:"2026-08-10" },
  { id:7,  person:"Dinesh Pachauri", desc:"Transparent Tape",          qty:1,  unit:"Roll",            price:65,   status:"Pending", ackBy:"", notes:"", date:"2026-08-10" },
  { id:8,  person:"Mukesh Pachauri", desc:"Modak Jar Box",             qty:25, unit:"Pack of 4",       price:17,   status:"Pending", ackBy:"", notes:"", date:"2026-08-10" },
  { id:9,  person:"Mukesh Pachauri", desc:"Modak Jar Box",             qty:40, unit:"Pack of 6",       price:23,   status:"Pending", ackBy:"", notes:"", date:"2026-08-10" },
  { id:10, person:"Mukesh Pachauri", desc:"Single Beer Mug Box",       qty:41, unit:"6/Box",           price:6,    status:"Pending", ackBy:"", notes:"", date:"2026-08-10" },
  { id:11, person:"Mukesh Pachauri", desc:"Beer Mug Cartoon",          qty:10, unit:"32 Pcs/Cartoon",  price:680,  status:"Pending", ackBy:"", notes:"", date:"2026-08-10" },
  { id:12, person:"Mukesh Pachauri", desc:"Cloth/Small Wrapping Sheet",qty:2,  unit:"Bundle",          price:null, status:"Pending", ackBy:"", notes:"", date:"2026-08-10" },
  { id:13, person:"Mukesh Pachauri", desc:"Big Wrapping Sheet",        qty:1,  unit:"Bundle",          price:null, status:"Pending", ackBy:"", notes:"", date:"2026-08-10" }
];

const initialPayments = [];

const initialActivityLogs = [
  { id:1, ts:"2026-08-10 10:00:00", operator:"Dinesh Pachauri", action:"Item Added", details:"Initial entry: 7 items added for Dinesh Pachauri (₹15,841.00 total)" },
  { id:2, ts:"2026-08-10 10:05:00", operator:"Mukesh Pachauri", action:"Item Added", details:"Initial entry: 6 items added for Mukesh Pachauri (₹8,391.00 total)" }
];

/* =============================================
   AUTH: Accounts (stored in localStorage)
   Keys: "dinesh" and "mukesh" only
============================================= */
const USERS_KEY     = 'pach_users';
const SESSION_KEY   = 'pach_session';
const ITEMS_KEY     = 'pach_items';
const PAYMENTS_KEY  = 'pach_payments';
const ACTIVITY_KEY  = 'pach_activity';

function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const db  = raw ? JSON.parse(raw) : null;
    // Validate structure — must have both dinesh and mukesh
    if (db && db.dinesh && db.mukesh) return db;
  } catch(e) {}
  // Return fresh defaults
  return {
    dinesh: { name: "Dinesh Pachauri", password: "12345", isDefault: true },
    mukesh: { name: "Mukesh Pachauri", password: "12345", isDefault: true }
  };
}

function saveUsers(db) {
  localStorage.setItem(USERS_KEY, JSON.stringify(db));
}

/* =============================================
   STATE
============================================= */
let usersDB           = loadUsers();
let sessionKey        = localStorage.getItem(SESSION_KEY) || null;  // "dinesh" or "mukesh"
let pendingLoginKey   = null;   // user key waiting for forced password change
let forcedPwdChange   = false;

let items        = JSON.parse(localStorage.getItem(ITEMS_KEY))    || initialItems;
let payments     = JSON.parse(localStorage.getItem(PAYMENTS_KEY)) || initialPayments;
let activityLogs = JSON.parse(localStorage.getItem(ACTIVITY_KEY)) || initialActivityLogs;

let activeTab    = 'all';
let searchQuery  = '';
let statusFilter = 'all';

/* =============================================
   HELPERS
============================================= */
const fmt = (v) => {
  if (v === null || v === undefined || isNaN(v)) return '—';
  return '₹' + Number(v).toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 });
};

const now = () => {
  const d = new Date();
  return d.toISOString().split('T')[0] + ' ' + d.toTimeString().split(' ')[0];
};

const activeUser = () => sessionKey ? usersDB[sessionKey]?.name || 'Unknown' : 'Unknown';

const nextId = (arr) => arr.length ? Math.max(...arr.map(x=>x.id)) + 1 : 1;

/* =============================================
   PERSISTENT AUDIT LOG (no delete)
============================================= */
function logActivity(action, details) {
  activityLogs.unshift({
    id: nextId(activityLogs),
    ts: now(),
    operator: activeUser(),
    action,
    details
  });
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activityLogs));
}

function saveAll() {
  localStorage.setItem(ITEMS_KEY,    JSON.stringify(items));
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activityLogs));
  saveUsers(usersDB);
  updateKPIs();
  renderTables();
}

/* =============================================
   AUTH SCREENS
============================================= */
const loginScreen    = document.getElementById('login-screen');
const pwdChangeScreen= document.getElementById('pwd-change-screen');
const appEl          = document.getElementById('app');

function showLoginScreen() {
  loginScreen.style.display    = 'flex';
  pwdChangeScreen.style.display= 'none';
  appEl.style.display          = 'none';
}

function showPwdChangeScreen() {
  loginScreen.style.display    = 'none';
  pwdChangeScreen.style.display= 'flex';
  appEl.style.display          = 'none';
}

function showApp() {
  loginScreen.style.display    = 'none';
  pwdChangeScreen.style.display= 'none';
  appEl.style.display          = 'flex';
  document.getElementById('header-user-name').textContent = usersDB[sessionKey].name;
}

function checkSession() {
  if (sessionKey && usersDB[sessionKey]) {
    showApp();
  } else {
    sessionKey = null;
    localStorage.removeItem(SESSION_KEY);
    showLoginScreen();
  }
}

/* =============================================
   LOGIN FORM
============================================= */
// Who-buttons: select Dinesh or Mukesh
let selectedUserKey = 'dinesh';

document.querySelectorAll('.who-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    selectedUserKey = btn.dataset.key;
    document.querySelectorAll('.who-btn').forEach(b => b.classList.remove('who-btn--active'));
    btn.classList.add('who-btn--active');
    // Clear error on switch
    document.getElementById('login-error').style.display = 'none';
    document.getElementById('login-password').value = '';
    document.getElementById('login-password').focus();
  });
});

// Toggle password visibility
document.getElementById('toggle-pwd-visibility').addEventListener('click', () => {
  const inp  = document.getElementById('login-password');
  const icon = document.getElementById('eye-icon');
  if (inp.type === 'password') {
    inp.type = 'text';
    icon.className = 'fa-solid fa-eye-slash';
  } else {
    inp.type = 'password';
    icon.className = 'fa-solid fa-eye';
  }
});

// Login submit
document.getElementById('login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const key      = selectedUserKey;                          // "dinesh" or "mukesh"
  const user     = usersDB[key];
  const typed    = document.getElementById('login-password').value;
  const errorBox = document.getElementById('login-error');
  const errorTxt = document.getElementById('login-error-text');

  if (!user) {
    errorTxt.textContent = 'Account not found.';
    errorBox.style.display = 'flex';
    return;
  }

  if (typed !== user.password) {
    errorTxt.textContent = 'Incorrect password. Please try again.';
    errorBox.style.display = 'flex';
    return;
  }

  // Correct password
  errorBox.style.display = 'none';

  if (user.isDefault) {
    // Force password change before entering
    pendingLoginKey = key;
    forcedPwdChange = true;
    document.getElementById('pwd-change-title').textContent = `Hi ${user.name.split(' ')[0]}, Set Your Password`;
    document.getElementById('pwd-change-subtitle').textContent = 'You are using the default password "12345". Please set a personal password to continue.';
    document.getElementById('pwd-change-form').reset();
    document.getElementById('pwd-change-error').style.display = 'none';
    showPwdChangeScreen();
  } else {
    completeLogin(key);
  }
});

/* =============================================
   FORCED PASSWORD CHANGE FORM
============================================= */
document.getElementById('pwd-change-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const newPwd     = document.getElementById('new-pwd').value;
  const confirmPwd = document.getElementById('confirm-pwd').value;
  const errBox     = document.getElementById('pwd-change-error');
  const errTxt     = document.getElementById('pwd-change-error-text');

  if (newPwd !== confirmPwd) {
    errTxt.textContent = 'Passwords do not match. Please re-enter.';
    errBox.style.display = 'flex';
    return;
  }

  if (newPwd === '12345') {
    errTxt.textContent = 'New password cannot be the default "12345". Choose a unique password.';
    errBox.style.display = 'flex';
    return;
  }

  if (newPwd.length < 4) {
    errTxt.textContent = 'Password must be at least 4 characters long.';
    errBox.style.display = 'flex';
    return;
  }

  errBox.style.display = 'none';
  const key = pendingLoginKey;
  usersDB[key].password  = newPwd;
  usersDB[key].isDefault = false;
  saveUsers(usersDB);

  forcedPwdChange = false;
  pendingLoginKey = null;
  completeLogin(key);
});

/* =============================================
   COMPLETE LOGIN
============================================= */
function completeLogin(key) {
  sessionKey = key;
  localStorage.setItem(SESSION_KEY, key);
  showApp();
  logActivity('User Logged In', `${usersDB[key].name} signed in successfully.`);
  saveAll();
}

/* =============================================
   LOGOUT
============================================= */
document.getElementById('logout-btn').addEventListener('click', () => {
  logActivity('User Logged Out', `${usersDB[sessionKey].name} signed out.`);
  saveAll();
  sessionKey = null;
  localStorage.removeItem(SESSION_KEY);
  showLoginScreen();
});

/* =============================================
   CHANGE PASSWORD MODAL (manual via header)
============================================= */
document.getElementById('change-pwd-btn').addEventListener('click', () => {
  document.getElementById('changepwd-form').reset();
  document.getElementById('changepwd-error').style.display = 'none';
  document.getElementById('changepwd-modal').classList.add('open');
});

document.getElementById('close-changepwd-modal').addEventListener('click', () => {
  document.getElementById('changepwd-modal').classList.remove('open');
});

document.getElementById('cancel-changepwd-modal').addEventListener('click', () => {
  document.getElementById('changepwd-modal').classList.remove('open');
});

document.getElementById('changepwd-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const newPwd  = document.getElementById('changepwd-new').value;
  const confPwd = document.getElementById('changepwd-confirm').value;
  const errBox  = document.getElementById('changepwd-error');
  const errTxt  = document.getElementById('changepwd-error-text');

  if (newPwd !== confPwd) {
    errTxt.textContent = 'Passwords do not match.';
    errBox.style.display = 'flex';
    return;
  }

  if (newPwd === '12345') {
    errTxt.textContent = 'Cannot use "12345" as your password.';
    errBox.style.display = 'flex';
    return;
  }

  errBox.style.display = 'none';
  usersDB[sessionKey].password  = newPwd;
  usersDB[sessionKey].isDefault = false;
  saveUsers(usersDB);
  logActivity('Password Changed', `${usersDB[sessionKey].name} changed their account password.`);
  document.getElementById('changepwd-modal').classList.remove('open');
  saveAll();
  alert(`Password updated successfully!`);
});

/* =============================================
   TAB NAVIGATION
============================================= */
document.querySelectorAll('.app-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.app-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeTab = btn.dataset.tab;
    renderTables();
  });
});

/* =============================================
   SEARCH & FILTER
============================================= */
document.getElementById('search-input').addEventListener('input', (e) => {
  searchQuery = e.target.value.toLowerCase();
  renderTables();
});

document.getElementById('status-filter').addEventListener('change', (e) => {
  statusFilter = e.target.value;
  renderTables();
});

/* =============================================
   KPI CALCULATIONS
============================================= */
function updateKPIs() {
  const dineshItems = items.filter(i => i.person === 'Dinesh Pachauri');
  const mukeshItems = items.filter(i => i.person === 'Mukesh Pachauri');

  const dineshTotal = dineshItems.reduce((s,i) => s + (i.price ? i.qty * i.price : 0), 0);
  const mukeshTotal = mukeshItems.reduce((s,i) => s + (i.price ? i.qty * i.price : 0), 0);

  const paidByDinesh = payments.filter(p=>p.paidBy==='Dinesh Pachauri').reduce((s,p)=>s+Number(p.amount||0),0);
  const paidByMukesh = payments.filter(p=>p.paidBy==='Mukesh Pachauri').reduce((s,p)=>s+Number(p.amount||0),0);

  const allPayments = paidByDinesh + paidByMukesh;
  const netDinesh   = dineshTotal - paidByDinesh;
  const netMukesh   = mukeshTotal - paidByMukesh;
  const diff        = netDinesh - netMukesh;

  document.getElementById('kpi-dinesh').textContent      = fmt(dineshTotal);
  document.getElementById('kpi-dinesh-sub').textContent  = `${dineshItems.length} items`;
  document.getElementById('kpi-mukesh').textContent      = fmt(mukeshTotal);
  document.getElementById('kpi-mukesh-sub').textContent  = `${mukeshItems.length} items`;
  document.getElementById('kpi-payments').textContent    = fmt(allPayments);
  document.getElementById('kpi-payments-sub').textContent= `${payments.length} payment${payments.length!==1?'s':''}`;

  const balEl  = document.getElementById('kpi-balance');
  const subEl  = document.getElementById('kpi-balance-sub');
  const tile   = document.getElementById('kpi-balance-tile');

  if (diff > 0.009) {
    balEl.textContent = fmt(diff);
    balEl.style.color = '#dc2626';
    subEl.textContent = 'Dinesh owes Mukesh';
    tile.style.borderColor = '#fca5a5';
  } else if (diff < -0.009) {
    balEl.textContent = fmt(Math.abs(diff));
    balEl.style.color = '#2563eb';
    subEl.textContent = 'Mukesh owes Dinesh';
    tile.style.borderColor = '#93c5fd';
  } else {
    balEl.textContent = 'Balanced ✓';
    balEl.style.color = '#059669';
    subEl.textContent = 'No outstanding dues';
    tile.style.borderColor = '#86efac';
  }
}

/* =============================================
   RENDER TABLES
============================================= */
function actionBadge(action) {
  const map = {
    'Item Added':    'add',
    'Item Updated':  'edit',
    'Status Updated':'status',
    'Item Deleted':  'delete',
    'Payment Recorded':'pay',
    'Payment Deleted':  'delete',
    'User Logged In':   'auth',
    'User Logged Out':  'auth',
    'Password Changed': 'edit',
  };
  const cls = map[action] || 'edit';
  return `<span class="badge badge--${cls}">${action}</span>`;
}

function operatorChip(name) {
  const cls = name.includes('Dinesh') ? 'dinesh' : name.includes('Mukesh') ? 'mukesh' : 'other';
  return `<span class="operator-chip operator-chip--${cls}"><i class="fa-solid fa-user-check"></i> ${name}</span>`;
}

function renderTables() {
  // Decide which views are visible
  const showItems    = (activeTab === 'all' || activeTab === 'dinesh' || activeTab === 'mukesh');
  const showPayments = (activeTab === 'all' || activeTab === 'payments');
  const showActivity = (activeTab === 'activity');

  document.getElementById('view-items').style.display    = showItems    ? 'block' : 'none';
  document.getElementById('view-payments').style.display = showPayments ? 'block' : 'none';
  document.getElementById('view-activity').style.display = showActivity ? 'block' : 'none';

  /* --- ITEMS --- */
  let filtered = items.filter(item => {
    if (activeTab === 'dinesh' && item.person !== 'Dinesh Pachauri') return false;
    if (activeTab === 'mukesh' && item.person !== 'Mukesh Pachauri') return false;
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery;
      return item.desc.toLowerCase().includes(q) ||
             (item.notes||'').toLowerCase().includes(q) ||
             (item.ackBy||'').toLowerCase().includes(q) ||
             item.person.toLowerCase().includes(q);
    }
    return true;
  });

  document.getElementById('filter-count').textContent = `${filtered.length} record${filtered.length!==1?'s':''}`;

  const tbody = document.getElementById('items-tbody');
  tbody.innerHTML = '';

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="11"><i class="fa-solid fa-inbox" style="font-size:1.5rem; color:#cbd5e1; display:block; margin-bottom:0.5rem"></i>No items match the current filter.</td></tr>`;
  } else {
    filtered.forEach((item, idx) => {
      const total    = item.price != null ? item.qty * item.price : null;
      const stBadge  = item.status === 'Acknowledged' ? 'acknowledged' : item.status.toLowerCase();
      const personCls= item.person.includes('Dinesh') ? 'chip-dinesh' : 'chip-mukesh';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${idx+1}</td>
        <td><span class="${personCls}">${item.person}</span></td>
        <td><strong>${item.desc}</strong></td>
        <td>${item.qty}</td>
        <td>${item.unit||'—'}</td>
        <td>${fmt(item.price)}</td>
        <td><strong>${fmt(total)}</strong></td>
        <td>
          <select class="status-inline" data-id="${item.id}">
            <option ${item.status==='Pending'     ?'selected':''}>Pending</option>
            <option ${item.status==='Acknowledged'?'selected':''}>Acknowledged</option>
            <option ${item.status==='Cleared'     ?'selected':''}>Cleared</option>
          </select>
        </td>
        <td>${item.ackBy||'—'}</td>
        <td>${item.date||'—'}</td>
        <td>
          <button class="tbl-btn edit-item-btn" data-id="${item.id}" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
          <button class="tbl-btn tbl-btn--red del-item-btn" data-id="${item.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </td>`;
      tbody.appendChild(tr);
    });
  }

  /* --- PAYMENTS --- */
  const ptbody = document.getElementById('payments-tbody');
  ptbody.innerHTML = '';
  if (payments.length === 0) {
    ptbody.innerHTML = `<tr class="empty-row"><td colspan="7"><i class="fa-solid fa-receipt" style="font-size:1.5rem; color:#cbd5e1; display:block; margin-bottom:0.5rem"></i>No payments recorded yet.</td></tr>`;
  } else {
    payments.forEach((p, idx) => {
      const pCls = p.paidBy.includes('Dinesh') ? 'chip-dinesh' : 'chip-mukesh';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${idx+1}</td>
        <td>${p.date}</td>
        <td><span class="${pCls}">${p.paidBy}</span></td>
        <td><strong style="color:#059669">${fmt(p.amount)}</strong></td>
        <td><span class="badge badge--pay">${p.method}</span></td>
        <td>${p.notes||'—'}</td>
        <td><button class="tbl-btn tbl-btn--red del-pay-btn" data-idx="${idx}" title="Delete"><i class="fa-solid fa-trash"></i></button></td>`;
      ptbody.appendChild(tr);
    });
  }

  /* --- ACTIVITY AUDIT LOG (immutable, no delete) --- */
  const atbody = document.getElementById('activity-tbody');
  atbody.innerHTML = '';
  let filteredLogs = activityLogs;
  if (searchQuery) {
    filteredLogs = activityLogs.filter(a =>
      a.details.toLowerCase().includes(searchQuery) ||
      a.operator.toLowerCase().includes(searchQuery) ||
      a.action.toLowerCase().includes(searchQuery)
    );
  }

  if (filteredLogs.length === 0) {
    atbody.innerHTML = `<tr class="empty-row"><td colspan="5">No activity logged yet.</td></tr>`;
  } else {
    filteredLogs.forEach((log, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${idx+1}</td>
        <td style="white-space:nowrap; font-family:monospace; font-size:0.78rem; color:#64748b">${log.ts}</td>
        <td>${operatorChip(log.operator)}</td>
        <td>${actionBadge(log.action)}</td>
        <td>${log.details}</td>`;
      atbody.appendChild(tr);
    });
  }
}

/* =============================================
   INLINE STATUS CHANGE
============================================= */
document.getElementById('items-tbody').addEventListener('change', (e) => {
  if (!e.target.classList.contains('status-inline')) return;
  const id        = Number(e.target.dataset.id);
  const item      = items.find(i => i.id === id);
  if (!item) return;
  const oldStatus = item.status;
  item.status     = e.target.value;
  if (item.status === 'Acknowledged' && !item.ackBy) {
    item.ackBy = activeUser();
  }
  logActivity('Status Updated', `"${item.desc}" status changed from ${oldStatus} → ${item.status} (${item.person})`);
  saveAll();
});

/* =============================================
   ITEMS TABLE — EDIT / DELETE
============================================= */
document.getElementById('items-tbody').addEventListener('click', (e) => {
  const editBtn = e.target.closest('.edit-item-btn');
  const delBtn  = e.target.closest('.del-item-btn');

  if (editBtn) {
    const id   = Number(editBtn.dataset.id);
    const item = items.find(i => i.id === id);
    if (!item) return;
    document.getElementById('item-id').value          = item.id;
    document.getElementById('item-person').value      = item.person;
    document.getElementById('item-desc').value        = item.desc;
    document.getElementById('item-qty').value         = item.qty;
    document.getElementById('item-unit').value        = item.unit || '';
    document.getElementById('item-price').value       = item.price != null ? item.price : '';
    document.getElementById('item-status').value      = item.status;
    document.getElementById('item-ack').value         = item.ackBy || '';
    document.getElementById('item-date').value        = item.date || '';
    document.getElementById('item-notes').value       = item.notes || '';
    document.getElementById('item-modal-title').innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit Inventory Item';
    document.getElementById('item-modal').classList.add('open');
  }

  if (delBtn) {
    const id   = Number(delBtn.dataset.id);
    const item = items.find(i => i.id === id);
    if (!item) return;
    if (!confirm(`Delete "${item.desc}"? This cannot be undone.`)) return;
    logActivity('Item Deleted', `Deleted: "${item.desc}" (${item.person}, Qty:${item.qty}, Value:${fmt(item.price ? item.qty*item.price : null)})`);
    items = items.filter(i => i.id !== id);
    saveAll();
  }
});

/* =============================================
   ADD / EDIT ITEM MODAL
============================================= */
document.getElementById('add-item-btn').addEventListener('click', () => {
  document.getElementById('item-form').reset();
  document.getElementById('item-id').value = '';
  document.getElementById('item-modal-title').innerHTML = '<i class="fa-solid fa-box-open"></i> Add Inventory Item';
  document.getElementById('item-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('item-modal').classList.add('open');
});

document.getElementById('close-item-modal').addEventListener('click', () => {
  document.getElementById('item-modal').classList.remove('open');
});

document.getElementById('cancel-item-modal').addEventListener('click', () => {
  document.getElementById('item-modal').classList.remove('open');
});

document.getElementById('item-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const idVal  = document.getElementById('item-id').value;
  const person = document.getElementById('item-person').value;
  const desc   = document.getElementById('item-desc').value;
  const qty    = Number(document.getElementById('item-qty').value);
  const unit   = document.getElementById('item-unit').value;
  const priceRaw = document.getElementById('item-price').value;
  const price  = priceRaw !== '' ? Number(priceRaw) : null;
  const status = document.getElementById('item-status').value;
  const ackBy  = document.getElementById('item-ack').value;
  const date   = document.getElementById('item-date').value;
  const notes  = document.getElementById('item-notes').value;

  if (idVal) {
    const item = items.find(i => i.id === Number(idVal));
    if (item) {
      Object.assign(item, {person, desc, qty, unit, price, status, ackBy, date, notes});
      logActivity('Item Updated', `Updated: "${desc}" (${person}, Qty:${qty}, Price:${fmt(price)})`);
    }
  } else {
    items.push({id: nextId(items), person, desc, qty, unit, price, status, ackBy, date, notes});
    logActivity('Item Added', `Added: "${desc}" taken by ${person} — Qty: ${qty} ${unit||''} @ ${fmt(price)}/unit`);
  }

  document.getElementById('item-modal').classList.remove('open');
  saveAll();
});

/* =============================================
   PAYMENT MODAL
============================================= */
document.getElementById('add-payment-btn').addEventListener('click', () => {
  document.getElementById('payment-form').reset();
  document.getElementById('pay-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('payment-modal').classList.add('open');
});

if (document.getElementById('add-payment-inline')) {
  document.getElementById('add-payment-inline').addEventListener('click', () => {
    document.getElementById('payment-form').reset();
    document.getElementById('pay-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('payment-modal').classList.add('open');
  });
}

document.getElementById('close-payment-modal').addEventListener('click', () => {
  document.getElementById('payment-modal').classList.remove('open');
});

document.getElementById('cancel-payment-modal').addEventListener('click', () => {
  document.getElementById('payment-modal').classList.remove('open');
});

document.getElementById('payment-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const date   = document.getElementById('pay-date').value;
  const paidBy = document.getElementById('pay-by').value;
  const amount = Number(document.getElementById('pay-amount').value);
  const method = document.getElementById('pay-method').value;
  const notes  = document.getElementById('pay-notes').value;

  payments.push({date, paidBy, amount, method, notes});
  logActivity('Payment Recorded', `${paidBy} paid ${fmt(amount)} via ${method}${notes?' — '+notes:''}`);
  document.getElementById('payment-modal').classList.remove('open');
  saveAll();
});

/* =============================================
   DELETE PAYMENT
============================================= */
document.getElementById('payments-tbody').addEventListener('click', (e) => {
  const delBtn = e.target.closest('.del-pay-btn');
  if (!delBtn) return;
  const idx = Number(delBtn.dataset.idx);
  const p   = payments[idx];
  if (!p) return;
  if (!confirm('Delete this payment record?')) return;
  logActivity('Payment Deleted', `Deleted payment: ${fmt(p.amount)} by ${p.paidBy} on ${p.date}`);
  payments.splice(idx, 1);
  saveAll();
});

/* =============================================
   EXPORT TO EXCEL
============================================= */
document.getElementById('export-btn').addEventListener('click', () => {
  const wb = XLSX.utils.book_new();

  const dineshRows = items.filter(i=>i.person==='Dinesh Pachauri').map((i,x)=>({
    '#':x+1, 'Item':i.desc, 'Qty':i.qty, 'Unit':i.unit, 'Price':i.price,
    'Total':i.price?i.qty*i.price:'', 'Status':i.status, 'Ack By':i.ackBy, 'Date':i.date, 'Notes':i.notes
  }));
  const mukeshRows = items.filter(i=>i.person==='Mukesh Pachauri').map((i,x)=>({
    '#':x+1, 'Item':i.desc, 'Qty':i.qty, 'Unit':i.unit, 'Price':i.price,
    'Total':i.price?i.qty*i.price:'', 'Status':i.status, 'Ack By':i.ackBy, 'Date':i.date, 'Notes':i.notes
  }));
  const payRows = payments.map((p,x)=>({
    '#':x+1, 'Date':p.date, 'Paid By':p.paidBy, 'Amount':p.amount, 'Method':p.method, 'Notes':p.notes
  }));
  const logRows = activityLogs.map((a,x)=>({
    '#':x+1, 'Timestamp':a.ts, 'Operator':a.operator, 'Action':a.action, 'Details':a.details
  }));

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dineshRows), 'Dinesh Items');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mukeshRows), 'Mukesh Items');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(payRows),    'Payments');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(logRows),    'Audit Log');

  XLSX.writeFile(wb, `Pachauri_Ledger_${new Date().toISOString().split('T')[0]}.xlsx`);
});

/* =============================================
   INIT
============================================= */
updateKPIs();
checkSession();
renderTables();
