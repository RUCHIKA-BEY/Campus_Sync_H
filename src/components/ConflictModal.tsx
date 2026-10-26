import React, { useState } from 'react';
import { EventItem, TimetableSlot } from '../types';
import { useAuth } from '../context/AuthContext';
import { checkStudentScheduleConflict, formatTime12h } from '../lib/conflictEngine';
import { registerStudentForEvent, getStudentTimetable } from '../lib/storage';
import { 
  X, CheckCircle2, AlertTriangle, AlertCircle, Clock, Calendar, 
  MapPin, Award, ArrowRight, Check 
} from 'lucide-react';

interface ConflictModalProps {
  event: EventItem | null;
  onClose: () => void;
  onSuccess: () => void;
  onViewTicket?: (ticketCode: string) => void;
}

export const ConflictModal: React.FC<ConflictModalProps> = ({ 
  event, 
  onClose, 
  onSuccess,
  onViewTicket 
}) => {
  const { user } = useAuth();
  const [requestOD, setRequestOD] = useState(false);
  const [odReason, setOdReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState<any | null>(null);

  if (!event || !user) return null;

  const timetable = getStudentTimetable(user.id);
  const conflictResult = checkStudentScheduleConflict(event, timetable);

  const formattedDate = new Date(event.eventDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const handleRegister = (withOD: boolean) => {
    setIsSubmitting(true);
    setErrorMsg(null);

    const clashingDetails = conflictResult.clashingSlots.map(c => c.description);

    const result = registerStudentForEvent({
      eventId: event.id,
      user,
      conflictType: conflictResult.conflictType,
      conflictDetails: clashingDetails,
      requestOD: withOD && event.isOdEligible,
      odReason: withOD ? (odReason.trim() || 'Academic on-duty request for event attendance') : undefined,
    });

    setIsSubmitting(false);

    if (result.success && result.registration) {
      setRegistrationSuccess(result.registration);
      onSuccess();
    } else {
      setErrorMsg(result.error || 'Failed to complete registration.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#4A2E35]/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white border border-[#EAE3D9] rounded-3xl shadow-2xl overflow-hidden text-[#4A2E35]">
        
        {/* Header Bar */}
        <div className="px-6 py-4.5 border-b border-[#EAE3D9] flex items-center justify-between bg-[#F7F3EC]/50">
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-[#D96B43]">
              Schedule Compatibility Engine
            </span>
            <h2 className="text-lg font-bold text-[#4A2E35]">Event Registration & Timetable Check</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#91717A] hover:text-[#4A2E35] hover:bg-[#EADFD8]/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Success View */}
          {registrationSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-xs">
                <Check className="w-8 h-8 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-[#4A2E35]">You're Registered!</h3>
                <p className="text-xs text-[#75565F]">
                  Your pass for <span className="font-semibold text-[#4A2E35]">{event.title}</span> has been confirmed.
                </p>
                {registrationSuccess.odStatus === 'PENDING' && (
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3 mt-2.5">
                    On-Duty (OD) request submitted to DSA. Status: <span className="font-bold">PENDING APPROVAL</span>.
                  </p>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-[#F7F3EC] border border-[#EAE3D9] text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#91717A]">Ticket Code:</span>
                  <span className="font-mono text-[#4A2E35] font-semibold">{registrationSuccess.qrTicketCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#91717A]">Compatibility Result:</span>
                  <span className="font-bold text-[#4A2E35]">{registrationSuccess.conflictType} CONFLICT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#91717A]">Venue:</span>
                  <span className="text-[#4A2E35] font-medium">{event.venueName}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    onClose();
                    if (onViewTicket) onViewTicket(registrationSuccess.qrTicketCode);
                  }}
                  className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-[#D96B43] hover:bg-[#E27E58] text-white flex items-center gap-1.5 shadow-xs"
                >
                  <span>View Scannable QR Pass</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-[#F3ECE7] hover:bg-[#EADFD8] text-[#4A2E35]"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Event Quick Summary */}
              <div className="p-4.5 rounded-2xl bg-[#F7F3EC] border border-[#EAE3D9] space-y-2">
                <h3 className="font-bold text-base text-[#4A2E35]">{event.title}</h3>
                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-[#75565F]">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#D96B43]" />
                    {formattedDate}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#D96B43]" />
                    {formatTime12h(event.startTime)} – {formatTime12h(event.endTime)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#D96B43]" />
                    {event.venueName}
                  </span>
                </div>
              </div>

              {/* Conflict Detection Diagnostic Result */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-[#4A2E35]">
                  <span>Timetable Diagnostic Analysis</span>
                  <span className="text-[#91717A] font-medium">{timetable.length} classes on schedule</span>
                </div>

                {conflictResult.conflictType === 'NONE' && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>No Scheduled Academic Conflict</span>
                    </div>
                    <p className="text-emerald-900/90 leading-relaxed">
                      {conflictResult.message} You have no classes scheduled during this {conflictResult.totalEventMinutes}-minute event window.
                    </p>
                  </div>
                )}

                {conflictResult.conflictType === 'PARTIAL' && (
                  <div className="p-4.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-3 text-xs">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      <span>Partial Schedule Conflict Detected</span>
                    </div>
                    <p className="text-amber-950 leading-relaxed font-medium">
                      {conflictResult.message}
                    </p>

                    <div className="space-y-1.5 pt-1">
                      <span className="font-bold text-[11px] uppercase tracking-wider text-amber-900">
                        Conflicting Lectures:
                      </span>
                      {conflictResult.clashingSlots.map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-amber-200 text-amber-950 font-mono text-[11px]">
                          <span>{c.description}</span>
                          <span className="font-sans font-bold text-amber-800">+{c.overlapMinutes}m overlap</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {conflictResult.conflictType === 'FULL' && (
                  <div className="p-4.5 rounded-2xl bg-rose-50 border border-rose-200 space-y-3 text-xs">
                    <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                      <AlertCircle className="w-5 h-5 text-rose-600" />
                      <span>Full Schedule Conflict Detected</span>
                    </div>
                    <p className="text-rose-950 leading-relaxed font-medium">
                      {conflictResult.message} Attending this event requires missing all scheduled classes in this time window.
                    </p>

                    <div className="space-y-1.5 pt-1">
                      <span className="font-bold text-[11px] uppercase tracking-wider text-rose-900">
                        Overlapping Lectures:
                      </span>
                      {conflictResult.clashingSlots.map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-rose-200 text-rose-950 font-mono text-[11px]">
                          <span>{c.description}</span>
                          <span className="font-sans font-bold text-rose-800">+{c.overlapMinutes}m</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* OD Request Section */}
              {conflictResult.conflictType !== 'NONE' && (
                <div className="p-4.5 rounded-2xl bg-[#F7F3EC] border border-[#EAE3D9] space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-[#D96B43]" />
                      <span className="font-bold text-[#4A2E35]">Institutional On-Duty (OD) Clearance</span>
                    </div>
                    {event.isOdEligible ? (
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        Available for this event
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-[#91717A] bg-[#EADFD8] px-2 py-0.5 rounded-md">
                        Not eligible for OD
                      </span>
                    )}
                  </div>

                  {event.isOdEligible ? (
                    <div className="space-y-2">
                      <label className="flex items-start gap-2.5 cursor-pointer text-[#4A2E35]">
                        <input
                          type="checkbox"
                          checked={requestOD}
                          onChange={(e) => setRequestOD(e.target.checked)}
                          className="mt-0.5 rounded border-[#D6C7C2] text-[#D96B43] focus:ring-[#D96B43]"
                        />
                        <span className="leading-snug font-medium">
                          Submit On-Duty request to DSA for the <span className="font-bold text-[#D96B43]">{conflictResult.totalOverlapMinutes} minutes</span> of lecture conflict.
                        </span>
                      </label>

                      {requestOD && (
                        <div className="pt-2 space-y-1.5 animate-in fade-in duration-150">
                          <label className="block text-[11px] font-semibold text-[#75565F]">
                            Reason / Academic justification for DSA:
                          </label>
                          <textarea
                            value={odReason}
                            onChange={(e) => setOdReason(e.target.value)}
                            placeholder="e.g. Representing department in technical competition / core workshop hands-on."
                            rows={2}
                            className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#D6C7C2] text-[#4A2E35] focus:outline-none focus:border-[#D96B43] shadow-xs"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-[#75565F] text-[11px] leading-relaxed">
                      The organizer has not designated this event as eligible for academic OD. If you choose to register, you are acknowledging that this class absence is self-managed.
                    </p>
                  )}
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-xl text-[#75565F] hover:text-[#4A2E35] hover:bg-[#F3ECE7] transition-colors"
                >
                  Cancel
                </button>

                {conflictResult.conflictType === 'NONE' ? (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleRegister(false)}
                    className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold rounded-xl bg-[#D96B43] hover:bg-[#E27E58] text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>Confirm Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : event.isOdEligible && requestOD ? (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleRegister(true)}
                    className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold rounded-xl bg-[#D96B43] hover:bg-[#E27E58] text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>Register & Submit OD Request</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleRegister(false)}
                    className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold rounded-xl bg-[#D96B43] hover:bg-[#E27E58] text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>Acknowledge Conflict & Register</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
};
