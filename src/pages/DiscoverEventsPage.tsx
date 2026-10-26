import React, { useState, useMemo } from 'react';
import { EventItem } from '../types';
import { getAllEvents, getAllClubs, getAllRegistrations } from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import { EventCard } from '../components/EventCard';
import { formatTime12h } from '../lib/conflictEngine';
import { 
  Search, Filter, Calendar, MapPin, Award, 
  CheckCircle, Clock, X, ArrowRight, ShieldCheck 
} from 'lucide-react';

interface DiscoverEventsPageProps {
  onSelectEventForConflict: (event: EventItem) => void;
  selectedEventFromOutside?: EventItem | null;
  onClearSelectedEvent?: () => void;
}

export const DiscoverEventsPage: React.FC<DiscoverEventsPageProps> = ({ 
  onSelectEventForConflict,
  selectedEventFromOutside,
  onClearSelectedEvent 
}) => {
  const { user } = useAuth();
  const allEvents = getAllEvents().filter(e => e.status === 'APPROVED');
  const clubs = getAllClubs();
  const userRegistrations = user ? getAllRegistrations().filter(r => r.userId === user.id && r.status === 'REGISTERED') : [];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedClub, setSelectedClub] = useState<string>('All');
  const [onlyOdEligible, setOnlyOdEligible] = useState<boolean>(false);
  const [onlyCertAvailable, setOnlyCertAvailable] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'date' | 'capacity'>('date');

  const [modalEvent, setModalEvent] = useState<EventItem | null>(selectedEventFromOutside || null);

  const categories: string[] = [
    'All',
    'Technology',
    'Hackathons',
    'Entrepreneurship',
    'Arts & Culture',
    'Music',
    'Research',
    'Workshops',
  ];

  const filteredEvents = useMemo(() => {
    return allEvents
      .filter((ev) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = ev.title.toLowerCase().includes(q);
          const matchesDesc = ev.description.toLowerCase().includes(q);
          const matchesClub = ev.clubName.toLowerCase().includes(q);
          const matchesVenue = ev.venueName.toLowerCase().includes(q);
          if (!matchesTitle && !matchesDesc && !matchesClub && !matchesVenue) return false;
        }

        if (selectedCategory !== 'All' && ev.category !== selectedCategory) {
          return false;
        }

        if (selectedClub !== 'All' && ev.clubId !== selectedClub) {
          return false;
        }

        if (onlyOdEligible && !ev.isOdEligible) {
          return false;
        }

        if (onlyCertAvailable && !ev.hasCertificate) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date') {
          return new Date(a.eventDate + 'T' + a.startTime).getTime() - new Date(b.eventDate + 'T' + b.startTime).getTime();
        } else {
          return (b.capacity - b.registeredCount) - (a.capacity - a.registeredCount);
        }
      });
  }, [allEvents, searchQuery, selectedCategory, selectedClub, onlyOdEligible, onlyCertAvailable, sortBy]);

  const isUserRegisteredFor = (eventId: string) => {
    return userRegistrations.some(r => r.eventId === eventId);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-[#FAF6F0]">
      
      {/* Header & Search Banner */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#4A2E35] tracking-tight">
            Discover Campus Events
          </h1>
          <p className="text-sm text-[#75565F] mt-1">
            Browse verified university sessions, workshops, and symposiums calibrated with student schedules.
          </p>
        </div>

        {/* Search & Main Filter Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-[#91717A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by event title, organizer, or keywords..."
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-[#F3ECE7] border border-[#EAE3D9] text-[#4A2E35] placeholder-[#91717A] focus:outline-none focus:border-[#D96B43] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#91717A] hover:text-[#4A2E35]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Club Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedClub}
              onChange={(e) => setSelectedClub(e.target.value)}
              className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#F3ECE7] border border-[#EAE3D9] text-[#4A2E35] focus:outline-none focus:border-[#D96B43] font-medium"
            >
              <option value="All">All Student Clubs</option>
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="md:col-span-3">
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="w-full px-3 py-2.5 text-xs rounded-xl bg-[#F3ECE7] border border-[#EAE3D9] text-[#4A2E35] focus:outline-none focus:border-[#D96B43] font-medium"
            >
              <option value="date">Sort by: Date (Earliest First)</option>
              <option value="capacity">Sort by: Seats Remaining</option>
            </select>
          </div>

        </div>

        {/* Category Buttons & Quick Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          
          {/* Segmented Category Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#D96B43] text-white shadow-xs'
                    : 'bg-white text-[#75565F] hover:bg-[#F7F3EC] hover:text-[#4A2E35] border border-[#EAE3D9]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Filter Toggles */}
          <div className="flex items-center gap-4 text-xs text-[#4A2E35] font-medium">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyOdEligible}
                onChange={(e) => setOnlyOdEligible(e.target.checked)}
                className="rounded border-[#D6C7C2] text-[#D96B43] focus:ring-[#D96B43]"
              />
              <span className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-[#D96B43]" />
                OD Eligible Only
              </span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyCertAvailable}
                onChange={(e) => setOnlyCertAvailable(e.target.checked)}
                className="rounded border-[#D6C7C2] text-[#D96B43] focus:ring-[#D96B43]"
              />
              <span>With Certificate</span>
            </label>
          </div>

        </div>

      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-[#75565F] pt-2 border-t border-[#EAE3D9]">
        <span>Showing <strong className="text-[#4A2E35]">{filteredEvents.length}</strong> verified events</span>
        {(selectedCategory !== 'All' || selectedClub !== 'All' || onlyOdEligible || searchQuery) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setSelectedClub('All');
              setOnlyOdEligible(false);
              setOnlyCertAvailable(false);
            }}
            className="text-[#D96B43] hover:underline font-semibold"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-20 rounded-3xl bg-white border border-[#EAE3D9] p-8 space-y-3 shadow-xs">
          <Filter className="w-8 h-8 text-[#91717A] mx-auto" />
          <h3 className="text-base font-bold text-[#4A2E35]">No matching events found</h3>
          <p className="text-xs text-[#75565F] max-w-sm mx-auto">
            Try adjusting your category filter, clearing your search query, or unchecking OD eligibility.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onSelect={(ev) => setModalEvent(ev)}
              onQuickRegister={(ev) => onSelectEventForConflict(ev)}
              isRegistered={isUserRegisteredFor(event.id)}
            />
          ))}
        </div>
      )}

      {/* ================= EVENT DETAILS MODAL ================= */}
      {modalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#4A2E35]/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white border border-[#EAE3D9] rounded-3xl shadow-2xl overflow-hidden text-[#4A2E35] max-h-[90vh] flex flex-col">
            
            {/* Modal Header with Poster Image */}
            <div className="relative aspect-[16/7] w-full overflow-hidden bg-[#F3ECE7]">
              <img
                src={modalEvent.posterUrl}
                alt={modalEvent.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              
              <button
                onClick={() => {
                  setModalEvent(null);
                  if (onClearSelectedEvent) onClearSelectedEvent();
                }}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/80 text-[#4A2E35] hover:bg-white transition-colors shadow-xs"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-4 left-6 right-6 text-white">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#FFD6CE]">
                  {modalEvent.category} · {modalEvent.clubName}
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight mt-1">
                  {modalEvent.title}
                </h2>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-white">
              
              {/* Timing & Venue Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#F7F3EC] border border-[#EAE3D9] text-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#D96B43] shrink-0" />
                  <div>
                    <span className="text-[#91717A] block text-[10px] uppercase font-bold">Date</span>
                    <span className="text-[#4A2E35] font-semibold">{modalEvent.eventDate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#D96B43] shrink-0" />
                  <div>
                    <span className="text-[#91717A] block text-[10px] uppercase font-bold">Time Window</span>
                    <span className="text-[#4A2E35] font-semibold">{formatTime12h(modalEvent.startTime)} – {formatTime12h(modalEvent.endTime)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#D96B43] shrink-0" />
                  <div>
                    <span className="text-[#91717A] block text-[10px] uppercase font-bold">Venue</span>
                    <span className="text-[#4A2E35] font-semibold truncate block">{modalEvent.venueName}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#75565F]">About the Event</h4>
                <p className="text-xs sm:text-sm text-[#75565F] leading-relaxed">
                  {modalEvent.description}
                </p>
              </div>

              {/* Badges & Capacity Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#F7F3EC] border border-[#EAE3D9]">
                  <span className="text-[#91717A] block text-[10px] uppercase font-bold">Capacity</span>
                  <span className="text-[#4A2E35] font-bold tabular-nums text-sm">
                    {modalEvent.registeredCount} / {modalEvent.capacity}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F7F3EC] border border-[#EAE3D9]">
                  <span className="text-[#91717A] block text-[10px] uppercase font-bold">On-Duty (OD)</span>
                  <span className={`font-bold text-xs ${modalEvent.isOdEligible ? 'text-emerald-800' : 'text-[#91717A]'}`}>
                    {modalEvent.isOdEligible ? 'Eligible' : 'Not Eligible'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F7F3EC] border border-[#EAE3D9]">
                  <span className="text-[#91717A] block text-[10px] uppercase font-bold">Certificate</span>
                  <span className="text-[#4A2E35] font-semibold text-xs">
                    {modalEvent.hasCertificate ? 'Issued' : 'None'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F7F3EC] border border-[#EAE3D9]">
                  <span className="text-[#91717A] block text-[10px] uppercase font-bold">Eligibility</span>
                  <span className="text-[#4A2E35] font-semibold text-xs">All Students</span>
                </div>
              </div>

              {/* Differentiator Notice */}
              <div className="p-4 rounded-2xl bg-[#F3ECE7] border border-[#EAE3D9] flex items-start gap-3 text-xs">
                <ShieldCheck className="w-5 h-5 text-[#D96B43] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-[#4A2E35]">Academic Schedule Compatibility Guard</p>
                  <p className="text-[#75565F] leading-relaxed">
                    Clicking "Register Now" will cross-reference this event's timing against your personal weekly timetable to flag any lecture conflicts and allow On-Duty opt-in.
                  </p>
                </div>
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 px-6 border-t border-[#EAE3D9] flex items-center justify-between gap-3 bg-[#F7F3EC]/70">
              <button
                onClick={() => {
                  setModalEvent(null);
                  if (onClearSelectedEvent) onClearSelectedEvent();
                }}
                className="px-4 py-2 text-xs font-semibold text-[#75565F] hover:text-[#4A2E35]"
              >
                Close
              </button>

              {isUserRegisteredFor(modalEvent.id) ? (
                <div className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>You Are Registered For This Event</span>
                </div>
              ) : modalEvent.registeredCount >= modalEvent.capacity ? (
                <div className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-50 text-rose-800 border border-rose-200">
                  Registration Full (Capacity Reached)
                </div>
              ) : (
                <button
                  onClick={() => {
                    const ev = modalEvent;
                    setModalEvent(null);
                    onSelectEventForConflict(ev);
                  }}
                  className="px-6 py-2.5 text-xs font-semibold rounded-xl bg-[#D96B43] hover:bg-[#E27E58] active:bg-[#BF5832] text-white transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <span>Register Now (Check Schedule)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
