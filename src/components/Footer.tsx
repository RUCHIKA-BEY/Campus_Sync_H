import React from 'react';
import { Calendar, ShieldCheck, Clock, Award } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#F7F3EC] border-t border-[#EAE3D9] text-[#75565F] text-xs py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-[#EAE3D9]">
          
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#D96B43] flex items-center justify-center text-white shadow-xs">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-base text-[#4A2E35] tracking-tight">
                Campus<span className="text-[#D96B43]">Sync</span>
              </span>
            </div>
            <p className="text-xs text-[#75565F] leading-relaxed">
              Academic-context-aware university event coordination platform connecting campus life with student schedules and On-Duty records.
            </p>
          </div>

          <div>
            <h4 className="text-[#4A2E35] font-semibold text-xs tracking-wider uppercase mb-3">Core Engines</h4>
            <ul className="space-y-2 text-[#75565F]">
              <li className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-[#D96B43]" /> Interval Clash Calculator</li>
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-[#D96B43]" /> Venue Collision Guard</li>
              <li className="flex items-center gap-1.5"><Award className="w-3 h-3 text-[#D96B43]" /> On-Duty (OD) Clearance</li>
            </ul>
          </div>

          <div>
            <h4 className="text-[#4A2E35] font-semibold text-xs tracking-wider uppercase mb-3">Institutional Roles</h4>
            <ul className="space-y-1.5 text-[#75565F]">
              <li>Student Discovery & Schedule Matrix</li>
              <li>Club & Organizer Scheduling Desk</li>
              <li>Department of Student Affairs (DSA)</li>
              <li>System Audit & Institutional Registry</li>
            </ul>
          </div>

          <div>
            <h4 className="text-[#4A2E35] font-semibold text-xs tracking-wider uppercase mb-3">Academic Rigor</h4>
            <p className="text-[#75565F] leading-relaxed mb-2">
              Built as a comprehensive Web Technology full-stack project demonstrating REST principles, RBAC authorization, temporal algorithms, and cryptographic event ticketing.
            </p>
            <div className="text-[11px] text-[#D96B43] font-medium">
              No external ERP sync assumed · System of Record for Event OD
            </div>
          </div>

        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#91717A]">
          <p>© 2026 CampusSync Institutional Platform. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Half-Open Temporal Overlap Model</span>
            <span>·</span>
            <span>Server-Authoritative RBAC</span>
            <span>·</span>
            <span>Tamper-Proof Audit Logging</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
