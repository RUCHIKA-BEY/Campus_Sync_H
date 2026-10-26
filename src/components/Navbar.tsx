import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { Bell, Calendar, CheckCircle, RefreshCw } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, openNotifications }) => {
  const { user, role, switchRole, unreadCount, resetAllDemoData } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const roles: { id: Role; label: string; desc: string }[] = [
    { id: 'STUDENT', label: 'Student', desc: 'Priya Sharma (CSE)' },
    { id: 'ORGANIZER', label: 'Event Organizer', desc: 'Arjun Patel (IEEE Branch)' },
    { id: 'DSA', label: 'DSA Office', desc: 'Dr. V. Ramanathan (Dean)' },
    { id: 'ADMIN', label: 'Administrator', desc: 'Campus IT Systems' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FAF6F0]/95 backdrop-blur-md border-b border-[#EAE3D9] text-[#4A2E35]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => setCurrentTab('landing')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D96B43] to-[#B34C28] flex items-center justify-center shadow-xs">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-[#4A2E35] group-hover:text-[#D96B43] transition-colors">
                Campus<span className="text-[#D96B43]">Sync</span>
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#75565F]">
          <button
            onClick={() => setCurrentTab('discover')}
            className={`transition-colors whitespace-nowrap hover:text-[#4A2E35] ${
              currentTab === 'discover' ? 'text-[#D96B43] font-semibold' : ''
            }`}
          >
            Discover Events
          </button>

          {role === 'STUDENT' && (
            <>
              <button
                onClick={() => setCurrentTab('timetable')}
                className={`transition-colors whitespace-nowrap hover:text-[#4A2E35] ${
                  currentTab === 'timetable' ? 'text-[#D96B43] font-semibold' : ''
                }`}
              >
                My Timetable
              </button>
              <button
                onClick={() => setCurrentTab('registrations')}
                className={`transition-colors whitespace-nowrap hover:text-[#4A2E35] ${
                  currentTab === 'registrations' ? 'text-[#D96B43] font-semibold' : ''
                }`}
              >
                My Passes & OD
              </button>
            </>
          )}

          {role === 'ORGANIZER' && (
            <button
              onClick={() => setCurrentTab('organizer')}
              className={`transition-colors whitespace-nowrap hover:text-[#4A2E35] ${
                currentTab === 'organizer' ? 'text-[#D96B43] font-semibold' : ''
              }`}
            >
              Organizer Console
            </button>
          )}

          {role === 'DSA' && (
            <button
              onClick={() => setCurrentTab('dsa')}
              className={`transition-colors whitespace-nowrap hover:text-[#4A2E35] ${
                currentTab === 'dsa' ? 'text-[#D96B43] font-semibold' : ''
              }`}
            >
              DSA Approvals & OD
            </button>
          )}

          {role === 'ADMIN' && (
            <button
              onClick={() => setCurrentTab('admin')}
              className={`transition-colors whitespace-nowrap hover:text-[#4A2E35] ${
                currentTab === 'admin' ? 'text-[#D96B43] font-semibold' : ''
              }`}
            >
              Admin Master
            </button>
          )}

          <button
            onClick={() => setCurrentTab('clubs')}
            className={`transition-colors whitespace-nowrap hover:text-[#4A2E35] ${
              currentTab === 'clubs' ? 'text-[#D96B43] font-semibold' : ''
            }`}
          >
            Campus Clubs
          </button>
        </nav>

        {/* Zone 3: Interactive Role Switcher & User Profile */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Notifications Button */}
          <button
            onClick={openNotifications}
            className="relative p-2 rounded-lg text-[#75565F] hover:text-[#4A2E35] hover:bg-[#EADFD8]/50 transition-colors"
            title="In-App Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D96B43]" />
            )}
          </button>

          {/* Quick Interactive Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#EAE3D9] text-xs font-semibold text-[#4A2E35] hover:border-[#D96B43]/60 transition-colors shadow-xs"
              title="Switch role instantly to test Student, Organizer, DSA, or Admin views"
            >
              <span className="w-2 h-2 rounded-full bg-[#D96B43]" />
              <span className="capitalize">{role.toLowerCase()} View</span>
            </button>

            {showRoleMenu && (
              <div 
                className="absolute right-0 mt-2 w-64 bg-white border border-[#EAE3D9] rounded-xl shadow-xl py-2 z-50 text-xs"
                onMouseLeave={() => setShowRoleMenu(false)}
              >
                <div className="px-3 py-1.5 border-b border-[#EAE3D9] text-[#91717A] uppercase tracking-wider text-[10px] font-semibold flex justify-between items-center">
                  <span>Switch Role Context</span>
                  <button 
                    onClick={() => {
                      if (confirm('Reset demo state to initial seed data?')) {
                        resetAllDemoData();
                        setShowRoleMenu(false);
                      }
                    }}
                    className="text-[#D96B43] hover:underline flex items-center gap-1 font-semibold"
                    title="Reset all registrations, timetable, and events to default"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    Reset Data
                  </button>
                </div>
                {roles.map(r => (
                  <button
                    key={r.id}
                    onClick={() => {
                      switchRole(r.id);
                      setShowRoleMenu(false);
                      if (r.id === 'STUDENT') setCurrentTab('discover');
                      else if (r.id === 'ORGANIZER') setCurrentTab('organizer');
                      else if (r.id === 'DSA') setCurrentTab('dsa');
                      else if (r.id === 'ADMIN') setCurrentTab('admin');
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#F7F3EC] transition-colors ${
                      role === r.id ? 'bg-[#F7F3EC] text-[#4A2E35] font-semibold' : 'text-[#75565F]'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-[#4A2E35]">{r.label}</p>
                      <p className="text-[11px] text-[#91717A]">{r.desc}</p>
                    </div>
                    {role === r.id && <CheckCircle className="w-4 h-4 text-[#D96B43]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Avatar */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[#EAE3D9]">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#EAE3D9] bg-[#EADFD8] shrink-0">
              <img 
                src={user?.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&q=80'} 
                alt={user?.name || 'User'} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-[#4A2E35] truncate max-w-[110px]">{user?.name}</p>
              <p className="text-[10px] text-[#91717A] truncate">{user?.department}</p>
            </div>
          </div>

          {/* Primary CTA */}
          <button
            onClick={() => setCurrentTab('discover')}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#D96B43] hover:bg-[#E27E58] active:bg-[#BF5832] rounded-lg transition-colors whitespace-nowrap shadow-xs"
          >
            Explore Events
          </button>
        </div>

      </div>
    </header>
  );
};
