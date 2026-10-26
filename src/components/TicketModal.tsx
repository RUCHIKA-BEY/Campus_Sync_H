import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Registration } from '../types';
import { formatTime12h } from '../lib/conflictEngine';
import { X, CheckCircle, Award, Copy, Check, ShieldCheck } from 'lucide-react';

interface TicketModalProps {
  registration: Registration | null;
  onClose: () => void;
}

export const TicketModal: React.FC<TicketModalProps> = ({ registration, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!registration) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(registration.qrTicketCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isCheckedIn = Boolean(registration.checkedInAt);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#4A2E35]/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white border border-[#EAE3D9] rounded-3xl shadow-2xl overflow-hidden text-[#4A2E35]">
        
        {/* Ticket Header */}
        <div className="relative bg-[#F7F3EC] p-6 pb-4 border-b border-dashed border-[#EAE3D9]">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-[#91717A] hover:text-[#4A2E35] hover:bg-[#EADFD8]/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#D96B43]" />
            <span className="text-[11px] font-bold tracking-widest uppercase text-[#D96B43]">
              CampusSync Digital Pass
            </span>
          </div>

          <h2 className="text-xl font-bold text-[#4A2E35] leading-tight">
            {registration.eventTitle}
          </h2>
          <p className="text-xs text-[#75565F] mt-1">{registration.venueName}</p>
        </div>

        {/* Ticket Body */}
        <div className="p-6 space-y-5 bg-white">
          
          {/* QR Code Presentation Box */}
          <div className="flex flex-col items-center justify-center p-5 bg-[#FAF6F0] border border-[#EAE3D9] rounded-2xl shadow-inner space-y-3">
            <div className="p-2 bg-white rounded-xl shadow-xs border border-[#EAE3D9]">
              <QRCodeSVG
                value={registration.qrTicketCode}
                size={180}
                level="H"
                fgColor="#4A2E35"
                bgColor="#ffffff"
              />
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#4A2E35] font-semibold bg-white border border-[#EAE3D9] px-3 py-1 rounded-lg">
              <span>{registration.qrTicketCode}</span>
              <button 
                onClick={handleCopyCode} 
                className="text-[#D96B43] hover:text-[#B34C28] p-0.5"
                title="Copy Ticket Token"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Attendee Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs p-3.5 rounded-2xl bg-[#F7F3EC] border border-[#EAE3D9]">
            <div>
              <span className="text-[#91717A] block text-[10px] uppercase font-bold">Attendee</span>
              <span className="text-[#4A2E35] font-semibold">{registration.studentName}</span>
            </div>
            <div>
              <span className="text-[#91717A] block text-[10px] uppercase font-bold">Roll Number</span>
              <span className="text-[#4A2E35] font-mono font-medium">{registration.studentRoll}</span>
            </div>
            <div>
              <span className="text-[#91717A] block text-[10px] uppercase font-bold">Department</span>
              <span className="text-[#4A2E35] truncate block font-medium">{registration.studentDepartment}</span>
            </div>
            <div>
              <span className="text-[#91717A] block text-[10px] uppercase font-bold">Event Time</span>
              <span className="text-[#4A2E35] font-semibold">{formatTime12h(registration.startTime)}</span>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-white border border-[#EAE3D9]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#D96B43]" />
                <span className="text-[#75565F] font-medium">Venue Check-In:</span>
              </div>
              {isCheckedIn ? (
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Checked In
                </span>
              ) : (
                <span className="text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-md text-[11px]">
                  Pending Scan at Entrance
                </span>
              )}
            </div>

            {registration.odStatus !== 'NOT_REQUESTED' && (
              <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-white border border-[#EAE3D9]">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#D96B43]" />
                  <span className="text-[#75565F] font-medium">On-Duty (OD) Clearance:</span>
                </div>
                <span className={`font-bold text-[11px] px-2.5 py-0.5 rounded-md ${
                  registration.odStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                  registration.odStatus === 'REJECTED' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                  'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  {registration.odStatus}
                </span>
              </div>
            )}
          </div>

          {/* Instructions */}
          <p className="text-center text-[11px] text-[#91717A] leading-relaxed">
            Present this QR code to the event coordinator at the venue entrance. Each pass is cryptographically tied to your student record.
          </p>

        </div>

      </div>
    </div>
  );
};
