import { TimetableSlot, EventItem, ConflictCheckResult, VenueClashResult, ConflictType } from '../types';

/**
 * Converts HH:mm (24hr) string to minutes from midnight
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Converts minutes from midnight to HH:mm string
 */
export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Formats 24-hr time to human-readable 12-hr format (e.g. "02:30 PM")
 */
export function formatTime12h(timeStr: string): string {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12; // 0 becomes 12
  return `${h}:${m} ${ampm}`;
}

/**
 * Gets day of week integer (1 = Monday, ..., 5 = Friday, 6 = Saturday, 0 = Sunday)
 */
export function getDayOfWeekFromDate(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  // Return 1 for Monday through 6 for Saturday, 0 for Sunday
  return day;
}

/**
 * Calculates half-open interval overlap [startA, endA) and [startB, endB)
 * An event ending at 14:00 does NOT conflict with a class starting at 14:00.
 */
export function getIntervalOverlapMinutes(startA: number, endA: number, startB: number, endB: number): number {
  const overlapStart = Math.max(startA, startB);
  const overlapEnd = Math.min(endA, endB);
  return overlapStart < overlapEnd ? overlapEnd - overlapStart : 0;
}

/**
 * Checks a student's timetable against an event's date and time window
 */
export function checkStudentScheduleConflict(
  event: { eventDate: string; startTime: string; endTime: string; isOdEligible: boolean },
  studentSlots: TimetableSlot[]
): ConflictCheckResult {
  const eventDay = getDayOfWeekFromDate(event.eventDate);
  const eventStart = timeToMinutes(event.startTime);
  const eventEnd = timeToMinutes(event.endTime);
  const totalEventMinutes = Math.max(0, eventEnd - eventStart);

  // If weekend or timetable empty
  if (!studentSlots || studentSlots.length === 0) {
    return {
      conflictType: 'NONE',
      clashingSlots: [],
      totalOverlapMinutes: 0,
      totalEventMinutes,
      message: 'No timetable configured for comparison. Proceeding with registration.',
      isOdEligible: event.isOdEligible,
    };
  }

  // Filter slots for the specific day of week
  const daySlots = studentSlots.filter(s => s.dayOfWeek === eventDay);

  if (daySlots.length === 0) {
    return {
      conflictType: 'NONE',
      clashingSlots: [],
      totalOverlapMinutes: 0,
      totalEventMinutes,
      message: 'Your timetable has no scheduled classes on this day.',
      isOdEligible: event.isOdEligible,
    };
  }

  const clashingSlots: ConflictCheckResult['clashingSlots'] = [];
  let totalOverlapMinutes = 0;

  for (const slot of daySlots) {
    const slotStart = timeToMinutes(slot.startTime);
    const slotEnd = timeToMinutes(slot.endTime);
    const overlap = getIntervalOverlapMinutes(eventStart, eventEnd, slotStart, slotEnd);

    if (overlap > 0) {
      totalOverlapMinutes += overlap;
      const overlapStartMins = Math.max(eventStart, slotStart);
      const overlapEndMins = Math.min(eventEnd, slotEnd);
      clashingSlots.push({
        slot,
        overlapMinutes: overlap,
        description: `${slot.subjectCode} - ${slot.subjectName} (${formatTime12h(minutesToTime(overlapStartMins))} – ${formatTime12h(minutesToTime(overlapEndMins))})`,
      });
    }
  }

  let conflictType: ConflictType = 'NONE';
  let message = 'No scheduled academic conflict. Your schedule is completely clear for this event!';

  if (clashingSlots.length > 0) {
    if (totalOverlapMinutes >= totalEventMinutes) {
      conflictType = 'FULL';
      message = `Full conflict: Your scheduled lectures completely overlap this entire event window (${totalOverlapMinutes} mins).`;
    } else {
      conflictType = 'PARTIAL';
      message = `Partial conflict: Overlaps with ${clashingSlots.length} lecture period(s) for ${totalOverlapMinutes} minutes.`;
    }
  }

  return {
    conflictType,
    clashingSlots,
    totalOverlapMinutes,
    totalEventMinutes,
    message,
    isOdEligible: event.isOdEligible,
  };
}

/**
 * Checks for venue collisions among scheduled events.
 * Distinguishes true venue clashes (hard collisions) from general campus time concurrency.
 */
export function checkVenueCollision(
  newEvent: {
    id?: string;
    venueId: string;
    eventDate: string;
    startTime: string;
    endTime: string;
  },
  existingEvents: EventItem[]
): VenueClashResult {
  const newStart = timeToMinutes(newEvent.startTime);
  const newEnd = timeToMinutes(newEvent.endTime);

  // Relevant events occurring on the same calendar date that are either approved or in review
  const activeEventsOnDate = existingEvents.filter(e => 
    e.eventDate === newEvent.eventDate &&
    e.id !== newEvent.id &&
    (e.status === 'APPROVED' || e.status === 'PENDING_DSA')
  );

  let conflictingEvent: EventItem | undefined;
  const concurrentOtherVenueEvents: EventItem[] = [];

  for (const ev of activeEventsOnDate) {
    const evStart = timeToMinutes(ev.startTime);
    const evEnd = timeToMinutes(ev.endTime);
    const overlap = getIntervalOverlapMinutes(newStart, newEnd, evStart, evEnd);

    if (overlap > 0) {
      if (ev.venueId === newEvent.venueId) {
        // True venue clash!
        conflictingEvent = ev;
      } else {
        // Happening at the same time, but in a different hall
        concurrentOtherVenueEvents.push(ev);
      }
    }
  }

  if (conflictingEvent) {
    return {
      hasClash: true,
      conflictingEvent,
      concurrentOtherVenueEvents,
      message: `Venue Collision: Selected venue is already booked by "${conflictingEvent.title}" (${conflictingEvent.clubName}) from ${formatTime12h(conflictingEvent.startTime)} to ${formatTime12h(conflictingEvent.endTime)}.`,
    };
  }

  return {
    hasClash: false,
    concurrentOtherVenueEvents,
    message: concurrentOtherVenueEvents.length > 0
      ? `Venue is available. Note: ${concurrentOtherVenueEvents.length} other event(s) are scheduled on campus during this time window.`
      : 'Venue and campus schedule are completely clear for this time slot.',
  };
}
