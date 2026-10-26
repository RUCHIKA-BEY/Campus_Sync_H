/**
 * CampusSync - Conflict Engine
 * Computes half-open interval overlaps [startA, endA) and [startB, endB),
 * student academic timetable clashes, and organizer venue collisions.
 */

export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

export function minutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function formatTime12h(timeStr) {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${h}:${m} ${ampm}`;
}

export function getDayOfWeekFromDate(dateStr) {
  // Using T00:00:00 to prevent local timezone offsets
  const d = new Date(dateStr + 'T00:00:00');
  return d.getDay(); // 1 = Monday, ..., 5 = Friday, 6 = Saturday, 0 = Sunday
}

export function getIntervalOverlapMinutes(startA, endA, startB, endB) {
  const overlapStart = Math.max(startA, startB);
  const overlapEnd = Math.min(endA, endB);
  return overlapStart < overlapEnd ? overlapEnd - overlapStart : 0;
}

/**
 * Checks a student's timetable against an event date & time window
 */
export function checkStudentScheduleConflict(event, studentSlots) {
  const eventDay = getDayOfWeekFromDate(event.eventDate);

  // If weekend, usually no regular classes
  if (eventDay === 0 || eventDay === 6) {
    return {
      conflictType: 'NONE',
      clashingSlots: [],
      totalOverlapMinutes: 0,
      totalEventMinutes: timeToMinutes(event.endTime) - timeToMinutes(event.startTime),
      message: 'No academic schedule conflict detected (Weekend event).',
      isOdEligible: Boolean(event.isOdEligible),
    };
  }

  const eventStart = timeToMinutes(event.startTime);
  const eventEnd = timeToMinutes(event.endTime);
  const totalEventMinutes = Math.max(0, eventEnd - eventStart);

  // Find day-specific slots
  const daySlots = (studentSlots || []).filter(slot => slot.dayOfWeek === eventDay);

  const clashingSlots = [];
  let totalOverlapMinutes = 0;

  for (const slot of daySlots) {
    const slotStart = timeToMinutes(slot.startTime);
    const slotEnd = timeToMinutes(slot.endTime);

    const overlap = getIntervalOverlapMinutes(eventStart, eventEnd, slotStart, slotEnd);

    if (overlap > 0) {
      totalOverlapMinutes += overlap;
      const desc = `${slot.subjectCode} - ${slot.subjectName} (${formatTime12h(slot.startTime)} - ${formatTime12h(slot.endTime)})`;
      clashingSlots.push({
        slot,
        overlapMinutes: overlap,
        description: desc,
      });
    }
  }

  let conflictType = 'NONE';
  let message = 'Your timetable is completely free during this event!';

  if (totalOverlapMinutes > 0) {
    if (totalOverlapMinutes >= totalEventMinutes || clashingSlots.length >= 2) {
      conflictType = 'FULL';
      message = `Major academic conflict: clashes with ${clashingSlots.length} lecture/lab slots (${totalOverlapMinutes} mins overlap). Attendance sanction required!`;
    } else {
      conflictType = 'PARTIAL';
      message = `Partial academic overlap: clashes with ${clashingSlots[0].slot.subjectCode} (${totalOverlapMinutes} mins). On-Duty recommendation available.`;
    }
  }

  return {
    conflictType,
    clashingSlots,
    totalOverlapMinutes,
    totalEventMinutes,
    message,
    isOdEligible: Boolean(event.isOdEligible),
  };
}

/**
 * Validates whether a venue is available for a proposed event time
 */
export function checkVenueCollision(newEvent, existingEvents) {
  const newStart = timeToMinutes(newEvent.startTime);
  const newEnd = timeToMinutes(newEvent.endTime);

  const collisions = (existingEvents || []).filter(ev => {
    // Exclude the event itself if updating
    if (ev.id === newEvent.id) return false;
    // Exclude rejected or completed events
    if (ev.status === 'REJECTED' || ev.status === 'COMPLETED') return false;
    // Must be same date and venue
    if (ev.eventDate !== newEvent.eventDate || ev.venueId !== newEvent.venueId) return false;

    const evStart = timeToMinutes(ev.startTime);
    const evEnd = timeToMinutes(ev.endTime);

    return getIntervalOverlapMinutes(newStart, newEnd, evStart, evEnd) > 0;
  });

  return {
    hasClash: collisions.length > 0,
    clashingEvents: collisions,
    message: collisions.length > 0 
      ? `Venue is already reserved on ${newEvent.eventDate} during this time slot by "${collisions[0].title}".`
      : 'Venue is available for booking during the requested time slot.',
  };
}
