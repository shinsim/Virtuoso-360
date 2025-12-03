import { User, AppConfig, AnalyticsRecord, UserRole, ContactGroup, ContactItem } from '../types';
import { MOCK_ADMIN, INITIAL_CONFIG, INITIAL_ANALYTICS } from '../constants';

const KEYS = {
  USERS: 'virtuoso_users',
  CONFIG: 'virtuoso_config',
  ANALYTICS: 'virtuoso_analytics',
  CURRENT_USER_ID: 'virtuoso_session'
};

// --- SECURITY HELPERS ---
// The salt value used for password hashing.
// In a real production app, this should be a random value per user stored in the database,
// or a secure environment variable.
const SALT = 'virtuoso_secure_salt_';

// Simple mock hash (Base64 + Salt) to avoid plain text storage.
// In a real application, use bcrypt or Argon2 on the server side.
const hashPassword = (password: string): string => {
  return btoa(`${SALT}${password}`);
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
};

export const updateUser = (user: User) => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === user.id);
  if (index >= 0) {
    users[index] = user;
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  }
};

export const changeUserPassword = (userId: string, newPassword: string): User | null => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index >= 0) {
    // Hash the new password before saving
    users[index].password = hashPassword(newPassword);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    return users[index];
  }
  return null;
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
    password: hashPassword(password), // Store hashed
    role: UserRole.USER,
    isVerified: false, 
    isSetupComplete: false
  };
  saveUser(newUser);
  return newUser;
};

// Config Methods
export const getConfig = (): AppConfig => {
  const stored = localStorage.getItem(KEYS.CONFIG);
  if (!stored) return INITIAL_CONFIG;

  const config = JSON.parse(stored);

  // MIGRATION: Convert old flat 'contacts' to 'contactGroups' if needed
  if (config.contacts && Array.isArray(config.contacts) && !config.contactGroups) {
    const groups: Record<string, ContactGroup> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config.contacts.forEach((c: any) => {
        const category = c.category || 'General';
        if (!groups[category]) {
            groups[category] = {
                id: `grp-${Date.now()}-${Math.random()}`,
                title: category,
                items: []
            };
        }
        groups[category].items.push({
            id: c.id,
            name: c.name,
            details: c.details
        });
    });
    config.contactGroups = Object.values(groups);
    delete config.contacts;
    saveConfig(config);
  }
  
  if (!config.contactGroups) {
      config.contactGroups = INITIAL_CONFIG.contactGroups;
  }

  return config as AppConfig;
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
  const hashed = hashPassword(password);
  
  const userIndex = users.findIndex(u => u.username === username);
  if (userIndex === -1) return null;
  
  const user = users[userIndex];
  
  // 1. Check secure hash
  if (user.password === hashed) {
    localStorage.setItem(KEYS.CURRENT_USER_ID, user.id);
    return user;
  }
  
  // 2. Fallback: Check plain text (for migration of old data)
  if (user.password === password) {
    // Migrate to hash immediately
    user.password = hashed;
    users[userIndex] = user;
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    
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

// Database Management (Backup/Restore)
export const backupSystem = (): string => {
  const backup = {
    users: getUsers(),
    config: getConfig(),
    analytics: getAnalytics(),
    timestamp: new Date().toISOString()
  };
  return JSON.stringify(backup, null, 2);
};

export const restoreSystem = (jsonContent: string): boolean => {
  try {
    const backup = JSON.parse(jsonContent);
    // Basic validation
    if (!backup || typeof backup !== 'object') {
        return false;
    }
    
    if (!backup.users && !backup.config && !backup.analytics) {
        return false;
    }

    if (backup.users) localStorage.setItem(KEYS.USERS, JSON.stringify(backup.users));
    if (backup.config) localStorage.setItem(KEYS.CONFIG, JSON.stringify(backup.config));
    if (backup.analytics) localStorage.setItem(KEYS.ANALYTICS, JSON.stringify(backup.analytics));
    return true;
  } catch (error) {
    console.error("Failed to restore database", error);
    return false;
  }
};

export const resetSystem = () => {
  localStorage.removeItem(KEYS.USERS);
  localStorage.removeItem(KEYS.CONFIG);
  localStorage.removeItem(KEYS.ANALYTICS);
  localStorage.removeItem(KEYS.CURRENT_USER_ID);
  initStorage();
};