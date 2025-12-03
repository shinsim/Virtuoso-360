import { User, AppConfig, AnalyticsRecord, UserRole } from '../types';
import { MOCK_ADMIN, INITIAL_CONFIG, INITIAL_ANALYTICS } from '../constants';

const KEYS = {
  USERS: 'virtuoso_users',
  CONFIG: 'virtuoso_config',
  ANALYTICS: 'virtuoso_analytics',
  CURRENT_USER_ID: 'virtuoso_session'
};

// Helper to generate ID
export const generateUniqueId = (): string => {
  return Math.random().toString(36).substring(2, 9).toUpperCase();
};

// Initialize Storage
export const initStorage = () => {
  if (!localStorage.getItem(KEYS.USERS)) {
    localStorage.setItem(KEYS.USERS, JSON.stringify([MOCK_ADMIN]));
  }
  if (!localStorage.getItem(KEYS.CONFIG)) {
    localStorage.setItem(KEYS.CONFIG, JSON.stringify(INITIAL_CONFIG));
  }
  if (!localStorage.getItem(KEYS.ANALYTICS)) {
    localStorage.setItem(KEYS.ANALYTICS, JSON.stringify(INITIAL_ANALYTICS));
  }
};

// User Methods
export const getUsers = (): User[] => {
  const stored = localStorage.getItem(KEYS.USERS);
  return stored ? JSON.parse(stored) : [];
};

export const saveUser = (user: User) => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === user.id);
  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  // Update session if it's the current user
  const currentId = localStorage.getItem(KEYS.CURRENT_USER_ID);
  if (currentId === user.id) {
    // Force re-render event or handled by App state
  }
};

export const deleteUser = (userId: string) => {
  let users = getUsers();
  users = users.filter(u => u.id !== userId);
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
};

export const registerUser = (username: string, password: string): User => {
  const newUser: User = {
    id: `user-${Date.now()}`,
    username,
    password,
    role: UserRole.USER,
    isVerified: false, // Requires verification
    isSetupComplete: false
  };
  saveUser(newUser);
  return newUser;
};

// Config Methods
export const getConfig = (): AppConfig => {
  const stored = localStorage.getItem(KEYS.CONFIG);
  return stored ? JSON.parse(stored) : INITIAL_CONFIG;
};

export const saveConfig = (config: AppConfig) => {
  localStorage.setItem(KEYS.CONFIG, JSON.stringify(config));
};

// Analytics Methods
export const getAnalytics = (): AnalyticsRecord[] => {
  const stored = localStorage.getItem(KEYS.ANALYTICS);
  return stored ? JSON.parse(stored) : INITIAL_ANALYTICS;
};

// Session
export const login = (username: string, password: string): User | null => {
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    localStorage.setItem(KEYS.CURRENT_USER_ID, user.id);
    return user;
  }
  return null;
};

export const logout = () => {
  localStorage.removeItem(KEYS.CURRENT_USER_ID);
};

export const getCurrentUser = (): User | null => {
  const id = localStorage.getItem(KEYS.CURRENT_USER_ID);
  if (!id) return null;
  const users = getUsers();
  return users.find(u => u.id === id) || null;
};