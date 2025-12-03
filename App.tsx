import React, { useState, useEffect } from 'react';
import { User, UserRole, AppConfig } from './types';
import { initStorage, getCurrentUser, login, logout, getConfig, saveUser, generateUniqueId, registerUser } from './services/storage';
import PanoramaViewer from './components/PanoramaViewer';
import Dashboard from './components/Dashboard';

// --- SVGs for Icons ---
const IconUser = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const IconContact = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const IconBuilding = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-3m-6 0h6" /></svg>;
const IconBook = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const IconDashboard = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const IconMenu = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>;
const IconLogin = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>;
const IconAlert = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP' | 'SETUP'>('LOGIN');
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState<string | null>(null);
  
  // Auth Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // Re-type password
  const [errorMessage, setErrorMessage] = useState('');
  const [shake, setShake] = useState(false);

  const [setupData, setSetupData] = useState({ name: '', phone: '', company: '' });
  const [verificationSent, setVerificationSent] = useState(false);

  // Password Change
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  useEffect(() => {
    initStorage();
    setCurrentUser(getCurrentUser());
    setConfig(getConfig());
  }, []);

  const handleConfigUpdate = () => {
    setConfig(getConfig());
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 300);
  };

  // Handle Login Flow
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = login(username, password);
    if (user) {
      if (!user.isSetupComplete && user.role === UserRole.USER) {
        // Needs setup
        setCurrentUser(user); // Temporarily set to allow setup
        setAuthMode('SETUP');
      } else {
        setCurrentUser(user);
        setIsAuthOpen(false);
        setAuthMode('LOGIN');
        setUsername('');
        setPassword('');
      }
      setErrorMessage('');
    } else {
      setErrorMessage('Invalid email or password');
      triggerShake();
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // 1. Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(username)) {
      setErrorMessage('Please enter a valid email address.');
      triggerShake();
      return;
    }

    // 2. Validate Password Complexity
    // NIST recommended: Min 8, Max 15, Uppercase, Numbers, Symbols
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,15}$/;
    if (!passwordRegex.test(password)) {
      setErrorMessage('Password must be 8-15 chars, contain 1 uppercase, 1 number, and 1 symbol.');
      triggerShake();
      return;
    }

    // 3. Validate Password Match
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      triggerShake();
      return;
    }

    registerUser(username, password);
    setVerificationSent(true);
  };

  const handleVerify = () => {
    // Simulated verification
    setVerificationSent(false);
    alert('Email verified successfully! Please login.');
    setAuthMode('LOGIN');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setErrorMessage('');
  };

  const handleSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser) {
      const updatedUser: User = {
        ...currentUser,
        fullName: setupData.name,
        contactNumber: setupData.phone,
        companyName: setupData.company,
        uniqueId: generateUniqueId(),
        isSetupComplete: true,
        isVerified: true
      };
      saveUser(updatedUser);
      setCurrentUser(updatedUser);
      setIsAuthOpen(false);
      setAuthMode('LOGIN');
    }
  };

  const handleChangePassword = () => {
    if(currentUser && newPassword) {
      const updated = { ...currentUser, password: newPassword };
      saveUser(updated);
      setCurrentUser(updated);
      setPasswordMsg('Password updated!');
      setTimeout(() => setPasswordMsg(''), 3000);
      setNewPassword('');
    }
  };

  const toggleOverlay = (key: string) => {
    if (activeOverlay === key) setActiveOverlay(null);
    else setActiveOverlay(key);
  };

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
    if (isMenuOpen) {
        setActiveOverlay(null); // Close overlays when closing menu
    }
  };

  // Helper to determine link type
  const getContactLink = (details: string) => {
      if (details.match(/^https?:\/\//i)) {
          return { href: details, target: '_blank', rel: 'noopener noreferrer' };
      }
      // Clean phone number
      const phone = details.replace(/[^0-9+]/g, '');
      return { href: `tel:${phone}`, target: undefined, rel: undefined };
  };

  // Render Overlay Content
  const renderOverlayContent = () => {
    if (!activeOverlay || !config) return null;

    let title = "";
    let content = null;

    switch(activeOverlay) {
        case 'CONTACT':
            title = "Useful Contacts";
            content = (
                <div className="space-y-6">
                    {config.contactGroups?.map(group => (
                        <div key={group.id} className="space-y-2">
                             <h4 className="text-sm font-bold text-blue-800 uppercase tracking-wide border-b border-blue-100 pb-1 mb-2">
                                {group.title}
                             </h4>
                             <div className="grid gap-2">
                                {group.items.map(item => {
                                    const linkProps = getContactLink(item.details);
                                    return (
                                        <a 
                                            key={item.id}
                                            {...linkProps}
                                            className="block bg-gray-50 p-3 rounded border hover:bg-blue-50 hover:border-blue-200 transition-colors cursor-pointer group"
                                        >
                                            <div className="font-semibold text-gray-800 group-hover:text-blue-900">{item.name}</div>
                                            <div className="text-gray-600 text-sm truncate">{item.details}</div>
                                        </a>
                                    );
                                })}
                             </div>
                        </div>
                    ))}
                </div>
            );
            break;
        case 'DEVELOPERS':
            title = "Property Developers";
            content = (
                <div className="space-y-4">
                    {config.developers.map(d => (
                        <a 
                            key={d.id} 
                            href={d.url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-gray-50 p-3 rounded border hover:bg-purple-50 hover:border-purple-200 transition-colors cursor-pointer group"
                        >
                            <div className="font-bold text-lg text-gray-800 group-hover:text-purple-900">{d.name}</div>
                            <div className="text-gray-600 text-sm mb-1">{d.description}</div>
                            {d.url && <div className="text-xs text-blue-500 hover:underline break-words">{d.url}</div>}
                        </a>
                    ))}
                </div>
            );
            break;
        case 'BOOKING':
            title = "Booking Systems";
            content = (
                <div className="grid grid-cols-1 gap-3">
                    {config.bookings.map(b => (
                        <a key={b.id} href={b.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-100 transition-colors">
                            <span className="font-semibold text-indigo-900">{b.systemName}</span>
                            <span className="text-indigo-400">→</span>
                        </a>
                    ))}
                </div>
            );
            break;
        case 'PROFILE':
            title = "User Profile";
            content = currentUser ? (
                <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded text-sm space-y-2">
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500">Name</span>
                            <span className="font-medium">{currentUser.fullName}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500">Company</span>
                            <span className="font-medium">{currentUser.companyName || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500">Contact</span>
                            <span className="font-medium">{currentUser.contactNumber || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between pt-1">
                            <span className="text-gray-500">Unique ID</span>
                            <span className="font-mono font-bold bg-yellow-100 px-2 py-0.5 rounded text-yellow-800">{currentUser.uniqueId}</span>
                        </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                        <h4 className="font-semibold text-sm mb-2">Change Password</h4>
                        <div className="flex gap-2">
                            <input 
                                type="password" 
                                placeholder="New Password" 
                                className="flex-1 border rounded px-2 py-1 text-sm bg-gray-100"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                            />
                            <button 
                                onClick={handleChangePassword}
                                className="bg-gray-800 text-white px-3 py-1 rounded text-sm hover:bg-black"
                            >
                                Update
                            </button>
                        </div>
                        {passwordMsg && <p className="text-green-600 text-xs mt-1">{passwordMsg}</p>}
                    </div>
                </div>
            ) : null;
            break;
    }

    return (
        <div 
            className="absolute top-28 right-60 w-80 bg-white/95 backdrop-blur shadow-2xl rounded-xl overflow-hidden animate-fade-in z-20 border border-white/50"
            style={{
                maxHeight: 'calc(100vh - 120px)'
            }}
        >
            <div className="bg-gray-100 px-4 py-3 flex justify-between items-center border-b">
                <h3 className="font-bold text-gray-800">{title}</h3>
                <button onClick={() => setActiveOverlay(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-4 overflow-y-auto custom-scrollbar" style={{maxHeight: '60vh'}}>
                {content}
            </div>
        </div>
    );
  };

  return (
    <div className="relative w-full h-screen font-sans text-gray-900">
      
      {/* 360 Viewer Background */}
      <div className="absolute inset-0 z-0">
        <PanoramaViewer url={config?.panoramaUrl} />
      </div>

      {/* Navbar / Top Controls */}
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-start p-6 pointer-events-none">
        <div className="pointer-events-auto">
            <div className="bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-lg">
                <h1 className="text-xl font-bold tracking-wider">VIRTUOSO <span className="text-blue-400">360</span></h1>
            </div>
        </div>
        
        <div className="pointer-events-auto flex flex-col items-end gap-2">
            {currentUser ? (
               <div className="flex flex-col items-end gap-1">
                   {/* Greeting */}
                   <div className="bg-white/90 backdrop-blur px-4 py-1 rounded-lg shadow-lg">
                       <span className="text-sm font-semibold">{currentUser.fullName || currentUser.username}</span>
                   </div>
                   
                   {/* Hamburger Menu & Dropdown */}
                   {currentUser.isSetupComplete && (
                       <div className="relative">
                           <button 
                                onClick={handleMenuToggle}
                                className={`p-2 rounded-lg shadow-lg transition-colors ml-auto flex ${isMenuOpen ? 'bg-blue-600 text-white' : 'bg-white/90 text-gray-800 hover:bg-white'}`}
                           >
                                <IconMenu />
                           </button>

                           {/* Dropdown Menu */}
                           {isMenuOpen && (
                               <div className="absolute right-0 top-full mt-2 bg-white/90 backdrop-blur-md rounded-xl shadow-xl p-2 flex flex-col gap-1 w-48 animate-fade-in border border-white/40">
                                    {currentUser.role === UserRole.ADMIN && (
                                        <button 
                                            onClick={() => setIsDashboardOpen(true)}
                                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors text-left"
                                        >
                                            <IconDashboard />
                                            <span>Dashboard</span>
                                        </button>
                                    )}
                                    
                                    <button 
                                        onClick={() => toggleOverlay('CONTACT')}
                                        className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left ${activeOverlay === 'CONTACT' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'}`}
                                    >
                                        <IconContact />
                                        <span>Contacts</span>
                                    </button>

                                    <button 
                                        onClick={() => toggleOverlay('DEVELOPERS')}
                                        className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left ${activeOverlay === 'DEVELOPERS' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'}`}
                                    >
                                        <IconBuilding />
                                        <span>Developers</span>
                                    </button>

                                    <button 
                                        onClick={() => toggleOverlay('BOOKING')}
                                        className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left ${activeOverlay === 'BOOKING' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'}`}
                                    >
                                        <IconBook />
                                        <span>Booking</span>
                                    </button>

                                    <div className="h-px bg-gray-200 my-1"></div>

                                    <button 
                                        onClick={() => toggleOverlay('PROFILE')}
                                        className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left ${activeOverlay === 'PROFILE' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'}`}
                                    >
                                        <IconUser />
                                        <span>Profile</span>
                                    </button>

                                    <button 
                                        onClick={() => { logout(); setCurrentUser(null); setActiveOverlay(null); setIsMenuOpen(false); }}
                                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left mt-1"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                        <span>Sign Out</span>
                                    </button>
                                </div>
                           )}
                       </div>
                   )}
               </div> 
            ) : (
                <button 
                    onClick={() => { setIsAuthOpen(true); setAuthMode('LOGIN'); setErrorMessage(''); }}
                    className="bg-white/90 hover:bg-white text-blue-600 hover:text-blue-700 p-3 rounded-full shadow-lg transition-all transform hover:scale-105 backdrop-blur-md"
                    title="Login / Signup"
                >
                    <IconLogin />
                </button>
            )}
        </div>
      </div>

      {/* Render Active Overlay Panel - Positioned relative to hamburger menu */}
      {renderOverlayContent()}

      {/* Dashboard Modal */}
      {isDashboardOpen && <Dashboard onClose={() => setIsDashboardOpen(false)} onConfigUpdate={handleConfigUpdate} />}

      {/* Auth / Setup Modal */}
      {isAuthOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transition-transform ${shake ? 'animate-shake' : ''}`}>
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white text-center">
                    <h2 className="text-2xl font-bold">
                        {authMode === 'LOGIN' && 'Welcome Back'}
                        {authMode === 'SIGNUP' && 'Create Account'}
                        {authMode === 'SETUP' && 'Complete Profile'}
                    </h2>
                    <p className="text-blue-100 text-sm mt-1">
                        {authMode === 'LOGIN' && 'Sign in to access premium features'}
                        {authMode === 'SIGNUP' && 'Join for exclusive 360 tours'}
                        {authMode === 'SETUP' && 'One last step to get started'}
                    </p>
                </div>

                {/* Verification Sent State */}
                {authMode === 'SIGNUP' && verificationSent ? (
                     <div className="p-8 text-center">
                        <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Check your email</h3>
                        <p className="text-gray-600 mb-6">We've sent a verification link to your email.</p>
                        <button 
                            onClick={handleVerify}
                            className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition"
                        >
                            Simulate Click Verify Link
                        </button>
                     </div>
                ) : (
                    <div className="p-8">
                        {authMode === 'SETUP' ? (
                            <form onSubmit={handleSetup} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input required type="text" className="w-full bg-gray-100 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" value={setupData.name} onChange={e => setSetupData({...setupData, name: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                                    <input required type="tel" className="w-full bg-gray-100 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" value={setupData.phone} onChange={e => setSetupData({...setupData, phone: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                    <input required type="text" className="w-full bg-gray-100 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" value={setupData.company} onChange={e => setSetupData({...setupData, company: e.target.value})} />
                                </div>
                                <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition mt-4">
                                    Complete Setup
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={authMode === 'LOGIN' ? handleLogin : handleSignup} className="space-y-4">
                                {errorMessage && (
                                    <div className="bg-red-50 text-red-600 text-xs px-4 py-2 rounded-lg border border-red-200 flex items-start gap-2 animate-fade-in break-words">
                                        <div className="mt-0.5"><IconAlert /></div>
                                        <span>{errorMessage}</span>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {authMode === 'SIGNUP' ? 'Email Address' : 'Username / Email'}
                                    </label>
                                    <input 
                                        required 
                                        type={authMode === 'SIGNUP' ? 'email' : 'text'}
                                        className="w-full bg-gray-100 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                                        value={username} 
                                        onChange={e => setUsername(e.target.value)} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input 
                                        required 
                                        type="password" 
                                        className="w-full bg-gray-100 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                                        value={password} 
                                        onChange={e => setPassword(e.target.value)} 
                                    />
                                </div>
                                {authMode === 'SIGNUP' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                        <input 
                                            required 
                                            type="password" 
                                            className="w-full bg-gray-100 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                                            value={confirmPassword} 
                                            onChange={e => setConfirmPassword(e.target.value)} 
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Min 8 chars, 1 upper, 1 number, 1 symbol</p>
                                    </div>
                                )}
                                <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition mt-2">
                                    {authMode === 'LOGIN' ? 'Sign In' : 'Sign Up'}
                                </button>
                            </form>
                        )}

                        {authMode !== 'SETUP' && (
                            <div className="mt-6 text-center text-sm">
                                {authMode === 'LOGIN' ? (
                                    <p>Don't have an account? <button onClick={() => { setAuthMode('SIGNUP'); setErrorMessage(''); }} className="text-blue-600 font-bold hover:underline">Sign up</button></p>
                                ) : (
                                    <p>Already registered? <button onClick={() => { setAuthMode('LOGIN'); setErrorMessage(''); }} className="text-blue-600 font-bold hover:underline">Login</button></p>
                                )}
                            </div>
                        )}
                    </div>
                )}
                
                {/* Close Button if not forced setup */}
                {authMode !== 'SETUP' && (
                     <button onClick={() => { setIsAuthOpen(false); setErrorMessage(''); }} className="absolute top-4 right-4 text-white/80 hover:text-white">✕</button>
                )}
            </div>
        </div>
      )}
    </div>
  );
}

export default App;