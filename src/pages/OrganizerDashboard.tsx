import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { EventItem, Venue, EventCategory } from '../types';
import { 
  getAllEvents, getAllVenues, createEvent, submitEventToDSA, 
  getAllRegistrations, scanAndMarkAttendance 
} from '../lib/storage';
import { checkVenueCollision, formatTime12h, timeToMinutes } from '../lib/conflictEngine';
import { 
  Calendar, Plus, Users, QrCode, ShieldAlert, CheckCircle, 
  Clock, MapPin, Award, AlertTriangle, ArrowRight, Camera, Search, RefreshCw 
} from 'lucide-react';

export const OrganizerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>(() => getAllEvents());
  const [venues, setVenues] = useState<Venue[]>(() => getAllVenues());
  const [activeTab, setActiveTab] = useState<'EVENTS' | 'CREATE' | 'ATTENDANCE'>('EVENTS');

  // Attendance scanner state
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');
  const [ticketInput, setTicketInput] = useState<string>('');
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);

  // Create Event Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>('Technology');
  const [venueId, setVenueId] = useState(venues[0]?.id || '');
  const [eventDate, setEventDate] = useState('2026-11-05');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('16:00');
  const [capacity, setCapacity] = useState(100);
  const [isOdEligible, setIsOdEligible] = useState(true);
  const [hasCertificate, setHasCertificate] = useState(true);
  const [tags, setTags] = useState('Coding, Workshop, AI');

  // Live Venue Conflict Diagnostic State
  const [venueCheckResult, setVenueCheckResult] = useState<any>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Evaluate venue clash whenever timing or venue changes
  useEffect(() => {
    if (venueId && eventDate && startTime && endTime) {
      const res = checkVenueCollision(
        {
          venueId,
          eventDate,
          startTime,
          endTime,
        },
        events
      );
      setVenueCheckResult(res);
    }
  }, [venueId, eventDate, startTime, endTime, events]);

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!user) return;

    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      setFormError('End time must be strictly after start time.');
      return;
    }

    const selectedVenue = venues.find(v => v.id === venueId);
    if (!selectedVenue) {
      setFormError('Please select a valid campus venue.');
      return;
    }

    if (capacity > selectedVenue.capacity) {
      setFormError(`Capacity exceeds physical limit of ${selectedVenue.name} (${selectedVenue.capacity} seats).`);
      return;
    }

    const result = createEvent(
      {
        clubId: user.clubId || 'c-1',
        clubName: 'IEEE Student Branch', // Organizer's club
        venueId,
        venueName: selectedVenue.name,
        title,
        description,
        category,
        eventDate,
        startTime,
        endTime,
        capacity,
        isOdEligible,
        hasCertificate,
        posterUrl: '/src/assets/images/event_hackathon_1793037313961.jpg',
        status: 'DRAFT',
        createdBy: user.id,
        tags: tags.split(',').map(t => t.trim()),
      },
      user
    );

    if (result.success && result.event) {
      setEvents(getAllEvents());
      setFormSuccess(`Event "${result.event.title}" drafted successfully. You can now submit it for DSA review.`);
      // Reset form
      setTitle('');
      setDescription('');
    } else {
      setFormError(result.error || 'Failed to create event.');
    }
  };

  const handleSubmitToDSA = (eventId: string) => {
    if (!user) return;
    submitEventToDSA(eventId, user);
    setEvents(getAllEvents());
  };

  const handleScanTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketInput.trim() || !user) return;

    const res = scanAndMarkAttendance(ticketInput.trim(), user);
    if (res.success && res.registration) {
      setScanResult({
        success: true,
        message: `Verified: ${res.registration.studentName} (${res.registration.studentRoll}) checked in for "${res.registration.eventTitle}".`,
      });
      setTicketInput('');
    } else {
      setScanResult({
        success: false,
        message: res.error || 'Scan validation failed.',
      });
    }
  };

  // Quick simulate scan for testing
  const handleQuickScan = (code: string) => {
    if (!user) return;
    const res = scanAndMarkAttendance(code, user);
    if (res.success && res.registration) {
      setScanResult({
        success: true,
        message: `Verified: ${res.registration.studentName} (${res.registration.studentRoll}) checked in successfully.`,
      });
    } else {
      setScanResult({
        success: false,
        message: res.error || 'Scan validation failed.',
      });
    }
  };

  const selectedEvent = events.find(e => e.id === selectedEventId) || events[0];
  const eventRegistrations = getAllRegistrations().filter(r => r.eventId === selectedEvent?.id);
  const checkedInCount = eventRegistrations.filter(r => r.checkedInAt).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#D96B43] font-semibold uppercase tracking-wider mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Organizer Console</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#4A2E35] tracking-tight">
            Club & Event Coordination Desk
          </h1>
          <p className="text-xs sm:text-sm text-[#75565F] mt-1">
            Manage proposals, resolve campus venue bookings, and operate the live QR attendance desk.
          </p>
        </div>

        {/* Action Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('EVENTS')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors ${
              activeTab === 'EVENTS'
                ? 'bg-[#D96B43] text-white shadow-sm'
                : 'bg-white text-[#75565F] hover:text-[#4A2E35] border border-[#EAE3D9]'
            }`}
          >
            My Club Events
          </button>
          <button
            onClick={() => setActiveTab('CREATE')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 ${
              activeTab === 'CREATE'
                ? 'bg-[#D96B43] text-white shadow-sm'
                : 'bg-white text-[#75565F] hover:text-[#4A2E35] border border-[#EAE3D9]'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Propose Event</span>
          </button>
          <button
            onClick={() => setActiveTab('ATTENDANCE')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 ${
              activeTab === 'ATTENDANCE'
                ? 'bg-[#D96B43] text-white shadow-sm'
                : 'bg-white text-[#75565F] hover:text-[#4A2E35] border border-[#EAE3D9]'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>QR Attendance Desk</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: MY EVENTS LIST ================= */}
      {activeTab === 'EVENTS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-white border border-[#EAE3D9] shadow-sm">
              <span className="text-[#91717A] uppercase font-semibold text-[10px]">Total Events</span>
              <span className="text-xl font-bold text-[#4A2E35] block mt-1">{events.length}</span>
            </div>
            <div className="p-4 rounded-xl bg-white border border-[#EAE3D9] shadow-sm">
              <span className="text-[#91717A] uppercase font-semibold text-[10px]">Approved & Published</span>
              <span className="text-xl font-bold text-emerald-700 block mt-1">
                {events.filter(e => e.status === 'APPROVED').length}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-white border border-[#EAE3D9] shadow-sm">
              <span className="text-[#91717A] uppercase font-semibold text-[10px]">Under DSA Review</span>
              <span className="text-xl font-bold text-amber-700 block mt-1">
                {events.filter(e => e.status === 'PENDING_DSA').length}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-white border border-[#EAE3D9] shadow-sm">
              <span className="text-[#91717A] uppercase font-semibold text-[10px]">Draft Proposals</span>
              <span className="text-xl font-bold text-[#4A2E35] block mt-1">
                {events.filter(e => e.status === 'DRAFT').length}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-bold text-[#4A2E35]">All Event Proposals & Active Sessions</h3>
            
            <div className="overflow-x-auto rounded-xl border border-[#EAE3D9] bg-white shadow-sm">
              <table className="w-full text-left text-xs text-[#4A2E35]">
                <thead className="bg-[#F7F3EC] text-[#75565F] uppercase text-[10px] tracking-wider border-b border-[#EAE3D9]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Event & Category</th>
                    <th className="py-3 px-4 font-semibold">Date & Time</th>
                    <th className="py-3 px-4 font-semibold">Venue & Capacity</th>
                    <th className="py-3 px-4 font-semibold">OD Eligible</th>
                    <th className="py-3 px-4 font-semibold">Lifecycle Status</th>
                    <th className="py-3 px-4 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE3D9] font-normal">
                  {events.map((ev) => (
                    <tr key={ev.id} className="hover:bg-[#FAF6F0] transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-[#4A2E35] block text-sm">{ev.title}</span>
                        <span className="text-[11px] text-[#D96B43]">{ev.category} · {ev.clubName}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[#4A2E35] font-medium block">{ev.eventDate}</span>
                        <span className="text-[#75565F]">{formatTime12h(ev.startTime)} – {formatTime12h(ev.endTime)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[#4A2E35] font-medium block">{ev.venueName}</span>
                        <span className="text-[#75565F] tabular-nums">{ev.registeredCount} / {ev.capacity} registered</span>
                      </td>
                      <td className="py-3 px-4">
                        {ev.isOdEligible ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Yes
                          </span>
                        ) : (
                          <span className="text-[#91717A]">No</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                          ev.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          ev.status === 'PENDING_DSA' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          ev.status === 'REJECTED' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                          'bg-[#F3ECE7] text-[#4A2E35] border-[#EAE3D9]'
                        }`}>
                          {ev.status === 'PENDING_DSA' ? 'PENDING DSA' : ev.status}
                        </span>
                        {ev.rejectionReason && (
                          <span className="block text-[10px] text-rose-700 italic mt-0.5">
                            Rejection: {ev.rejectionReason}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {ev.status === 'DRAFT' && (
                          <button
                            onClick={() => handleSubmitToDSA(ev.id)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#D96B43] hover:bg-[#E27E58] text-white transition-colors"
                          >
                            Submit to DSA
                          </button>
                        )}
                        {ev.status === 'APPROVED' && (
                          <button
                            onClick={() => {
                              setSelectedEventId(ev.id);
                              setActiveTab('ATTENDANCE');
                            }}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#F7F3EC] hover:bg-[#EAE3D9] text-[#D96B43] border border-[#EAE3D9] transition-colors"
                          >
                            Open Scanner Desk →
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: CREATE EVENT WITH VENUE CLASH ENGINE ================= */}
      {activeTab === 'CREATE' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-[#EAE3D9] shadow-sm space-y-5">
            <div>
              <h2 className="text-xl font-bold text-[#4A2E35]">Propose New Campus Event</h2>
              <p className="text-xs text-[#75565F] mt-1">
                Enter event details. The system runs an automated temporal collision check on the selected venue before allowing submission.
              </p>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              
              <div>
                <label className="block text-[11px] text-[#75565F] uppercase font-semibold mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Cloud Systems Symposium"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F3ECE7] border border-[#EAE3D9] text-[#4A2E35] focus:outline-none focus:border-[#4A2E35]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-[#75565F] uppercase font-semibold mb-1">
                    Event Category
                  </label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F3ECE7] border border-[#EAE3D9] text-[#4A2E35] focus:outline-none focus:border-[#4A2E35]"
                  >
                    <option value="Technology">Technology</option>
                    <option value="Hackathons">Hackathons</option>
                    <option value="Entrepreneurship">Entrepreneurship</option>
                    <option value="Arts & Culture">Arts & Culture</option>
                    <option value="Music">Music</option>
                    <option value="Research">Research</option>
                    <option value="Workshops">Workshops</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-[#75565F] uppercase font-semibold mb-1">
                    Campus Venue
                  </label>
                  <select
                    value={venueId}
                    onChange={(e) => setVenueId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F3ECE7] border border-[#EAE3D9] text-[#4A2E35] focus:outline-none focus:border-[#4A2E35]"
                  >
                    {venues.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} (Max Capacity: {v.capacity})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Timing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] text-[#75565F] uppercase font-semibold mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F3ECE7] border border-[#EAE3D9] text-[#4A2E35] focus:outline-none focus:border-[#4A2E35]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#75565F] uppercase font-semibold mb-1">
                    Start Time (24h)
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F3ECE7] border border-[#EAE3D9] text-[#4A2E35] focus:outline-none focus:border-[#4A2E35]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#75565F] uppercase font-semibold mb-1">
                    End Time (24h)
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F3ECE7] border border-[#EAE3D9] text-[#4A2E35] focus:outline-none focus:border-[#4A2E35]"
                  />
                </div>
              </div>

              {/* LIVE VENUE COLLISION DETECTOR CALLOUT (Signature Feature) */}
              {venueCheckResult && (
                <div className="pt-2">
                  {venueCheckResult.hasClash ? (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 space-y-2 text-rose-900">
                      <div className="flex items-center gap-2 font-bold text-rose-700 text-xs">
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>HARD COLLISION: Selected Venue is Double-Booked</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-rose-800">
                        {venueCheckResult.message}
                      </p>
                      <div className="text-[10px] text-rose-700 font-mono">
                        Clashing Event: "{venueCheckResult.conflictingEvent?.title}" ({venueCheckResult.conflictingEvent?.clubName})
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 space-y-1">
                      <div className="flex items-center gap-2 font-semibold text-emerald-800 text-xs">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>Venue is Available for this Date and Time Slot</span>
                      </div>
                      {venueCheckResult.concurrentOtherVenueEvents.length > 0 && (
                        <p className="text-[11px] text-emerald-700">
                          {venueCheckResult.concurrentOtherVenueEvents.length} other campus event(s) happening concurrently in different halls.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-[11px] text-[#75565F] uppercase font-semibold mb-1">
                    Student Capacity Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F3ECE7] border border-[#EAE3D9] text-[#4A2E35] focus:outline-none focus:border-[#4A2E35]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#75565F] uppercase font-semibold mb-1">
                    Tags (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Coding, Hardware, Keynote"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F3ECE7] border border-[#EAE3D9] text-[#4A2E35] focus:outline-none focus:border-[#4A2E35]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#75565F] uppercase font-semibold mb-1">
                  Event Description & Agenda
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Outline topics covered, keynotes, prerequisites, and learning outcomes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F3ECE7] border border-[#EAE3D9] text-[#4A2E35] focus:outline-none focus:border-[#4A2E35]"
                />
              </div>

              {/* Toggles */}
              <div className="p-3.5 rounded-xl bg-[#F7F3EC] border border-[#EAE3D9] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-[#4A2E35]">
                  <input
                    type="checkbox"
                    checked={isOdEligible}
                    onChange={(e) => setIsOdEligible(e.target.checked)}
                    className="rounded border-[#EAE3D9] text-[#D96B43] focus:ring-[#D96B43]"
                  />
                  <span className="font-medium">Request On-Duty (OD) Academic Clearance from DSA</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[#4A2E35]">
                  <input
                    type="checkbox"
                    checked={hasCertificate}
                    onChange={(e) => setHasCertificate(e.target.checked)}
                    className="rounded border-[#EAE3D9] text-[#D96B43] focus:ring-[#D96B43]"
                  />
                  <span className="font-medium">Provide Digital Participation Certificate</span>
                </label>
              </div>

              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-300 text-rose-800">
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800">
                  {formSuccess}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('EVENTS')}
                  className="px-4 py-2.5 rounded-xl text-[#75565F] hover:text-[#4A2E35]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={venueCheckResult?.hasClash}
                  className={`px-6 py-2.5 rounded-xl font-semibold text-white transition-colors ${
                    venueCheckResult?.hasClash
                      ? 'bg-neutral-300 cursor-not-allowed opacity-60 text-neutral-600'
                      : 'bg-[#D96B43] hover:bg-[#E27E58]'
                  }`}
                >
                  Draft Event Proposal
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ================= TAB 3: QR ATTENDANCE DESK ================= */}
      {activeTab === 'ATTENDANCE' && (
        <div className="space-y-6">
          
          {/* Active Event Selector */}
          <div className="p-5 rounded-2xl bg-white border border-[#EAE3D9] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold uppercase text-[#D96B43] tracking-wider">
                Live Check-In Desk
              </span>
              <h2 className="text-xl font-bold text-[#4A2E35] mt-0.5">
                {selectedEvent?.title}
              </h2>
              <p className="text-xs text-[#75565F]">
                {selectedEvent?.venueName} · {selectedEvent?.eventDate}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedEventId}
                onChange={(e) => {
                  setSelectedEventId(e.target.value);
                  setScanResult(null);
                }}
                className="px-3 py-2 text-xs rounded-xl bg-[#F3ECE7] border border-[#EAE3D9] text-[#4A2E35] focus:outline-none"
              >
                {events.filter(e => e.status === 'APPROVED').map(e => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>

              <div className="px-3.5 py-1.5 rounded-lg bg-[#F7F3EC] border border-[#EAE3D9] text-center font-mono text-xs">
                <span className="text-[#91717A] block text-[10px] uppercase">Attendance</span>
                <span className="text-[#4A2E35] font-bold">{checkedInCount} / {eventRegistrations.length}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: QR Scanner / Code Entry Terminal */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-white border border-[#EAE3D9] shadow-sm space-y-5 text-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[#4A2E35] text-sm flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#D96B43]" />
                  Ticket Code Verification Terminal
                </h3>
              </div>

              <p className="text-[#75565F] leading-relaxed">
                Enter or scan the student's digital pass code (e.g. from their mobile screen). Duplicates and invalid passes will be rejected.
              </p>

              <form onSubmit={handleScanTicket} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="e.g. CS-EV5-21CS042-882194"
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F3ECE7] border border-[#EAE3D9] text-[#4A2E35] font-mono text-xs focus:outline-none focus:border-[#4A2E35]"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#D96B43] hover:bg-[#E27E58] text-white font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Verify Ticket & Check In</span>
                </button>
              </form>

              {/* Scan Feedback */}
              {scanResult && (
                <div className={`p-4 rounded-xl border text-xs leading-relaxed animate-in fade-in ${
                  scanResult.success 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}>
                  <div className="font-bold mb-0.5">
                    {scanResult.success ? '✓ Verified Pass' : '⚠ Scan Rejected'}
                  </div>
                  <div>{scanResult.message}</div>
                </div>
              )}

              {/* Quick simulation pill */}
              <div className="p-3.5 rounded-xl bg-[#F7F3EC] border border-[#EAE3D9] space-y-2 text-[#75565F] text-[11px]">
                <span className="font-semibold text-[#4A2E35] block">Coordinator Testing Tip:</span>
                <p>Click "Quick Scan" next to any registered student in the roster table to simulate an instant QR scan at the door.</p>
              </div>

            </div>

            {/* Right Column: Registered Participants Roster */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between text-xs text-[#75565F]">
                <h3 className="font-bold text-[#4A2E35] text-sm">
                  Registered Participants Roster ({eventRegistrations.length})
                </h3>
                <span>Sorted by registration time</span>
              </div>

              {eventRegistrations.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-white border border-[#EAE3D9] text-xs text-[#75565F]">
                  No students have registered for this event yet.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[#EAE3D9] bg-white shadow-sm">
                  <table className="w-full text-left text-xs text-[#4A2E35]">
                    <thead className="bg-[#F7F3EC] text-[#75565F] uppercase text-[10px] tracking-wider border-b border-[#EAE3D9]">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Student Name</th>
                        <th className="py-2.5 px-3 font-semibold">Roll & Dept</th>
                        <th className="py-2.5 px-3 font-semibold">OD Status</th>
                        <th className="py-2.5 px-3 font-semibold">Attendance</th>
                        <th className="py-2.5 px-3 text-right font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE3D9]">
                      {eventRegistrations.map((r) => (
                        <tr key={r.id} className="hover:bg-[#FAF6F0] transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-[#4A2E35]">
                            {r.studentName}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-[#75565F]">
                            {r.studentRoll} · {r.studentDepartment}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              r.odStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                              r.odStatus === 'PENDING' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                              'text-[#91717A] border-transparent'
                            }`}>
                              {r.odStatus}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            {r.checkedInAt ? (
                              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                ✓ Present
                              </span>
                            ) : (
                              <span className="text-[#91717A]">Pending</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {!r.checkedInAt ? (
                              <button
                                onClick={() => handleQuickScan(r.qrTicketCode)}
                                className="px-2.5 py-1 text-[11px] font-semibold rounded bg-[#D96B43] hover:bg-[#E27E58] text-white transition-colors"
                              >
                                Quick Scan
                              </button>
                            ) : (
                              <span className="text-[10px] text-[#91717A]">Checked In</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
