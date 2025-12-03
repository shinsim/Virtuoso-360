import { AppConfig, User, UserRole, AnalyticsRecord } from './types';

export const MOCK_ADMIN: User = {
  id: 'admin-001',
  username: 'admin',
  password: 'dmlydHVvc29fc2VjdXJlX3NhbHRfcGFzc3dvcmQ=', // Hashed 'password'
  role: UserRole.ADMIN,
  isVerified: true,
  isSetupComplete: true,
  fullName: 'System Administrator',
  uniqueId: 'ADMIN01'
};

export const INITIAL_CONFIG: AppConfig = {
  panoramaUrl: "https://tuju.pages.dev/showunit_only/index.htm",
  contactGroups: [
    {
      id: 'g1',
      title: 'Lawyer',
      items: [
        { id: 'c1', name: 'Legal Eagles LLP', details: '555-0123' }
      ]
    },
    {
      id: 'g2',
      title: 'Banker',
      items: [
        { id: 'c2', name: 'Global Trust Bank', details: '555-0987' }
      ]
    },
    {
      id: 'g3',
      title: 'City Council',
      items: [
        { id: 'c3', name: 'Metro City Council', details: 'https://metro.city.gov' }
      ]
    }
  ],
  developers: [
    { id: 'd1', name: 'WCT', description: 'Engineering and Construction', url: 'https://www.wct.com.my' },
    { id: 'd2', name: 'EcoWorld', description: 'Creating Tomorrow & Beyond', url: 'https://ecoworld.my' },
    { id: 'd3', name: 'UEM Sunrise', description: 'Find your Happy', url: 'https://uemsunrise.com' },
    { id: 'd4', name: 'Sunway Property', description: 'Master Community Developer', url: 'https://sunwayproperty.com' },
  ],
  bookings: [
    { id: 'b1', systemName: 'MHub', url: '#' },
    { id: 'b2', systemName: 'IFCA', url: '#' },
    { id: 'b3', systemName: 'GProp', url: '#' },
  ]
};

// Generate last 7 days of mock data
const generateMockAnalytics = (): AnalyticsRecord[] => {
  const data: AnalyticsRecord[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    data.push({
      date: d.toISOString().split('T')[0],
      visitors: Math.floor(Math.random() * 200) + 50,
      panoramaViews: {
        'pano-001': Math.floor(Math.random() * 100) + 20,
        'pano-002': Math.floor(Math.random() * 80) + 10,
        'pano-003': Math.floor(Math.random() * 50) + 5,
      }
    });
  }
  return data;
};

export const INITIAL_ANALYTICS = generateMockAnalytics();

export const PANORAMA_IMAGE = "https://images.unsplash.com/photo-1557971370-e7298ed473ab?q=80&w=3200&auto=format&fit=crop";