import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Venue, Club, User, AuditLog } from '../types';
import { 
  getAllVenues, addVenue, getAllClubs, addClub, 
  getAllUsers, getAuditLogs, getAllEvents, getAllRegistrations 
} from '../lib/storage';
import { 
  Shield, Building2, Users, FileText, BarChart3, 
  Plus, Search, CheckCircle, Clock, MapPin, Calendar 
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'VENUES' | 'CLUBS' | 'USERS' | 'AUDIT'>('ANALYTICS');

  const venues = getAllVenues();
  const clubs = getAllClubs();
  const users = getAllUsers();
  const events = getAllEvents();
  const registrations = getAllRegistrations();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => getAuditLogs());

  // Search in audit logs
  const [auditSearch, setAuditSearch] = useState('');

  // Add Venue Form Modal
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [vName, setVName] = useState('');
  const [vBuilding, setVBuilding] = useState('');
  const [vCapacity, setVCapacity] = useState(150);

  // Add Club Form Modal
  const [showClubModal, setShowClubModal] = useState(false);
  const [cName, setCName] = useState('');
  const [cCategory, setCCategory] = useState<any>('Technology');
  const [cDesc, setCDesc] = useState('');
  const [cLead, setCLead] = useState('');

  const handleCreateVenue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !vName.trim()) return;

    addVenue(
      {
        name: vName.trim(),
        building: vBuilding.trim() || 'Academic Complex',
        capacity: Number(vCapacity),
        facilities: ['Projector', 'Audio', 'AC'],
        isActive: true,
      },
      user
    );

    setShowVenueModal(false);
    setVName('');
    setVBuilding('');
    setAuditLogs(getAuditLogs());
  };

  const handleCreateClub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !cName.trim()) return;

    addClub(
      {
        name: cName.trim(),
        category: cCategory,
        description: cDesc.trim() || 'University student organization.',
        leadUserId: user.id,
        leadName: cLead.trim() || user.name,
        memberCount: 25,
        establishedYear: 2026,
      },
      user
    );

    setShowClubModal(false);
    setCName('');
    setCDesc('');
    setCLead('');
    setAuditLogs(getAuditLogs());
  };

  const filteredLogs = auditLogs.filter(log => {
    if (!auditSearch.trim()) return true;
    const q = auditSearch.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.actorName.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.entityType.toLowerCase().includes(q)
    );
  });

  const totalCapacity = events.reduce((acc, ev) => acc + ev.capacity, 0);
  const totalRegistrations = registrations.filter(r => r.status === 'REGISTERED').length;
  const totalAttended = registrations.filter(r => r.checkedInAt).length;
  const overallAttendanceRate = totalRegistrations > 0 ? Math.round((totalAttended / totalRegistrations) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#D96B43] font-semibold uppercase tracking-wider mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>Campus Administrator</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#4A2E35] tracking-tight">
            Institutional Master Console
          </h1>
          <p className="text-xs sm:text-sm text-[#75565F] mt-1">
            Campus-wide registry management, physical venue capacity boundaries, and immutable audit logs.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {(['ANALYTICS', 'VENUES', 'CLUBS', 'USERS', 'AUDIT'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
                activeTab === tab
                  ? 'bg-[#D96B43] text-white shadow-sm'
                  : 'bg-white text-[#75565F] hover:text-[#4A2E35] border border-[#EAE3D9]'
              }`}
            >
              {tab === 'ANALYTICS' && 'System Analytics'}
              {tab === 'VENUES' && `Venues (${venues.length})`}
              {tab === 'CLUBS' && `Clubs (${clubs.length})`}
              {tab === 'USERS' && `Users (${users.length})`}
              {tab === 'AUDIT' && `Audit Log (${auditLogs.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* ================= TAB 1: SYSTEM ANALYTICS ================= */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-5 rounded-2xl bg-white border border-[#EAE3D9] shadow-sm space-y-1">
              <span className="text-[#91717A] uppercase text-[10px] font-semibold">Active Student Users</span>
              <span className="text-2xl font-bold text-[#4A2E35] block tabular-nums">{users.filter(u => u.role === 'STUDENT').length} Students</span>
              <p className="text-[11px] text-[#75565F]">With active academic timetables</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#EAE3D9] shadow-sm space-y-1">
              <span className="text-[#91717A] uppercase text-[10px] font-semibold">Total Event Registrations</span>
              <span className="text-2xl font-bold text-[#D96B43] block tabular-nums">{totalRegistrations} Passes</span>
              <p className="text-[11px] text-[#75565F]">Cross-checked with lecture hours</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#EAE3D9] shadow-sm space-y-1">
              <span className="text-[#91717A] uppercase text-[10px] font-semibold">Verified Check-In Rate</span>
              <span className="text-2xl font-bold text-emerald-700 block tabular-nums">{overallAttendanceRate}%</span>
              <p className="text-[11px] text-[#75565F]">{totalAttended} physical QR scans marked</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#EAE3D9] shadow-sm space-y-1">
              <span className="text-[#91717A] uppercase text-[10px] font-semibold">On-Duty (OD) Exemptions</span>
              <span className="text-2xl font-bold text-amber-700 block tabular-nums">
                {registrations.filter(r => r.odStatus === 'APPROVED').length} Approved
              </span>
              <p className="text-[11px] text-[#75565F]">Granted by DSA Office</p>
            </div>
          </div>

          {/* Institutional Participation Distribution */}
          <div className="p-6 rounded-2xl bg-white border border-[#EAE3D9] shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-[#4A2E35] text-base">Campus Participation by Event Category</h3>
            <div className="space-y-3 pt-2">
              {[
                { name: 'Technology & Hackathons', count: 80, pct: 65, color: 'bg-[#D96B43]' },
                { name: 'Arts & Cultural Showcases', count: 118, pct: 85, color: 'bg-purple-600' },
                { name: 'Robotics & Research Labs', count: 38, pct: 40, color: 'bg-amber-600' },
                { name: 'Entrepreneurship & Pitch Clinics', count: 24, pct: 30, color: 'bg-emerald-600' },
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-[#4A2E35]">{item.name}</span>
                    <span className="text-[#75565F] tabular-nums">{item.count} attendees ({item.pct}%)</span>
                  </div>
                  <div className="w-full bg-[#F3ECE7] h-2 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: CAMPUS VENUES ================= */}
      {activeTab === 'VENUES' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[#4A2E35] text-base">Campus Physical Venues</h3>
              <p className="text-xs text-[#75565F]">
                Venues checked by the Organizer Collision Engine during event scheduling.
              </p>
            </div>
            <button
              onClick={() => setShowVenueModal(true)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#D96B43] hover:bg-[#E27E58] text-white flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Venue</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((v) => (
              <div key={v.id} className="p-5 rounded-2xl bg-white border border-[#EAE3D9] shadow-sm space-y-3 text-xs">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-[#D96B43] uppercase">{v.id}</span>
                    <h4 className="font-bold text-[#4A2E35] text-base leading-tight">{v.name}</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Active
                  </span>
                </div>

                <div className="space-y-1 text-[#75565F]">
                  <p className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#D96B43]" />
                    {v.building}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#D96B43]" />
                    Max Seating Limit: <strong className="text-[#4A2E35]">{v.capacity}</strong>
                  </p>
                </div>

                <div className="pt-2 border-t border-[#EAE3D9] flex flex-wrap gap-1 text-[10px] text-[#75565F]">
                  {v.facilities.map((f, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-[#F7F3EC] border border-[#EAE3D9] text-[#75565F]">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 3: CLUBS ================= */}
      {activeTab === 'CLUBS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[#4A2E35] text-base">Registered Student Clubs & Societies</h3>
              <p className="text-xs text-[#75565F]">Authorized to propose university events and scan tickets.</p>
            </div>
            <button
              onClick={() => setShowClubModal(true)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#D96B43] hover:bg-[#E27E58] text-white flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Club</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {clubs.map((c) => (
              <div key={c.id} className="p-5 rounded-2xl bg-white border border-[#EAE3D9] shadow-sm space-y-3 text-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#D96B43]">{c.category}</span>
                    <h4 className="font-bold text-[#4A2E35] text-base mt-0.5">{c.name}</h4>
                  </div>
                  <span className="text-xs font-bold text-[#75565F] tabular-nums">
                    Est. {c.establishedYear}
                  </span>
                </div>
                <p className="text-[#75565F] leading-relaxed">{c.description}</p>
                <div className="pt-2 border-t border-[#EAE3D9] flex items-center justify-between text-[#75565F] text-[11px]">
                  <span>Lead Coordinator: <strong className="text-[#4A2E35]">{c.leadName}</strong></span>
                  <span className="tabular-nums font-medium">{c.memberCount} active members</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 4: USERS & RBAC GOVERNANCE ================= */}
      {activeTab === 'USERS' && (
        <div className="space-y-4">
          <h3 className="font-bold text-[#4A2E35] text-base">User Directory & Role Access Level</h3>
          <div className="overflow-x-auto rounded-xl border border-[#EAE3D9] bg-white shadow-sm">
            <table className="w-full text-left text-xs text-[#4A2E35]">
              <thead className="bg-[#F7F3EC] text-[#75565F] uppercase text-[10px] tracking-wider border-b border-[#EAE3D9]">
                <tr>
                  <th className="py-3 px-4 font-semibold">User</th>
                  <th className="py-3 px-4 font-semibold">Email</th>
                  <th className="py-3 px-4 font-semibold">Department</th>
                  <th className="py-3 px-4 font-semibold">Roll / ID</th>
                  <th className="py-3 px-4 font-semibold">Access Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3D9]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#FAF6F0] transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#4A2E35]">
                      {u.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#75565F]">
                      {u.email}
                    </td>
                    <td className="py-3 px-4 text-[#75565F]">{u.department}</td>
                    <td className="py-3 px-4 font-mono text-[#75565F]">{u.rollNumber || 'STAFF'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        u.role === 'ADMIN' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                        u.role === 'DSA' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                        u.role === 'ORGANIZER' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                        'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 5: INSTITUTIONAL AUDIT LOG ================= */}
      {activeTab === 'AUDIT' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-[#4A2E35] text-base">Institutional Activity & Audit Ledger</h3>
              <p className="text-xs text-[#75565F]">
                Tamper-evident record of approvals, rejections, OD grants, and QR entrance scans.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-[#91717A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search audit trail..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-[#F3ECE7] border border-[#EAE3D9] text-[#4A2E35] focus:outline-none focus:border-[#4A2E35]"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#EAE3D9] bg-white shadow-sm">
            <table className="w-full text-left text-xs text-[#4A2E35]">
              <thead className="bg-[#F7F3EC] text-[#75565F] uppercase text-[10px] tracking-wider border-b border-[#EAE3D9]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Actor & Role</th>
                  <th className="py-3 px-4 font-semibold">Action</th>
                  <th className="py-3 px-4 font-semibold">Entity</th>
                  <th className="py-3 px-4 font-semibold">Operational Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3D9] font-mono text-[11px]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FAF6F0] transition-colors">
                    <td className="py-2.5 px-4 text-[#75565F] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-2.5 px-4 text-[#4A2E35] font-sans font-medium whitespace-nowrap">
                      {log.actorName} <span className="text-[#D96B43] text-[10px]">({log.actorRole})</span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-bold text-[#D96B43]">{log.action}</span>
                    </td>
                    <td className="py-2.5 px-4 text-[#75565F]">
                      {log.entityType}
                    </td>
                    <td className="py-2.5 px-4 font-sans text-xs text-[#75565F]">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= ADD VENUE MODAL ================= */}
      {showVenueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#4A2E35]/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white border border-[#EAE3D9] shadow-xl rounded-2xl p-6 text-[#4A2E35] space-y-4">
            <h3 className="font-bold text-base text-[#4A2E35]">Add Campus Venue</h3>
            <form onSubmit={handleCreateVenue} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] text-[#75565F] uppercase font-semibold mb-1">Venue Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramanujan Smart Auditorium"
                  value={vName}
                  onChange={(e) => setVName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#F3ECE7] border border-[#EAE3D9] text-[#4A2E35] focus:outline-none focus:border-[#4A2E35]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#75565F] uppercase font-semibold mb-1">Building / Complex</label>
                <input
                  type="text"
                  placeholder="e.g. Science Block 1st Floor"
                  value={vBuilding}
                  onChange={(e) => setVBuilding(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#F3ECE7] border border-[#EAE3D9] text-[#4A2E35] focus:outline-none focus:border-[#4A2E35]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#75565F] uppercase font-semibold mb-1">Physical Capacity Limit</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={vCapacity}
                  onChange={(e) => setVCapacity(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-[#F3ECE7] border border-[#EAE3D9] text-[#4A2E35] focus:outline-none focus:border-[#4A2E35]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowVenueModal(false)}
                  className="px-4 py-2 text-[#75565F] hover:text-[#4A2E35]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg font-semibold bg-[#D96B43] hover:bg-[#E27E58] text-white transition-colors"
                >
                  Save Venue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ADD CLUB MODAL ================= */}
      {showClubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#4A2E35]/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white border border-[#EAE3D9] shadow-xl rounded-2xl p-6 text-[#4A2E35] space-y-4">
            <h3 className="font-bold text-base text-[#4A2E35]">Register Student Club</h3>
            <form onSubmit={handleCreateClub} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] text-[#75565F] uppercase font-semibold mb-1">Club Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Quantum Computing Guild"
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#F3ECE7] border border-[#EAE3D9] text-[#4A2E35] focus:outline-none focus:border-[#4A2E35]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#75565F] uppercase font-semibold mb-1">Category</label>
                <select
                  value={cCategory}
                  onChange={(e) => setCCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#F3ECE7] border border-[#EAE3D9] text-[#4A2E35] focus:outline-none focus:border-[#4A2E35]"
                >
                  <option value="Technology">Technology</option>
                  <option value="Arts & Culture">Arts & Culture</option>
                  <option value="Research">Research</option>
                  <option value="Entrepreneurship">Entrepreneurship</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#75565F] uppercase font-semibold mb-1">Student Lead Name</label>
                <input
                  type="text"
                  placeholder="e.g. Vikramaditya Sen"
                  value={cLead}
                  onChange={(e) => setCLead(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#F3ECE7] border border-[#EAE3D9] text-[#4A2E35] focus:outline-none focus:border-[#4A2E35]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#75565F] uppercase font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Club charter and mission..."
                  value={cDesc}
                  onChange={(e) => setCDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#F3ECE7] border border-[#EAE3D9] text-[#4A2E35] focus:outline-none focus:border-[#4A2E35]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowClubModal(false)}
                  className="px-4 py-2 text-[#75565F] hover:text-[#4A2E35]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg font-semibold bg-[#D96B43] hover:bg-[#E27E58] text-white transition-colors"
                >
                  Register Club
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
