import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  users: User[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initial mock data
const initialUsersData: User[] = [
    { id: '001', firstName: 'Admin', lastName: 'User', username: 'admin', password: 'password123', phoneNumber: '0912-345-6789', role: 'SuperAdmin', permission: 'Full Access', lastLogin: '10/24/2024 09:30 AM', status: 'Active' },
    { id: '002', firstName: 'John', lastName: 'Doe', username: 'johndoe', password: 'password123', phoneNumber: '0912-345-6789', role: 'Admin', permission: 'Document Access', lastLogin: '10/23/2024 04:15 PM', status: 'Active' },
    { id: '003', firstName: 'Jane', lastName: 'Smith', username: 'janesmith', password: 'password123', phoneNumber: '0912-345-6789', role: 'Admin', permission: 'Resident Access', lastLogin: '10/20/2024 11:00 AM', status: 'Disabled' },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(initialUsersData);
  const navigate = useNavigate();

  const login = async (username: string, password: string) => {
    const foundUser = users.find(u => u.username === username && u.password === password);
    if (foundUser) {
      if (foundUser.status === 'Disabled') {
        alert('Your account is disabled. Please contact the administrator.');
        return false;
      }
      // Update last login
      const updatedUser = { ...foundUser, lastLogin: new Date().toLocaleString() };
      const updatedUsers = users.map(u => u.id === foundUser.id ? updatedUser : u);
      setUsers(updatedUsers);
      setUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const addUser = (newUser: User) => {
    setUsers([...users, newUser]);
  };

  const updateUser = (updatedUser: User) => {
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    // If updating current user, update state
    if (user && user.id === updatedUser.id) {
        setUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
  };

  const deleteUser = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
  };

  // Restore session
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, users, login, logout, addUser, updateUser, deleteUser }}>
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
