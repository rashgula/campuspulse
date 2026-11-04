// ==========================================================
// CampusPulse — Client Application Engine
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
    timeElem.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    dateElem.innerText = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
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
  document.getElementById('stat-attendance').innerText = `${studentData.stats.overallAttendance}%`;
  document.getElementById('stat-fee-due').innerText = `₹${studentData.stats.pendingFee.toLocaleString()}`;

  if (studentData.stats.pendingFee === 0) {
    document.getElementById('nav-fee-badge').innerText = "Paid";
    document.getElementById('nav-fee-badge').className = "ml-auto text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold";
  }

  // Dashboard schedule
  fetch(`/api/timetable?day=${currentDay}`)
    .then(r => r.json())
    .then(data => {
      const container = document.getElementById('dashboard-schedule-list');
      container.innerHTML = data.schedule.slice(0, 4).map(slot => `
        <div class="p-3.5 rounded-xl border transition-all ${
          slot.isCurrent 
            ? 'bg-gradient-to-r from-indigo-950/60 to-slate-900 border-indigo-500/50 shadow-lg shadow-indigo-500/10' 
            : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
        } flex items-center justify-between gap-4">
          <div class="flex items-center gap-3.5">
            <div class="w-10 h-10 rounded-xl ${
              slot.isCurrent ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-700/60 text-slate-300'
            } flex items-center justify-center font-bold text-xs">
              ${slot.time.split(' - ')[0]}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="text-xs font-bold text-white">${slot.code}: ${slot.name}</h4>
                ${slot.isCurrent ? '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">LIVE NOW</span>' : ''}
              </div>
              <p class="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                <i data-lucide="map-pin" class="w-3 h-3 text-cyan-400"></i>
                <span>${slot.block} • ${slot.room}</span>
                <span class="text-slate-600">•</span>
                <span>${slot.faculty}</span>
              </p>
            </div>
          </div>
          <button onclick="navigateTo('mandovi-hostel', '${slot.block.toLowerCase().includes('arya') ? 'aryabhatta' : 'ramanujan'}', '${slot.room}')" class="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs font-semibold flex items-center gap-1 border border-indigo-500/30 transition">
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

  document.getElementById('att-summary-overall').innerText = `${attendanceData.overall}%`;

  const container = document.getElementById('attendance-cards-container');
  container.innerHTML = attendanceData.subjects.map(sub => {
    let statusBadge = '';
    let bunkAdvice = '';

    if (sub.isLow) {
      statusBadge = `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">Below 75% Criteria</span>`;
      bunkAdvice = `<div class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
        <i data-lucide="alert-circle" class="w-4 h-4 shrink-0"></i>
        <span>Debarment Risk! Attend next <strong>${sub.requiredToRecover} classes</strong> consecutively to recover back to 75%.</span>
      </div>`;
    } else if (sub.isWarning) {
      statusBadge = `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">Borderline Safe</span>`;
      bunkAdvice = `<div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
        <i data-lucide="alert-triangle" class="w-4 h-4 shrink-0"></i>
        <span>Careful! You can only miss <strong>${sub.safeBunks} class</strong> before dropping into the danger zone.</span>
      </div>`;
    } else {
      statusBadge = `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Safe Zone</span>`;
      bunkAdvice = `<div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
        <i data-lucide="check-circle-2" class="w-4 h-4 shrink-0"></i>
        <span>Safe buffer: You can safely miss <strong>${sub.safeBunks} more classes</strong> and stay above 75%.</span>
      </div>`;
    }

    return `
      <div class="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition space-y-4 backdrop-blur-md">
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10">${sub.code}</span>
              <span class="text-[11px] text-slate-400">${sub.credits} Credits</span>
            </div>
            <h4 class="text-base font-bold text-white mt-1">${sub.name}</h4>
            <p class="text-xs text-slate-400">Faculty: ${sub.faculty}</p>
          </div>
          ${statusBadge}
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-400 font-medium">${sub.attended} attended of ${sub.total} classes</span>
            <span class="font-extrabold ${sub.isLow ? 'text-rose-400' : 'text-emerald-400'} text-base">${sub.percentage}%</span>
          </div>
          <div class="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-500 ${
              sub.isLow ? 'bg-gradient-to-r from-rose-500 to-amber-500' : 'bg-gradient-to-r from-emerald-500 to-cyan-400'
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
  box.classList.remove('hidden');

  const isSafe = data.projectedPercentage >= 75;
  box.className = `p-4 rounded-xl border mt-3 transition-all ${
    isSafe ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
  }`;

  box.innerHTML = `
    <div class="flex items-center justify-between">
      <div>
        <h4 class="text-xs font-bold uppercase tracking-wider">${data.code} — Projected Scenario Result</h4>
        <p class="text-sm mt-1">
          If you <strong>${action === 'bunk' ? 'MISS' : 'ATTEND'}</strong> next <strong>${count} class(es)</strong>, 
          your attendance changes from <strong>${data.currentPercentage}%</strong> to <strong class="text-lg underline">${data.projectedPercentage}%</strong>.
        </p>
      </div>
      <div class="text-right">
        <span class="px-3 py-1.5 rounded-lg text-xs font-bold ${
          isSafe ? 'bg-emerald-500 text-white' : 'bg-rose-600 text-white animate-bounce'
        }">${data.status}</span>
      </div>
    </div>
  `;
}

// 6. Interactive Campus SVG Map & Route Finder
function renderCampusMap() {
  const group = document.getElementById('map-blocks-group');
  if (!group || campusBlocks.length === 0) return;

  const colors = {
    Academic: { fill: '#4f46e5', stroke: '#818cf8', icon: 'graduation-cap' },
    Hostel: { fill: '#0891b2', stroke: '#22d3ee', icon: 'home' },
    Dining: { fill: '#d97706', stroke: '#fbbf24', icon: 'utensils' },
    Facility: { fill: '#7c3aed', stroke: '#a78bfa', icon: 'book' },
    Administration: { fill: '#475569', stroke: '#94a3b8', icon: 'landmark' },
    'Medical / SOS': { fill: '#e11d48', stroke: '#fb7185', icon: 'shield-alert' },
    Sports: { fill: '#059669', stroke: '#34d399', icon: 'trophy' }
  };

  group.innerHTML = campusBlocks.map(b => {
    const theme = colors[b.category] || colors.Academic;
    return `
      <g class="map-node" onclick="selectMapBlock('${b.id}')" transform="translate(${b.coords.x}, ${b.coords.y})">
        <!-- Building Outline Box -->
        <rect x="-45" y="-30" width="90" height="60" rx="12" fill="${theme.fill}" fill-opacity="0.25" stroke="${theme.stroke}" stroke-width="1.8" />
        
        <!-- Center Pulsing Pin -->
        <circle cx="0" cy="-5" r="8" fill="${theme.stroke}" />
        <circle cx="0" cy="-5" r="14" fill="${theme.stroke}" fill-opacity="0.3" class="animate-ping" />

        <!-- Block Name Tag -->
        <text x="0" y="20" text-anchor="middle" fill="#ffffff" font-size="10" font-weight="bold" font-family="'Plus Jakarta Sans', sans-serif">
          ${b.name.split(' ')[0]}
        </text>
      </g>
    `;
  }).join('');
}

function selectMapBlock(blockId) {
  const block = campusBlocks.find(b => b.id === blockId);
  if (!block) return;

  // Scroll to block index card
  const el = document.getElementById(`block-card-${block.id}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('border-cyan-400', 'shadow-cyan-500/20', 'shadow-2xl');
    setTimeout(() => {
      el.classList.remove('border-cyan-400', 'shadow-cyan-500/20', 'shadow-2xl');
    }, 2500);
  }
}

function renderCampusBlocksIndex() {
  const container = document.getElementById('blocks-info-container');
  if (!container || campusBlocks.length === 0) return;

  container.innerHTML = campusBlocks.map(b => `
    <div id="block-card-${b.id}" class="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition space-y-3 backdrop-blur-md">
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
          ${b.category}
        </span>
        <span class="text-xs text-indigo-400 font-semibold">${b.floors} Floors • ${b.totalRooms} Rooms</span>
      </div>

      <h4 class="text-base font-bold text-white">${b.name}</h4>
      <p class="text-xs text-slate-400">Departments: <span class="text-slate-300">${b.departments.join(', ')}</span></p>

      <div class="p-2.5 rounded-xl bg-slate-800/50 text-xs text-slate-300 space-y-1">
        <p class="text-[11px] font-bold text-cyan-400 uppercase">Key Features:</p>
        <ul class="list-disc list-inside text-slate-400 text-[11px] space-y-0.5">
          ${b.keyHighlights.map(h => `<li>${h}</li>`).join('')}
        </ul>
      </div>

      <div class="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
        <span class="text-slate-400">From Mandovi Hostel:</span>
        <span class="font-bold text-emerald-400">${b.distanceFromHostel}</span>
      </div>

      <button onclick="navigateTo('mandovi-hostel', '${b.id}', 'Main Lobby')" class="w-full py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-700">
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

  // Draw animated cyan line on SVG
  const pathElem = document.getElementById('active-route-path');
  if (pathElem && data.pathCoordinates.length >= 2) {
    const [p1, p2, p3] = data.pathCoordinates;
    const dStr = `M ${p1.x} ${p1.y} Q ${p2.x} ${p2.y} ${p3.x} ${p3.y}`;
    pathElem.setAttribute('d', dStr);
  }

  alert(`🗺️ Campus Walking Directions:\n\n• Route: ${data.from} ➔ ${data.to}\n• Distance: approx ${data.distanceMeters} meters\n• Walking Time: ~${data.walkTimeMinutes} minutes\n\nDirections:\n1. ${data.steps[0]}\n2. ${data.steps[1]}\n3. ${data.steps[3]}`);
}

// 7. Timetable Loader
async function loadTimetable(day) {
  currentDay = day;

  // Update button states
  document.querySelectorAll('.day-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.innerText.toLowerCase() === day.slice(0, 3).toLowerCase());
    btn.classList.toggle('bg-indigo-600', btn.innerText.toLowerCase() === day.slice(0, 3).toLowerCase());
    btn.classList.toggle('text-white', btn.innerText.toLowerCase() === day.slice(0, 3).toLowerCase());
  });

  const res = await fetch(`/api/timetable?day=${day}`);
  const data = await res.json();

  const container = document.getElementById('timetable-slots-container');
  container.innerHTML = data.schedule.map(slot => `
    <div class="p-4 rounded-2xl bg-slate-900/60 border ${
      slot.isCurrent ? 'border-indigo-500 shadow-lg shadow-indigo-500/10 bg-indigo-950/20' : 'border-slate-800'
    } flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-2xl ${
          slot.isCurrent ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
        } flex flex-col items-center justify-center font-bold text-xs p-1 text-center shrink-0">
          <span class="text-[10px] text-slate-400 font-mono">${slot.time.split(' - ')[0]}</span>
          <span class="text-[10px] text-indigo-300 font-mono">${slot.time.split(' - ')[1]}</span>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10">${slot.code}</span>
            <span class="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">${slot.type}</span>
            ${slot.isCurrent ? '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">ACTIVE SESSION</span>' : ''}
          </div>
          <h4 class="text-sm font-bold text-white mt-1">${slot.name}</h4>
          <p class="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
            <span class="text-indigo-400 font-semibold">${slot.block}</span>
            <span>•</span>
            <span class="text-slate-200">${slot.room}</span>
            <span>•</span>
            <span>${slot.faculty}</span>
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <button onclick="navigateTo('mandovi-hostel', '${slot.block.toLowerCase().includes('arya') ? 'aryabhatta' : 'ramanujan'}', '${slot.room}')" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition">
          <i data-lucide="map-pin" class="w-3.5 h-3.5"></i>
          <span>Locate Classroom</span>
        </button>
      </div>
    </div>
  `).join('');

  lucide.createIcons();
}

// 8. Mess Menu Loader & Feedback
async function loadMessMenu(day) {
  // Update buttons
  document.querySelectorAll('.mess-day-btn').forEach(btn => {
    btn.classList.toggle('active', btn.innerText.toLowerCase() === day.slice(0, 3).toLowerCase());
    btn.classList.toggle('bg-amber-600', btn.innerText.toLowerCase() === day.slice(0, 3).toLowerCase());
    btn.classList.toggle('text-white', btn.innerText.toLowerCase() === day.slice(0, 3).toLowerCase());
  });

  const res = await fetch(`/api/mess/menu?day=${day}`);
  const data = await res.json();
  messMenuData = data;

  const meals = [
    { name: "Breakfast", time: "7:30 - 9:30 AM", data: data.menu.breakfast, icon: "coffee" },
    { name: "Lunch", time: "12:30 - 2:30 PM", data: data.menu.lunch, icon: "sun" },
    { name: "High Tea / Snacks", time: "5:00 - 6:30 PM", data: data.menu.snacks, icon: "cookie" },
    { name: "Dinner", time: "7:30 - 9:45 PM", data: data.menu.dinner, icon: "moon" }
  ];

  const grid = document.getElementById('mess-meals-grid');
  grid.innerHTML = meals.map(m => `
    <div class="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition space-y-3 backdrop-blur-md flex flex-col justify-between">
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-amber-400 uppercase tracking-wider">${m.name}</span>
          <span class="text-[11px] text-slate-400">${m.time}</span>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-semibold text-[10px]">${m.data.tag}</span>
          <span class="text-slate-400 font-mono text-[11px]">${m.data.calories} kcal</span>
        </div>
        <h4 class="text-sm font-bold text-white pt-1 leading-snug">${m.data.items}</h4>
      </div>
      <div class="pt-2 border-t border-slate-800 text-[11px] text-emerald-400 flex items-center gap-1">
        <i data-lucide="check" class="w-3 h-3"></i>
        <span>Diet Approved by Mess Secretary</span>
      </div>
    </div>
  `).join('');

  // Render recent reviews
  const stream = document.getElementById('mess-reviews-stream');
  stream.innerHTML = data.recentRatings.map(r => `
    <div class="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-start justify-between gap-4">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <h5 class="text-xs font-bold text-white">${r.student}</h5>
          <span class="text-amber-400 text-xs">★ ${r.rating}.0</span>
        </div>
        <p class="text-xs text-slate-300">"${r.comment}"</p>
      </div>
      <span class="text-[11px] text-slate-500 whitespace-nowrap">${r.time}</span>
    </div>
  `).join('');

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
  const data = await res.json();

  alert("🌟 Thank you! Your food review has been recorded on the live campus ledger.");
  document.getElementById('review-comment').value = '';
  loadMessMenu(currentDay);
}

// 9. Fee Management & Payment Modal
function renderFeesLedger() {
  if (!feeData) return;

  document.getElementById('fee-header-due').innerText = `₹${feeData.pendingAmount.toLocaleString()}`;

  const tbody = document.getElementById('fee-table-body');
  tbody.innerHTML = feeData.breakdown.map(item => `
    <tr class="hover:bg-slate-800/30 transition">
      <td class="py-3 px-4 font-semibold text-white">${item.head}</td>
      <td class="py-3 px-4 font-mono font-bold text-slate-200">₹${item.amount.toLocaleString()}</td>
      <td class="py-3 px-4">
        <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
          item.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
        }">${item.status}</span>
      </td>
      <td class="py-3 px-4 text-slate-400">${item.paidOn}</td>
      <td class="py-3 px-4 font-mono text-[11px] text-indigo-400">${item.txId}</td>
    </tr>
  `).join('');

  const receiptsBox = document.getElementById('receipts-cards-container');
  receiptsBox.innerHTML = feeData.receipts.map(rec => `
    <div class="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-mono font-bold text-emerald-400">${rec.receiptNo}</span>
          <span class="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-bold">PAID</span>
        </div>
        <h4 class="text-sm font-bold text-white mt-1">₹${rec.amountPaid.toLocaleString()} — ${rec.itemsCovered}</h4>
        <p class="text-[11px] text-slate-400 mt-0.5">${rec.date} • via ${rec.mode}</p>
      </div>
      <button onclick='viewReceiptModal(${JSON.stringify(rec)})' class="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs font-bold border border-indigo-500/30">
        View e-Receipt
      </button>
    </div>
  `).join('');
}

function openPaymentModal() {
  document.getElementById('payment-modal').classList.remove('hidden');
}

function closePaymentModal() {
  document.getElementById('payment-modal').classList.add('hidden');
}

function selectPayMode(mode) {
  document.querySelectorAll('.paymode-btn').forEach(btn => btn.classList.remove('active', 'border-indigo-500', 'bg-indigo-600/20'));
  const active = document.getElementById(`paymode-${mode}`);
  if (active) active.classList.add('active', 'border-indigo-500', 'bg-indigo-600/20');
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

  // Trigger celebration confetti
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

  viewReceiptModal(data.receipt);
}

function viewReceiptModal(rec) {
  const content = document.getElementById('receipt-modal-content');
  content.innerHTML = `
    <div class="flex items-center justify-between pb-3 border-b">
      <div>
        <p class="text-[10px] text-slate-500 uppercase font-bold">Receipt Reference</p>
        <p class="font-mono font-bold text-sm text-indigo-900">${rec.receiptNo}</p>
      </div>
      <div class="text-right">
        <p class="text-[10px] text-slate-500 uppercase font-bold">Transaction Date</p>
        <p class="font-medium text-xs text-slate-700">${rec.date}</p>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3 py-2">
      <div>
        <p class="text-[10px] text-slate-500 font-bold uppercase">Student Name</p>
        <p class="font-bold text-slate-900">${rec.studentName || 'Aryan Sharma'}</p>
        <p class="text-[11px] text-slate-600">Roll No: ${rec.rollNo || '23BCSE1042'}</p>
      </div>
      <div>
        <p class="text-[10px] text-slate-500 font-bold uppercase">Payment Gateway Ref</p>
        <p class="font-mono text-[11px] text-indigo-700 font-bold">${rec.txRef}</p>
        <p class="text-[11px] text-slate-600">Mode: ${rec.mode}</p>
      </div>
    </div>

    <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 mt-2">
      <div class="flex justify-between items-center text-xs">
        <span class="font-bold text-slate-700">Fee Particulars: ${rec.itemsCovered}</span>
        <span class="font-mono font-extrabold text-base text-emerald-700">₹${rec.amountPaid.toLocaleString()}</span>
      </div>
    </div>

    <div class="flex items-center justify-between pt-2">
      <div class="w-16 h-16 bg-slate-100 p-1 rounded border flex items-center justify-center font-mono text-[8px] text-center text-slate-400">
        [QR CODE STAMP]
      </div>
      <div class="text-right">
        <div class="text-indigo-900 font-serif italic font-bold">Authorized Registrar</div>
        <p class="text-[9px] text-slate-400">Computer Generated Sealed Document</p>
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

  const div = document.createElement('div');
  div.className = sender === 'user' ? 'flex items-start justify-end gap-3' : 'flex items-start gap-3';

  if (sender === 'user') {
    div.innerHTML = `
      <div class="bg-indigo-600 text-white rounded-2xl p-3.5 max-w-md text-xs font-medium shadow-md">
        ${text}
      </div>
      <div class="w-8 h-8 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center shrink-0 border border-slate-700">
        <i data-lucide="user" class="w-4 h-4"></i>
      </div>
    `;
  } else {
    let actionBtnHtml = '';
    if (actionCard) {
      actionBtnHtml = `
        <div class="pt-2">
          <button onclick="switchTab('${actionCard.tab}')" class="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-bold border border-indigo-500/40 flex items-center gap-1.5 transition">
            <span>${actionCard.label}</span>
            <i data-lucide="arrow-right" class="w-3 h-3"></i>
          </button>
        </div>
      `;
    }

    div.innerHTML = `
      <div class="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/30">
        <i data-lucide="bot" class="w-4 h-4"></i>
      </div>
      <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 max-w-xl text-xs space-y-2">
        <p class="text-slate-200 leading-relaxed">${text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
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
  alert(`🚨 EMERGENCY ALERT DISPATCHED!\n\nReference: ${data.alertId}\nStatus: Campus QRT & Ambulance en route to Mandovi Hostel B-312.\nEstimated Arrival: ${data.responseTimeEstimate}.\nHostel Warden & Security Control notified.`);
}

