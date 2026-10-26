import React from 'react';
import { getAllClubs, getAllEvents } from '../lib/storage';
import { Club, EventItem } from '../types';
import { Users, Calendar, Award, ArrowRight, Sparkles } from 'lucide-react';

interface ClubsDirectoryPageProps {
  onSelectEvent: (event: EventItem) => void;
  onExploreEvents: () => void;
}

export const ClubsDirectoryPage: React.FC<ClubsDirectoryPageProps> = ({ 
  onSelectEvent, 
  onExploreEvents 
}) => {
  const clubs = getAllClubs();
  const events = getAllEvents().filter(e => e.status === 'APPROVED');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs text-[#D96B43] font-semibold uppercase tracking-wider mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Student Societies & Guilds</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[#4A2E35] tracking-tight">
          Campus Student Organizations
        </h1>
        <p className="text-xs sm:text-sm text-[#75565F] mt-1 max-w-2xl">
          Discover student-run technical branches, cultural guilds, and innovation incubators organizing events on campus.
        </p>
      </div>

      {/* Clubs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {clubs.map((club) => {
          const clubEvents = events.filter(e => e.clubId === club.id);

          return (
            <div
              key={club.id}
              className="p-6 rounded-2xl bg-white border border-[#EAE3D9] hover:border-[#D96B43]/50 transition-all space-y-5 flex flex-col justify-between shadow-sm hover:shadow-md"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#D96B43]">
                      {club.category}
                    </span>
                    <h2 className="text-xl font-bold text-[#4A2E35] mt-0.5">
                      {club.name}
                    </h2>
                  </div>
                  <span className="text-xs font-mono text-[#75565F] bg-[#F7F3EC] border border-[#EAE3D9] px-2.5 py-1 rounded-md">
                    Est. {club.establishedYear}
                  </span>
                </div>

                <p className="text-xs text-[#75565F] leading-relaxed">
                  {club.description}
                </p>

                <div className="pt-2 flex items-center gap-6 text-xs text-[#75565F]">
                  <span className="flex items-center gap-1.5 tabular-nums">
                    <Users className="w-3.5 h-3.5 text-[#D96B43]" />
                    {club.memberCount} active members
                  </span>
                  <span>Lead: <strong className="text-[#4A2E35]">{club.leadName}</strong></span>
                </div>
              </div>

              {/* Upcoming Club Events Mini-Roster */}
              <div className="pt-4 border-t border-[#EAE3D9] space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#91717A] block">
                  Upcoming Hosted Sessions ({clubEvents.length})
                </span>

                {clubEvents.length === 0 ? (
                  <p className="text-xs text-[#91717A] italic">No active events currently scheduled.</p>
                ) : (
                  <div className="space-y-1.5">
                    {clubEvents.map((ev) => (
                      <div
                        key={ev.id}
                        onClick={() => onSelectEvent(ev)}
                        className="p-2.5 rounded-lg bg-[#F7F3EC] hover:bg-[#FAF6F0] border border-[#EAE3D9] cursor-pointer transition-colors flex items-center justify-between text-xs group"
                      >
                        <div>
                          <span className="font-semibold text-[#4A2E35] group-hover:text-[#D96B43] transition-colors block">
                            {ev.title}
                          </span>
                          <span className="text-[11px] text-[#75565F]">{ev.eventDate} · {ev.venueName}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-[#D96B43] group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
