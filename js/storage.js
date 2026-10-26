/**
 * CampusSync - Storage & State Layer
 * LocalStorage-backed state with full persistence and reset capabilities.
 */

import {
  INITIAL_USERS,
  INITIAL_VENUES,
  INITIAL_CLUBS,
  INITIAL_EVENTS,
  INITIAL_TIMETABLE_SLOTS,
  INITIAL_REGISTRATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
} from './data.js';

import { checkVenueCollision } from './conflictEngine.js';

const STORAGE_KEYS = {
  USERS: 'campussync_users_v2',
  CURRENT_USER_ID: 'campussync_current_user_id_v2',
  VENUES: 'campussync_venues_v2',
  CLUBS: 'campussync_clubs_v2',
  EVENTS: 'campussync_events_v2',
  TIMETABLE: 'campussync_timetable_v2',
  REGISTRATIONS: 'campussync_registrations_v2',
  AUDIT_LOGS: 'campussync_audit_logs_v2',
  NOTIFICATIONS: 'campussync_notifications_v2',
};

function getStored(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to parse ${key} from storage`, e);
    return defaultValue;
  }
}

function setStored(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to write ${key} to storage`, e);
  }
}

export function initializeStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    setStored(STORAGE_KEYS.USERS, INITIAL_USERS);
    setStored(STORAGE_KEYS.CURRENT_USER_ID, INITIAL_USERS[0].id);
    setStored(STORAGE_KEYS.VENUES, INITIAL_VENUES);
    setStored(STORAGE_KEYS.CLUBS, INITIAL_CLUBS);
    setStored(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
    setStored(STORAGE_KEYS.TIMETABLE, INITIAL_TIMETABLE_SLOTS);
    setStored(STORAGE_KEYS.REGISTRATIONS, INITIAL_REGISTRATIONS);
    setStored(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    setStored(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  }
}

export function resetAllData() {
  localStorage.removeItem(STORAGE_KEYS.USERS);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
  localStorage.removeItem(STORAGE_KEYS.VENUES);
  localStorage.removeItem(STORAGE_KEYS.CLUBS);
  localStorage.removeItem(STORAGE_KEYS.EVENTS);
  localStorage.removeItem(STORAGE_KEYS.TIMETABLE);
  localStorage.removeItem(STORAGE_KEYS.REGISTRATIONS);
  localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
  localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
  initializeStorage();
}

// =================== USERS & AUTH ===================
export function getCurrentUser() {
  initializeStorage();
  const currentId = getStored(STORAGE_KEYS.CURRENT_USER_ID, INITIAL_USERS[0].id);
  const users = getStored(STORAGE_KEYS.USERS, INITIAL_USERS);
  return users.find(u => u.id === currentId) || users[0];
}

export function getAllUsers() {
  initializeStorage();
  return getStored(STORAGE_KEYS.USERS, INITIAL_USERS);
}

export function setCurrentUserById(userId) {
  initializeStorage();
  setStored(STORAGE_KEYS.CURRENT_USER_ID, userId);
}

export function switchRole(targetRole) {
  initializeStorage();
  const users = getAllUsers();
  const match = users.find(u => u.role === targetRole);
  if (match) {
    setCurrentUserById(match.id);
    return match;
  }
  return getCurrentUser();
}

// =================== VENUES & CLUBS ===================
export function getAllVenues() {
  initializeStorage();
  return getStored(STORAGE_KEYS.VENUES, INITIAL_VENUES);
}

export function getAllClubs() {
  initializeStorage();
  return getStored(STORAGE_KEYS.CLUBS, INITIAL_CLUBS);
}

// =================== EVENTS ===================
export function getAllEvents() {
  initializeStorage();
  return getStored(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
}

export function getEventById(id) {
  const events = getAllEvents();
  return events.find(e => e.id === id) || null;
}

export function createEvent(eventData, creator) {
  const events = getAllEvents();
  const venues = getAllVenues();
  const clubs = getAllClubs();

  const venue = venues.find(v => v.id === eventData.venueId);
  const club = clubs.find(c => c.id === eventData.clubId);

  // Check venue collisions
  const clashResult = checkVenueCollision(eventData, events);
  if (clashResult.hasClash) {
    return { success: false, error: clashResult.message };
  }

  const newEvent = {
    id: `ev-${Date.now()}`,
    clubId: eventData.clubId,
    clubName: club ? club.name : 'Campus Society',
    venueId: eventData.venueId,
    venueName: venue ? venue.name : 'Campus Hall',
    title: eventData.title,
    description: eventData.description,
    category: eventData.category,
    eventDate: eventData.eventDate,
    startTime: eventData.startTime,
    endTime: eventData.endTime,
    capacity: Number(eventData.capacity) || 100,
    registeredCount: 0,
    isOdEligible: Boolean(eventData.isOdEligible),
    hasCertificate: Boolean(eventData.hasCertificate),
    posterUrl: eventData.posterUrl || '/assets/images/hero_campus_life_1793037312856.jpg',
    status: 'PENDING_DSA',
    createdBy: creator.id,
    createdAt: new Date().toISOString(),
    tags: eventData.tags || ['CampusEvent'],
  };

  events.unshift(newEvent);
  setStored(STORAGE_KEYS.EVENTS, events);

  // Audit log
  addAuditLog({
    actorId: creator.id,
    actorName: creator.name,
    actorRole: creator.role,
    action: 'EVENT_CREATED',
    entityType: 'EVENT',
    entityId: newEvent.id,
    details: `Created new event proposal "${newEvent.title}" pending DSA review.`,
  });

  return { success: true, event: newEvent };
}

export function updateEventStatus(eventId, newStatus, actor, reason = '') {
  const events = getAllEvents();
  const idx = events.findIndex(e => e.id === eventId);
  if (idx === -1) return { success: false, error: 'Event not found' };

  events[idx].status = newStatus;
  if (reason) {
    events[idx].rejectionReason = reason;
  }
  setStored(STORAGE_KEYS.EVENTS, events);

  // Audit
  addAuditLog({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: `EVENT_${newStatus}`,
    entityType: 'EVENT',
    entityId: eventId,
    details: `${newStatus} event "${events[idx].title}" ${reason ? `(Reason: ${reason})` : ''}`,
  });

  // Notify organizer
  addNotification({
    userId: events[idx].createdBy,
    title: `Event ${newStatus}: ${events[idx].title}`,
    message: newStatus === 'APPROVED'
      ? `Your event proposal has been officially approved by the DSA Office.`
      : `Your event proposal was rejected. Feedback: ${reason || 'Contact DSA office.'}`,
    type: newStatus === 'APPROVED' ? 'SUCCESS' : 'ALERT',
  });

  return { success: true, event: events[idx] };
}

// =================== TIMETABLE ===================
export function getStudentTimetable(userId) {
  initializeStorage();
  const slots = getStored(STORAGE_KEYS.TIMETABLE, INITIAL_TIMETABLE_SLOTS);
  return slots.filter(s => s.userId === userId);
}

// =================== REGISTRATIONS & OD ===================
export function getAllRegistrations() {
  initializeStorage();
  return getStored(STORAGE_KEYS.REGISTRATIONS, INITIAL_REGISTRATIONS);
}

export function getStudentRegistrations(userId) {
  const all = getAllRegistrations();
  return all.filter(r => r.userId === userId && r.status !== 'CANCELLED');
}

export function registerStudentForEvent(params) {
  const { eventId, user, conflictType, conflictDetails, requestOD, odReason } = params;
  const registrations = getAllRegistrations();
  const events = getAllEvents();

  const eventIndex = events.findIndex(e => e.id === eventId);
  if (eventIndex === -1) return { success: false, error: 'Event not found.' };

  const event = events[eventIndex];

  // Prevent duplicate registration
  const existing = registrations.find(r => r.eventId === eventId && r.userId === user.id && r.status === 'REGISTERED');
  if (existing) {
    return { success: false, error: 'You are already registered for this event.', registration: existing };
  }

  // Capacity check
  if (event.registeredCount >= event.capacity) {
    return { success: false, error: 'Event is fully booked. Registration closed.' };
  }

  // Ticket Code Generator
  const cleanRoll = (user.rollNumber || 'STU').replace(/[^a-zA-Z0-9]/g, '');
  const randSuffix = Math.floor(100000 + Math.random() * 900000);
  const ticketCode = `CS-${event.id.toUpperCase().slice(-4)}-${cleanRoll}-${randSuffix}`;

  const initialOdStatus = (requestOD && event.isOdEligible) ? 'PENDING' : 'NOT_REQUESTED';

  const newReg = {
    id: `reg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    eventId: event.id,
    userId: user.id,
    studentName: user.name,
    studentRoll: user.rollNumber || '21CS042',
    studentDepartment: user.department || 'Engineering',
    eventTitle: event.title,
    eventDate: event.eventDate,
    startTime: event.startTime,
    endTime: event.endTime,
    venueName: event.venueName,
    status: 'REGISTERED',
    conflictType: conflictType || 'NONE',
    conflictDetails: conflictDetails || [],
    odStatus: initialOdStatus,
    odReason: odReason || '',
    qrTicketCode: ticketCode,
    createdAt: new Date().toISOString(),
  };

  registrations.unshift(newReg);
  setStored(STORAGE_KEYS.REGISTRATIONS, registrations);

  // Increment event registeredCount
  events[eventIndex].registeredCount += 1;
  setStored(STORAGE_KEYS.EVENTS, events);

  // Audit
  addAuditLog({
    actorId: user.id,
    actorName: user.name,
    actorRole: 'STUDENT',
    action: 'STUDENT_REGISTERED',
    entityType: 'REGISTRATION',
    entityId: newReg.id,
    details: `Registered for "${event.title}" (Conflict: ${conflictType}, OD: ${initialOdStatus})`,
  });

  // Notification for student
  addNotification({
    userId: user.id,
    title: `Registered: ${event.title}`,
    message: `Your pass ${ticketCode} is ready. ${initialOdStatus === 'PENDING' ? 'OD application submitted to DSA Office.' : ''}`,
    type: 'SUCCESS',
  });

  return { success: true, registration: newReg };
}

export function cancelRegistration(registrationId, user) {
  const registrations = getAllRegistrations();
  const events = getAllEvents();

  const idx = registrations.findIndex(r => r.id === registrationId);
  if (idx === -1) return { success: false, error: 'Registration not found' };

  const reg = registrations[idx];
  reg.status = 'CANCELLED';
  setStored(STORAGE_KEYS.REGISTRATIONS, registrations);

  // Decrement registered count
  const evIdx = events.findIndex(e => e.id === reg.eventId);
  if (evIdx !== -1 && events[evIdx].registeredCount > 0) {
    events[evIdx].registeredCount -= 1;
    setStored(STORAGE_KEYS.EVENTS, events);
  }

  // Audit
  addAuditLog({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'REGISTRATION_CANCELLED',
    entityType: 'REGISTRATION',
    entityId: registrationId,
    details: `Cancelled pass for "${reg.eventTitle}"`,
  });

  return { success: true };
}

export function updateODDecision(registrationId, newStatus, decisionReason, actor) {
  const registrations = getAllRegistrations();
  const idx = registrations.findIndex(r => r.id === registrationId);
  if (idx === -1) return { success: false, error: 'Registration not found' };

  registrations[idx].odStatus = newStatus;
  registrations[idx].odDecisionReason = decisionReason || '';
  setStored(STORAGE_KEYS.REGISTRATIONS, registrations);

  // Audit
  addAuditLog({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: `OD_${newStatus}`,
    entityType: 'OD',
    entityId: registrationId,
    details: `${newStatus} OD request for student ${registrations[idx].studentName} (${registrations[idx].studentRoll}) - Event: ${registrations[idx].eventTitle}`,
  });

  // Notify student
  addNotification({
    userId: registrations[idx].userId,
    title: `On-Duty Sanction ${newStatus === 'APPROVED' ? 'Granted' : 'Declined'}`,
    message: newStatus === 'APPROVED'
      ? `Your OD request for "${registrations[idx].eventTitle}" has been APPROVED. Attendance will be credited.`
      : `Your OD request for "${registrations[idx].eventTitle}" was not approved. Remarks: ${decisionReason || 'Schedule conflict cannot be excused.'}`,
    type: newStatus === 'APPROVED' ? 'SUCCESS' : 'ALERT',
  });

  return { success: true, registration: registrations[idx] };
}

export function checkInAttendee(ticketCode, actor) {
  const registrations = getAllRegistrations();
  const cleanCode = ticketCode.trim();

  const reg = registrations.find(r => r.qrTicketCode === cleanCode && r.status === 'REGISTERED');
  if (!reg) {
    return { success: false, error: 'Invalid or expired gate pass code.' };
  }

  if (reg.checkedInAt) {
    return { 
      success: false, 
      error: `Pass already verified at gate at ${new Date(reg.checkedInAt).toLocaleTimeString()} by ${reg.checkedInBy || 'Gate Staff'}.`,
      registration: reg 
    };
  }

  reg.checkedInAt = new Date().toISOString();
  reg.checkedInBy = actor.name;
  setStored(STORAGE_KEYS.REGISTRATIONS, registrations);

  // Audit log for gate entry
  addAuditLog({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'ATTENDEE_CHECKIN',
    entityType: 'ATTENDANCE',
    entityId: reg.id,
    details: `Gate Check-in verified: ${reg.studentName} (${reg.studentRoll}) for "${reg.eventTitle}"`,
  });

  return { success: true, registration: reg };
}

// =================== AUDIT LOGS ===================
export function getAuditLogs() {
  initializeStorage();
  return getStored(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
}

export function addAuditLog(logData) {
  const logs = getAuditLogs();
  const newLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    actorId: logData.actorId,
    actorName: logData.actorName,
    actorRole: logData.actorRole,
    action: logData.action,
    entityType: logData.entityType,
    entityId: logData.entityId,
    details: logData.details,
    timestamp: new Date().toISOString(),
  };
  logs.unshift(newLog);
  setStored(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 50)); // Keep recent 50
  return newLog;
}

// =================== NOTIFICATIONS ===================
export function getNotifications(userId) {
  initializeStorage();
  const notifs = getStored(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  return notifs.filter(n => !n.userId || n.userId === userId);
}

export function markNotificationAsRead(id) {
  const notifs = getStored(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  const updated = notifs.map(n => n.id === id ? { ...n, read: true } : n);
  setStored(STORAGE_KEYS.NOTIFICATIONS, updated);
}

export function addNotification(data) {
  const notifs = getStored(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  const newNotif = {
    id: `notif-${Date.now()}`,
    userId: data.userId,
    title: data.title,
    message: data.message,
    type: data.type || 'INFO',
    read: false,
    createdAt: new Date().toISOString(),
  };
  notifs.unshift(newNotif);
  setStored(STORAGE_KEYS.NOTIFICATIONS, notifs.slice(0, 30));
  return newNotif;
}
