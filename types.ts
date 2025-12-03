export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export interface User {
  id: string;
  username: string; // Used as email
  password?: string; // stored for mock auth
  role: UserRole;
  isVerified: boolean;
  isSetupComplete: boolean;
  // User Details
  fullName?: string;
  contactNumber?: string;
  companyName?: string;
  uniqueId?: string; // 7 digit alphanumeric
}

export interface AnalyticsRecord {
  date: string;
  visitors: number;
  panoramaViews: Record<string, number>; // panoId -> count
}

export interface ContactItem {
  id: string;
  name: string;
  details: string; // Phone or URL
}

export interface ContactGroup {
  id: string;
  title: string;
  items: ContactItem[];
}

export interface DeveloperEntry {
  id: string;
  name: string;
  description: string;
  url: string;
}

export interface BookingEntry {
  id: string;
  systemName: string;
  url: string;
}

export interface AppConfig {
  panoramaUrl: string;
  contactGroups: ContactGroup[];
  developers: DeveloperEntry[];
  bookings: BookingEntry[];
}