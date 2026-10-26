import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Role, InAppNotification } from '../types';
import { 
  getCurrentUser, setCurrentUser, switchRoleUser, getAllUsers, 
  getUserNotifications, registerUser, resetAllDataToDefault 
} from '../lib/storage';

interface AuthContextType {
  user: User | null;
  role: Role;
  switchRole: (role: Role) => void;
  loginByEmail: (email: string) => boolean;
  signup: (userData: Omit<User, 'id'>) => User;
  logout: () => void;
  notifications: InAppNotification[];
  unreadCount: number;
  refreshNotifications: () => void;
  resetAllDemoData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => getCurrentUser());
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);

  const refreshNotifications = useCallback(() => {
    if (user) {
      const notifs = getUserNotifications(user.id);
      setNotifications(notifs);
    } else {
      setNotifications([]);
    }
  }, [user]);

  useEffect(() => {
    refreshNotifications();
  }, [user, refreshNotifications]);

  const switchRole = (newRole: Role) => {
    const targetUser = switchRoleUser(newRole);
    setUser({ ...targetUser });
  };

  const loginByEmail = (email: string): boolean => {
    const users = getAllUsers();
    const found = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (found) {
      setCurrentUser(found);
      setUser(found);
      return true;
    }
    return false;
  };

  const signup = (userData: Omit<User, 'id'>): User => {
    const created = registerUser(userData);
    setUser(created);
    return created;
  };

  const logout = () => {
    // For demo convenience, log out sets to Student Priya
    const defaultStudent = switchRoleUser('STUDENT');
    setUser(defaultStudent);
  };

  const resetAllDemoData = () => {
    resetAllDataToDefault();
    const current = getCurrentUser();
    setUser(current);
    refreshNotifications();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'STUDENT',
        switchRole,
        loginByEmail,
        signup,
        logout,
        notifications,
        unreadCount,
        refreshNotifications,
        resetAllDemoData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
