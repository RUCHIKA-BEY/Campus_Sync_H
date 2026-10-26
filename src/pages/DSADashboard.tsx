import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { EventItem, Registration } from '../types';
import { 
  getAllEvents, approveEventByDSA, rejectEventByDSA, 
  getAllRegistrations, decideODRequest 
} from '../lib/storage';
import { formatTime12h } from '../lib/conflictEngine';
import { 
  ShieldCheck, Check, X, Award, AlertTriangle, 
  Calendar, MapPin, Users, FileText, CheckCircle2, ChevronDown 
} from 'lucide-react';

export const DSADashboard: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>(() => getAllEvents());
  const [registrations, setRegistrations] = useState<Registration[]>(() => getAllRegistrations());
  const [activeTab, setActiveTab] = useState<'PROPOSALS' | 'OD_CLEARANCE' | 'REGISTRY'>('PROPOSALS');

  // Rejection modal state
  const [rejectingEventId, setRejectingEventId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  const pendingProposals = events.filter(e => e.status === 'PENDING_DSA');
  const approvedEvents = events.filter(e => e.status === 'APPROVED');
  const pendingODs = registrations.filter(r => r.odStatus === 'PENDING');

  const handleApproveEvent = (eventId: string) => {
    if (!user) return;
    approveEventByDSA(eventId, user);
    setEvents(getAllEvents());
  };

  const handleRejectEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingEventId || !rejectReason.trim() || !user) return;

    rejectEventByDSA(rejectingEventId, rejectReason.trim(), user);
    setRejectingEventId(null);
    setRejectReason('');
    setEvents(getAllEvents());
  };

  const handleODDecision = (regId: string, status: 'APPROVED' | 'REJECTED') => {
    if (!user) return;
    const reason = status === 'APPROVED' 
      ? 'Verified and granted by Dean of Student Affairs' 
      : 'Insufficient institutional justification for lecture absence';
    decideODRequest(regId, status, reason, user);
    setRegistrations(getAllRegistrations());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#D96B43] font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Institutional Governance</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#4A2E35] tracking-tight">
            Department of Student Affairs (DSA)
          </h1>
          <p className="text-xs sm:text-sm text-[#75565F] mt-1">
            Official compliance desk for campus event approval, schedule clash resolution, and On-Duty clearance.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('PROPOSALS')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 ${
              activeTab === 'PROPOSALS'
                ? 'bg-[#D96B43] text-white shadow-sm'
                : 'bg-white text-[#75565F] hover:text-[#4A2E35] border border-[#EAE3D9]'
            }`}
          >
            <span>Pending Proposals</span>
            {pendingProposals.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-white/30 text-white text-[10px] flex items-center justify-center font-bold">
                {pendingProposals.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('OD_CLEARANCE')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 ${
              activeTab === 'OD_CLEARANCE'
                ? 'bg-[#D96B43] text-white shadow-sm'
                : 'bg-white text-[#75565F] hover:text-[#4A2E35] border border-[#EAE3D9]'
            }`}
          >
            <span>On-Duty Desk</span>
            {pendingODs.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                {pendingODs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('REGISTRY')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors ${
              activeTab === 'REGISTRY'
                ? 'bg-[#D96B43] text-white shadow-sm'
                : 'bg-white text-[#75565F] hover:text-[#4A2E35] border border-[#EAE3D9]'
            }`}
          >
            Approved Campus Registry
          </button>
        </div>
      </div>

      {/* ================= TAB 1: PENDING EVENT PROPOSALS ================= */}
      {activeTab === 'PROPOSALS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-[#75565F]">
            <h3 className="font-bold text-[#4A2E35] text-base">
              Proposals Awaiting Institutional Decision ({pendingProposals.length})
            </h3>
            <span>Decisions immediately sync with student discovery</span>
          </div>

          {pendingProposals.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white border border-[#EAE3D9] shadow-sm space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-[#4A2E35]">All Event Proposals Cleared!</h3>
              <p className="text-xs text-[#75565F] max-w-sm mx-auto">
                No club events are currently awaiting DSA review. When organizers submit proposals, they will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {pendingProposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="p-6 rounded-2xl bg-white border border-[#EAE3D9] space-y-4 shadow-sm text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <span className="text-[11px] font-bold uppercase text-[#D96B43] tracking-wider block">
                        {proposal.clubName} · {proposal.category}
                      </span>
                      <h3 className="text-xl font-extrabold text-[#4A2E35] mt-1">
                        {proposal.title}
                      </h3>
                      <p className="text-xs text-[#75565F] mt-2 max-w-2xl leading-relaxed">
                        {proposal.description}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F7F3EC] border border-[#EAE3D9] shrink-0 text-center sm:text-right space-y-1">
                      <span className="text-[#91717A] text-[10px] uppercase font-semibold block">Requested Limits</span>
                      <span className="text-[#4A2E35] font-bold block">{proposal.capacity} Max Attendees</span>
                      <span className={`text-[11px] font-semibold ${proposal.isOdEligible ? 'text-emerald-700' : 'text-[#91717A]'}`}>
                        {proposal.isOdEligible ? 'OD Clearance Requested' : 'No OD Requested'}
                      </span>
                    </div>
                  </div>

                  {/* Booking Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#F7F3EC] border border-[#EAE3D9]">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#D96B43]" />
                      <div>
                        <span className="text-[#91717A] text-[10px] block">Date</span>
                        <span className="text-[#4A2E35] font-medium">{proposal.eventDate}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#D96B43]" />
                      <div>
                        <span className="text-[#91717A] text-[10px] block">Venue</span>
                        <span className="text-[#4A2E35] font-medium">{proposal.venueName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#D96B43]" />
                      <div>
                        <span className="text-[#91717A] text-[10px] block">Timing</span>
                        <span className="text-[#4A2E35] font-medium">{formatTime12h(proposal.startTime)} – {formatTime12h(proposal.endTime)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Automated Venue Verification Badge */}
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 text-[11px]">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Automated Conflict Audit: <strong className="text-emerald-800">Venue Available</strong>. No collision with existing approved university fixtures.
                    </span>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#EAE3D9]">
                    <button
                      onClick={() => setRejectingEventId(proposal.id)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-300 transition-colors"
                    >
                      Reject with Reason
                    </button>
                    <button
                      onClick={() => handleApproveEvent(proposal.id)}
                      className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>Approve & Publish to Students</span>
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: ON-DUTY (OD) CLEARANCE DESK ================= */}
      {activeTab === 'OD_CLEARANCE' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-[#75565F]">
            <div>
              <h3 className="font-bold text-[#4A2E35] text-base">Student On-Duty (OD) Clearance Desk</h3>
              <p className="text-[11px] text-[#75565F]">
                Validate lecture absence exemptions. The system records whether the student physically attended the event via the QR check-in scan.
              </p>
            </div>
            <button 
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#F7F3EC] border border-[#EAE3D9] text-[#4A2E35] font-semibold flex items-center gap-1 shadow-sm transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-[#D96B43]" />
              <span>Print OD Sheet</span>
            </button>
          </div>

          {registrations.filter(r => r.odStatus !== 'NOT_REQUESTED').length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-white border border-[#EAE3D9] text-xs text-[#75565F]">
              No students have filed On-Duty requests yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#EAE3D9] bg-white shadow-sm">
              <table className="w-full text-left text-xs text-[#4A2E35]">
                <thead className="bg-[#F7F3EC] text-[#75565F] uppercase text-[10px] tracking-wider border-b border-[#EAE3D9]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Student Name & Roll</th>
                    <th className="py-3 px-4 font-semibold">Event & Venue</th>
                    <th className="py-3 px-4 font-semibold">Conflicting Lectures</th>
                    <th className="py-3 px-4 font-semibold">QR Attendance Check-In</th>
                    <th className="py-3 px-4 font-semibold">OD Decision</th>
                    <th className="py-3 px-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE3D9]">
                  {registrations.filter(r => r.odStatus !== 'NOT_REQUESTED').map((r) => (
                    <tr key={r.id} className="hover:bg-[#FAF6F0] transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-[#4A2E35] block">{r.studentName}</span>
                        <span className="text-[11px] text-[#75565F] font-mono">{r.studentRoll} · {r.studentDepartment}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-[#4A2E35] block">{r.eventTitle}</span>
                        <span className="text-[#75565F]">{r.eventDate} ({formatTime12h(r.startTime)})</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-amber-800 font-mono text-[11px] block">
                          {r.conflictDetails && r.conflictDetails.length > 0 ? r.conflictDetails.join(', ') : 'Standard Overlap'}
                        </span>
                        {r.odReason && (
                          <span className="text-[10px] text-[#75565F] italic">Reason: "{r.odReason}"</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {r.checkedInAt ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            ✓ Present at Event
                          </span>
                        ) : (
                          <span className="text-amber-800 text-[11px]">
                            Pending Entrance Scan
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          r.odStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          r.odStatus === 'REJECTED' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                          'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {r.odStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {r.odStatus === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleODDecision(r.id, 'APPROVED')}
                              className="px-2.5 py-1 text-[11px] font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                            >
                              Grant OD
                            </button>
                            <button
                              onClick={() => handleODDecision(r.id, 'REJECTED')}
                              className="px-2.5 py-1 text-[11px] font-semibold rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                            >
                              Decline
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#91717A]">Decided</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: APPROVED REGISTRY ================= */}
      {activeTab === 'REGISTRY' && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-[#4A2E35]">All Approved Campus Events</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {approvedEvents.map((ev) => (
              <div key={ev.id} className="p-4 rounded-xl bg-white border border-[#EAE3D9] space-y-2 shadow-sm">
                <span className="text-[10px] text-[#D96B43] uppercase font-bold tracking-wider">{ev.category}</span>
                <h4 className="font-bold text-[#4A2E35] text-sm">{ev.title}</h4>
                <p className="text-[#75565F]">{ev.venueName} · {ev.eventDate}</p>
                <div className="pt-2 flex justify-between items-center text-[11px] border-t border-[#EAE3D9]">
                  <span className="text-emerald-700 font-semibold">Active & Discoverable</span>
                  <span className="text-[#4A2E35] font-mono tabular-nums">{ev.registeredCount}/{ev.capacity} Seats</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= REJECT REASON MODAL ================= */}
      {rejectingEventId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#4A2E35]/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white border border-[#EAE3D9] shadow-xl rounded-2xl p-6 text-[#4A2E35] space-y-4">
            <h3 className="font-bold text-base text-[#4A2E35]">Provide Mandatory Rejection Reason</h3>
            <p className="text-xs text-[#75565F]">
              Institutional guidelines require a constructive rejection reason so the organizer can revise venue or schedule parameters.
            </p>

            <form onSubmit={handleRejectEvent} className="space-y-3">
              <textarea
                required
                rows={3}
                placeholder="e.g. Conflicts with University Convocation rehearsals in the adjacent quadrangle."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3ECE7] border border-[#EAE3D9] text-[#4A2E35] focus:outline-none focus:border-[#4A2E35]"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRejectingEventId(null);
                    setRejectReason('');
                  }}
                  className="px-4 py-2 rounded-lg text-xs text-[#75565F] hover:text-[#4A2E35]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
