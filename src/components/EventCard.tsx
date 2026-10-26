import React from 'react';
import { EventItem } from '../types';
import { formatTime12h } from '../lib/conflictEngine';
import { MapPin, Users, Award, ArrowUpRight } from 'lucide-react';

interface EventCardProps {
  event: EventItem;
  onSelect: (event: EventItem) => void;
  onQuickRegister?: (event: EventItem) => void;
  isRegistered?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  onSelect, 
  onQuickRegister,
  isRegistered 
}) => {
  const isFull = event.registeredCount >= event.capacity;
  const isDraftOrPending = event.status !== 'APPROVED';

  const dateObj = new Date(event.eventDate + 'T00:00:00');
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="group relative bg-white border border-[#EAE3D9] rounded-2xl overflow-hidden hover:border-[#D96B43]/50 hover:shadow-md transition-all duration-200 flex flex-col h-full shadow-xs">
      
      {/* Poster Image Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#F3ECE7]">
        <img
          src={event.posterUrl}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />

        {/* Gradient scrim for soft contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Top Floating Status Indicators */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-xs">
          <span className="font-semibold text-xs text-[#4A2E35] tracking-wide px-2.5 py-0.5 rounded-md bg-white/95 backdrop-blur-xs shadow-xs">
            {event.category}
          </span>

          {event.isOdEligible && (
            <span className="text-[11px] font-semibold text-[#B34C28] bg-[#F7F3EC]/95 backdrop-blur-xs border border-[#EAE3D9] px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
              <Award className="w-3 h-3 text-[#D96B43]" />
              OD Eligible
            </span>
          )}
        </div>

        {/* Status indicator for non-approved states in Organizer/DSA views */}
        {isDraftOrPending && (
          <div className="absolute bottom-2 left-3 text-[11px] font-semibold text-amber-900 bg-amber-100/95 px-2 py-0.5 rounded-md shadow-xs">
            {event.status === 'PENDING_DSA' ? 'Under DSA Review' : event.status}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5 bg-white">
        
        <div>
          {/* Metadata unboxed text */}
          <div className="flex items-center gap-1.5 text-xs text-[#75565F] mb-1.5 font-medium">
            <span className="font-semibold text-[#D96B43]">{event.clubName}</span>
            <span aria-hidden="true" className="text-[#D6C7C2]">·</span>
            <span>{formattedDate}</span>
            <span aria-hidden="true" className="text-[#D6C7C2]">·</span>
            <span>{formatTime12h(event.startTime)}</span>
          </div>

          {/* Title */}
          <h3 
            onClick={() => onSelect(event)}
            className="font-bold text-base text-[#4A2E35] group-hover:text-[#D96B43] transition-colors line-clamp-2 cursor-pointer leading-snug"
          >
            {event.title}
          </h3>

          {/* Location & Capacity */}
          <div className="mt-3 flex items-center justify-between text-xs text-[#75565F]">
            <div className="flex items-center gap-1.5 truncate max-w-[70%]">
              <MapPin className="w-3.5 h-3.5 text-[#D96B43] shrink-0" />
              <span className="truncate">{event.venueName}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0 tabular-nums font-medium text-[#4A2E35]">
              <Users className="w-3.5 h-3.5 text-[#75565F]" />
              <span>{event.registeredCount}/{event.capacity}</span>
            </div>
          </div>
        </div>

        {/* Capacity Bar */}
        <div className="w-full bg-[#EADFD8] h-1.5 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${
              isFull ? 'bg-rose-500' : 'bg-[#D96B43]'
            }`}
            style={{ width: `${Math.min(100, (event.registeredCount / event.capacity) * 100)}%` }}
          />
        </div>

        {/* Action Button Row */}
        <div className="pt-1 flex items-center justify-between gap-2 border-t border-[#EAE3D9]/60">
          <button
            onClick={() => onSelect(event)}
            className="text-xs text-[#75565F] hover:text-[#4A2E35] font-semibold flex items-center gap-1 transition-colors"
          >
            <span>Event Details</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>

          {isRegistered ? (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md flex items-center gap-1">
              ✓ Registered
            </span>
          ) : isFull ? (
            <span className="text-xs font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
              Registration Full
            </span>
          ) : (
            <button
              onClick={() => onQuickRegister ? onQuickRegister(event) : onSelect(event)}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#D96B43] hover:bg-[#E27E58] active:bg-[#BF5832] text-white transition-colors shadow-xs"
            >
              Check & Register
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
