// Initial Default Data from User's Prompt
const initialItems = [
  // Dinesh Pachauri Items
  { id: 1, person: "Dinesh Pachauri", desc: "Double Bottle Box", qty: 46, unit: "Per Box", price: 16.00, status: "Pending", ackBy: "", notes: "", date: "2026-08-10" },
  { id: 2, person: "Dinesh Pachauri", desc: "Double Beer Mug Box", qty: 51, unit: "Per Box", price: 11.00, status: "Pending", ackBy: "", notes: "", date: "2026-08-10" },
  { id: 3, person: "Dinesh Pachauri", desc: "Modak Box", qty: 13, unit: "Pack of 6", price: 23.00, status: "Pending", ackBy: "", notes: "", date: "2026-08-10" },
  { id: 4, person: "Dinesh Pachauri", desc: "Modak Jar Cartoon", qty: 10, unit: "72 Pcs/Cartoon", price: 972.00, status: "Pending", ackBy: "", notes: "", date: "2026-08-10" },
  { id: 5, person: "Dinesh Pachauri", desc: "Salsa Jar Cartoon", qty: 5, unit: "48 Pcs/Cartoon", price: 864.00, status: "Pending", ackBy: "", notes: "", date: "2026-08-10" },
  { id: 6, person: "Dinesh Pachauri", desc: "Fragile Tape", qty: 1, unit: "sqft", price: 140.00, status: "Pending", ackBy: "", notes: "", date: "2026-08-10" },
  { id: 7, person: "Dinesh Pachauri", desc: "Transparent Tape", qty: 1, unit: "Roll", price: 65.00, status: "Pending", ackBy: "", notes: "", date: "2026-08-10" },

  // Mukesh Pachauri Items
  { id: 8, person: "Mukesh Pachauri", desc: "Modak Jar Box", qty: 25, unit: "Pack of 4", price: 17.00, status: "Pending", ackBy: "", notes: "", date: "2026-08-10" },
  { id: 9, person: "Mukesh Pachauri", desc: "Modak Jar Box", qty: 40, unit: "Pack of 6", price: 23.00, status: "Pending", ackBy: "", notes: "", date: "2026-08-10" },
  { id: 10, person: "Mukesh Pachauri", desc: "Single Beer Mug Box", qty: 41, unit: "6/Box", price: 6.00, status: "Pending", ackBy: "", notes: "", date: "2026-08-10" },
  { id: 11, person: "Mukesh Pachauri", desc: "Beer Mug Cartoon", qty: 10, unit: "32 Pcs/Cartoon", price: 680.00, status: "Pending", ackBy: "", notes: "", date: "2026-08-10" },
  { id: 12, person: "Mukesh Pachauri", desc: "Cloth/Small Wrapping Sheet", qty: 2, unit: "Bundle", price: null, status: "Pending", ackBy: "", notes: "", date: "2026-08-10" },
  { id: 13, person: "Mukesh Pachauri", desc: "Big Wrapping Sheet", qty: 1, unit: "Bundle", price: null, status: "Pending", ackBy: "", notes: "", date: "2026-08-10" }
];

const initialPayments = [];

// State variables
let items = JSON.parse(localStorage.getItem('pachauri_inventory_items')) || initialItems;
let payments = JSON.parse(localStorage.getItem('pachauri_inventory_payments')) || initialPayments;
let activeTab = 'all';
let searchQuery = '';
let statusFilter = 'all';

// DOM Elements
const itemsTbody = document.getElementById('items-tbody');
const paymentsTbody = document.getElementById('payments-tbody');
const kpiDineshTotal = document.getElementById('kpi-dinesh-total');
const kpiDineshCount = document.getElementById('kpi-dinesh-count');
const kpiMukeshTotal = document.getElementById('kpi-mukesh-total');
const kpiMukeshCount = document.getElementById('kpi-mukesh-count');
const kpiPaymentsTotal = document.getElementById('kpi-payments-total');
const kpiPaymentsCount = document.getElementById('kpi-payments-count');
const kpiBalanceText = document.getElementById('kpi-balance-text');
const kpiBalanceSub = document.getElementById('kpi-balance-sub');
const netBalanceCard = document.getElementById('net-balance-card');
const searchInput = document.getElementById('search-input');
const statusSelectFilter = document.getElementById('status-filter');
const recordCountBadge = document.getElementById('record-count');

// Helper Formatter
const formatCurrency = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '-';
  return '₹' + Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Save to LocalStorage
const saveState = () => {
  localStorage.setItem('pachauri_inventory_items', JSON.stringify(items));
  localStorage.setItem('pachauri_inventory_payments', JSON.stringify(payments));
  updateKPIs();
  renderTables();
};

// Calculate Balance Engine
const calculateBalance = () => {
  const dineshItemsTotal = items
    .filter(item => item.person === 'Dinesh Pachauri')
    .reduce((sum, item) => sum + (item.price ? item.qty * item.price : 0), 0);

  const mukeshItemsTotal = items
    .filter(item => item.person === 'Mukesh Pachauri')
    .reduce((sum, item) => sum + (item.price ? item.qty * item.price : 0), 0);

  const paidByDinesh = payments
    .filter(p => p.paidBy === 'Dinesh Pachauri')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const paidByMukesh = payments
    .filter(p => p.paidBy === 'Mukesh Pachauri')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const netDinesh = dineshItemsTotal - paidByDinesh;
  const netMukesh = mukeshItemsTotal - paidByMukesh;
  const balanceDiff = netDinesh - netMukesh;

  return { dineshItemsTotal, mukeshItemsTotal, paidByDinesh, paidByMukesh, balanceDiff };
};

// Update Top KPI Metric Cards
const updateKPIs = () => {
  const { dineshItemsTotal, mukeshItemsTotal, paidByDinesh, paidByMukesh, balanceDiff } = calculateBalance();
  const dineshCount = items.filter(i => i.person === 'Dinesh Pachauri').length;
  const mukeshCount = items.filter(i => i.person === 'Mukesh Pachauri').length;
  const totalPayments = paidByDinesh + paidByMukesh;

  kpiDineshTotal.textContent = formatCurrency(dineshItemsTotal);
  kpiDineshCount.textContent = `${dineshCount} Items Recorded`;

  kpiMukeshTotal.textContent = formatCurrency(mukeshItemsTotal);
  kpiMukeshCount.textContent = `${mukeshCount} Items Recorded`;

  kpiPaymentsTotal.textContent = formatCurrency(totalPayments);
  kpiPaymentsCount.textContent = `${payments.length} Payments Logged`;

  if (balanceDiff > 0) {
    kpiBalanceText.textContent = `Dinesh owes Mukesh ${formatCurrency(balanceDiff)}`;
    kpiBalanceSub.textContent = "Positive Balance (Dinesh Liability)";
    kpiBalanceText.style.color = "#dc2626";
    netBalanceCard.style.borderColor = "#fca5a5";
  } else if (balanceDiff < 0) {
    kpiBalanceText.textContent = `Mukesh owes Dinesh ${formatCurrency(Math.abs(balanceDiff))}`;
    kpiBalanceSub.textContent = "Negative Balance (Mukesh Liability)";
    kpiBalanceText.style.color = "#2563eb";
    netBalanceCard.style.borderColor = "#93c5fd";
  } else {
    kpiBalanceText.textContent = "Account Fully Balanced!";
    kpiBalanceSub.textContent = "Net difference is ₹0.00";
    kpiBalanceText.style.color = "#16a34a";
    netBalanceCard.style.borderColor = "#86efac";
  }
};

// Render Tables
const renderTables = () => {
  // Filter items based on activeTab, search, status
  let filteredItems = items.filter(item => {
    if (activeTab === 'dinesh' && item.person !== 'Dinesh Pachauri') return false;
    if (activeTab === 'mukesh' && item.person !== 'Mukesh Pachauri') return false;
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchDesc = item.desc.toLowerCase().includes(q);
      const matchNotes = (item.notes || '').toLowerCase().includes(q);
      const matchAck = (item.ackBy || '').toLowerCase().includes(q);
      if (!matchDesc && !matchNotes && !matchAck) return false;
    }
    return true;
  });

  recordCountBadge.textContent = `${filteredItems.length} Items`;

  if (activeTab === 'payments') {
    document.getElementById('items-section').style.display = 'none';
    document.getElementById('payments-section').style.display = 'block';
  } else {
    document.getElementById('items-section').style.display = 'block';
    document.getElementById('payments-section').style.display = 'block';
  }

  // Render Items Tbody
  itemsTbody.innerHTML = '';
  if (filteredItems.length === 0) {
    itemsTbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding: 2rem; color: #94a3b8;">No matching inventory items found.</td></tr>`;
  } else {
    filteredItems.forEach((item, index) => {
      const totalVal = item.price ? item.qty * item.price : null;
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td><strong style="color: ${item.person.includes('Dinesh') ? '#2563eb' : '#16a34a'}">${item.person}</strong></td>
        <td><strong>${item.desc}</strong></td>
        <td>${item.qty}</td>
        <td>${item.unit || '-'}</td>
        <td>${formatCurrency(item.price)}</td>
        <td><strong>${formatCurrency(totalVal)}</strong></td>
        <td>
          <select class="status-select badge badge-${item.status.toLowerCase() === 'acknowledged' ? 'ack' : item.status.toLowerCase()}" data-id="${item.id}">
            <option value="Pending" ${item.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Acknowledged" ${item.status === 'Acknowledged' ? 'selected' : ''}>Acknowledged</option>
            <option value="Cleared" ${item.status === 'Cleared' ? 'selected' : ''}>Cleared</option>
          </select>
        </td>
        <td>${item.ackBy || '-'}</td>
        <td>${item.date || '-'}</td>
        <td>
          <button class="btn btn-sm btn-secondary edit-item-btn" data-id="${item.id}" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
          <button class="btn btn-sm btn-secondary delete-item-btn" data-id="${item.id}" title="Delete" style="color:#dc2626"><i class="fa-solid fa-trash"></i></button>
        </td>
      `;
      itemsTbody.appendChild(tr);
    });
  }

  // Render Payments Tbody
  paymentsTbody.innerHTML = '';
  if (payments.length === 0) {
    paymentsTbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 1.5rem; color: #94a3b8;">No payment records logged yet. Click "Record Payment" to add one.</td></tr>`;
  } else {
    payments.forEach((pay, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td>${pay.date}</td>
        <td><strong>${pay.paidBy}</strong></td>
        <td><strong style="color: #059669">${formatCurrency(pay.amount)}</strong></td>
        <td><span class="badge badge-info">${pay.method}</span></td>
        <td>${pay.notes || '-'}</td>
        <td>
          <button class="btn btn-sm btn-secondary delete-pay-btn" data-idx="${idx}" title="Delete" style="color:#dc2626"><i class="fa-solid fa-trash"></i></button>
        </td>
      `;
      paymentsTbody.appendChild(tr);
    });
  }
};

// Event Listeners for Tab Switches & Filtering
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeTab = btn.dataset.tab;
    renderTables();
  });
});

searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  renderTables();
});

statusSelectFilter.addEventListener('change', (e) => {
  statusFilter = e.target.value;
  renderTables();
});

// Handle Inline Status Change in Table
itemsTbody.addEventListener('change', (e) => {
  if (e.target.classList.contains('status-select')) {
    const id = Number(e.target.dataset.id);
    const newStatus = e.target.value;
    const item = items.find(i => i.id === id);
    if (item) {
      item.status = newStatus;
      if (newStatus === 'Acknowledged' && !item.ackBy) {
        item.ackBy = item.person.includes('Dinesh') ? 'Mukesh Pachauri' : 'Dinesh Pachauri';
      }
      saveState();
    }
  }
});

// Modal Logic
const itemModal = document.getElementById('item-modal');
const paymentModal = document.getElementById('payment-modal');

document.getElementById('add-item-btn').addEventListener('click', () => {
  document.getElementById('item-form').reset();
  document.getElementById('item-id').value = '';
  document.getElementById('item-modal-title').innerHTML = '<i class="fa-solid fa-box-open"></i> Add New Inventory Item';
  document.getElementById('item-date').value = new Date().toISOString().split('T')[0];
  itemModal.classList.add('active');
});

document.getElementById('add-payment-btn').addEventListener('click', () => {
  document.getElementById('payment-form').reset();
  document.getElementById('pay-date').value = new Date().toISOString().split('T')[0];
  paymentModal.classList.add('active');
});

document.getElementById('add-payment-btn-inline').addEventListener('click', () => {
  document.getElementById('payment-form').reset();
  document.getElementById('pay-date').value = new Date().toISOString().split('T')[0];
  paymentModal.classList.add('active');
});

document.querySelectorAll('.close-modal').forEach(btn => {
  btn.addEventListener('click', () => {
    itemModal.classList.remove('active');
    paymentModal.classList.remove('active');
  });
});

// Add / Edit Item Form Submission
document.getElementById('item-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const idVal = document.getElementById('item-id').value;
  const person = document.getElementById('item-person').value;
  const desc = document.getElementById('item-desc').value;
  const qty = Number(document.getElementById('item-qty').value);
  const unit = document.getElementById('item-unit').value;
  const priceVal = document.getElementById('item-price').value;
  const price = priceVal !== '' ? Number(priceVal) : null;
  const status = document.getElementById('item-status').value;
  const ackBy = document.getElementById('item-ack').value;
  const date = document.getElementById('item-date').value;
  const notes = document.getElementById('item-notes').value;

  if (idVal) {
    // Edit existing
    const item = items.find(i => i.id === Number(idVal));
    if (item) {
      Object.assign(item, { person, desc, qty, unit, price, status, ackBy, date, notes });
    }
  } else {
    // Add new
    const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
    items.push({ id: newId, person, desc, qty, unit, price, status, ackBy, date, notes });
  }

  itemModal.classList.remove('active');
  saveState();
});

// Edit & Delete Buttons handling
itemsTbody.addEventListener('click', (e) => {
  const editBtn = e.target.closest('.edit-item-btn');
  const deleteBtn = e.target.closest('.delete-item-btn');

  if (editBtn) {
    const id = Number(editBtn.dataset.id);
    const item = items.find(i => i.id === id);
    if (item) {
      document.getElementById('item-id').value = item.id;
      document.getElementById('item-person').value = item.person;
      document.getElementById('item-desc').value = item.desc;
      document.getElementById('item-qty').value = item.qty;
      document.getElementById('item-unit').value = item.unit || '';
      document.getElementById('item-price').value = item.price !== null ? item.price : '';
      document.getElementById('item-status').value = item.status;
      document.getElementById('item-ack').value = item.ackBy || '';
      document.getElementById('item-date').value = item.date || '';
      document.getElementById('item-notes').value = item.notes || '';
      document.getElementById('item-modal-title').innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit Inventory Item';
      itemModal.classList.add('active');
    }
  }

  if (deleteBtn) {
    const id = Number(deleteBtn.dataset.id);
    if (confirm('Are you sure you want to delete this item?')) {
      items = items.filter(i => i.id !== id);
      saveState();
    }
  }
});

// Record Payment Form Submission
document.getElementById('payment-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const date = document.getElementById('pay-date').value;
  const paidBy = document.getElementById('pay-by').value;
  const amount = Number(document.getElementById('pay-amount').value);
  const method = document.getElementById('pay-method').value;
  const notes = document.getElementById('pay-notes').value;

  payments.push({ date, paidBy, amount, method, notes });
  paymentModal.classList.remove('active');
  saveState();
});

// Delete Payment handling
paymentsTbody.addEventListener('click', (e) => {
  const deleteBtn = e.target.closest('.delete-pay-btn');
  if (deleteBtn) {
    const idx = Number(deleteBtn.dataset.idx);
    if (confirm('Delete this payment record?')) {
      payments.splice(idx, 1);
      saveState();
    }
  }
});

// Export to Excel Button using SheetJS
document.getElementById('export-excel-btn').addEventListener('click', () => {
  const wb = XLSX.utils.book_new();

  // Dinesh Items
  const dineshRows = items.filter(i => i.person === 'Dinesh Pachauri').map((i, idx) => ({
    "#": idx + 1,
    "Item Description": i.desc,
    "Qty": i.qty,
    "Unit/Pack": i.unit,
    "Price per Unit": i.price,
    "Total Value": i.price ? i.qty * i.price : '',
    "Status": i.status,
    "Acknowledged By": i.ackBy,
    "Notes": i.notes,
    "Date": i.date
  }));

  // Mukesh Items
  const mukeshRows = items.filter(i => i.person === 'Mukesh Pachauri').map((i, idx) => ({
    "#": idx + 1,
    "Item Description": i.desc,
    "Qty": i.qty,
    "Unit/Pack": i.unit,
    "Price per Unit": i.price,
    "Total Value": i.price ? i.qty * i.price : '',
    "Status": i.status,
    "Acknowledged By": i.ackBy,
    "Notes": i.notes,
    "Date": i.date
  }));

  const payRows = payments.map((p, idx) => ({
    "#": idx + 1,
    "Date": p.date,
    "Paid By": p.paidBy,
    "Amount Paid": p.amount,
    "Payment Method": p.method,
    "Notes": p.notes
  }));

  const wsDinesh = XLSX.utils.json_to_sheet(dineshRows);
  const wsMukesh = XLSX.utils.json_to_sheet(mukeshRows);
  const wsPayments = XLSX.utils.json_to_sheet(payRows);

  XLSX.utils.book_append_sheet(wb, wsDinesh, "Dinesh Items");
  XLSX.utils.book_append_sheet(wb, wsMukesh, "Mukesh Items");
  XLSX.utils.book_append_sheet(wb, wsPayments, "Payments");

  XLSX.writeFile(wb, "Pachauri_Inventory_Export.xlsx");
});

// Initial Render
updateKPIs();
renderTables();
