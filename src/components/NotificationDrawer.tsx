import React from 'react';
import { useAuth } from '../context/AuthContext';
import { markNotificationRead } from '../lib/storage';
import { X, Bell, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ 
  isOpen, 
  onClose,
  onNavigate 
}) => {
  const { notifications, refreshNotifications } = useAuth();

  if (!isOpen) return null;

  const handleMarkAsRead = (id: string) => {
    markNotificationRead(id);
    refreshNotifications();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'WARNING':
      case 'ALERT':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      default:
        return <Info className="w-4 h-4 text-[#D96B43]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#4A2E35]/30 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white border-l border-[#EAE3D9] h-full flex flex-col text-[#4A2E35] shadow-2xl">
        
        {/* Header */}
        <div className="p-4.5 border-b border-[#EAE3D9] flex items-center justify-between bg-[#F7F3EC]/50">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#D96B43]" />
            <h3 className="font-bold text-sm text-[#4A2E35]">Notifications</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-[#91717A] hover:text-[#4A2E35] hover:bg-[#EADFD8]/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-xs text-[#91717A]">
              No notifications yet.
            </div>
          ) : (
            notifications.map((n) => (
              <div 
                key={n.id}
                className={`p-3.5 rounded-xl border transition-colors ${
                  n.read 
                    ? 'bg-white border-[#EAE3D9] text-[#75565F]' 
                    : 'bg-[#F7F3EC] border-[#D6C7C2] text-[#4A2E35] shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    {getIcon(n.type)}
                    <span className={n.read ? 'text-[#75565F]' : 'text-[#4A2E35]'}>{n.title}</span>
                  </div>
                  {!n.read && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="text-[10px] text-[#D96B43] hover:underline shrink-0 font-semibold"
                    >
                      Mark read
                    </button>
                  )}
                </div>
                <p className="text-[11px] leading-relaxed text-[#75565F]">{n.message}</p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-[#91717A]">
                  <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {n.linkUrl && (
                    <button
                      onClick={() => {
                        const target = n.linkUrl!.replace('/', '');
                        onNavigate(target);
                        onClose();
                      }}
                      className="text-[#D96B43] hover:underline font-semibold"
                    >
                      View Details →
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
