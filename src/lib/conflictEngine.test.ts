import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  timeToMinutes, minutesToTime, getIntervalOverlapMinutes, 
  checkStudentScheduleConflict, checkVenueCollision 
} from './conflictEngine';
import { TimetableSlot, EventItem } from '../types';

test('time conversion utilities work correctly', () => {
  assert.equal(timeToMinutes('00:00'), 0);
  assert.equal(timeToMinutes('08:50'), 530);
  assert.equal(timeToMinutes('14:30'), 870);
  assert.equal(minutesToTime(870), '14:30');
});

test('half-open interval overlap math handles boundaries cleanly', () => {
  // Overlapping 14:00-16:00 and 15:00-17:00 => 60 mins
  assert.equal(getIntervalOverlapMinutes(840, 960, 900, 1020), 60);

  // Exact abutment (14:00-15:00 and 15:00-16:00) => 0 mins (no conflict)
  assert.equal(getIntervalOverlapMinutes(840, 900, 900, 960), 0);

  // Disjoint intervals => 0 mins
  assert.equal(getIntervalOverlapMinutes(600, 700, 800, 900), 0);

  // Enclosure => inner duration
  assert.equal(getIntervalOverlapMinutes(600, 900, 700, 800), 100);
});

test('student timetable conflict detection flags partial, full, and clear schedules', () => {
  const sampleSlots: TimetableSlot[] = [
    {
      id: 'slot-1',
      userId: 'u1',
      dayOfWeek: 3, // Wednesday
      startTime: '14:00',
      endTime: '15:00',
      subjectCode: 'CS8501',
      subjectName: 'Web Technology',
    },
    {
      id: 'slot-2',
      userId: 'u1',
      dayOfWeek: 5, // Friday
      startTime: '09:00',
      endTime: '12:00',
      subjectCode: 'CS8502',
      subjectName: 'Data Structures Lab',
    },
  ];

  // Test 1: Wednesday event 14:00-16:00 (overlaps with CS8501 14:00-15:00 for 60m out of 120m) -> PARTIAL
  const partialRes = checkStudentScheduleConflict(
    {
      eventDate: '2026-10-28', // Wednesday (day 3)
      startTime: '14:00',
      endTime: '16:00',
      isOdEligible: true,
    },
    sampleSlots
  );
  assert.equal(partialRes.conflictType, 'PARTIAL');
  assert.equal(partialRes.totalOverlapMinutes, 60);
  assert.equal(partialRes.clashingSlots.length, 1);

  // Test 2: Thursday event -> day 4 has no classes -> NONE
  const clearRes = checkStudentScheduleConflict(
    {
      eventDate: '2026-10-29', // Thursday (day 4)
      startTime: '14:00',
      endTime: '16:00',
      isOdEligible: false,
    },
    sampleSlots
  );
  assert.equal(clearRes.conflictType, 'NONE');
  assert.equal(clearRes.totalOverlapMinutes, 0);

  // Test 3: Friday event 09:30-11:30 (120 mins) during 09:00-12:00 lab -> FULL (120m overlap)
  const fullRes = checkStudentScheduleConflict(
    {
      eventDate: '2026-10-30', // Friday (day 5)
      startTime: '09:30',
      endTime: '11:30',
      isOdEligible: true,
    },
    sampleSlots
  );
  assert.equal(fullRes.conflictType, 'FULL');
  assert.equal(fullRes.totalOverlapMinutes, 120);
});

test('venue collision detector blocks same venue double bookings', () => {
  const existingEvents: EventItem[] = [
    {
      id: 'ev-1',
      clubId: 'c1',
      clubName: 'IEEE',
      venueId: 'v-audi',
      venueName: 'Auditorium',
      title: 'AI Symposium',
      description: 'Symposium',
      category: 'Technology',
      eventDate: '2026-11-05',
      startTime: '14:00',
      endTime: '17:00',
      capacity: 200,
      registeredCount: 50,
      isOdEligible: true,
      hasCertificate: true,
      posterUrl: '',
      status: 'APPROVED',
      createdBy: 'u1',
      createdAt: '',
      tags: [],
    },
  ];

  // Collision case: same venue 'v-audi', same date '2026-11-05', overlapping 15:00-18:00
  const clash = checkVenueCollision(
    {
      venueId: 'v-audi',
      eventDate: '2026-11-05',
      startTime: '15:00',
      endTime: '18:00',
    },
    existingEvents
  );
  assert.equal(clash.hasClash, true);
  assert.equal(clash.conflictingEvent?.id, 'ev-1');

  // No collision case: different venue 'v-lab', same time
  const clear = checkVenueCollision(
    {
      venueId: 'v-lab',
      eventDate: '2026-11-05',
      startTime: '15:00',
      endTime: '18:00',
    },
    existingEvents
  );
  assert.equal(clear.hasClash, false);
  assert.equal(clear.concurrentOtherVenueEvents.length, 1);
});
