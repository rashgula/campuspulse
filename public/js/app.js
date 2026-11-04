// ==========================================================
// CampusPulse — Client Application Engine (shadcn/ui Edition)
// ==========================================================

let studentData = null;
let attendanceData = null;
let campusBlocks = [];
let timetableData = [];
let messMenuData = null;
let feeData = null;
let currentDay = "Wednesday";

document.addEventListener('DOMContentLoaded', () => {
  initLiveClock();
  fetchAllData();
});

// 1. Live Clock & Date Display
function initLiveClock() {
  const timeElem = document.getElementById('live-time');
  const dateElem = document.getElementById('live-date');

  function update() {
    const now = new Date();
    if (timeElem) timeElem.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    if (dateElem) dateElem.innerText = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
  update();
  setInterval(update, 1000);
}

// 2. Tab Navigation
function switchTab(tabName) {
  // Hide all panes
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

  // Show selected pane
  const activePane = document.getElementById(`tab-${tabName}`);
  if (activePane) activePane.classList.remove('hidden');

  const activeNav = document.getElementById(`nav-${tabName}`);
  if (activeNav) activeNav.classList.add('active');

  // Trigger sub-render if needed
  if (tabName === 'map') renderCampusMap();
  if (tabName === 'timetable') loadTimetable(currentDay);
  if (tabName === 'mess') loadMessMenu(currentDay);

  lucide.createIcons();
}

// 3. Fetch All Initial Campus Data from REST APIs
async function fetchAllData() {
  try {
    const [resStudent, resAtt, resBlocks, resFee] = await Promise.all([
      fetch('/api/student').then(r => r.json()),
      fetch('/api/attendance').then(r => r.json()),
      fetch('/api/campus/blocks').then(r => r.json()),
      fetch('/api/fees').then(r => r.json())
    ]);

    studentData = resStudent;
    attendanceData = resAtt;
    campusBlocks = resBlocks;
    feeData = resFee;

    renderDashboardOverview();
    renderAttendanceCards();
    renderCampusBlocksIndex();
    renderFeesLedger();
    loadTimetable(currentDay);
    loadMessMenu(currentDay);

    lucide.createIcons();
  } catch (err) {
    console.error("Error loading campus data:", err);
  }
}

// 4. Render Dashboard Overview
function renderDashboardOverview() {
  if (!studentData) return;

  // Stats
  const statAtt = document.getElementById('stat-attendance');
  const statFee = document.getElementById('stat-fee-due');
  if (statAtt) statAtt.innerText = `${studentData.stats.overallAttendance}%`;
  if (statFee) statFee.innerText = `₹${studentData.stats.pendingFee.toLocaleString()}`;

  const navFeeBadge = document.getElementById('nav-fee-badge');
  if (studentData.stats.pendingFee === 0 && navFeeBadge) {
    navFeeBadge.innerText = "Paid";
    navFeeBadge.className = "ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium border border-emerald-500/30";
  }

  // Dashboard schedule
  fetch(`/api/timetable?day=${currentDay}`)
    .then(r => r.json())
    .then(data => {
      const container = document.getElementById('dashboard-schedule-list');
      if (!container) return;
      container.innerHTML = data.schedule.slice(0, 4).map(slot => `
        <div class="p-3 rounded-lg border ${
          slot.isCurrent 
            ? 'border-border bg-muted/60' 
            : 'border-border/60 bg-card/60 hover:bg-muted/30'
        } flex items-center justify-between gap-4 transition">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-md ${
              slot.isCurrent ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
            } flex items-center justify-center font-mono font-medium text-xs shrink-0">
              ${slot.time.split(' - ')[0]}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="text-xs font-semibold text-foreground">${slot.code}: ${slot.name}</h4>
                ${slot.isCurrent ? '<span class="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">NOW</span>' : ''}
              </div>
              <p class="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <i data-lucide="map-pin" class="w-3 h-3 text-muted-foreground"></i>
                <span>${slot.block} • ${slot.room}</span>
                <span class="text-zinc-600">•</span>
                <span>${slot.faculty}</span>
              </p>
            </div>
          </div>
          <button onclick="navigateTo('mandovi-hostel', '${slot.block.toLowerCase().includes('arya') ? 'aryabhatta' : 'ramanujan'}', '${slot.room}')" class="btn-shadcn-secondary text-xs py-1 px-2.5 h-auto">
            <span>Route</span>
            <i data-lucide="arrow-right" class="w-3 h-3"></i>
          </button>
        </div>
      `).join('');
      lucide.createIcons();
    });
}

// 5. Render Attendance Cards with Bunk Predictions
function renderAttendanceCards() {
  if (!attendanceData) return;

  const summaryOverall = document.getElementById('att-summary-overall');
  if (summaryOverall) summaryOverall.innerText = `${attendanceData.overall}%`;

  const container = document.getElementById('attendance-cards-container');
  if (!container) return;

  container.innerHTML = attendanceData.subjects.map(sub => {
    let statusBadge = '';
    let bunkAdvice = '';

    if (sub.isLow) {
      statusBadge = `<span class="badge-shadcn bg-rose-500/10 text-rose-400 border-rose-500/30 text-[10px]">Debarment Risk</span>`;
      bunkAdvice = `<div class="p-2.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
        <i data-lucide="alert-circle" class="w-3.5 h-3.5 shrink-0"></i>
        <span>Debarment Risk! Attend next <strong>${sub.requiredToRecover} classes</strong> consecutively to recover back to 75%.</span>
      </div>`;
    } else if (sub.isWarning) {
      statusBadge = `<span class="badge-shadcn bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px]">Borderline Safe</span>`;
      bunkAdvice = `<div class="p-2.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
        <i data-lucide="alert-triangle" class="w-3.5 h-3.5 shrink-0"></i>
        <span>Careful! You can miss <strong>${sub.safeBunks} class</strong> before dropping below 75%.</span>
      </div>`;
    } else {
      statusBadge = `<span class="badge-shadcn bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">Safe Zone</span>`;
      bunkAdvice = `<div class="p-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
        <i data-lucide="check-circle-2" class="w-3.5 h-3.5 shrink-0"></i>
        <span>Safe buffer: You can safely miss <strong>${sub.safeBunks} more classes</strong> and stay above 75%.</span>
      </div>`;
    }

    return `
      <div class="shadcn-card p-5 space-y-4">
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono font-medium text-foreground px-2 py-0.5 rounded bg-muted border border-border">${sub.code}</span>
              <span class="text-[11px] text-muted-foreground">${sub.credits} Credits</span>
            </div>
            <h4 class="text-sm font-semibold text-foreground mt-1.5 tracking-tight">${sub.name}</h4>
            <p class="text-xs text-muted-foreground">Faculty: ${sub.faculty}</p>
          </div>
          ${statusBadge}
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-xs">
            <span class="text-muted-foreground font-medium">${sub.attended} attended of ${sub.total} classes</span>
            <span class="font-mono font-bold ${sub.isLow ? 'text-rose-400' : 'text-emerald-400'} text-sm">${sub.percentage}%</span>
          </div>
          <div class="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-500 ${
              sub.isLow ? 'bg-rose-500' : 'bg-emerald-500'
            }" style="width: ${Math.min(100, sub.percentage)}%"></div>
          </div>
        </div>

        ${bunkAdvice}
      </div>
    `;
  }).join('');

  lucide.createIcons();
}

// Attendance Simulator Runner
async function runAttendanceSimulation() {
  const code = document.getElementById('sim-course').value;
  const action = document.getElementById('sim-action').value;
  const count = document.getElementById('sim-count').value;

  const res = await fetch('/api/attendance/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, action, count })
  });
  const data = await res.json();

  const box = document.getElementById('sim-result-box');
  if (!box) return;
  box.classList.remove('hidden');

  const isSafe = data.projectedPercentage >= 75;
  box.className = `p-3.5 rounded-lg border mt-3 transition-all ${
    isSafe ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200' : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
  }`;

  box.innerHTML = `
    <div class="flex items-center justify-between gap-4">
      <div>
        <h4 class="text-xs font-mono font-semibold uppercase tracking-wider">${data.code} — Projected Scenario</h4>
        <p class="text-xs mt-1 text-foreground">
          If you <strong>${action === 'bunk' ? 'MISS' : 'ATTEND'}</strong> next <strong>${count} class(es)</strong>, 
          your attendance moves from <strong>${data.currentPercentage}%</strong> to <strong class="font-mono text-sm underline">${data.projectedPercentage}%</strong>.
        </p>
      </div>
      <div class="text-right shrink-0">
        <span class="badge-shadcn ${
          isSafe ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
        }">${data.status}</span>
      </div>
    </div>
  `;

  shadcnToast({
    title: "Simulation Calculated",
    description: `${data.code}: Projected attendance is ${data.projectedPercentage}% (${data.status})`,
    variant: isSafe ? "success" : "destructive"
  });
}

// 6. Interactive Campus SVG Map & Route Finder
function renderCampusMap() {
  const group = document.getElementById('map-blocks-group');
  if (!group || campusBlocks.length === 0) return;

  const colors = {
    Academic: { fill: '#27272a', stroke: '#fafafa' },
    Hostel: { fill: '#18181b', stroke: '#38bdf8' },
    Dining: { fill: '#18181b', stroke: '#fbbf24' },
    Facility: { fill: '#18181b', stroke: '#a78bfa' },
    Administration: { fill: '#18181b', stroke: '#94a3b8' },
    'Medical / SOS': { fill: '#18181b', stroke: '#f43f5e' },
    Sports: { fill: '#18181b', stroke: '#34d399' }
  };

  group.innerHTML = campusBlocks.map(b => {
    const theme = colors[b.category] || colors.Academic;
    return `
      <g class="map-node" onclick="selectMapBlock('${b.id}')" transform="translate(${b.coords.x}, ${b.coords.y})">
        <!-- Building Outline Box -->
        <rect x="-45" y="-30" width="90" height="60" rx="8" fill="${theme.fill}" fill-opacity="0.85" stroke="${theme.stroke}" stroke-width="1.2" />
        
        <!-- Center Pin -->
        <circle cx="0" cy="-6" r="6" fill="${theme.stroke}" />
        <circle cx="0" cy="-6" r="12" fill="${theme.stroke}" fill-opacity="0.25" class="animate-ping" />

        <!-- Block Name Tag -->
        <text x="0" y="18" text-anchor="middle" fill="#fafafa" font-size="9" font-weight="600" font-family="'Geist', sans-serif">
          ${b.name.split(' ')[0]}
        </text>
      </g>
    `;
  }).join('');
}

function selectMapBlock(blockId) {
  const block = campusBlocks.find(b => b.id === blockId);
  if (!block) return;

  const el = document.getElementById(`block-card-${block.id}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('border-primary', 'shadow-lg');
    setTimeout(() => {
      el.classList.remove('border-primary', 'shadow-lg');
    }, 2500);
  }
}

function renderCampusBlocksIndex() {
  const container = document.getElementById('blocks-info-container');
  if (!container || campusBlocks.length === 0) return;

  container.innerHTML = campusBlocks.map(b => `
    <div id="block-card-${b.id}" class="shadcn-card p-5 space-y-3">
      <div class="flex items-center justify-between">
        <span class="badge-shadcn bg-secondary text-foreground text-[10px]">
          ${b.category}
        </span>
        <span class="text-xs text-muted-foreground font-mono">${b.floors} Floors • ${b.totalRooms} Rooms</span>
      </div>

      <h4 class="text-sm font-semibold tracking-tight text-foreground">${b.name}</h4>
      <p class="text-xs text-muted-foreground">Departments: <span class="text-foreground">${b.departments.join(', ')}</span></p>

      <div class="p-2.5 rounded-md bg-muted/40 text-xs text-muted-foreground space-y-1 border border-border/50">
        <p class="text-[10px] font-mono font-semibold text-foreground uppercase">Key Features:</p>
        <ul class="list-disc list-inside text-[11px] space-y-0.5">
          ${b.keyHighlights.map(h => `<li>${h}</li>`).join('')}
        </ul>
      </div>

      <div class="pt-2 border-t border-border flex items-center justify-between text-xs">
        <span class="text-muted-foreground">From Mandovi Hostel:</span>
        <span class="font-mono font-medium text-emerald-400">${b.distanceFromHostel}</span>
      </div>

      <button onclick="navigateTo('mandovi-hostel', '${b.id}', 'Main Entrance')" class="btn-shadcn-secondary w-full text-xs">
        <i data-lucide="navigation" class="w-3.5 h-3.5"></i>
        <span>Get Walking Directions</span>
      </button>
    </div>
  `).join('');

  lucide.createIcons();
}

async function calculateSelectedRoute() {
  const from = document.getElementById('route-from').value;
  const to = document.getElementById('route-to').value;
  navigateTo(from, to, "Classroom");
}

async function navigateTo(from, to, room) {
  switchTab('map');

  const res = await fetch(`/api/campus/route?from=${from}&to=${to}&room=${encodeURIComponent(room)}`);
  const data = await res.json();

  const pathElem = document.getElementById('active-route-path');
  if (pathElem && data.pathCoordinates.length >= 2) {
    const [p1, p2, p3] = data.pathCoordinates;
    const dStr = `M ${p1.x} ${p1.y} Q ${p2.x} ${p2.y} ${p3.x} ${p3.y}`;
    pathElem.setAttribute('d', dStr);
  }

  shadcnToast({
    title: `Route: ${data.from} ➔ ${data.to}`,
    description: `~${data.distanceMeters}m • Est. ${data.walkTimeMinutes} mins. Follow walking path highlighted on map.`,
    variant: "default",
    duration: 5000
  });
}

// 7. Timetable Loader
async function loadTimetable(day) {
  currentDay = day;

  // Update tabs
  document.querySelectorAll('.day-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.innerText.toLowerCase() === day.slice(0, 3).toLowerCase());
  });

  const res = await fetch(`/api/timetable?day=${day}`);
  const data = await res.json();

  const container = document.getElementById('timetable-slots-container');
  if (!container) return;

  container.innerHTML = data.schedule.map(slot => `
    <div class="shadcn-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
      slot.isCurrent ? 'border-primary/50 bg-muted/20' : ''
    }">
      <div class="flex items-center gap-3.5">
        <div class="w-12 h-12 rounded-lg ${
          slot.isCurrent ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
        } flex flex-col items-center justify-center font-mono font-medium text-xs p-1 text-center shrink-0">
          <span class="text-[10px] text-muted-foreground">${slot.time.split(' - ')[0]}</span>
          <span class="text-[10px] font-bold">${slot.time.split(' - ')[1]}</span>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono font-medium text-foreground px-1.5 py-0.5 rounded bg-muted border border-border">${slot.code}</span>
            <span class="badge-shadcn bg-secondary text-foreground text-[10px]">${slot.type}</span>
            ${slot.isCurrent ? '<span class="badge-shadcn bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">ACTIVE NOW</span>' : ''}
          </div>
          <h4 class="text-xs font-semibold text-foreground mt-1 tracking-tight">${slot.name}</h4>
          <p class="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
            <span class="text-foreground">${slot.block}</span>
            <span>•</span>
            <span>${slot.room}</span>
            <span>•</span>
            <span>${slot.faculty}</span>
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <button onclick="navigateTo('mandovi-hostel', '${slot.block.toLowerCase().includes('arya') ? 'aryabhatta' : 'ramanujan'}', '${slot.room}')" class="btn-shadcn-secondary text-xs">
          <i data-lucide="map-pin" class="w-3.5 h-3.5"></i>
          <span>Locate Room</span>
        </button>
      </div>
    </div>
  `).join('');

  lucide.createIcons();
}

// 8. Mess Menu Loader & Feedback
async function loadMessMenu(day) {
  document.querySelectorAll('.mess-day-btn').forEach(btn => {
    btn.classList.toggle('active', btn.innerText.toLowerCase() === day.slice(0, 3).toLowerCase());
  });

  const res = await fetch(`/api/mess/menu?day=${day}`);
  const data = await res.json();
  messMenuData = data;

  const meals = [
    { name: "Breakfast", time: "7:30 - 9:30 AM", data: data.menu.breakfast, icon: "coffee" },
    { name: "Lunch", time: "12:30 - 2:30 PM", data: data.menu.lunch, icon: "sun" },
    { name: "High Tea", time: "5:00 - 6:30 PM", data: data.menu.snacks, icon: "cookie" },
    { name: "Dinner", time: "7:30 - 9:45 PM", data: data.menu.dinner, icon: "moon" }
  ];

  const grid = document.getElementById('mess-meals-grid');
  if (grid) {
    grid.innerHTML = meals.map(m => `
      <div class="shadcn-card p-5 space-y-3 flex flex-col justify-between">
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-foreground uppercase tracking-wider">${m.name}</span>
            <span class="text-[10px] text-muted-foreground font-mono">${m.time}</span>
          </div>
          <div class="flex items-center justify-between text-xs">
            <span class="badge-shadcn bg-secondary text-foreground text-[10px]">${m.data.tag}</span>
            <span class="text-muted-foreground font-mono text-[11px]">${m.data.calories} kcal</span>
          </div>
          <h4 class="text-xs font-medium text-foreground pt-1 leading-snug">${m.data.items}</h4>
        </div>
        <div class="pt-2 border-t border-border text-[10px] text-muted-foreground flex items-center gap-1">
          <i data-lucide="check" class="w-3 h-3 text-emerald-400"></i>
          <span>Verified Diet Quality</span>
        </div>
      </div>
    `).join('');
  }

  // Render recent reviews
  const stream = document.getElementById('mess-reviews-stream');
  if (stream) {
    stream.innerHTML = data.recentRatings.map(r => `
      <div class="p-3 rounded-lg bg-muted/30 border border-border/60 flex items-start justify-between gap-4">
        <div class="space-y-0.5">
          <div class="flex items-center gap-2">
            <h5 class="text-xs font-semibold text-foreground">${r.student}</h5>
            <span class="text-amber-400 text-xs font-mono font-medium">★ ${r.rating}.0</span>
          </div>
          <p class="text-xs text-muted-foreground">"${r.comment}"</p>
        </div>
        <span class="text-[10px] text-muted-foreground font-mono whitespace-nowrap">${r.time}</span>
      </div>
    `).join('');
  }

  lucide.createIcons();
}

function setStarRating(num) {
  document.getElementById('selected-rating').value = num;
  const stars = document.querySelectorAll('#star-rating-picker .star');
  stars.forEach((s, idx) => {
    s.style.opacity = idx < num ? '1' : '0.3';
  });
}

async function submitMessReview(e) {
  e.preventDefault();
  const meal = document.getElementById('review-meal-type').value;
  const rating = document.getElementById('selected-rating').value;
  const comment = document.getElementById('review-comment').value;

  const res = await fetch('/api/mess/rate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ meal, rating, comment })
  });
  await res.json();

  shadcnToast({
    title: "Review Submitted",
    description: `Your ${rating}-star feedback for ${meal} has been recorded on the live campus ledger.`,
    variant: "success"
  });

  document.getElementById('review-comment').value = '';
  loadMessMenu(currentDay);
}

// 9. Fee Management & Payment Modal
function renderFeesLedger() {
  if (!feeData) return;

  const headerDue = document.getElementById('fee-header-due');
  if (headerDue) headerDue.innerText = `₹${feeData.pendingAmount.toLocaleString()}`;

  const tbody = document.getElementById('fee-table-body');
  if (tbody) {
    tbody.innerHTML = feeData.breakdown.map(item => `
      <tr class="hover:bg-muted/40 transition-colors">
        <td class="py-3 px-4 font-medium text-foreground">${item.head}</td>
        <td class="py-3 px-4 font-mono font-semibold text-foreground">₹${item.amount.toLocaleString()}</td>
        <td class="py-3 px-4">
          <span class="badge-shadcn ${
            item.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }">${item.status}</span>
        </td>
        <td class="py-3 px-4 text-muted-foreground font-mono text-xs">${item.paidOn}</td>
        <td class="py-3 px-4 font-mono text-[11px] text-muted-foreground">${item.txId}</td>
      </tr>
    `).join('');
  }

  const receiptsBox = document.getElementById('receipts-cards-container');
  if (receiptsBox) {
    receiptsBox.innerHTML = feeData.receipts.map(rec => `
      <div class="p-4 rounded-lg bg-muted/30 border border-border flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono font-semibold text-foreground">${rec.receiptNo}</span>
            <span class="badge-shadcn bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[9px]">PAID</span>
          </div>
          <h4 class="text-xs font-semibold text-foreground mt-1">₹${rec.amountPaid.toLocaleString()} — ${rec.itemsCovered}</h4>
          <p class="text-[11px] text-muted-foreground font-mono mt-0.5">${rec.date} • via ${rec.mode}</p>
        </div>
        <button onclick='viewReceiptModal(${JSON.stringify(rec)})' class="btn-shadcn-secondary text-xs">
          View Receipt
        </button>
      </div>
    `).join('');
  }
}

function openPaymentModal() {
  document.getElementById('payment-modal').classList.remove('hidden');
}

function closePaymentModal() {
  document.getElementById('payment-modal').classList.add('hidden');
}

function selectPayMode(mode) {
  document.querySelectorAll('.paymode-btn').forEach(btn => {
    btn.classList.remove('active', 'border-primary', 'bg-secondary', 'text-foreground');
    btn.classList.add('border-border', 'bg-card', 'text-muted-foreground');
  });
  const active = document.getElementById(`paymode-${mode}`);
  if (active) {
    active.classList.add('active', 'border-primary', 'bg-secondary', 'text-foreground');
    active.classList.remove('border-border', 'bg-card', 'text-muted-foreground');
  }
}

async function processFinalPayment() {
  const btn = document.getElementById('btn-submit-payment');
  btn.innerText = "Processing Transaction...";
  btn.disabled = true;

  const res = await fetch('/api/fees/pay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: feeData.pendingAmount, method: "UPI (Google Pay)" })
  });
  const data = await res.json();

  // Celebration confetti
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });

  feeData = data.newStatus;
  renderFeesLedger();
  closePaymentModal();

  btn.innerText = "Confirm & Pay ₹14,500";
  btn.disabled = false;

  shadcnToast({
    title: "Payment Successful",
    description: "₹14,500 transaction cleared. Official university e-receipt generated.",
    variant: "success",
    duration: 5000
  });

  viewReceiptModal(data.receipt);
}

function viewReceiptModal(rec) {
  const content = document.getElementById('receipt-modal-content');
  if (!content) return;

  content.innerHTML = `
    <div class="flex items-center justify-between pb-3 border-b border-zinc-200">
      <div>
        <p class="text-[10px] text-zinc-500 uppercase font-semibold">Receipt Reference</p>
        <p class="font-mono font-bold text-sm text-zinc-900">${rec.receiptNo}</p>
      </div>
      <div class="text-right">
        <p class="text-[10px] text-zinc-500 uppercase font-semibold">Transaction Date</p>
        <p class="font-mono text-xs text-zinc-700">${rec.date}</p>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3 py-2">
      <div>
        <p class="text-[10px] text-zinc-500 font-semibold uppercase">Student Name</p>
        <p class="font-bold text-zinc-900">${rec.studentName || 'Aryan Sharma'}</p>
        <p class="text-[11px] text-zinc-600 font-mono">Roll: ${rec.rollNo || '23BCSE1042'}</p>
      </div>
      <div>
        <p class="text-[10px] text-zinc-500 font-semibold uppercase">Gateway Ref</p>
        <p class="font-mono text-[11px] text-zinc-800 font-bold">${rec.txRef}</p>
        <p class="text-[11px] text-zinc-600">Mode: ${rec.mode}</p>
      </div>
    </div>

    <div class="bg-zinc-50 p-3 rounded-lg border border-zinc-200 mt-2">
      <div class="flex justify-between items-center text-xs">
        <span class="font-medium text-zinc-700">${rec.itemsCovered}</span>
        <span class="font-mono font-bold text-sm text-emerald-700">₹${rec.amountPaid.toLocaleString()}</span>
      </div>
    </div>

    <div class="flex items-center justify-between pt-2">
      <div class="w-14 h-14 bg-zinc-100 p-1 rounded border flex items-center justify-center font-mono text-[8px] text-center text-zinc-400">
        [SEAL / QR]
      </div>
      <div class="text-right">
        <div class="text-zinc-900 font-serif italic font-bold text-sm">Authorized Registrar</div>
        <p class="text-[9px] text-zinc-400">Digitally Verified & Sealed</p>
      </div>
    </div>
  `;

  document.getElementById('receipt-modal').classList.remove('hidden');
}

function closeReceiptModal() {
  document.getElementById('receipt-modal').classList.add('hidden');
}

// 10. AI Campus Copilot (UniBot)
async function handleChatSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;

  appendChatMessage(msg, 'user');
  input.value = '';

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: msg })
  });
  const data = await res.json();

  appendChatMessage(data.reply, 'bot', data.actionCard);
}

function sendQuickPrompt(promptText) {
  document.getElementById('chat-input').value = promptText;
  handleChatSubmit(new Event('submit'));
}

function appendChatMessage(text, sender, actionCard = null) {
  const container = document.getElementById('chat-messages-container');
  if (!container) return;

  const div = document.createElement('div');
  div.className = sender === 'user' ? 'flex items-start justify-end gap-2.5' : 'flex items-start gap-2.5';

  if (sender === 'user') {
    div.innerHTML = `
      <div class="bg-primary text-primary-foreground rounded-lg px-3.5 py-2.5 max-w-md text-xs font-medium shadow-sm">
        ${text}
      </div>
      <div class="w-7 h-7 rounded-md bg-secondary text-secondary-foreground flex items-center justify-center shrink-0 border border-border">
        <i data-lucide="user" class="w-3.5 h-3.5"></i>
      </div>
    `;
  } else {
    let actionBtnHtml = '';
    if (actionCard) {
      actionBtnHtml = `
        <div class="pt-1.5">
          <button onclick="switchTab('${actionCard.tab}')" class="btn-shadcn-secondary text-xs py-1 px-2.5 h-auto">
            <span>${actionCard.label}</span>
            <i data-lucide="arrow-right" class="w-3 h-3"></i>
          </button>
        </div>
      `;
    }

    div.innerHTML = `
      <div class="w-7 h-7 rounded-md bg-secondary text-secondary-foreground flex items-center justify-center shrink-0 border border-border">
        <i data-lucide="bot" class="w-3.5 h-3.5"></i>
      </div>
      <div class="bg-muted/40 border border-border rounded-lg p-3.5 max-w-xl text-xs space-y-2 text-foreground">
        <p class="leading-relaxed">${text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
        ${actionBtnHtml}
      </div>
    `;
  }

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  lucide.createIcons();
}

// 11. Campus Emergency SOS
function triggerSOSModal() {
  document.getElementById('sos-modal').classList.remove('hidden');
}

function closeSOSModal() {
  document.getElementById('sos-modal').classList.add('hidden');
}

async function dispatchSOS(type) {
  const res = await fetch('/api/sos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type })
  });
  const data = await res.json();

  closeSOSModal();

  shadcnToast({
    title: "🚨 EMERGENCY SOS DISPATCHED",
    description: `Ref: ${data.alertId} • Campus QRT & Ambulance dispatched to Mandovi B-312 (~${data.responseTimeEstimate}).`,
    variant: "destructive",
    duration: 8000
  });
}

// 12. shadcn/ui Toast Notification Engine
function shadcnToast({ title, description = '', variant = 'default', duration = 4000 }) {
  const toaster = document.getElementById('shadcn-toaster');
  if (!toaster) return;

  const toast = document.createElement('div');
  toast.className = 'shadcn-toast';

  let icon = '<i data-lucide="info" class="w-4 h-4 text-zinc-300 shrink-0"></i>';
  if (variant === 'success') {
    icon = '<i data-lucide="check-circle" class="w-4 h-4 text-emerald-400 shrink-0"></i>';
  } else if (variant === 'destructive') {
    icon = '<i data-lucide="alert-triangle" class="w-4 h-4 text-rose-500 shrink-0"></i>';
  }

  toast.innerHTML = `
    ${icon}
    <div class="flex-1 space-y-0.5">
      <h5 class="text-xs font-semibold text-foreground tracking-tight">${title}</h5>
      ${description ? `<p class="text-[11px] text-muted-foreground leading-snug">${description}</p>` : ''}
    </div>
    <button onclick="this.parentElement.remove()" class="text-muted-foreground hover:text-foreground text-xs ml-1">
      ✕
    </button>
  `;

  toaster.appendChild(toast);
  lucide.createIcons();

  setTimeout(() => {
    toast.classList.add('closing');
    setTimeout(() => toast.remove(), 250);
  }, duration);
}
