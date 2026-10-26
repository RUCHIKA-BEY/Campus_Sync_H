import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EventItem, Registration } from './types';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ConflictModal } from './components/ConflictModal';
import { TicketModal } from './components/TicketModal';
import { NotificationDrawer } from './components/NotificationDrawer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { DiscoverEventsPage } from './pages/DiscoverEventsPage';
import { TimetablePage } from './pages/TimetablePage';
import { MyRegistrationsPage } from './pages/MyRegistrationsPage';
import { OrganizerDashboard } from './pages/OrganizerDashboard';
import { DSADashboard } from './pages/DSADashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ClubsDirectoryPage } from './pages/ClubsDirectoryPage';

function MainApp() {
  const { role, user, switchRole } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('landing');
  
  // Modals
  const [conflictEvent, setConflictEvent] = useState<EventItem | null>(null);
  const [ticketRegistration, setTicketRegistration] = useState<Registration | null>(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [detailEvent, setDetailEvent] = useState<EventItem | null>(null);

  const handleSelectEventForConflict = (event: EventItem) => {
    setConflictEvent(event);
  };

  const handleSelectEventFromOutside = (event: EventItem) => {
    setDetailEvent(event);
    setCurrentTab('discover');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0] text-[#4A2E35]">
      
      {/* Top Navigation Bar adhering to Top Bar Contract */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openNotifications={() => setIsNotifOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'landing' && (
          <LandingPage
            onNavigate={setCurrentTab}
            onSelectEvent={handleSelectEventFromOutside}
            onQuickRegister={handleSelectEventForConflict}
          />
        )}

        {currentTab === 'discover' && (
          <DiscoverEventsPage
            onSelectEventForConflict={handleSelectEventForConflict}
            selectedEventFromOutside={detailEvent}
            onClearSelectedEvent={() => setDetailEvent(null)}
          />
        )}

        {currentTab === 'timetable' && <TimetablePage />}

        {currentTab === 'registrations' && (
          <MyRegistrationsPage
            onOpenTicket={(reg) => setTicketRegistration(reg)}
            onExploreEvents={() => setCurrentTab('discover')}
          />
        )}

        {currentTab === 'organizer' && <OrganizerDashboard />}

        {currentTab === 'dsa' && <DSADashboard />}

        {currentTab === 'admin' && <AdminDashboard />}

        {currentTab === 'clubs' && (
          <ClubsDirectoryPage
            onSelectEvent={handleSelectEventFromOutside}
            onExploreEvents={() => setCurrentTab('discover')}
          />
        )}
      </main>

      {/* Global Modals */}
      <ConflictModal
        event={conflictEvent}
        onClose={() => setConflictEvent(null)}
        onSuccess={() => {
          // Success handled in modal
        }}
        onViewTicket={(ticketCode) => {
          // Open registrations tab to see the newly generated pass
          setCurrentTab('registrations');
        }}
      />

      <TicketModal
        registration={ticketRegistration}
        onClose={() => setTicketRegistration(null)}
      />

      <NotificationDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        onNavigate={(tab) => setCurrentTab(tab)}
      />

      {/* Persistent Academic Testing Ribbon at Bottom */}
      <aside 
        aria-label="Evaluation Console"
        className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#EAE3D9] py-2.5 px-4 text-xs shadow-md"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#75565F]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D96B43] animate-pulse" />
            <span className="text-[#4A2E35] font-bold">Evaluation Mode Active:</span>
            <span>Current Persona: <strong className="text-[#D96B43]">{user?.name} ({role})</strong></span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[#91717A] hidden md:inline">Quick Perspective Switch:</span>
            <button
              onClick={() => { switchRole('STUDENT'); setCurrentTab('discover'); }}
              className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                role === 'STUDENT' ? 'bg-[#D96B43] text-white shadow-sm' : 'bg-[#F7F3EC] text-[#75565F] hover:text-[#4A2E35] border border-[#EAE3D9]'
              }`}
            >
              1. Student (Priya)
            </button>
            <button
              onClick={() => { switchRole('ORGANIZER'); setCurrentTab('organizer'); }}
              className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                role === 'ORGANIZER' ? 'bg-[#D96B43] text-white shadow-sm' : 'bg-[#F7F3EC] text-[#75565F] hover:text-[#4A2E35] border border-[#EAE3D9]'
              }`}
            >
              2. Organizer (Arjun)
            </button>
            <button
              onClick={() => { switchRole('DSA'); setCurrentTab('dsa'); }}
              className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                role === 'DSA' ? 'bg-[#D96B43] text-white shadow-sm' : 'bg-[#F7F3EC] text-[#75565F] hover:text-[#4A2E35] border border-[#EAE3D9]'
              }`}
            >
              3. DSA (Dr. Ramanathan)
            </button>
            <button
              onClick={() => { switchRole('ADMIN'); setCurrentTab('admin'); }}
              className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                role === 'ADMIN' ? 'bg-[#D96B43] text-white shadow-sm' : 'bg-[#F7F3EC] text-[#75565F] hover:text-[#4A2E35] border border-[#EAE3D9]'
              }`}
            >
              4. Admin
            </button>
          </div>
        </div>
      </aside>

      {/* Footer */}
      <Footer />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
