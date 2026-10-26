import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TimetableSlot } from '../types';
import { 
  getStudentTimetable, addTimetableSlot, deleteTimetableSlot, resetTimetableToDemo 
} from '../lib/storage';
import { formatTime12h, timeToMinutes } from '../lib/conflictEngine';
import { 
  Plus, Trash2, Calendar, Clock, User, 
  MapPin, RefreshCw, CheckCircle2 
} from 'lucide-react';

export const TimetablePage: React.FC = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<TimetableSlot[]>(() => 
    user ? getStudentTimetable(user.id) : []
  );

  const [activeDay, setActiveDay] = useState<number>(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [facultyName, setFacultyName] = useState('');
  const [room, setRoom] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  const days = [
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
  ];

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!user) return;
    if (!subjectCode || !subjectName) {
      setErrorMsg('Subject code and name are required.');
      return;
    }

    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);

    if (endMins <= startMins) {
      setErrorMsg('End time must be strictly after start time.');
      return;
    }

    const daySlots = slots.filter(s => s.dayOfWeek === dayOfWeek);
    for (const existing of daySlots) {
      const eStart = timeToMinutes(existing.startTime);
      const eEnd = timeToMinutes(existing.endTime);
      if (Math.max(startMins, eStart) < Math.min(endMins, eEnd)) {
        setErrorMsg(`Time clash: Overlaps with existing class ${existing.subjectCode} (${existing.startTime} - ${existing.endTime}).`);
        return;
      }
    }

    addTimetableSlot({
      userId: user.id,
      dayOfWeek,
      startTime,
      endTime,
      subjectCode: subjectCode.toUpperCase(),
      subjectName,
      facultyName: facultyName || undefined,
      room: room || undefined,
    });

    setSlots(getStudentTimetable(user.id));
    setShowAddModal(false);
    setSubjectCode('');
    setSubjectName('');
    setFacultyName('');
    setRoom('');
  };

  const handleDeleteSlot = (id: string) => {
    deleteTimetableSlot(id);
    if (user) {
      setSlots(getStudentTimetable(user.id));
    }
  };

  const handleReset = () => {
    if (!user) return;
    if (confirm('Reset your timetable to the verified demonstration schedule?')) {
      const defaults = resetTimetableToDemo(user.id);
      setSlots(defaults);
    }
  };

  const activeDaySlots = slots
    .filter(s => s.dayOfWeek === activeDay)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-[#FAF6F0]">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#D96B43] font-bold uppercase tracking-wider mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Academic Schedule System</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#4A2E35] tracking-tight">
            Weekly Timetable Matrix
          </h1>
          <p className="text-xs sm:text-sm text-[#75565F] mt-1 max-w-2xl leading-relaxed">
            Maintain your official class lectures. CampusSync checks this schedule against university events to detect conflicts and authorize On-Duty (OD) clearance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-[#EAE3D9] text-[#4A2E35] hover:bg-[#F7F3EC] hover:border-[#D96B43]/50 flex items-center gap-1.5 transition-colors shadow-xs"
            title="Reset to default calibrated schedule"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#D96B43]" />
            <span>Reset Demo Timetable</span>
          </button>

          <button
            onClick={() => {
              setDayOfWeek(activeDay);
              setShowAddModal(true);
            }}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#D96B43] hover:bg-[#E27E58] text-white flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Class Slot</span>
          </button>
        </div>
      </div>

      {/* Day Selector Segmented Tabs */}
      <div className="flex items-center gap-2 border-b border-[#EAE3D9] pb-3 overflow-x-auto scrollbar-none">
        {days.map((d) => {
          const count = slots.filter(s => s.dayOfWeek === d.id).length;
          return (
            <button
              key={d.id}
              onClick={() => setActiveDay(d.id)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeDay === d.id
                  ? 'bg-[#D96B43] text-white shadow-xs'
                  : 'bg-white text-[#75565F] hover:bg-[#F7F3EC] hover:text-[#4A2E35] border border-[#EAE3D9]'
              }`}
            >
              <span>{d.name}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                activeDay === d.id ? 'bg-white/25 text-white' : 'bg-[#EADFD8] text-[#75565F]'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main View: Day Schedule Timeline & Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Chronological Lecture Cards */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between text-xs text-[#75565F]">
            <span className="font-bold text-[#4A2E35] uppercase tracking-wider text-[11px]">
              {days.find(d => d.id === activeDay)?.name} Schedule ({activeDaySlots.length} Lectures)
            </span>
            <span className="font-medium">All times 24-hr format (Standard Campus Slot)</span>
          </div>

          {activeDaySlots.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-[#EAE3D9] space-y-3 shadow-xs">
              <Calendar className="w-8 h-8 text-[#91717A] mx-auto" />
              <h3 className="text-sm font-bold text-[#4A2E35]">No classes scheduled for this day</h3>
              <p className="text-xs text-[#75565F] max-w-sm mx-auto">
                You have completely free academic time on this day. Any event scheduled today will trigger a "No Conflict (100% Free)" check!
              </p>
              <button
                onClick={() => {
                  setDayOfWeek(activeDay);
                  setShowAddModal(true);
                }}
                className="mt-2 px-4 py-2 text-xs font-bold rounded-xl bg-[#F7F3EC] hover:bg-[#EADFD8] text-[#D96B43]"
              >
                + Add A Lecture Slot
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeDaySlots.map((slot) => (
                <div
                  key={slot.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EAE3D9] hover:border-[#D96B43]/50 transition-all flex items-center justify-between gap-4 text-xs shadow-xs"
                >
                  <div className="flex items-start gap-4">
                    {/* Time Pillar */}
                    <div className="p-3 rounded-xl bg-[#F7F3EC] border border-[#EAE3D9] text-center min-w-[100px] shrink-0 font-mono">
                      <span className="text-[#4A2E35] font-bold block">{formatTime12h(slot.startTime)}</span>
                      <span className="text-[#91717A] text-[10px] block font-medium">to {formatTime12h(slot.endTime)}</span>
                    </div>

                    {/* Subject Details */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#D96B43]">{slot.subjectCode}</span>
                        <span className="text-[#4A2E35] font-bold text-sm">{slot.subjectName}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#75565F] text-[11px] font-medium">
                        {slot.facultyName && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-[#D96B43]" />
                            {slot.facultyName}
                          </span>
                        )}
                        {slot.room && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#D96B43]" />
                            {slot.room}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => handleDeleteSlot(slot.id)}
                    className="p-2 rounded-xl text-[#91717A] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Remove Lecture Slot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Weekly Snapshot & Calibration Guide */}
        <div className="lg:col-span-4 space-y-5">
          
          <div className="p-6 rounded-3xl bg-white border border-[#EAE3D9] space-y-3.5 text-xs shadow-xs">
            <h3 className="font-bold text-[#4A2E35] text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#D96B43]" />
              How the Conflict Engine Works
            </h3>
            <p className="text-[#75565F] leading-relaxed">
              When you click "Register" on any event, CampusSync compares the event's date and time window with this timetable using a <strong>half-open interval formula</strong>:
            </p>
            <div className="p-3 rounded-xl bg-[#F7F3EC] border border-[#EAE3D9] font-mono text-[11px] text-[#D96B43] font-semibold">
              max(Event_Start, Class_Start) &lt; min(Event_End, Class_End)
            </div>
            <ul className="space-y-1.5 text-[#75565F] text-[11px]">
              <li>• An event ending at 2:00 PM does <em>not</em> clash with a 2:00 PM class.</li>
              <li>• If there is a clash, you can request DSA On-Duty (OD) exemption.</li>
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-[#F7F3EC] border border-[#EAE3D9] text-xs space-y-2 text-[#75565F]">
            <span className="font-bold text-[#4A2E35] block">Pre-calibrated test scenarios:</span>
            <div className="space-y-1 text-[11px]">
              <p>• <strong>Wednesday 14:00</strong>: Web Technology clashes with HackGrid → <em>Partial Conflict</em>.</p>
              <p>• <strong>Thursday 17:30</strong>: Evening is free → <em>No Conflict</em> for Acoustic Sunset.</p>
              <p>• <strong>Friday 09:30–12:30</strong>: Back-to-back lectures block Robotics Bootcamp → <em>Full Conflict</em>.</p>
            </div>
          </div>

        </div>

      </div>

      {/* ================= ADD CLASS MODAL ================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#4A2E35]/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white border border-[#EAE3D9] rounded-3xl shadow-2xl p-6 text-[#4A2E35] space-y-4">
            
            <div className="flex items-center justify-between border-b border-[#EAE3D9] pb-3">
              <h3 className="font-bold text-base text-[#4A2E35]">Add Academic Class Slot</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-[#91717A] hover:text-[#4A2E35]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSlot} className="space-y-3.5 text-xs">
              
              <div>
                <label className="block text-[11px] text-[#75565F] mb-1 font-bold uppercase">Day of the Week</label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F3ECE7] border border-[#EAE3D9] text-[#4A2E35] focus:outline-none focus:border-[#D96B43] font-medium"
                >
                  {days.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#75565F] mb-1 font-bold uppercase">Course Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS8501"
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F3ECE7] border border-[#EAE3D9] text-[#4A2E35] font-mono uppercase focus:outline-none focus:border-[#D96B43]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#75565F] mb-1 font-bold uppercase">Room / Lab</label>
                  <input
                    type="text"
                    placeholder="e.g. Lab 2 / Room 304"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F3ECE7] border border-[#EAE3D9] text-[#4A2E35] focus:outline-none focus:border-[#D96B43]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#75565F] mb-1 font-bold uppercase">Course Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Web Technology"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F3ECE7] border border-[#EAE3D9] text-[#4A2E35] focus:outline-none focus:border-[#D96B43]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#75565F] mb-1 font-bold uppercase">Faculty In-Charge (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. S. K. Nair"
                  value={facultyName}
                  onChange={(e) => setFacultyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F3ECE7] border border-[#EAE3D9] text-[#4A2E35] focus:outline-none focus:border-[#D96B43]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#75565F] mb-1 font-bold uppercase">Start Time (24h)</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F3ECE7] border border-[#EAE3D9] text-[#4A2E35] focus:outline-none focus:border-[#D96B43]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#75565F] mb-1 font-bold uppercase">End Time (24h)</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F3ECE7] border border-[#EAE3D9] text-[#4A2E35] focus:outline-none focus:border-[#D96B43]"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#75565F] hover:text-[#4A2E35]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#D96B43] hover:bg-[#E27E58] text-white transition-colors shadow-xs"
                >
                  Save Class Slot
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
