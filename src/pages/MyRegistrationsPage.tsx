import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Registration } from '../types';
import { getRegistrationsForStudent, cancelRegistration } from '../lib/storage';
import { formatTime12h } from '../lib/conflictEngine';
import { 
  Calendar, Clock, MapPin, QrCode, Award, 
  CheckCircle2, ArrowUpRight 
} from 'lucide-react';

interface MyRegistrationsPageProps {
  onOpenTicket: (registration: Registration) => void;
  onExploreEvents: () => void;
}

export const MyRegistrationsPage: React.FC<MyRegistrationsPageProps> = ({ 
  onOpenTicket, 
  onExploreEvents 
}) => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'OD' | 'ATTENDED'>('ALL');
  const [registrations, setRegistrations] = useState<Registration[]>(() =>
    user ? getRegistrationsForStudent(user.id) : []
  );

  const handleCancel = (regId: string, title: string) => {
    if (!user) return;
    if (confirm(`Cancel your registration for "${title}"? This will free your seat for other students.`)) {
      cancelRegistration(regId, user);
      setRegistrations(getRegistrationsForStudent(user.id));
    }
  };

  const filtered = registrations.filter((r) => {
    if (filter === 'ACTIVE') return r.status === 'REGISTERED';
    if (filter === 'OD') return r.odStatus !== 'NOT_REQUESTED';
    if (filter === 'ATTENDED') return Boolean(r.checkedInAt);
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-[#FAF6F0]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#D96B43] font-bold uppercase tracking-wider mb-1">
            <QrCode className="w-3.5 h-3.5" />
            <span>Digital Passes & Records</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#4A2E35] tracking-tight">
            My Event Passes & On-Duty Status
          </h1>
          <p className="text-xs sm:text-sm text-[#75565F] mt-1">
            Access your scannable QR tickets and track the status of institutional On-Duty (OD) approvals.
          </p>
        </div>

        <button
          onClick={onExploreEvents}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#D96B43] hover:bg-[#E27E58] text-white flex items-center gap-1.5 self-start sm:self-auto transition-colors shadow-xs"
        >
          <span>Find More Events</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#EAE3D9] pb-3 overflow-x-auto scrollbar-none">
        {(['ALL', 'ACTIVE', 'OD', 'ATTENDED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              filter === tab
                ? 'bg-[#D96B43] text-white shadow-xs'
                : 'bg-white text-[#75565F] hover:bg-[#F7F3EC] hover:text-[#4A2E35] border border-[#EAE3D9]'
            }`}
          >
            {tab === 'ALL' && `All Records (${registrations.length})`}
            {tab === 'ACTIVE' && `Active Passes (${registrations.filter(r => r.status === 'REGISTERED').length})`}
            {tab === 'OD' && `OD Requests (${registrations.filter(r => r.odStatus !== 'NOT_REQUESTED').length})`}
            {tab === 'ATTENDED' && `Attended (${registrations.filter(r => r.checkedInAt).length})`}
          </button>
        ))}
      </div>

      {/* Registrations List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 rounded-3xl bg-white border border-[#EAE3D9] p-8 space-y-4 shadow-xs">
          <Calendar className="w-8 h-8 text-[#91717A] mx-auto" />
          <h3 className="text-base font-bold text-[#4A2E35]">No passes found</h3>
          <p className="text-xs text-[#75565F] max-w-sm mx-auto">
            You don't have any event passes matching this filter. Explore campus events to check your timetable and register!
          </p>
          <button
            onClick={onExploreEvents}
            className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-[#D96B43] hover:bg-[#E27E58] text-white shadow-xs"
          >
            Discover Campus Events
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.map((reg) => {
            const isAttended = Boolean(reg.checkedInAt);
            const isCancelled = reg.status === 'CANCELLED';

            return (
              <div
                key={reg.id}
                className={`p-6 rounded-3xl border transition-all flex flex-col justify-between space-y-4 ${
                  isCancelled
                    ? 'bg-[#F7F3EC]/70 border-[#EAE3D9] opacity-75'
                    : 'bg-white border-[#EAE3D9] hover:border-[#D96B43]/50 shadow-xs hover:shadow-md'
                }`}
              >
                {/* Top Row: Event Title & Status */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold text-[#D96B43] uppercase tracking-wider block">
                        Ticket: {reg.qrTicketCode}
                      </span>
                      <h3 className="text-lg font-bold text-[#4A2E35] leading-tight mt-0.5">
                        {reg.eventTitle}
                      </h3>
                    </div>

                    {isCancelled ? (
                      <span className="text-xs px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200 font-semibold shrink-0">
                        Cancelled
                      </span>
                    ) : isAttended ? (
                      <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Attended
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-1 rounded-md bg-[#F7F3EC] text-[#4A2E35] font-semibold shrink-0 border border-[#EAE3D9]">
                        Confirmed Pass
                      </span>
                    )}
                  </div>

                  {/* Metadata Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-[#75565F] pt-1">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-[#D96B43]" />
                      {reg.eventDate}
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-[#D96B43]" />
                      {formatTime12h(reg.startTime)}
                    </span>
                    <span className="flex items-center gap-1.5 truncate font-medium">
                      <MapPin className="w-3.5 h-3.5 text-[#D96B43] shrink-0" />
                      <span className="truncate">{reg.venueName}</span>
                    </span>
                  </div>
                </div>

                {/* Compatibility & OD Snapshot Pill */}
                <div className="p-4 rounded-2xl bg-[#F7F3EC] border border-[#EAE3D9] text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#91717A] font-medium">Timetable Conflict:</span>
                    <span className="font-bold text-[#4A2E35]">
                      {reg.conflictType === 'NONE' ? 'None (Clear Schedule)' : `${reg.conflictType} Conflict`}
                    </span>
                  </div>

                  {reg.conflictDetails && reg.conflictDetails.length > 0 && (
                    <div className="text-[11px] text-amber-900 font-mono font-medium">
                      ↳ {reg.conflictDetails.join(', ')}
                    </div>
                  )}

                  {reg.odStatus !== 'NOT_REQUESTED' && (
                    <div className="pt-2 border-t border-[#EAE3D9] flex items-center justify-between">
                      <span className="text-[#75565F] font-medium flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-[#D96B43]" />
                        On-Duty (OD) Approval:
                      </span>
                      <span className={`font-bold text-[11px] px-2.5 py-0.5 rounded-md ${
                        reg.odStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                        reg.odStatus === 'REJECTED' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                        'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {reg.odStatus}
                      </span>
                    </div>
                  )}

                  {reg.odDecisionReason && (
                    <div className="text-[11px] text-[#75565F] italic">
                      Remarks: "{reg.odDecisionReason}"
                    </div>
                  )}

                  {isAttended && reg.checkedInAt && (
                    <div className="pt-1 text-[11px] text-emerald-800 font-bold">
                      ✓ Checked in at {new Date(reg.checkedInAt).toLocaleTimeString()} by {reg.checkedInBy || 'Coordinator'}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-2 flex items-center justify-between gap-3 border-t border-[#EAE3D9]/60">
                  {!isCancelled && !isAttended ? (
                    <button
                      onClick={() => handleCancel(reg.id, reg.eventTitle)}
                      className="text-xs text-[#91717A] hover:text-rose-700 font-medium transition-colors"
                    >
                      Cancel Registration
                    </button>
                  ) : (
                    <span className="text-xs text-[#91717A]">
                      {isCancelled ? 'Ticket Void' : 'Attendance Verified'}
                    </span>
                  )}

                  {!isCancelled && (
                    <button
                      onClick={() => onOpenTicket(reg)}
                      className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#D96B43] hover:bg-[#E27E58] text-white flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>View QR Entry Pass</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
