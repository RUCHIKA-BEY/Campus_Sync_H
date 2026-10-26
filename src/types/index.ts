export type Role = 'STUDENT' | 'ORGANIZER' | 'DSA' | 'ADMIN';

export type EventCategory = 
  | 'Technology' 
  | 'Hackathons' 
  | 'Entrepreneurship' 
  | 'Arts & Culture' 
  | 'Music' 
  | 'Sports' 
  | 'Research' 
  | 'Workshops';

export type EventStatus = 'DRAFT' | 'PENDING_DSA' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export type RegistrationStatus = 'REGISTERED' | 'CANCELLED';

export type ConflictType = 'NONE' | 'PARTIAL' | 'FULL';

export type ODStatus = 'NOT_REQUESTED' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  department: string;
  year?: number;
  rollNumber?: string;
  avatarUrl?: string;
  interests?: string[];
  clubId?: string; // If organizer belongs to a club
}

export interface Venue {
  id: string;
  name: string;
  building: string;
  capacity: number;
  facilities: string[];
  isActive: boolean;
}

export interface Club {
  id: string;
  name: string;
  category: EventCategory;
  description: string;
  leadUserId: string;
  leadName: string;
  memberCount: number;
  logoUrl?: string;
  establishedYear: number;
}

export interface EventItem {
  id: string;
  clubId: string;
  clubName: string;
  venueId: string;
  venueName: string;
  title: string;
  description: string;
  category: EventCategory;
  eventDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24hr)
  endTime: string;   // HH:mm (24hr)
  capacity: number;
  registeredCount: number;
  isOdEligible: boolean;
  hasCertificate: boolean;
  posterUrl: string;
  status: EventStatus;
  rejectionReason?: string;
  createdBy: string;
  createdAt: string;
  tags: string[];
}

export interface TimetableSlot {
  id: string;
  userId: string;
  dayOfWeek: number; // 1 = Monday, 2 = Tuesday, ..., 5 = Friday
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  subjectCode: string;
  subjectName: string;
  facultyName?: string;
  room?: string;
}

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  studentName: string;
  studentRoll: string;
  studentDepartment: string;
  eventTitle: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  venueName: string;
  status: RegistrationStatus;
  conflictType: ConflictType;
  conflictDetails?: string[];
  odStatus: ODStatus;
  odReason?: string;
  odDecisionReason?: string;
  qrTicketCode: string;
  checkedInAt?: string;
  checkedInBy?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: Role;
  action: string;
  entityType: 'EVENT' | 'REGISTRATION' | 'OD' | 'VENUE' | 'CLUB' | 'ATTENDANCE';
  entityId: string;
  details: string;
  timestamp: string;
}

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  read: boolean;
  createdAt: string;
  linkUrl?: string;
}

export interface ConflictCheckResult {
  conflictType: ConflictType;
  clashingSlots: {
    slot: TimetableSlot;
    overlapMinutes: number;
    description: string;
  }[];
  totalOverlapMinutes: number;
  totalEventMinutes: number;
  message: string;
  isOdEligible: boolean;
}

export interface VenueClashResult {
  hasClash: boolean;
  conflictingEvent?: EventItem;
  concurrentOtherVenueEvents: EventItem[];
  message?: string;
}
