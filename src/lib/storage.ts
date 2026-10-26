import { 
  User, Venue, Club, EventItem, TimetableSlot, Registration, AuditLog, InAppNotification, ConflictType 
} from '../types';
import { 
  INITIAL_USERS, INITIAL_VENUES, INITIAL_CLUBS, INITIAL_EVENTS, 
  INITIAL_TIMETABLE_SLOTS, INITIAL_REGISTRATIONS, INITIAL_AUDIT_LOGS, INITIAL_NOTIFICATIONS 
} from './mockData';
import { checkVenueCollision } from './conflictEngine';

const STORAGE_KEYS = {
  USERS: 'campussync_users_v1',
  CURRENT_USER: 'campussync_current_user_v1',
  VENUES: 'campussync_venues_v1',
  CLUBS: 'campussync_clubs_v1',
  EVENTS: 'campussync_events_v1',
  TIMETABLE: 'campussync_timetable_v1',
  REGISTRATIONS: 'campussync_registrations_v1',
  AUDIT_LOGS: 'campussync_audit_logs_v1',
  NOTIFICATIONS: 'campussync_notifications_v1',
};

function getStored<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to parse ${key} from storage`, e);
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to write ${key} to storage`, e);
  }
}

/** Initialize state if first time or empty */
export function initializeStorage(): void {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    setStored(STORAGE_KEYS.USERS, INITIAL_USERS);
    setStored(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]); // Default to student Priya
    setStored(STORAGE_KEYS.VENUES, INITIAL_VENUES);
    setStored(STORAGE_KEYS.CLUBS, INITIAL_CLUBS);
    setStored(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
    setStored(STORAGE_KEYS.TIMETABLE, INITIAL_TIMETABLE_SLOTS);
    setStored(STORAGE_KEYS.REGISTRATIONS, INITIAL_REGISTRATIONS);
    setStored(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    setStored(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  }
}

// =================== USERS & AUTH ===================
export function getCurrentUser(): User {
  initializeStorage();
  const user = getStored<User>(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
  return user;
}

export function setCurrentUser(user: User): void {
  setStored(STORAGE_KEYS.CURRENT_USER, user);
}

export function getAllUsers(): User[] {
  initializeStorage();
  return getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
}

export function switchRoleUser(role: User['role']): User {
  const users = getAllUsers();
  const target = users.find(u => u.role === role) || users[0];
  setCurrentUser(target);
  return target;
}

export function registerUser(newUser: Omit<User, 'id'>): User {
  const users = getAllUsers();
  const created: User = {
    ...newUser,
    id: `u-${Date.now()}`,
  };
  users.push(created);
  setStored(STORAGE_KEYS.USERS, users);
  setCurrentUser(created);
  return created;
}

// =================== VENUES ===================
export function getAllVenues(): Venue[] {
  initializeStorage();
  return getStored<Venue[]>(STORAGE_KEYS.VENUES, INITIAL_VENUES);
}

export function addVenue(venueData: Omit<Venue, 'id'>, actor: User): Venue {
  const venues = getAllVenues();
  const created: Venue = {
    ...venueData,
    id: `v-${Date.now()}`,
  };
  venues.push(created);
  setStored(STORAGE_KEYS.VENUES, venues);

  addAuditLog({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'VENUE_CREATED',
    entityType: 'VENUE',
    entityId: created.id,
    details: `Created new campus venue "${created.name}" (Capacity: ${created.capacity}).`,
  });

  return created;
}

// =================== CLUBS ===================
export function getAllClubs(): Club[] {
  initializeStorage();
  return getStored<Club[]>(STORAGE_KEYS.CLUBS, INITIAL_CLUBS);
}

export function addClub(clubData: Omit<Club, 'id'>, actor: User): Club {
  const clubs = getAllClubs();
  const created: Club = {
    ...clubData,
    id: `c-${Date.now()}`,
  };
  clubs.push(created);
  setStored(STORAGE_KEYS.CLUBS, clubs);

  addAuditLog({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'CLUB_CREATED',
    entityType: 'CLUB',
    entityId: created.id,
    details: `Registered university club "${created.name}" under lead ${created.leadName}.`,
  });

  return created;
}

// =================== EVENTS ===================
export function getAllEvents(): EventItem[] {
  initializeStorage();
  return getStored<EventItem[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
}

export function getEventById(id: string): EventItem | undefined {
  return getAllEvents().find(e => e.id === id);
}

export function createEvent(
  eventData: Omit<EventItem, 'id' | 'createdAt' | 'registeredCount'>,
  actor: User
): { success: boolean; error?: string; event?: EventItem } {
  const events = getAllEvents();

  // Enforce venue collision check!
  const clashResult = checkVenueCollision(
    {
      venueId: eventData.venueId,
      eventDate: eventData.eventDate,
      startTime: eventData.startTime,
      endTime: eventData.endTime,
    },
    events
  );

  if (clashResult.hasClash && clashResult.conflictingEvent) {
    return {
      success: false,
      error: clashResult.message || 'Venue collision detected with another scheduled event.',
    };
  }

  const newEvent: EventItem = {
    ...eventData,
    id: `ev-${Date.now()}`,
    registeredCount: 0,
    createdAt: new Date().toISOString(),
  };

  events.push(newEvent);
  setStored(STORAGE_KEYS.EVENTS, events);

  addAuditLog({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'EVENT_CREATED',
    entityType: 'EVENT',
    entityId: newEvent.id,
    details: `Drafted event "${newEvent.title}" at ${newEvent.venueName} for ${newEvent.eventDate}.`,
  });

  return { success: true, event: newEvent };
}

export function submitEventToDSA(eventId: string, actor: User): boolean {
  const events = getAllEvents();
  const index = events.findIndex(e => e.id === eventId);
  if (index === -1) return false;

  events[index].status = 'PENDING_DSA';
  setStored(STORAGE_KEYS.EVENTS, events);

  addAuditLog({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'EVENT_SUBMITTED_DSA',
    entityType: 'EVENT',
    entityId: eventId,
    details: `Submitted proposal "${events[index].title}" for DSA review and institutional clearance.`,
  });

  // Notify DSA
  sendNotification({
    userId: 'u-dsa-1',
    title: 'New Event Proposal Submitted',
    message: `"${events[index].title}" submitted by ${events[index].clubName} requires your approval.`,
    type: 'ALERT',
    linkUrl: '/dsa',
  });

  return true;
}

export function approveEventByDSA(eventId: string, actor: User): boolean {
  const events = getAllEvents();
  const index = events.findIndex(e => e.id === eventId);
  if (index === -1) return false;

  events[index].status = 'APPROVED';
  events[index].rejectionReason = undefined;
  setStored(STORAGE_KEYS.EVENTS, events);

  addAuditLog({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'EVENT_APPROVED',
    entityType: 'EVENT',
    entityId: eventId,
    details: `Approved event "${events[index].title}" for public student discovery and campus scheduling.`,
  });

  // Notify organizer
  sendNotification({
    userId: events[index].createdBy,
    title: 'Event Proposal Approved!',
    message: `Your event "${events[index].title}" was approved by ${actor.name} and is now published.`,
    type: 'SUCCESS',
    linkUrl: '/organizer',
  });

  return true;
}

export function rejectEventByDSA(eventId: string, reason: string, actor: User): boolean {
  const events = getAllEvents();
  const index = events.findIndex(e => e.id === eventId);
  if (index === -1) return false;

  events[index].status = 'REJECTED';
  events[index].rejectionReason = reason;
  setStored(STORAGE_KEYS.EVENTS, events);

  addAuditLog({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'EVENT_REJECTED',
    entityType: 'EVENT',
    entityId: eventId,
    details: `Rejected event "${events[index].title}". Reason: ${reason}`,
  });

  sendNotification({
    userId: events[index].createdBy,
    title: 'Event Proposal Rejected',
    message: `Your proposal "${events[index].title}" was rejected. Reason: ${reason}`,
    type: 'WARNING',
    linkUrl: '/organizer',
  });

  return true;
}

// =================== TIMETABLE ===================
export function getStudentTimetable(userId: string): TimetableSlot[] {
  initializeStorage();
  const allSlots = getStored<TimetableSlot[]>(STORAGE_KEYS.TIMETABLE, INITIAL_TIMETABLE_SLOTS);
  return allSlots.filter(s => s.userId === userId);
}

export function addTimetableSlot(slotData: Omit<TimetableSlot, 'id'>): TimetableSlot {
  const allSlots = getStored<TimetableSlot[]>(STORAGE_KEYS.TIMETABLE, INITIAL_TIMETABLE_SLOTS);
  const created: TimetableSlot = {
    ...slotData,
    id: `slot-${Date.now()}`,
  };
  allSlots.push(created);
  setStored(STORAGE_KEYS.TIMETABLE, allSlots);
  return created;
}

export function deleteTimetableSlot(slotId: string): boolean {
  const allSlots = getStored<TimetableSlot[]>(STORAGE_KEYS.TIMETABLE, INITIAL_TIMETABLE_SLOTS);
  const filtered = allSlots.filter(s => s.id !== slotId);
  setStored(STORAGE_KEYS.TIMETABLE, filtered);
  return true;
}

export function resetTimetableToDemo(userId: string): TimetableSlot[] {
  const allSlots = getStored<TimetableSlot[]>(STORAGE_KEYS.TIMETABLE, INITIAL_TIMETABLE_SLOTS);
  const withoutUser = allSlots.filter(s => s.userId !== userId);
  const userDefaults = INITIAL_TIMETABLE_SLOTS.map(s => ({ ...s, userId }));
  const combined = [...withoutUser, ...userDefaults];
  setStored(STORAGE_KEYS.TIMETABLE, combined);
  return userDefaults;
}

// =================== REGISTRATIONS & OD ===================
export function getAllRegistrations(): Registration[] {
  initializeStorage();
  return getStored<Registration[]>(STORAGE_KEYS.REGISTRATIONS, INITIAL_REGISTRATIONS);
}

export function getRegistrationsForStudent(userId: string): Registration[] {
  return getAllRegistrations().filter(r => r.userId === userId);
}

export function getRegistrationsForEvent(eventId: string): Registration[] {
  return getAllRegistrations().filter(r => r.eventId === eventId);
}

export function registerStudentForEvent(params: {
  eventId: string;
  user: User;
  conflictType: ConflictType;
  conflictDetails?: string[];
  requestOD: boolean;
  odReason?: string;
}): { success: boolean; error?: string; registration?: Registration } {
  const events = getAllEvents();
  const eventIndex = events.findIndex(e => e.id === params.eventId);
  if (eventIndex === -1) return { success: false, error: 'Event not found.' };

  const event = events[eventIndex];

  // Capacity check
  if (event.registeredCount >= event.capacity) {
    return { success: false, error: 'Event registration is full! Capacity limit reached.' };
  }

  const registrations = getAllRegistrations();
  // Duplicate check
  const alreadyRegistered = registrations.some(
    r => r.eventId === params.eventId && r.userId === params.user.id && r.status === 'REGISTERED'
  );
  if (alreadyRegistered) {
    return { success: false, error: 'You are already registered for this event!' };
  }

  // Generate unique verifiable ticket code
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const qrTicketCode = `CS-${event.id.toUpperCase()}-${params.user.rollNumber || params.user.id}-${randomSuffix}`;

  const registration: Registration = {
    id: `reg-${Date.now()}`,
    eventId: event.id,
    userId: params.user.id,
    studentName: params.user.name,
    studentRoll: params.user.rollNumber || 'STU-NEW',
    studentDepartment: params.user.department || 'General',
    eventTitle: event.title,
    eventDate: event.eventDate,
    startTime: event.startTime,
    endTime: event.endTime,
    venueName: event.venueName,
    status: 'REGISTERED',
    conflictType: params.conflictType,
    conflictDetails: params.conflictDetails,
    odStatus: params.requestOD ? 'PENDING' : 'NOT_REQUESTED',
    odReason: params.odReason,
    qrTicketCode,
    createdAt: new Date().toISOString(),
  };

  registrations.push(registration);
  setStored(STORAGE_KEYS.REGISTRATIONS, registrations);

  // Increment event registeredCount
  events[eventIndex].registeredCount += 1;
  setStored(STORAGE_KEYS.EVENTS, events);

  // Audit log
  addAuditLog({
    actorId: params.user.id,
    actorName: params.user.name,
    actorRole: params.user.role,
    action: params.requestOD ? 'STUDENT_REGISTER_WITH_OD' : 'STUDENT_REGISTERED',
    entityType: 'REGISTRATION',
    entityId: registration.id,
    details: `${params.user.name} registered for "${event.title}" (Conflict: ${params.conflictType}${params.requestOD ? ', OD Requested' : ''}).`,
  });

  // Notify student
  sendNotification({
    userId: params.user.id,
    title: 'Registration Confirmed!',
    message: `Your pass for "${event.title}" is ready. View your ticket in My Registrations.`,
    type: 'SUCCESS',
    linkUrl: '/registrations',
  });

  return { success: true, registration };
}

export function cancelRegistration(registrationId: string, user: User): boolean {
  const registrations = getAllRegistrations();
  const regIndex = registrations.findIndex(r => r.id === registrationId);
  if (regIndex === -1) return false;

  const reg = registrations[regIndex];
  reg.status = 'CANCELLED';
  setStored(STORAGE_KEYS.REGISTRATIONS, registrations);

  // Decrement event counter
  const events = getAllEvents();
  const eventIndex = events.findIndex(e => e.id === reg.eventId);
  if (eventIndex !== -1 && events[eventIndex].registeredCount > 0) {
    events[eventIndex].registeredCount -= 1;
    setStored(STORAGE_KEYS.EVENTS, events);
  }

  addAuditLog({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'REGISTRATION_CANCELLED',
    entityType: 'REGISTRATION',
    entityId: registrationId,
    details: `${user.name} cancelled registration for "${reg.eventTitle}".`,
  });

  return true;
}

// =================== ATTENDANCE & QR CHECK-IN ===================
export function scanAndMarkAttendance(
  ticketCode: string,
  organizer: User
): { success: boolean; error?: string; registration?: Registration } {
  const registrations = getAllRegistrations();
  const reg = registrations.find(r => r.qrTicketCode === ticketCode.trim());

  if (!reg) {
    return {
      success: false,
      error: 'Invalid QR Ticket Code. No matching registration found in database.',
    };
  }

  if (reg.status === 'CANCELLED') {
    return {
      success: false,
      error: 'Registration has been cancelled. Cannot mark attendance.',
    };
  }

  if (reg.checkedInAt) {
    return {
      success: false,
      error: `Already checked in! Marked at ${new Date(reg.checkedInAt).toLocaleTimeString()} by ${reg.checkedInBy || 'Organizer'}.`,
      registration: reg,
    };
  }

  // Mark attendance
  reg.checkedInAt = new Date().toISOString();
  reg.checkedInBy = organizer.name;
  setStored(STORAGE_KEYS.REGISTRATIONS, registrations);

  addAuditLog({
    actorId: organizer.id,
    actorName: organizer.name,
    actorRole: organizer.role,
    action: 'ATTENDANCE_CHECKED_IN',
    entityType: 'ATTENDANCE',
    entityId: reg.id,
    details: `Scanned pass for ${reg.studentName} (${reg.studentRoll}) at "${reg.eventTitle}".`,
  });

  // Notify student
  sendNotification({
    userId: reg.userId,
    title: 'Attendance Verified!',
    message: `Your attendance at "${reg.eventTitle}" was verified.`,
    type: 'SUCCESS',
  });

  return { success: true, registration: reg };
}

// =================== OD WORKFLOW ===================
export function decideODRequest(
  registrationId: string,
  status: 'APPROVED' | 'REJECTED',
  decisionReason: string,
  actor: User
): boolean {
  const registrations = getAllRegistrations();
  const index = registrations.findIndex(r => r.id === registrationId);
  if (index === -1) return false;

  const reg = registrations[index];
  reg.odStatus = status;
  reg.odDecisionReason = decisionReason;
  setStored(STORAGE_KEYS.REGISTRATIONS, registrations);

  addAuditLog({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: status === 'APPROVED' ? 'OD_APPROVED' : 'OD_REJECTED',
    entityType: 'OD',
    entityId: reg.id,
    details: `${status} On-Duty request for ${reg.studentName} (${reg.studentRoll}) for "${reg.eventTitle}". Reason: ${decisionReason}`,
  });

  sendNotification({
    userId: reg.userId,
    title: status === 'APPROVED' ? 'On-Duty Request Approved!' : 'On-Duty Request Declined',
    message: `OD for "${reg.eventTitle}" was ${status.toLowerCase()} by DSA. ${decisionReason}`,
    type: status === 'APPROVED' ? 'SUCCESS' : 'WARNING',
    linkUrl: '/registrations',
  });

  return true;
}

// =================== AUDIT LOGS ===================
export function getAuditLogs(): AuditLog[] {
  initializeStorage();
  return getStored<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS).sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function addAuditLog(logData: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
  const logs = getStored<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  const log: AuditLog = {
    ...logData,
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
  };
  logs.unshift(log);
  setStored(STORAGE_KEYS.AUDIT_LOGS, logs);
  return log;
}

// =================== NOTIFICATIONS ===================
export function getUserNotifications(userId: string): InAppNotification[] {
  initializeStorage();
  const notifs = getStored<InAppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  return notifs
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function sendNotification(notifData: Omit<InAppNotification, 'id' | 'createdAt' | 'read'>): InAppNotification {
  const notifs = getStored<InAppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  const created: InAppNotification = {
    ...notifData,
    id: `notif-${Date.now()}`,
    read: false,
    createdAt: new Date().toISOString(),
  };
  notifs.unshift(created);
  setStored(STORAGE_KEYS.NOTIFICATIONS, notifs);
  return created;
}

export function markNotificationRead(notifId: string): boolean {
  const notifs = getStored<InAppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  const target = notifs.find(n => n.id === notifId);
  if (target) {
    target.read = true;
    setStored(STORAGE_KEYS.NOTIFICATIONS, notifs);
    return true;
  }
  return false;
}

export function resetAllDataToDefault(): void {
  localStorage.clear();
  initializeStorage();
}
