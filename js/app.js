/**
 * CampusSync - Vanilla JavaScript Application Controller
 * Modular ES6 architecture handling navigation, event filtering, conflict calculations,
 * multi-persona workflows, QR gate passes, and institutional DSA approvals.
 */

import {
  initializeStorage,
  resetAllData,
  getCurrentUser,
  getAllUsers,
  switchRole,
  getAllVenues,
  getAllClubs,
  getAllEvents,
  getEventById,
  createEvent,
  updateEventStatus,
  getStudentTimetable,
  getAllRegistrations,
  getStudentRegistrations,
  registerStudentForEvent,
  cancelRegistration,
  updateODDecision,
  checkInAttendee,
  getAuditLogs,
  getNotifications,
  markNotificationAsRead,
} from './storage.js';

import {
  checkStudentScheduleConflict,
  checkVenueCollision,
  formatTime12h,
} from './conflictEngine.js';

import { generateQRCodeSVG } from './qr.js';

// Application State
const state = {
  currentTab: 'landing',
  currentUser: null,
  selectedCategory: 'ALL',
  searchQuery: '',
  filterOdOnly: false,
  filterAvailableOnly: false,
  overlayEventsOnTimetable: true,
  pendingEventForConflict: null,
};

// ==========================================================================
// 1. INITIALIZATION & LIFECYCLE
// ==========================================================================
function initApp() {
  initializeStorage();
  state.currentUser = getCurrentUser();

  setupEventListeners();
  updateUserInterfaceForRole();
  renderCurrentTab();
  updateNotificationsBadge();
}

// ==========================================================================
// 2. ROLE & PERSPECTIVE SWITCHING
// ==========================================================================
function setRole(roleName) {
  state.currentUser = switchRole(roleName);
  updateUserInterfaceForRole();
  
  // Auto-route based on persona for optimal UX
  if (roleName === 'STUDENT') {
    switchTab('discover');
  } else if (roleName === 'ORGANIZER') {
    switchTab('organizer');
  } else if (roleName === 'DSA') {
    switchTab('dsa');
  } else if (roleName === 'ADMIN') {
    switchTab('admin');
  }
}

function updateUserInterfaceForRole() {
  const user = state.currentUser;
  if (!user) return;

  // Header user info
  const nameEl = document.getElementById('current-user-name');
  const roleEl = document.getElementById('current-user-role');
  const avatarEl = document.getElementById('current-user-avatar');

  if (nameEl) nameEl.textContent = user.name;
  if (roleEl) roleEl.textContent = user.role.charAt(0) + user.role.slice(1).toLowerCase();
  if (avatarEl && user.avatarUrl) avatarEl.src = user.avatarUrl;

  // Evaluation Ribbon
  const ribbonLabel = document.getElementById('ribbon-user-label');
  if (ribbonLabel) {
    ribbonLabel.textContent = `${user.name} (${user.role})`;
  }

  // Update Ribbon buttons active state
  document.querySelectorAll('.eval-role-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-role') === user.role);
  });

  // Update Dropdown options active state
  document.querySelectorAll('.role-option-item').forEach(btn => {
    btn.classList.toggle('selected', btn.getAttribute('data-role') === user.role);
  });

  // Toggle navigation visibility
  document.querySelectorAll('.nav-student-only').forEach(el => {
    el.classList.toggle('hidden', user.role !== 'STUDENT');
  });
  document.querySelectorAll('.nav-organizer-only').forEach(el => {
    el.classList.toggle('hidden', user.role !== 'ORGANIZER');
  });
  document.querySelectorAll('.nav-dsa-only').forEach(el => {
    el.classList.toggle('hidden', user.role !== 'DSA');
  });
  document.querySelectorAll('.nav-admin-only').forEach(el => {
    el.classList.toggle('hidden', user.role !== 'ADMIN');
  });
}

// ==========================================================================
// 3. TAB NAVIGATION
// ==========================================================================
function switchTab(tabId) {
  state.currentTab = tabId;

  // Update nav link active classes
  document.querySelectorAll('.nav-link').forEach(link => {
    const isActive = link.getAttribute('data-tab') === tabId;
    link.classList.toggle('active', isActive);
  });

  // Show/Hide section views
  document.querySelectorAll('.tab-view').forEach(view => {
    const isTarget = view.id === `view-${tabId}`;
    view.classList.toggle('hidden', !isTarget);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
  renderCurrentTab();
}

function renderCurrentTab() {
  switch (state.currentTab) {
    case 'landing':
      renderLandingView();
      break;
    case 'discover':
      renderDiscoverView();
      break;
    case 'timetable':
      renderTimetableView();
      break;
    case 'registrations':
      renderRegistrationsView();
      break;
    case 'organizer':
      renderOrganizerView();
      break;
    case 'dsa':
      renderDSAView();
      break;
    case 'admin':
      renderAdminView();
      break;
    case 'clubs':
      renderClubsView();
      break;
  }
}

// ==========================================================================
// 4. VIEW RENDERERS
// ==========================================================================

// --- VIEW 1: LANDING PAGE ---
function renderLandingView() {
  const container = document.getElementById('landing-featured-events-grid');
  if (!container) return;

  const events = getAllEvents().filter(e => e.status === 'APPROVED').slice(0, 3);
  const timetable = getStudentTimetable(state.currentUser.id);

  container.innerHTML = events.map(event => createEventCardHTML(event, timetable)).join('');
  attachEventCardListeners(container);
}

// --- VIEW 2: DISCOVER EVENTS PAGE ---
function renderDiscoverView() {
  const container = document.getElementById('discover-events-grid');
  const countLabel = document.getElementById('events-count-label');
  if (!container) return;

  let events = getAllEvents().filter(e => e.status === 'APPROVED');
  const timetable = getStudentTimetable(state.currentUser.id);

  // Filter by category
  if (state.selectedCategory !== 'ALL') {
    events = events.filter(e => e.category === state.selectedCategory);
  }

  // Filter by search query
  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase();
    events = events.filter(e => 
      e.title.toLowerCase().includes(q) ||
      e.clubName.toLowerCase().includes(q) ||
      e.venueName.toLowerCase().includes(q) ||
      (e.tags && e.tags.some(t => t.toLowerCase().includes(q)))
    );
  }

  // Filter by OD Eligibility
  if (state.filterOdOnly) {
    events = events.filter(e => e.isOdEligible);
  }

  // Filter by Open spots
  if (state.filterAvailableOnly) {
    events = events.filter(e => e.registeredCount < e.capacity);
  }

  if (countLabel) {
    countLabel.textContent = `Showing ${events.length} event${events.length === 1 ? '' : 's'}`;
  }

  if (events.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; background: var(--bg-card); border-radius: var(--radius-xl); border: 1px solid var(--border-subtle);">
        <p style="font-weight: 700; font-size: 1.125rem;">No matching events found</p>
        <p style="font-size: 0.8125rem; color: var(--text-secondary); margin-top: 0.25rem;">Try adjusting your search terms or category filters.</p>
        <button class="btn btn-secondary btn-sm" id="btn-reset-filters" style="margin-top: 1rem;">Reset Filters</button>
      </div>
    `;
    const resetBtn = document.getElementById('btn-reset-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.selectedCategory = 'ALL';
        state.searchQuery = '';
        state.filterOdOnly = false;
        state.filterAvailableOnly = false;
        const searchInput = document.getElementById('event-search-input');
        if (searchInput) searchInput.value = '';
        document.querySelectorAll('.category-pill-btn').forEach(btn => {
          btn.classList.toggle('active', btn.getAttribute('data-category') === 'ALL');
        });
        renderDiscoverView();
      });
    }
    return;
  }

  container.innerHTML = events.map(event => createEventCardHTML(event, timetable)).join('');
  attachEventCardListeners(container);
}

function createEventCardHTML(event, timetable) {
  const conflict = checkStudentScheduleConflict(event, timetable);
  const percentage = Math.min(100, Math.round((event.registeredCount / event.capacity) * 100));

  let conflictBadge = '';
  if (conflict.conflictType === 'NONE') {
    conflictBadge = '<span class="badge badge-success">✓ No Timetable Clash</span>';
  } else if (conflict.conflictType === 'PARTIAL') {
    conflictBadge = `<span class="badge badge-warning">⚠ Partial Clash (${conflict.totalOverlapMinutes}m)</span>`;
  } else {
    conflictBadge = `<span class="badge badge-danger">✕ Full Clash (${conflict.totalOverlapMinutes}m)</span>`;
  }

  const dateFormatted = new Date(event.eventDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });

  return `
    <article class="event-card" data-event-id="${event.id}">
      <div class="event-card-media">
        <img src="${event.posterUrl}" alt="${event.title}" class="event-card-img" loading="lazy" />
        <span class="event-category-tag">${event.category}</span>
        ${event.isOdEligible ? '<span class="event-od-pill">OD Sanction Available</span>' : ''}
      </div>

      <div class="event-card-body">
        <div class="event-card-organizer">${event.clubName}</div>
        <h3 class="event-card-title">${event.title}</h3>
        <p class="event-card-desc">${event.description}</p>

        <div class="event-meta-list">
          <div class="event-meta-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            <span>${dateFormatted} &bull; ${formatTime12h(event.startTime)} - ${formatTime12h(event.endTime)}</span>
          </div>
          <div class="event-meta-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>${event.venueName}</span>
          </div>
        </div>

        <div style="margin-bottom: 0.75rem;">
          ${conflictBadge}
        </div>

        <div class="event-card-footer">
          <div class="capacity-progress-container">
            <div class="capacity-text">
              <span>Spots Filled</span>
              <span>${event.registeredCount} / ${event.capacity}</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${percentage}%;"></div>
            </div>
          </div>

          <button class="btn btn-primary btn-sm btn-register-trigger" data-event-id="${event.id}">
            Check & Register
          </button>
        </div>
      </div>
    </article>
  `;
}

function attachEventCardListeners(container) {
  container.querySelectorAll('.btn-register-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const eventId = btn.getAttribute('data-event-id');
      const event = getEventById(eventId);
      if (event) {
        openConflictModal(event);
      }
    });
  });
}

// --- VIEW 3: TIMETABLE VIEW ---
function renderTimetableView() {
  const container = document.getElementById('weekly-timetable-content');
  if (!container) return;

  const timetableSlots = getStudentTimetable(state.currentUser.id);
  const studentRegs = getStudentRegistrations(state.currentUser.id);

  const days = [
    { num: 1, name: 'Monday' },
    { num: 2, name: 'Tuesday' },
    { num: 3, name: 'Wednesday' },
    { num: 4, name: 'Thursday' },
    { num: 5, name: 'Friday' },
  ];

  const timeBlocks = [
    { start: '08:00', end: '10:00', label: '08:00 - 10:00' },
    { start: '10:00', end: '12:00', label: '10:00 - 12:00' },
    { start: '12:00', end: '14:00', label: '12:00 - 14:00' },
    { start: '14:00', end: '16:00', label: '14:00 - 16:00' },
    { start: '16:00', end: '18:00', label: '16:00 - 18:00' },
  ];

  let html = `
    <div class="timetable-col-header">Time</div>
    ${days.map(d => `<div class="timetable-col-header">${d.name}</div>`).join('')}
  `;

  for (const block of timeBlocks) {
    html += `<div class="timetable-time-cell">${block.label}</div>`;

    for (const day of days) {
      // Find matching academic slots for this day & block
      const matchingSlots = timetableSlots.filter(s => {
        if (s.dayOfWeek !== day.num) return false;
        const slotStart = s.startTime;
        return slotStart >= block.start && slotStart < block.end;
      });

      // Find registered events that fall on this day of week if overlay enabled
      let eventOverlays = [];
      if (state.overlayEventsOnTimetable) {
        eventOverlays = studentRegs.filter(r => {
          const d = new Date(r.eventDate + 'T00:00:00');
          if (d.getDay() !== day.num) return false;
          return r.startTime >= block.start && r.startTime < block.end;
        });
      }

      html += `<div class="timetable-slot-cell">`;

      if (matchingSlots.length > 0) {
        for (const slot of matchingSlots) {
          const isClashing = eventOverlays.length > 0;
          html += `
            <div class="academic-slot-card ${isClashing ? 'clashing' : ''}">
              <span class="academic-subject-code">${slot.subjectCode}</span>
              <span class="academic-subject-name">${slot.subjectName}</span>
              <span class="academic-room-tag">${slot.room || 'Room 304'} &bull; ${formatTime12h(slot.startTime)}</span>
            </div>
          `;
        }
      }

      if (eventOverlays.length > 0) {
        for (const ev of eventOverlays) {
          html += `
            <div class="event-overlay-slot">
              🎯 ${ev.eventTitle} (${formatTime12h(ev.startTime)})
            </div>
          `;
        }
      }

      if (matchingSlots.length === 0 && eventOverlays.length === 0) {
        html += `<span style="font-size: 0.6875rem; color: var(--text-muted);">Free</span>`;
      }

      html += `</div>`;
    }
  }

  container.innerHTML = html;
}

// --- VIEW 4: MY PASSES & OD PAGE ---
function renderRegistrationsView() {
  const container = document.getElementById('my-passes-grid');
  if (!container) return;

  const registrations = getStudentRegistrations(state.currentUser.id);

  if (registrations.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; background: var(--bg-card); border-radius: var(--radius-xl); border: 1px solid var(--border-subtle);">
        <p style="font-weight: 700; font-size: 1.125rem;">You haven't registered for any campus events yet</p>
        <p style="font-size: 0.8125rem; color: var(--text-secondary); margin-top: 0.25rem;">Browse upcoming hackathons, guest lectures, and cultural events.</p>
        <button class="btn btn-primary btn-sm" id="btn-browse-events-empty" style="margin-top: 1.25rem;">
          Discover Events
        </button>
      </div>
    `;
    const btn = document.getElementById('btn-browse-events-empty');
    if (btn) btn.addEventListener('click', () => switchTab('discover'));
    return;
  }

  container.innerHTML = registrations.map(reg => {
    let odBadge = '<span class="badge" style="background:#F1F5F9; color:#475569;">No OD Requested</span>';
    if (reg.odStatus === 'PENDING') {
      odBadge = '<span class="badge badge-warning">⏳ OD Pending Review</span>';
    } else if (reg.odStatus === 'APPROVED') {
      odBadge = '<span class="badge badge-success">✓ OD Approved by Dean</span>';
    } else if (reg.odStatus === 'REJECTED') {
      odBadge = '<span class="badge badge-danger">✕ OD Declined</span>';
    }

    const dateFormatted = new Date(reg.eventDate + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });

    return `
      <article class="ticket-pass-card" data-reg-id="${reg.id}">
        <div class="ticket-pass-top">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
            <span style="font-size: 0.6875rem; font-weight: 800; color: var(--accent-terracotta); text-transform: uppercase; letter-spacing: 0.05em;">
              Digital Entry Pass
            </span>
            ${odBadge}
          </div>

          <h3 style="font-size: 1.125rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.5rem;">
            ${reg.eventTitle}
          </h3>

          <div style="font-size: 0.8125rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.25rem;">
            <div>📅 ${dateFormatted} &bull; ${formatTime12h(reg.startTime)} - ${formatTime12h(reg.endTime)}</div>
            <div>📍 ${reg.venueName}</div>
            <div>👤 Student: <strong>${reg.studentName}</strong> (${reg.studentRoll})</div>
          </div>

          <div class="ticket-pass-notch-left"></div>
          <div class="ticket-pass-notch-right"></div>
        </div>

        <div class="ticket-pass-bottom">
          <div>
            <div style="font-size: 0.6875rem; color: var(--text-muted); margin-bottom: 0.25rem;">PASS CODE</div>
            <span class="ticket-code-tag">${reg.qrTicketCode}</span>
          </div>

          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-secondary btn-sm btn-open-pass-modal" data-reg-id="${reg.id}">
              View QR Pass
            </button>
            <button class="btn btn-cream btn-sm btn-cancel-reg" data-reg-id="${reg.id}" title="Cancel registration">
              Cancel
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  // Attach pass modal openers
  container.querySelectorAll('.btn-open-pass-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      const regId = btn.getAttribute('data-reg-id');
      const allRegs = getAllRegistrations();
      const match = allRegs.find(r => r.id === regId);
      if (match) openTicketModal(match);
    });
  });

  // Attach cancel listeners
  container.querySelectorAll('.btn-cancel-reg').forEach(btn => {
    btn.addEventListener('click', () => {
      const regId = btn.getAttribute('data-reg-id');
      if (confirm('Are you sure you want to cancel this event registration?')) {
        cancelRegistration(regId, state.currentUser);
        renderRegistrationsView();
      }
    });
  });
}

// --- VIEW 5: ORGANIZER DASHBOARD ---
function renderOrganizerView() {
  const venues = getAllVenues();
  const clubs = getAllClubs();
  const events = getAllEvents();

  // Populate Venue and Club dropdowns in Create Event Form
  const venueSelect = document.getElementById('ev-form-venue');
  const clubSelect = document.getElementById('ev-form-club');

  if (venueSelect) {
    venueSelect.innerHTML = venues.map(v => `<option value="${v.id}">${v.name} (Cap: ${v.capacity})</option>`).join('');
  }
  if (clubSelect) {
    clubSelect.innerHTML = clubs.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }

  // Live venue collision checker listeners
  const dateInput = document.getElementById('ev-form-date');
  const startInput = document.getElementById('ev-form-start');
  const endInput = document.getElementById('ev-form-end');
  const warningBox = document.getElementById('venue-clash-warning');

  function checkFormCollision() {
    if (!dateInput || !startInput || !endInput || !venueSelect || !warningBox) return;
    const proposed = {
      venueId: venueSelect.value,
      eventDate: dateInput.value,
      startTime: startInput.value,
      endTime: endInput.value,
    };
    const check = checkVenueCollision(proposed, getAllEvents());
    if (check.hasClash) {
      warningBox.textContent = `⚠ Venue Conflict: ${check.message}`;
      warningBox.classList.remove('hidden');
    } else {
      warningBox.classList.add('hidden');
    }
  }

  if (dateInput) dateInput.onchange = checkFormCollision;
  if (startInput) startInput.onchange = checkFormCollision;
  if (endInput) endInput.onchange = checkFormCollision;
  if (venueSelect) venueSelect.onchange = checkFormCollision;

  // Render Organized Events Table
  const tableBody = document.getElementById('org-events-table-body');
  if (tableBody) {
    tableBody.innerHTML = events.map(ev => {
      let statusBadge = '';
      if (ev.status === 'APPROVED') {
        statusBadge = '<span class="badge badge-success">✓ Approved</span>';
      } else if (ev.status === 'PENDING_DSA') {
        statusBadge = '<span class="badge badge-warning">⏳ Under Review</span>';
      } else if (ev.status === 'DRAFT') {
        statusBadge = '<span class="badge badge-info">Draft</span>';
      } else {
        statusBadge = '<span class="badge badge-danger">Rejected</span>';
      }

      return `
        <tr>
          <td><strong>${ev.title}</strong><br><span style="font-size:0.6875rem; color:var(--text-muted);">${ev.category}</span></td>
          <td>${ev.eventDate}<br><span style="font-size:0.6875rem; color:var(--text-muted);">${formatTime12h(ev.startTime)} - ${formatTime12h(ev.endTime)}</span></td>
          <td>${ev.venueName}</td>
          <td><strong>${ev.registeredCount}</strong> / ${ev.capacity}</td>
          <td>${statusBadge}</td>
          <td>
            <button class="btn btn-cream btn-sm" onclick="navigator.clipboard.writeText('${ev.id}')">Copy ID</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Update Organizer metric counts
  const metricEvents = document.getElementById('org-metric-events');
  const metricReg = document.getElementById('org-metric-reg');
  const metricApproved = document.getElementById('org-metric-approved');

  if (metricEvents) metricEvents.textContent = events.length;
  if (metricReg) metricReg.textContent = events.reduce((sum, e) => sum + e.registeredCount, 0);
  if (metricApproved) metricApproved.textContent = events.filter(e => e.status === 'APPROVED').length;
}

// --- VIEW 6: DSA DASHBOARD ---
function renderDSAView() {
  const registrations = getAllRegistrations();
  const events = getAllEvents();
  const auditLogs = getAuditLogs();

  // Pending OD table
  const pendingODs = registrations.filter(r => r.odStatus === 'PENDING');
  const odTableBody = document.getElementById('dsa-od-table-body');
  const odBadge = document.getElementById('dsa-od-count-badge');

  if (odBadge) odBadge.textContent = `${pendingODs.length} Pending`;

  if (odTableBody) {
    if (pendingODs.length === 0) {
      odTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:2rem;">No pending student OD sanctions.</td></tr>`;
    } else {
      odTableBody.innerHTML = pendingODs.map(reg => `
        <tr>
          <td><strong>${reg.studentName}</strong><br><span style="font-size:0.6875rem; color:var(--text-muted);">${reg.studentRoll} &bull; ${reg.studentDepartment}</span></td>
          <td>${reg.eventTitle}</td>
          <td>${reg.eventDate}</td>
          <td><span class="badge badge-warning">${reg.conflictDetails && reg.conflictDetails[0] ? reg.conflictDetails[0] : 'Academic Slot Clash'}</span></td>
          <td style="font-size:0.75rem; max-width:200px;">"${reg.odReason || 'Department representation'}"</td>
          <td>
            <div style="display:flex; gap:0.375rem;">
              <button class="btn btn-success btn-sm btn-dsa-od-approve" data-reg-id="${reg.id}">Approve</button>
              <button class="btn btn-danger btn-sm btn-dsa-od-reject" data-reg-id="${reg.id}">Decline</button>
            </div>
          </td>
        </tr>
      `).join('');

      odTableBody.querySelectorAll('.btn-dsa-od-approve').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-reg-id');
          updateODDecision(id, 'APPROVED', 'Approved by Dean - Student Affairs', state.currentUser);
          renderDSAView();
        });
      });

      odTableBody.querySelectorAll('.btn-dsa-od-reject').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-reg-id');
          const reason = prompt('Enter rejection reason for student notification:', 'Attendance threshold conflict') || 'Schedule conflict cannot be excused';
          updateODDecision(id, 'REJECTED', reason, state.currentUser);
          renderDSAView();
        });
      });
    }
  }

  // Pending Event Proposals
  const pendingEvents = events.filter(e => e.status === 'PENDING_DSA');
  const eventTableBody = document.getElementById('dsa-event-table-body');
  const eventBadge = document.getElementById('dsa-event-count-badge');

  if (eventBadge) eventBadge.textContent = `${pendingEvents.length} Pending`;

  if (eventTableBody) {
    if (pendingEvents.length === 0) {
      eventTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:2rem;">All event proposals have been processed.</td></tr>`;
    } else {
      eventTableBody.innerHTML = pendingEvents.map(ev => `
        <tr>
          <td><strong>${ev.title}</strong><br><span style="font-size:0.6875rem; color:var(--text-muted);">${ev.category}</span></td>
          <td>${ev.clubName}</td>
          <td>${ev.eventDate}<br><span style="font-size:0.6875rem; color:var(--text-muted);">${formatTime12h(ev.startTime)} - ${formatTime12h(ev.endTime)}</span></td>
          <td>${ev.venueName} (Cap: ${ev.capacity})</td>
          <td>${ev.isOdEligible ? '<span class="badge badge-success">Yes</span>' : '<span class="badge badge-info">No</span>'}</td>
          <td>
            <div style="display:flex; gap:0.375rem;">
              <button class="btn btn-success btn-sm btn-dsa-ev-approve" data-ev-id="${ev.id}">Approve</button>
              <button class="btn btn-danger btn-sm btn-dsa-ev-reject" data-ev-id="${ev.id}">Decline</button>
            </div>
          </td>
        </tr>
      `).join('');

      eventTableBody.querySelectorAll('.btn-dsa-ev-approve').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-ev-id');
          updateEventStatus(id, 'APPROVED', state.currentUser);
          renderDSAView();
        });
      });

      eventTableBody.querySelectorAll('.btn-dsa-ev-reject').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-ev-id');
          const reason = prompt('Enter rejection reason for organizer:', 'Venue maintenance scheduled') || 'Declined by DSA';
          updateEventStatus(id, 'REJECTED', state.currentUser, reason);
          renderDSAView();
        });
      });
    }
  }

  // Audit Log Table
  const auditTableBody = document.getElementById('dsa-audit-table-body');
  if (auditTableBody) {
    auditTableBody.innerHTML = auditLogs.slice(0, 15).map(log => `
      <tr>
        <td style="font-family:monospace; font-size:0.75rem;">${new Date(log.timestamp).toLocaleTimeString()}</td>
        <td><strong>${log.actorName}</strong> <span style="font-size:0.6875rem; color:var(--text-muted);">(${log.actorRole})</span></td>
        <td><span class="badge badge-terracotta">${log.action}</span></td>
        <td style="font-size:0.75rem; color:var(--text-secondary);">${log.details}</td>
      </tr>
    `).join('');
  }
}

// --- VIEW 7: ADMIN MASTER ---
function renderAdminView() {
  const venues = getAllVenues();
  const tableBody = document.getElementById('admin-venues-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = venues.map(v => `
    <tr>
      <td><strong>${v.name}</strong></td>
      <td>${v.building}</td>
      <td><strong>${v.capacity}</strong> attendees</td>
      <td>${v.facilities.map(f => `<span class="badge badge-info" style="margin-right:0.25rem;">${f}</span>`).join('')}</td>
      <td><span class="badge badge-success">Active & Bookable</span></td>
    </tr>
  `).join('');
}

// --- VIEW 8: CLUBS DIRECTORY ---
function renderClubsView() {
  const container = document.getElementById('clubs-directory-grid');
  if (!container) return;

  const clubs = getAllClubs();
  const events = getAllEvents();

  container.innerHTML = clubs.map(c => {
    const clubEvents = events.filter(e => e.clubId === c.id);
    return `
      <article class="feature-card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <span class="badge badge-terracotta">${c.category}</span>
          <span style="font-size: 0.75rem; color: var(--text-muted);">Est. ${c.establishedYear}</span>
        </div>

        <h3 style="margin-top: 0.5rem;">${c.name}</h3>
        <p>${c.description}</p>

        <div style="margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--border-subtle); font-size: 0.8125rem; color: var(--text-secondary); display: flex; justify-content: space-between;">
          <span>Lead: <strong>${c.leadName}</strong></span>
          <span><strong>${c.memberCount}</strong> Members</span>
        </div>

        <div style="font-size: 0.75rem; color: var(--accent-terracotta); font-weight: 700;">
          ${clubEvents.length} active event${clubEvents.length === 1 ? '' : 's'} hosted
        </div>
      </article>
    `;
  }).join('');
}

// ==========================================================================
// 5. MODALS & WORKFLOWS
// ==========================================================================

// --- CONFLICT & REGISTRATION MODAL ---
function openConflictModal(event) {
  state.pendingEventForConflict = event;
  const modal = document.getElementById('modal-conflict');
  const body = document.getElementById('conflict-modal-body');
  if (!modal || !body) return;

  const timetable = getStudentTimetable(state.currentUser.id);
  const conflict = checkStudentScheduleConflict(event, timetable);

  let bannerHTML = '';
  if (conflict.conflictType === 'NONE') {
    bannerHTML = `
      <div style="background-color: var(--success-bg); border: 1px solid var(--success-border); border-radius: var(--radius-lg); padding: 1.25rem; display: flex; gap: 0.75rem; align-items: center;">
        <span style="font-size: 1.5rem; color: var(--success-solid);">✓</span>
        <div>
          <h4 style="color: var(--success-text); font-size: 0.9375rem;">No Academic Timetable Conflict</h4>
          <p style="font-size: 0.8125rem; color: var(--success-text);">
            Your class schedule is completely clear during this event window. You can attend freely without missing any lectures!
          </p>
        </div>
      </div>
    `;
  } else if (conflict.conflictType === 'PARTIAL') {
    bannerHTML = `
      <div style="background-color: var(--warning-bg); border: 1px solid var(--warning-border); border-radius: var(--radius-lg); padding: 1.25rem; display: flex; gap: 0.75rem; align-items: flex-start;">
        <span style="font-size: 1.5rem; color: var(--warning-solid);">⚠</span>
        <div>
          <h4 style="color: var(--warning-text); font-size: 0.9375rem;">Partial Academic Schedule Overlap</h4>
          <p style="font-size: 0.8125rem; color: var(--warning-text); margin-bottom: 0.5rem;">
            This event overlaps with ${conflict.clashingSlots.length} lecture session (${conflict.totalOverlapMinutes} minutes overlap).
          </p>
          <div style="background: rgba(255,255,255,0.7); border-radius: var(--radius-sm); padding: 0.5rem; font-size: 0.75rem; font-weight: 600;">
            ${conflict.clashingSlots.map(c => `<div>Clashing Lecture: ${c.description}</div>`).join('')}
          </div>
        </div>
      </div>
    `;
  } else {
    bannerHTML = `
      <div style="background-color: var(--danger-bg); border: 1px solid var(--danger-border); border-radius: var(--radius-lg); padding: 1.25rem; display: flex; gap: 0.75rem; align-items: flex-start;">
        <span style="font-size: 1.5rem; color: var(--danger-solid);">✕</span>
        <div>
          <h4 style="color: var(--danger-text); font-size: 0.9375rem;">Major Academic Timetable Conflict</h4>
          <p style="font-size: 0.8125rem; color: var(--danger-text); margin-bottom: 0.5rem;">
            Event completely overlaps with required lectures/labs (${conflict.totalOverlapMinutes} minutes total clash).
          </p>
          <div style="background: rgba(255,255,255,0.7); border-radius: var(--radius-sm); padding: 0.5rem; font-size: 0.75rem; font-weight: 600;">
            ${conflict.clashingSlots.map(c => `<div>Clashing Class: ${c.description}</div>`).join('')}
          </div>
        </div>
      </div>
    `;
  }

  const dateFormatted = new Date(event.eventDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric', year: 'numeric',
  });

  body.innerHTML = `
    <!-- Event Summary Card -->
    <div style="background-color: var(--bg-cream); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 1.25rem;">
      <span style="font-size: 0.6875rem; font-weight: 800; color: var(--accent-terracotta); text-transform: uppercase;">
        ${event.clubName}
      </span>
      <h3 style="font-size: 1.125rem; font-weight: 800; color: var(--text-primary); margin-top: 0.25rem;">
        ${event.title}
      </h3>
      <div style="font-size: 0.8125rem; color: var(--text-secondary); margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.25rem;">
        <div>📅 ${dateFormatted} &bull; ${formatTime12h(event.startTime)} - ${formatTime12h(event.endTime)}</div>
        <div>📍 ${event.venueName} (Cap: ${event.capacity})</div>
        <div>👥 Current Registrations: <strong>${event.registeredCount}</strong> / ${event.capacity}</div>
      </div>
    </div>

    <!-- Conflict Result Card -->
    ${bannerHTML}

    <!-- OD Sanction Application Checkbox -->
    ${event.isOdEligible ? `
      <div style="background-color: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 1.25rem;">
        <label style="display: flex; align-items: flex-start; gap: 0.75rem; cursor: pointer;">
          <input type="checkbox" id="modal-request-od-cb" ${conflict.conflictType !== 'NONE' ? 'checked' : ''} style="margin-top: 0.25rem; accent-color: var(--accent-terracotta);" />
          <div>
            <span style="font-weight: 700; font-size: 0.875rem; color: var(--text-primary);">
              Request Institutional On-Duty (OD) Sanction
            </span>
            <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">
              Since this event is officially recognized by the DSA office, submitted OD requests will be routed to Dr. Ramanathan for attendance credit.
            </p>
          </div>
        </label>

        <div id="modal-od-reason-group" style="margin-top: 0.75rem;">
          <label class="form-label">Justification / Reason (Optional)</label>
          <input type="text" id="modal-od-reason-input" class="form-input" placeholder="e.g. Presenting paper / competing on behalf of university..." />
        </div>
      </div>
    ` : `
      <div style="font-size: 0.75rem; color: var(--text-muted); background: var(--bg-cream); padding: 0.75rem; border-radius: var(--radius-md);">
        ℹ This is an extracurricular hobby session. Academic On-Duty (OD) sanction is not available.
      </div>
    `}
  `;

  modal.classList.add('open');
}

function closeConflictModal() {
  const modal = document.getElementById('modal-conflict');
  if (modal) modal.classList.remove('open');
  state.pendingEventForConflict = null;
}

// --- TICKET / GATE PASS MODAL ---
function openTicketModal(registration) {
  const modal = document.getElementById('modal-ticket');
  const body = document.getElementById('ticket-modal-body');
  if (!modal || !body) return;

  const qrSvg = generateQRCodeSVG(registration.qrTicketCode, 180);

  const dateFormatted = new Date(registration.eventDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric', year: 'numeric',
  });

  body.innerHTML = `
    <div style="background: linear-gradient(135deg, #FAF6F0, #FFFFFF); border: 2px dashed var(--border-strong); border-radius: var(--radius-xl); padding: 1.5rem; text-align: center;">
      
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <span style="font-size: 0.6875rem; font-weight: 800; color: var(--accent-terracotta); text-transform: uppercase;">
          CAMPUSSYNC DIGITAL PASS
        </span>
        <span class="badge ${registration.odStatus === 'APPROVED' ? 'badge-success' : 'badge-warning'}">
          ${registration.odStatus === 'APPROVED' ? 'OD Approved' : 'Standard Gate Pass'}
        </span>
      </div>

      <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.25rem;">
        ${registration.eventTitle}
      </h3>

      <div style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: 1.25rem;">
        <div>${dateFormatted} &bull; ${formatTime12h(registration.startTime)} - ${formatTime12h(registration.endTime)}</div>
        <div style="font-weight: 600; color: var(--text-primary);">${registration.venueName}</div>
      </div>

      <!-- QR Code -->
      <div style="display: inline-block; padding: 0.75rem; background: #FFFFFF; border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); margin-bottom: 1rem;">
        ${qrSvg}
      </div>

      <!-- Pass Code -->
      <div style="font-family: monospace; font-size: 0.8125rem; font-weight: 800; letter-spacing: 0.08em; background: var(--bg-cream); padding: 0.5rem 1rem; border-radius: var(--radius-md); display: inline-block; margin-bottom: 1rem;">
        ${registration.qrTicketCode}
      </div>

      <div style="border-top: 1px solid var(--border-subtle); padding-top: 1rem; font-size: 0.8125rem; display: flex; justify-content: space-around;">
        <div>
          <span style="color: var(--text-muted); font-size: 0.6875rem; display: block;">ATTENDEE</span>
          <strong>${registration.studentName}</strong>
        </div>
        <div>
          <span style="color: var(--text-muted); font-size: 0.6875rem; display: block;">ROLL NUMBER</span>
          <strong>${registration.studentRoll}</strong>
        </div>
      </div>

      ${registration.checkedInAt ? `
        <div style="margin-top: 1rem; background: var(--success-bg); color: var(--success-text); padding: 0.5rem; border-radius: var(--radius-md); font-size: 0.75rem; font-weight: 700;">
          ✓ Verified at Gate Entrance (${new Date(registration.checkedInAt).toLocaleTimeString()})
        </div>
      ` : ''}

    </div>
  `;

  modal.classList.add('open');
}

function closeTicketModal() {
  const modal = document.getElementById('modal-ticket');
  if (modal) modal.classList.remove('open');
}

// --- NOTIFICATIONS DRAWER ---
function toggleNotificationDrawer(forceState) {
  const drawer = document.getElementById('drawer-notifications');
  if (!drawer) return;

  const isOpen = forceState !== undefined ? forceState : !drawer.classList.contains('open');
  drawer.classList.toggle('open', isOpen);

  if (isOpen) {
    renderNotificationsList();
  }
}

function renderNotificationsList() {
  const container = document.getElementById('notif-list-container');
  if (!container) return;

  const notifs = getNotifications(state.currentUser.id);
  if (notifs.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:3rem 1rem; color:var(--text-muted); font-size:0.875rem;">No new notifications</div>`;
    return;
  }

  container.innerHTML = notifs.map(n => `
    <div class="notification-item ${n.read ? '' : 'unread'}" data-notif-id="${n.id}">
      <div class="notification-title">${n.title}</div>
      <div class="notification-msg">${n.message}</div>
      <span class="notification-time">${new Date(n.createdAt).toLocaleDateString()}</span>
    </div>
  `).join('');

  container.querySelectorAll('.notification-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.getAttribute('data-notif-id');
      markNotificationAsRead(id);
      renderNotificationsList();
      updateNotificationsBadge();
    });
  });
}

function updateNotificationsBadge() {
  const badge = document.getElementById('notif-badge');
  if (!badge) return;

  const notifs = getNotifications(state.currentUser.id);
  const unreadCount = notifs.filter(n => !n.read).length;

  badge.style.display = unreadCount > 0 ? 'block' : 'none';
}

// ==========================================================================
// 6. EVENT LISTENERS SETUP
// ==========================================================================
function setupEventListeners() {
  // Brand logo
  const brandLogo = document.getElementById('brand-logo-btn');
  if (brandLogo) {
    brandLogo.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab('landing');
    });
  }

  // Navigation Links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      const tab = link.getAttribute('data-tab');
      if (tab) switchTab(tab);
    });
  });

  // Footer navigation links
  document.querySelectorAll('.footer-links-list a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = link.getAttribute('data-tab');
      if (tab) switchTab(tab);
    });
  });

  // Hero CTAs
  const heroBtnDiscover = document.getElementById('hero-btn-discover');
  if (heroBtnDiscover) {
    heroBtnDiscover.addEventListener('click', () => switchTab('discover'));
  }
  const heroBtnTimetable = document.getElementById('hero-btn-timetable');
  if (heroBtnTimetable) {
    heroBtnTimetable.addEventListener('click', () => switchTab('timetable'));
  }
  const landingAllEvents = document.getElementById('landing-view-all-events-btn');
  if (landingAllEvents) {
    landingAllEvents.addEventListener('click', () => switchTab('discover'));
  }

  const passesExploreBtn = document.getElementById('passes-explore-btn');
  if (passesExploreBtn) {
    passesExploreBtn.addEventListener('click', () => switchTab('discover'));
  }

  // Role Switcher Dropdown
  const userMenuBtn = document.getElementById('user-menu-btn');
  const roleDropdown = document.getElementById('role-menu-dropdown');
  if (userMenuBtn && roleDropdown) {
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      roleDropdown.classList.toggle('show');
    });
    document.addEventListener('click', (e) => {
      if (!roleDropdown.contains(e.target)) {
        roleDropdown.classList.remove('show');
      }
    });
  }

  document.querySelectorAll('.role-option-item').forEach(item => {
    item.addEventListener('click', () => {
      const role = item.getAttribute('data-role');
      if (role) {
        setRole(role);
        if (roleDropdown) roleDropdown.classList.remove('show');
      }
    });
  });

  // Persona Workflow Cards
  document.querySelectorAll('[data-action="switch-role"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetRole = btn.getAttribute('data-target');
      if (targetRole) setRole(targetRole);
    });
  });

  // Evaluation Ribbon
  document.querySelectorAll('.eval-role-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const role = btn.getAttribute('data-role');
      if (role) setRole(role);
    });
  });

  // Notifications Bell
  const notifBtn = document.getElementById('notif-toggle-btn');
  if (notifBtn) {
    notifBtn.addEventListener('click', () => toggleNotificationDrawer(true));
  }
  const closeNotifBtn = document.getElementById('btn-close-notif-drawer');
  if (closeNotifBtn) {
    closeNotifBtn.addEventListener('click', () => toggleNotificationDrawer(false));
  }

  // Reset Demo State
  const resetBtn = document.getElementById('reset-data-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset all demo state to fresh default dataset?')) {
        resetAllData();
        state.currentUser = getCurrentUser();
        updateUserInterfaceForRole();
        renderCurrentTab();
        updateNotificationsBadge();
        alert('All demo data has been reset to defaults.');
      }
    });
  }

  // Search input
  const searchInput = document.getElementById('event-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderDiscoverView();
    });
  }

  // Category pills
  document.querySelectorAll('.category-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.category-pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedCategory = btn.getAttribute('data-category') || 'ALL';
      renderDiscoverView();
    });
  });

  // Discover checkboxes
  const odOnlyCb = document.getElementById('filter-od-only');
  if (odOnlyCb) {
    odOnlyCb.addEventListener('change', (e) => {
      state.filterOdOnly = e.target.checked;
      renderDiscoverView();
    });
  }
  const openSeatsCb = document.getElementById('filter-available-only');
  if (openSeatsCb) {
    openSeatsCb.addEventListener('change', (e) => {
      state.filterAvailableOnly = e.target.checked;
      renderDiscoverView();
    });
  }

  // Timetable Overlay Toggle
  const toggleOverlay = document.getElementById('toggle-overlay-events');
  if (toggleOverlay) {
    toggleOverlay.addEventListener('change', (e) => {
      state.overlayEventsOnTimetable = e.target.checked;
      renderTimetableView();
    });
  }

  // Modal Closers
  const closeConflictBtn = document.getElementById('btn-close-conflict-modal');
  if (closeConflictBtn) closeConflictBtn.addEventListener('click', closeConflictModal);
  const cancelConflictBtn = document.getElementById('btn-cancel-conflict-modal');
  if (cancelConflictBtn) cancelConflictBtn.addEventListener('click', closeConflictModal);

  const closeTicketBtn = document.getElementById('btn-close-ticket-modal');
  if (closeTicketBtn) closeTicketBtn.addEventListener('click', closeTicketModal);
  const doneTicketBtn = document.getElementById('btn-done-ticket-modal');
  if (doneTicketBtn) doneTicketBtn.addEventListener('click', closeTicketModal);

  // Confirm Registration in Conflict Modal
  const confirmRegBtn = document.getElementById('btn-confirm-registration');
  if (confirmRegBtn) {
    confirmRegBtn.addEventListener('click', () => {
      if (!state.pendingEventForConflict) return;

      const event = state.pendingEventForConflict;
      const timetable = getStudentTimetable(state.currentUser.id);
      const conflict = checkStudentScheduleConflict(event, timetable);

      const requestOdCb = document.getElementById('modal-request-od-cb');
      const odReasonInput = document.getElementById('modal-od-reason-input');

      const wantOD = requestOdCb ? requestOdCb.checked : false;
      const odReason = odReasonInput ? odReasonInput.value.trim() : '';

      const regResult = registerStudentForEvent({
        eventId: event.id,
        user: state.currentUser,
        conflictType: conflict.conflictType,
        conflictDetails: conflict.clashingSlots.map(c => c.description),
        requestOD: wantOD,
        odReason: odReason,
      });

      closeConflictModal();

      if (regResult.success && regResult.registration) {
        openTicketModal(regResult.registration);
        updateNotificationsBadge();
        renderCurrentTab();
      } else {
        alert(regResult.error || 'Failed to complete registration.');
      }
    });
  }

  // Organizer: Create Event Form
  const createEventForm = document.getElementById('create-event-form');
  if (createEventForm) {
    createEventForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const newEventData = {
        title: document.getElementById('ev-form-title').value,
        description: document.getElementById('ev-form-desc').value,
        category: document.getElementById('ev-form-category').value,
        clubId: document.getElementById('ev-form-club').value,
        eventDate: document.getElementById('ev-form-date').value,
        venueId: document.getElementById('ev-form-venue').value,
        startTime: document.getElementById('ev-form-start').value,
        endTime: document.getElementById('ev-form-end').value,
        capacity: document.getElementById('ev-form-capacity').value,
        isOdEligible: document.getElementById('ev-form-od').checked,
        hasCertificate: true,
        tags: ['NewEvent'],
      };

      const result = createEvent(newEventData, state.currentUser);
      if (result.success) {
        alert('Event proposal submitted! It is now pending DSA Institutional Review.');
        createEventForm.reset();
        renderOrganizerView();
      } else {
        alert(result.error || 'Failed to create event proposal.');
      }
    });
  }

  // Organizer: Gate Pass Scanner
  const verifyPassBtn = document.getElementById('btn-verify-pass');
  const scannerInput = document.getElementById('scanner-code-input');
  const scannerResult = document.getElementById('scanner-result-box');

  if (verifyPassBtn && scannerInput && scannerResult) {
    verifyPassBtn.addEventListener('click', () => {
      const code = scannerInput.value.trim();
      if (!code) {
        alert('Please enter or scan a pass code.');
        return;
      }

      const res = checkInAttendee(code, state.currentUser);
      scannerResult.classList.remove('hidden');

      if (res.success && res.registration) {
        scannerResult.style.backgroundColor = 'var(--success-bg)';
        scannerResult.style.border = '1px solid var(--success-border)';
        scannerResult.style.color = 'var(--success-text)';
        scannerResult.innerHTML = `
          <strong>✓ Verified Entry Granted:</strong> ${res.registration.studentName} (${res.registration.studentRoll})
          <br>Event: ${res.registration.eventTitle} &bull; Timestamp: ${new Date().toLocaleTimeString()}
        `;
        scannerInput.value = '';
      } else {
        scannerResult.style.backgroundColor = 'var(--danger-bg)';
        scannerResult.style.border = '1px solid var(--danger-border)';
        scannerResult.style.color = 'var(--danger-text)';
        scannerResult.innerHTML = `<strong>✕ Verification Alert:</strong> ${res.error}`;
      }
    });
  }

  // Admin Export JSON
  const exportBtn = document.getElementById('btn-export-data');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const dump = {
        users: getAllUsers(),
        venues: getAllVenues(),
        clubs: getAllClubs(),
        events: getAllEvents(),
        registrations: getAllRegistrations(),
        auditLogs: getAuditLogs(),
      };
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campussync-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
