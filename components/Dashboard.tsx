import React, { useState, useEffect } from 'react';
import { User, AppConfig, AnalyticsRecord, UserRole } from '../types';
import { getUsers, deleteUser, getAnalytics, getConfig, saveConfig } from '../services/storage';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer, LineChart, Line 
} from 'recharts';

interface DashboardProps {
  onClose: () => void;
  onConfigUpdate: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onClose, onConfigUpdate }) => {
  const [activeTab, setActiveTab] = useState<'USERS' | 'ANALYTICS' | 'CUSTOMIZE'>('USERS');
  const [users, setUsers] = useState<User[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsRecord[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Load Data
  useEffect(() => {
    setUsers(getUsers());
    setAnalytics(getAnalytics());
    setConfig(getConfig());
  }, []);

  const handleDeleteUser = (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteUser(id);
      setUsers(getUsers());
    }
  };

  const handleConfigChange = (section: keyof AppConfig, id: string, field: string, value: string) => {
    if (!config) return;
    const newConfig = { ...config };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const item = (newConfig[section] as any[]).find((i: any) => i.id === id);
    if (item) {
      item[field] = value;
      setConfig(newConfig);
      setIsDirty(true);
    }
  };

  const handleGlobalConfigChange = (field: keyof AppConfig, value: string) => {
    if (!config) return;
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    setIsDirty(true);
  };

  const handleSave = () => {
    if (config) {
      saveConfig(config);
      setIsDirty(false);
      onConfigUpdate();
    }
  };

  const renderUsers = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
      </div>
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{user.username}</div>
                  <div className="text-sm text-gray-500">{user.uniqueId || 'No ID'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === UserRole.ADMIN ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.fullName || '-'}<br/>{user.companyName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                   {user.role !== UserRole.ADMIN && (
                     <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-900">Delete</button>
                   )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAnalytics = () => {
    // Process data for panorama view chart
    const panoData = analytics.map(day => ({
        date: day.date,
        'Pano 1': day.panoramaViews['pano-001'],
        'Pano 2': day.panoramaViews['pano-002'],
        'Pano 3': day.panoramaViews['pano-003'],
    }));

    return (
      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h2>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Daily Visitor Traffic</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip />
                <Legend />
                <Line type="monotone" dataKey="visitors" stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Panorama Views by ID</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={panoData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip />
                <Legend />
                <Bar dataKey="Pano 1" fill="#8884d8" />
                <Bar dataKey="Pano 2" fill="#82ca9d" />
                <Bar dataKey="Pano 3" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderCustomize = () => {
    if (!config) return null;

    return (
      <div className="space-y-8 pb-20">
         <div className="flex justify-between items-center sticky top-0 bg-gray-100 z-10 py-4 -mx-8 px-8 border-b mb-4 backdrop-blur bg-opacity-90 transition-all">
             <h2 className="text-2xl font-bold text-gray-800">Customize Content</h2>
             {isDirty && (
                 <button 
                    onClick={handleSave}
                    className="bg-green-600 text-white px-6 py-2 rounded shadow hover:bg-green-700 transition animate-fade-in font-bold flex items-center gap-2"
                 >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    SAVE CHANGES
                 </button>
             )}
         </div>

         {/* General Settings */}
         <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">General Settings</h3>
            <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1">Main 360 Panorama URL</label>
                <input 
                    type="url" 
                    className="w-full bg-gray-100 border rounded px-2 py-2 text-sm"
                    value={config.panoramaUrl}
                    onChange={(e) => handleGlobalConfigChange('panoramaUrl', e.target.value)}
                    placeholder="https://..."
                />
                <p className="text-xs text-gray-400 mt-1">Enter the full URL of the 360 tour to be displayed in the background.</p>
            </div>
         </div>
         
         {/* Contacts */}
         <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4 text-blue-600">Contacts</h3>
            {config.contacts.map(contact => (
                <div key={contact.id} className="grid grid-cols-3 gap-4 mb-4 border-b pb-4">
                    <div className="col-span-1">
                        <label className="block text-xs text-gray-500">Name</label>
                        <input 
                            type="text" 
                            className="w-full bg-gray-100 border rounded px-2 py-1"
                            value={contact.name}
                            onChange={(e) => handleConfigChange('contacts', contact.id, 'name', e.target.value)}
                        />
                    </div>
                    <div className="col-span-2">
                         <label className="block text-xs text-gray-500">Details</label>
                        <input 
                            type="text" 
                            className="w-full bg-gray-100 border rounded px-2 py-1"
                            value={contact.details}
                            onChange={(e) => handleConfigChange('contacts', contact.id, 'details', e.target.value)}
                        />
                    </div>
                </div>
            ))}
         </div>

         {/* Developers */}
         <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4 text-purple-600">Property Developers</h3>
            {config.developers.map(dev => (
                <div key={dev.id} className="mb-6 border-b pb-4">
                    <div className="mb-2">
                      <label className="block text-xs text-gray-500 mb-1">Developer Name</label>
                      <input 
                          type="text" 
                          className="w-full font-bold bg-gray-100 border rounded px-2 py-1 text-lg mb-1 focus:ring-0"
                          value={dev.name}
                          onChange={(e) => handleConfigChange('developers', dev.id, 'name', e.target.value)}
                      />
                    </div>
                    <div className="mb-2">
                      <label className="block text-xs text-gray-500 mb-1">Description</label>
                      <textarea 
                          className="w-full bg-gray-100 border rounded px-2 py-1 text-sm text-gray-600"
                          rows={2}
                          value={dev.description}
                          onChange={(e) => handleConfigChange('developers', dev.id, 'description', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Website URL</label>
                      <div className="flex gap-2 items-center">
                        <input 
                            type="url" 
                            className="w-full bg-gray-100 border rounded px-2 py-1 text-sm text-blue-600"
                            value={dev.url || ''}
                            onChange={(e) => handleConfigChange('developers', dev.id, 'url', e.target.value)}
                        />
                        {dev.url && (
                          <a 
                            href={dev.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="p-1.5 text-blue-600 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                            title="Visit Link"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                </div>
            ))}
         </div>

          {/* Booking */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4 text-indigo-600">Booking Systems</h3>
            {config.bookings.map(book => (
                <div key={book.id} className="grid grid-cols-2 gap-4 mb-4 border-b pb-4">
                    <div className="col-span-1">
                        <label className="block text-xs text-gray-500">System Name</label>
                        <input 
                            type="text" 
                            className="w-full bg-gray-100 border rounded px-2 py-1"
                            value={book.systemName}
                            onChange={(e) => handleConfigChange('bookings', book.id, 'systemName', e.target.value)}
                        />
                    </div>
                    <div className="col-span-1">
                         <label className="block text-xs text-gray-500">URL</label>
                        <input 
                            type="text" 
                            className="w-full bg-gray-100 border rounded px-2 py-1"
                            value={book.url}
                            onChange={(e) => handleConfigChange('bookings', book.id, 'url', e.target.value)}
                        />
                    </div>
                </div>
            ))}
         </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-white shadow px-6 py-4 flex justify-between items-center z-10">
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">ADMIN DASHBOARD</h1>
        <div className="flex items-center gap-4">
          <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-800 font-medium"
          >
              Close Dashboard
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800 text-white flex flex-col">
            <nav className="flex-1 px-2 py-4 space-y-2">
                <button 
                    onClick={() => setActiveTab('USERS')}
                    className={`w-full text-left px-4 py-3 rounded-md transition-colors ${activeTab === 'USERS' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                >
                    Users
                </button>
                <button 
                    onClick={() => setActiveTab('ANALYTICS')}
                    className={`w-full text-left px-4 py-3 rounded-md transition-colors ${activeTab === 'ANALYTICS' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                >
                    Analytics
                </button>
                <button 
                    onClick={() => setActiveTab('CUSTOMIZE')}
                    className={`w-full text-left px-4 py-3 rounded-md transition-colors ${activeTab === 'CUSTOMIZE' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                >
                    Customize
                </button>
            </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8" id="dashboard-content">
            {activeTab === 'USERS' && renderUsers()}
            {activeTab === 'ANALYTICS' && renderAnalytics()}
            {activeTab === 'CUSTOMIZE' && renderCustomize()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;