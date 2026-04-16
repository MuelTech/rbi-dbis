import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { useNavigate } from 'react-router-dom';
import { authService, type AuthUser } from '../services/auth';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  /** Exposed so ManageAccount and other CRUD pages can still operate on users lists via their own service calls */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapAuthUser(au: AuthUser): User {
  return {
    id: au.id,
    displayId: au.displayId,
    firstName: au.firstName,
    lastName: au.lastName,
    username: au.username,
    phoneNumber: au.phoneNumber,
    profileImage: au.profileImage,
    role: au.roleType as User['role'],
    roleType: au.roleType,
    permission: (au.permission ?? 'Full Access') as User['permission'],
    lastLogin: au.lastLogin ?? undefined,
    status: au.isActive ? 'Active' : 'Disabled',
    isActive: au.isActive,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const navigate = useNavigate();

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    navigate('/login');
  }, [navigate]);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const au = await authService.me();
      const mapped = mapAuthUser(au);
      setUser(mapped);
      localStorage.setItem('currentUser', JSON.stringify(mapped));
    } catch {
      logout();
    }
  }, [logout]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const { token, user: au } = await authService.login(username, password);
      localStorage.setItem('authToken', token);
      const mapped = mapAuthUser(au);
      setUser(mapped);
      localStorage.setItem('currentUser', JSON.stringify(mapped));
      return true;
    } catch (err: any) {
      const msg: string = err?.message ?? '';
      if (msg.includes('disabled') || msg.includes('Disabled')) {
        alert('Your account is disabled. Please contact the administrator.');
      }
      return false;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      authService
        .me()
        .then((au) => {
          const mapped = mapAuthUser(au);
          setUser(mapped);
          localStorage.setItem('currentUser', JSON.stringify(mapped));
        })
        .catch(() => {
          localStorage.removeItem('authToken');
          localStorage.removeItem('currentUser');
        })
        .finally(() => setInitializing(false));
    } else {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        localStorage.removeItem('currentUser');
      }
      setInitializing(false);
    }
  }, []);

  if (initializing) return null;

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
