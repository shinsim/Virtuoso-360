import React, { useState, useEffect, useRef } from 'react';
import { User, AppConfig, AnalyticsRecord, UserRole, ContactGroup } from '../types';
import { getUsers, deleteUser, updateUser, getAnalytics, getConfig, saveConfig, backupSystem, restoreSystem, resetSystem } from '../services/storage';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer, LineChart, Line 
} from 'recharts';

interface DashboardProps {
  onClose: () => void;
  onConfigUpdate: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onClose, onConfigUpdate }) => {
  const [activeTab, setActiveTab] = useState<'USERS' | 'ANALYTICS' | 'CUSTOMIZE' | 'DATABASE'>('USERS');
  const [users, setUsers] = useState<User[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsRecord[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  
  // Database State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedBackupFile, setSelectedBackupFile] = useState<File | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Edit User State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Accordion State
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

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

  const handleEditUser = (user: User) => {
    setEditingUser({ ...user });
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateUser(editingUser);
      setUsers(getUsers());
      setEditingUser(null);
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

  // --- Contact Group Handlers ---
  const toggleGroup = (id: string) => {
      setExpandedGroup(expandedGroup === id ? null : id);
  };

  const updateGroupTitle = (id: string, newTitle: string) => {
    if (!config) return;
    const newGroups = config.contactGroups.map(g => 
        g.id === id ? { ...g, title: newTitle } : g
    );
    setConfig({ ...config, contactGroups: newGroups });
    setIsDirty(true);
  };

  const addGroup = () => {
      if (!config) return;
      const newGroup: ContactGroup = {
          id: `grp-${Date.now()}`,
          title: 'New Category',
          items: []
      };
      setConfig({ ...config, contactGroups: [...config.contactGroups, newGroup] });
      setIsDirty(true);
      setExpandedGroup(newGroup.id);
  };

  const deleteGroup = (id: string) => {
      if (!config) return;
      if (confirm('Delete this entire category?')) {
          setConfig({ ...config, contactGroups: config.contactGroups.filter(g => g.id !== id) });
          setIsDirty(true);
      }
  };

  const addItemToGroup = (groupId: string) => {
      if (!config) return;
      const newGroups = config.contactGroups.map(g => {
          if (g.id === groupId) {
              return {
                  ...g,
                  items: [...g.items, { id: `item-${Date.now()}`, name: '', details: '' }]
              };
          }
          return g;
      });
      setConfig({ ...config, contactGroups: newGroups });
      setIsDirty(true);
  };

  const deleteItemFromGroup = (groupId: string, itemId: string) => {
      if (!config) return;
      const newGroups = config.contactGroups.map(g => {
          if (g.id === groupId) {
              return {
                  ...g,
                  items: g.items.filter(i => i.id !== itemId)
              };
          }
          return g;
      });
      setConfig({ ...config, contactGroups: newGroups });
      setIsDirty(true);
  };

  const updateItemInGroup = (groupId: string, itemId: string, field: 'name' | 'details', value: string) => {
      if (!config) return;
      const newGroups = config.contactGroups.map(g => {
          if (g.id === groupId) {
              const newItems = g.items.map(i => i.id === itemId ? { ...i, [field]: value } : i);
              return { ...g, items: newItems };
          }
          return g;
      });
      setConfig({ ...config, contactGroups: newGroups });
      setIsDirty(true);
  };


  const handleSave = () => {
    if (config) {
      saveConfig(config);
      setIsDirty(false);
      onConfigUpdate();
    }
  };

  // Database Handlers
  const handleDownloadBackup = () => {
    const data = backupSystem();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `virtuoso_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedBackupFile(e.target.files[0]);
    } else {
      setSelectedBackupFile(null);
    }
  };

  const handleConfirmRestore = () => {
    if (!selectedBackupFile) return;

    setIsRestoring(true);

    const reader = new FileReader();
    
    reader.onload = (event) => {
        try {
            const content = event.target?.result as string;
            if (!content) {
                alert('Error: The selected file is empty.');
                setIsRestoring(false);
                return;
            }

            if (restoreSystem(content)) {
                alert('System restored successfully! The application will now reload.');
                window.location.reload();
            } else {
                alert('Failed to restore. The file format seems invalid or corrupted.');
                setIsRestoring(false);
            }
        } catch (err) {
            console.error(err);
            alert('An unexpected error occurred while processing the backup file.');
            setIsRestoring(false);
        }
    };

    reader.onerror = () => {
        alert('Error reading the file from your device.');
        setIsRestoring(false);
    };

    reader.readAsText(selectedBackupFile);
  };

  const handleCancelRestore = () => {
    setSelectedBackupFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsRestoring(false);
  };

  const handleResetSystem = () => {
      if (confirm('WARNING: This will delete ALL users and customizations and reset to factory defaults. This cannot be undone. Are you sure?')) {
          resetSystem();
          window.location.reload();
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username / Email</th>
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
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleEditUser(user)} 
                      className="text-indigo-600 hover:text-indigo-900 font-bold"
                    >
                      Edit
                    </button>
                    {user.role !== UserRole.ADMIN && (
                      <button 
                        onClick={() => handleDeleteUser(user.id)} 
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    )}
                  </div>
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
         
         {/* Contacts - Accordion UI */}
         <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-blue-600">Contacts</h3>
                <button onClick={addGroup} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200">
                    + New Group
                </button>
            </div>
            
            <div className="space-y-4">
                {config.contactGroups?.map(group => (
                    <div key={group.id} className="border rounded-md overflow-hidden bg-white">
                        {/* Accordion Header */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
                            <div className="flex items-center gap-2 flex-1">
                                <button onClick={() => toggleGroup(group.id)} className="text-gray-500 hover:text-gray-800">
                                    <svg className={`w-5 h-5 transition-transform ${expandedGroup === group.id ? 'transform rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                                <input 
                                    type="text" 
                                    className="bg-transparent border-none font-semibold text-gray-800 focus:ring-0 w-full"
                                    value={group.title}
                                    onChange={(e) => updateGroupTitle(group.id, e.target.value)}
                                    placeholder="Group Title (e.g. Lawyer)"
                                />
                            </div>
                            <button onClick={() => deleteGroup(group.id)} className="text-red-400 hover:text-red-600 p-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>

                        {/* Accordion Body */}
                        {expandedGroup === group.id && (
                            <div className="p-4 bg-gray-50 space-y-3">
                                {group.items.length === 0 && <p className="text-xs text-gray-400 italic text-center">No contacts in this group.</p>}
                                
                                {group.items.map(item => (
                                    <div key={item.id} className="flex gap-2 items-start">
                                        <div className="flex-1">
                                            <input 
                                                type="text" 
                                                className="w-full bg-white border rounded px-2 py-1 text-sm mb-1"
                                                placeholder="Name (e.g. John Doe)"
                                                value={item.name}
                                                onChange={(e) => updateItemInGroup(group.id, item.id, 'name', e.target.value)}
                                            />
                                        </div>
                                        <div className="flex-[2]">
                                            <input 
                                                type="text" 
                                                className="w-full bg-white border rounded px-2 py-1 text-sm"
                                                placeholder="Phone or URL (e.g. 555-1234 or https://site.com)"
                                                value={item.details}
                                                onChange={(e) => updateItemInGroup(group.id, item.id, 'details', e.target.value)}
                                            />
                                        </div>
                                        <button onClick={() => deleteItemFromGroup(group.id, item.id)} className="text-gray-400 hover:text-red-500 pt-1">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ))}

                                <button 
                                    onClick={() => addItemToGroup(group.id)}
                                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded text-gray-500 hover:border-blue-400 hover:text-blue-600 text-xs font-semibold transition-colors"
                                >
                                    + Add Contact Row
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
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

  const renderDatabase = () => (
      <div className="space-y-8">
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Database Management</h2>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow space-y-6">
              <div className="border-b pb-6">
                  <h3 className="text-lg font-semibold mb-2 text-blue-800">Backup Database</h3>
                  <p className="text-sm text-gray-600 mb-4">Download a complete backup of Users, Analytics, and Configuration settings to your local computer.</p>
                  <button 
                      onClick={handleDownloadBackup}
                      className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition flex items-center gap-2"
                  >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Download Backup (.json)
                  </button>
              </div>

              <div className="border-b pb-6">
                  <h3 className="text-lg font-semibold mb-2 text-green-800">Restore Database</h3>
                  <p className="text-sm text-gray-600 mb-4">Upload a previously saved backup file to restore the system. <span className="font-bold text-red-500">This will overwrite all current data.</span></p>
                  <div className="space-y-4">
                      <input 
                          type="file" 
                          accept=".json" 
                          ref={fileInputRef}
                          className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-green-50 file:text-green-700
                            hover:file:bg-green-100
                            cursor-pointer
                          "
                          onChange={handleFileSelect}
                          disabled={isRestoring}
                      />
                      
                      {selectedBackupFile && (
                          <div className="bg-green-50 p-4 rounded-lg border border-green-200 animate-fade-in">
                              <p className="text-sm text-green-800 mb-3 font-medium">
                                  Selected file: <span className="font-bold">{selectedBackupFile.name}</span>
                              </p>
                              <div className="flex gap-3">
                                  <button 
                                      onClick={handleConfirmRestore}
                                      disabled={isRestoring}
                                      className={`bg-green-600 text-white px-4 py-2 rounded shadow flex items-center gap-2 font-bold ${isRestoring ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700 transition'}`}
                                  >
                                      {isRestoring ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Restoring...
                                        </>
                                      ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                            Confirm Restore
                                        </>
                                      )}
                                  </button>
                                  <button 
                                      onClick={handleCancelRestore}
                                      disabled={isRestoring}
                                      className="text-gray-600 hover:text-gray-900 px-4 py-2"
                                  >
                                      Cancel
                                  </button>
                              </div>
                          </div>
                      )}
                  </div>
              </div>

              <div>
                  <h3 className="text-lg font-semibold mb-2 text-red-800">Factory Reset</h3>
                  <p className="text-sm text-gray-600 mb-4">Clear all data and reset the system to initial state. Users (except default Admin) will be deleted.</p>
                  <button 
                      onClick={handleResetSystem}
                      className="bg-red-100 text-red-700 border border-red-200 px-4 py-2 rounded hover:bg-red-200 transition flex items-center gap-2"
                  >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      Reset to Defaults
                  </button>
              </div>
          </div>
      </div>
  );

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
                <button 
                    onClick={() => setActiveTab('DATABASE')}
                    className={`w-full text-left px-4 py-3 rounded-md transition-colors ${activeTab === 'DATABASE' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                >
                    Database
                </button>
            </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8" id="dashboard-content">
            {activeTab === 'USERS' && renderUsers()}
            {activeTab === 'ANALYTICS' && renderAnalytics()}
            {activeTab === 'CUSTOMIZE' && renderCustomize()}
            {activeTab === 'DATABASE' && renderDatabase()}
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="px-6 py-4 bg-gray-100 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Edit User</h3>
              <button onClick={() => setEditingUser(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select 
                      className="w-full bg-gray-50 border rounded px-3 py-2"
                      value={editingUser.role}
                      onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})}
                    >
                      <option value={UserRole.USER}>User</option>
                      <option value={UserRole.ADMIN}>Admin</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email / Username</label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-50 border rounded px-3 py-2"
                      value={editingUser.username}
                      onChange={e => setEditingUser({...editingUser, username: e.target.value})}
                    />
                 </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border rounded px-3 py-2"
                  value={editingUser.fullName || ''}
                  onChange={e => setEditingUser({...editingUser, fullName: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border rounded px-3 py-2"
                  value={editingUser.companyName || ''}
                  onChange={e => setEditingUser({...editingUser, companyName: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <button 
                  type="button" 
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;