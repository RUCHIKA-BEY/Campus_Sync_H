import React, { useState } from 'react';
import { EventItem } from '../types';
import { getAllEvents, getAllClubs } from '../lib/storage';
import { EventCard } from '../components/EventCard';
import { 
  ArrowRight, Sparkles, Users, CheckCircle2, ChevronRight 
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (tab: string) => void;
  onSelectEvent: (event: EventItem) => void;
  onQuickRegister: (event: EventItem) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onNavigate, 
  onSelectEvent, 
  onQuickRegister 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const allEvents = getAllEvents().filter(e => e.status === 'APPROVED');
  const clubs = getAllClubs();

  const categories: { label: string; value: string }[] = [
    { label: 'All Events', value: 'All' },
    { label: 'Technology', value: 'Technology' },
    { label: 'Hackathons', value: 'Hackathons' },
    { label: 'Entrepreneurship', value: 'Entrepreneurship' },
    { label: 'Arts & Culture', value: 'Arts & Culture' },
    { label: 'Music', value: 'Music' },
    { label: 'Research', value: 'Research' },
  ];

  const filteredEvents = selectedCategory === 'All' 
    ? allEvents 
    : allEvents.filter(e => e.category === selectedCategory);

  const featuredEvent = allEvents[0];

  return (
    <div className="space-y-20 pb-20 bg-[#FAF6F0]">
      
      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-8 pb-16 lg:pt-14 lg:pb-20 overflow-hidden">
        {/* Subtle warm ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#D96B43]/8 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[300px] bg-[#EADFD8]/40 blur-[140px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Headline Column */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#EAE3D9] text-xs text-[#D96B43] font-semibold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#D96B43]" />
                <span>Academic Timetable & Event Coordination</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#4A2E35] tracking-tight leading-[1.1] text-balance">
                Your campus is full of <span className="text-[#D96B43]">possibilities.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#75565F] max-w-2xl leading-relaxed">
                Find events worth showing up for, discover communities that match your interests, and make the most of your university life—without risking attendance shortage.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => onNavigate('discover')}
                  className="px-6 py-3.5 rounded-xl bg-[#D96B43] hover:bg-[#E27E58] active:bg-[#BF5832] text-white font-semibold text-sm shadow-md shadow-[#D96B43]/20 transition-all flex items-center gap-2"
                >
                  <span>Explore Events</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onNavigate('clubs')}
                  className="px-6 py-3.5 rounded-xl bg-white hover:bg-[#F7F3EC] border border-[#EAE3D9] text-[#4A2E35] font-semibold text-sm shadow-xs transition-all"
                >
                  Discover Clubs
                </button>
              </div>

              {/* Differentiator Strip */}
              <div className="pt-6 border-t border-[#EAE3D9] grid grid-cols-3 gap-4 text-xs text-[#75565F]">
                <div>
                  <div className="text-[#4A2E35] font-bold text-sm tabular-nums">100% Conflict Free</div>
                  <span className="text-[#91717A]">Instant timetable checking</span>
                </div>
                <div>
                  <div className="text-[#4A2E35] font-bold text-sm tabular-nums">Verified OD</div>
                  <span className="text-[#91717A]">Direct DSA clearance slips</span>
                </div>
                <div>
                  <div className="text-[#4A2E35] font-bold text-sm tabular-nums">One-Scan Check-in</div>
                  <span className="text-[#91717A]">QR ticketing pass</span>
                </div>
              </div>

            </div>

            {/* Right Asymmetrical Editorial Composition */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                
                {/* Main Hero Card */}
                <div className="relative rounded-3xl overflow-hidden border border-[#EAE3D9] bg-white shadow-xl group">
                  <div className="aspect-[16/10] overflow-hidden bg-[#F3ECE7]">
                    <img
                      src="/src/assets/images/hero_campus_life_1793037312856.jpg"
                      alt="University campus pavilion at twilight"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-5 sm:p-6 space-y-2 bg-white">
                    <div className="flex items-center justify-between text-xs text-[#75565F]">
                      <span className="font-semibold text-[#D96B43]">{featuredEvent?.clubName || 'IEEE Student Branch'}</span>
                      <span className="font-medium text-[#91717A]">Next Upcoming Session</span>
                    </div>
                    <h3 className="text-lg font-bold text-[#4A2E35] group-hover:text-[#D96B43] transition-colors leading-snug">
                      {featuredEvent?.title || 'HackGrid 2026: 24h Campus Hackathon'}
                    </h3>
                    <p className="text-xs text-[#75565F] line-clamp-2 leading-relaxed">
                      {featuredEvent?.description}
                    </p>
                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-xs text-[#91717A] font-medium">{featuredEvent?.venueName}</span>
                      <button
                        onClick={() => onSelectEvent(featuredEvent)}
                        className="text-xs font-semibold text-[#D96B43] hover:underline flex items-center gap-1"
                      >
                        Inspect Timetable Fit →
                      </button>
                    </div>
                  </div>
                </div>

                {/* Overlapping Floating Compatibility Preview Callout */}
                <div className="hidden sm:block absolute -bottom-6 -left-6 bg-white/95 backdrop-blur-md border border-[#EAE3D9] p-4 rounded-2xl shadow-xl max-w-[270px] text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-[#4A2E35]">Live Timetable Guard</span>
                  </div>
                  <p className="text-[11px] text-[#75565F] leading-relaxed">
                    Evaluates lecture hours before you register. Supports DSA On-Duty clearance.
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= DISCOVER BY INTEREST ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#4A2E35] tracking-tight">
              Discover by interest
            </h2>
            <p className="text-sm text-[#75565F] mt-1">
              Select a category to filter live campus events.
            </p>
          </div>

          <button
            onClick={() => onNavigate('discover')}
            className="text-xs font-semibold text-[#D96B43] hover:text-[#B34C28] flex items-center gap-1 shrink-0"
          >
            <span>View Complete Directory</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Interactive Segmented Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all duration-150 ${
                selectedCategory === cat.value
                  ? 'bg-[#D96B43] text-white shadow-xs'
                  : 'bg-white text-[#75565F] hover:bg-[#F7F3EC] hover:text-[#4A2E35] border border-[#EAE3D9]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Featured Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onSelect={onSelectEvent}
              onQuickRegister={onQuickRegister}
            />
          ))}
        </div>
      </section>

      {/* ================= HOW CAMPUSSYNC WORKS ================= */}
      <section className="bg-[#F7F3EC] py-16 border-y border-[#EAE3D9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D96B43]">
              The CampusSync Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#4A2E35] tracking-tight">
              Academic-Context-Aware Event Coordination
            </h2>
            <p className="text-sm text-[#75565F] leading-relaxed">
              We eliminated the guesswork of skipping lectures or arguing with faculty over event attendance.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="p-6 rounded-2xl bg-white border border-[#EAE3D9] space-y-3 text-left shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#F3ECE7] text-[#D96B43] flex items-center justify-center font-bold text-sm">
                01
              </div>
              <h3 className="font-bold text-base text-[#4A2E35]">Discover & Filter</h3>
              <p className="text-xs text-[#75565F] leading-relaxed">
                Browse student-organized technical hackathons, cultural festivals, and entrepreneurship pitch sessions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#EAE3D9] space-y-3 text-left shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#F3ECE7] text-[#D96B43] flex items-center justify-center font-bold text-sm">
                02
              </div>
              <h3 className="font-bold text-base text-[#4A2E35]">Check Your Schedule</h3>
              <p className="text-xs text-[#75565F] leading-relaxed">
                Click register and our algorithm instantly evaluates your personal Monday–Friday timetable for collisions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#EAE3D9] space-y-3 text-left shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#F3ECE7] text-[#D96B43] flex items-center justify-center font-bold text-sm">
                03
              </div>
              <h3 className="font-bold text-base text-[#4A2E35]">One-Click OD</h3>
              <p className="text-xs text-[#75565F] leading-relaxed">
                If an approved event overlaps with your lectures, request institutional On-Duty (OD) directly during signup.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#EAE3D9] space-y-3 text-left shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#F3ECE7] text-[#D96B43] flex items-center justify-center font-bold text-sm">
                04
              </div>
              <h3 className="font-bold text-base text-[#4A2E35]">QR Entry Pass</h3>
              <p className="text-xs text-[#75565F] leading-relaxed">
                Receive your digital event ticket with embedded QR code. Organizers scan at the venue for instant check-in.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ================= CAMPUS CLUBS SECTION ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#4A2E35] tracking-tight">
              Active campus student bodies
            </h2>
            <p className="text-sm text-[#75565F] mt-1">
              Connect with university societies driving campus innovation and culture.
            </p>
          </div>

          <button
            onClick={() => onNavigate('clubs')}
            className="text-xs font-semibold text-[#D96B43] hover:text-[#B34C28] flex items-center gap-1"
          >
            <span>Explore All Clubs</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {clubs.map((club) => (
            <div 
              key={club.id}
              className="p-5 sm:p-6 rounded-2xl bg-white border border-[#EAE3D9] hover:border-[#D96B43]/50 hover:shadow-md transition-all flex flex-col justify-between space-y-4 text-left shadow-xs"
            >
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-[#D96B43] uppercase tracking-wider">
                  {club.category}
                </div>
                <h3 className="font-bold text-base text-[#4A2E35]">{club.name}</h3>
                <p className="text-xs text-[#75565F] line-clamp-3 leading-relaxed">
                  {club.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#EAE3D9] flex items-center justify-between text-xs text-[#75565F]">
                <span className="flex items-center gap-1 tabular-nums font-medium">
                  <Users className="w-3.5 h-3.5 text-[#D96B43]" />
                  {club.memberCount} members
                </span>
                <button
                  onClick={() => onNavigate('discover')}
                  className="font-semibold text-[#D96B43] hover:underline"
                >
                  View Events →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-r from-[#F7F3EC] via-white to-[#F7F3EC] border border-[#EAE3D9] p-8 sm:p-12 text-center overflow-hidden shadow-md">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#D96B43]/8 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="max-w-2xl mx-auto space-y-6 relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#4A2E35] tracking-tight">
              Your next campus memory starts here.
            </h2>
            <p className="text-sm sm:text-base text-[#75565F] leading-relaxed">
              Don't let rigid timetable schedules hold you back from participating in flagship workshops, competitions, and music sessions.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('discover')}
                className="px-8 py-3.5 rounded-xl bg-[#D96B43] hover:bg-[#E27E58] text-white font-semibold text-sm shadow-md shadow-[#D96B43]/20 transition-all inline-flex items-center gap-2"
              >
                <span>Explore Upcoming Events</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
