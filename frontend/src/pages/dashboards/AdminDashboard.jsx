import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ShieldCheck, Activity, Users, Building, BookOpen, Factory, 
  MapPin, Server, LogOut, Menu, X, Globe, Target, Terminal, 
  CheckCircle, Key, ShieldAlert, Lock, Save, AlertTriangle, Trash2, Search
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, Legend
} from 'recharts';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userFilter, setUserFilter] = useState('ALL'); 
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // --- SECURITY & ACTION STATES ---
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null); 
  const [targetUser, setTargetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [securityCodes, setSecurityCodes] = useState({ gov_code: '', admin_code: '' });
  const [isUpdating, setIsUpdating] = useState(false);

  // --- CUSTOM POPUP NOTIFICATION STATE ---
  const [popupMessage, setPopupMessage] = useState({ show: false, text: '', type: 'success' });
  
  // --- TERMINAL SCROLL REF ---
  const logsEndRef = useRef(null);

  const showPopup = (text, type = 'success') => {
    setPopupMessage({ show: true, text, type });
    setTimeout(() => setPopupMessage({ show: false, text: '', type: 'success' }), 4000);
  };

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };

      if (activeTab === 'overview') {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/challenges/admin-stats/ecosystem_stats/`, { headers });
        setStats(response.data);
      } else if (activeTab === 'users') {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/challenges/admin-stats/all_users/`, { headers });
        setUsersList(response.data);
      } else if (activeTab === 'logs') {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/challenges/admin-stats/system_logs/`, { headers });
        setSystemLogs(response.data.logs || []);
      }
    } catch (error) {
      console.error(`Error fetching ${activeTab} data`, error);
      if (error.response?.status === 401 || error.response?.status === 403) handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  // Auto-scroll to the bottom of the terminal when logs load
  useEffect(() => {
    if (activeTab === 'logs' && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [systemLogs, activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  // --- Handle Password Reset ---
  const handlePasswordReset = async () => {
    if (!newPassword || newPassword.length < 6) {
      showPopup("Password must be at least 6 characters long.", 'error');
      return;
    }
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/challenges/admin-stats/update_user_password/`, 
        { user_id: targetUser.id, new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showPopup(`Password for ${targetUser.email} has been reset successfully.`, 'success');
      setPasswordModalOpen(false);
      setNewPassword('');
    } catch (err) {
      showPopup("Failed to reset password. Please try again.", 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // --- Handle User Deletion ---
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/challenges/admin-stats/delete_user/`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { user_id: userToDelete.id }
      });
      showPopup(`User ${userToDelete.email} has been permanently deleted.`, 'success');
      setUsersList(usersList.filter(u => u.id !== userToDelete.id));
      setUserToDelete(null);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || "Failed to delete user.";
      showPopup(errMsg, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // --- Handle Security Codes ---
  const openSecurityModal = async () => {
    setSecurityModalOpen(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/challenges/admin-stats/security_codes/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSecurityCodes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const saveSecurityCodes = async () => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/challenges/admin-stats/security_codes/`, 
        securityCodes,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showPopup("Master Security Codes updated successfully!", 'success');
      setSecurityModalOpen(false);
    } catch (err) {
      showPopup("Failed to update security codes.", 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const NavLinks = () => (
    <>
      <button onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg shadow-sm transition-colors ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
        <Globe className="w-5 h-5" /> Ecosystem Overview
      </button>
      <button onClick={() => { setActiveTab('users'); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg shadow-sm transition-colors ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
        <Users className="w-5 h-5" /> User Management
      </button>
      <button onClick={() => { setActiveTab('logs'); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg shadow-sm transition-colors ${activeTab === 'logs' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
        <Server className="w-5 h-5" /> Server Logs
      </button>
    </>
  );

  const getRoleBadge = (role) => {
    switch (role) {
      case 'CITIZEN': return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-[10px] font-bold uppercase tracking-wider">Citizen</span>;
      case 'GOVERNMENT_OFFICER': return <span className="px-2.5 py-1 bg-teal-100 text-teal-800 rounded-full text-[10px] font-bold uppercase tracking-wider">Govt Official</span>;
      case 'UNIVERSITY': return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold uppercase tracking-wider">University</span>;
      case 'INDUSTRY': return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold uppercase tracking-wider">Industry CSR</span>;
      case 'ADMIN': 
      case 'SYSTEM_ADMIN': return <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse">Root Admin</span>;
      default: return <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-full text-[10px] font-bold uppercase tracking-wider">{role}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">

      {/* CUSTOM POPUP NOTIFICATION - Highest z-index */}
      {popupMessage.show && (
        <div className="fixed top-6 right-6 z-[99999] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${
            popupMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {popupMessage.type === 'success' ? <CheckCircle className="w-6 h-6 text-emerald-600" /> : <AlertTriangle className="w-6 h-6 text-red-600" />}
            <span className="font-semibold text-sm">{popupMessage.text}</span>
            <button onClick={() => setPopupMessage({show: false, text: '', type: 'success'})} className="ml-4 opacity-50 hover:opacity-100"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* SIDEBAR DESKTOP */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col h-screen sticky top-0 shrink-0 border-r border-slate-800 shadow-xl z-20">
        <div className="p-6 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-8 h-8 text-blue-500" />
            <h2 className="text-2xl font-bold tracking-tight">SANKALP</h2>
          </div>
          <p className="text-blue-400 text-[10px] font-mono uppercase tracking-widest mt-1">System Master Control</p>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-6">
          <NavLinks />
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm">
            <LogOut className="w-5 h-5" /> Secure Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* RESPONSIVE HEADER */}
        <header className="min-h-[64px] py-3 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-slate-500 hover:text-slate-800 shrink-0">
              <Menu className="w-6 h-6" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-bold text-slate-900 leading-tight truncate sm:whitespace-normal">
                {activeTab === 'overview' ? 'Global Network Telemetry' : activeTab === 'users' ? 'User Directory & IAM' : 'Live Ecosystem Audits'}
              </h1>
              <p className="text-xs text-slate-500 font-mono">
                {activeTab === 'overview' ? 'Live Monitoring Mode' : activeTab === 'users' ? 'Identity & Access Management' : 'Global Logging System'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3 py-1 bg-red-100 text-red-700 border border-red-200 rounded-full text-xs font-bold uppercase tracking-wider hidden sm:flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Root Access
            </div>
            <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold border border-slate-700 shrink-0">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        </header>

        {/* MOBILE SIDEBAR OVERLAY */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-slate-900/60 z-[9999] md:hidden" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-64 bg-slate-900 h-full flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950 shrink-0">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-blue-500" />
                  <h2 className="text-xl font-bold text-white tracking-tight">SANKALP</h2>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400"><X className="w-5 h-5"/></button>
              </div>
              <nav className="flex-1 px-4 space-y-2 mt-6 overflow-y-auto"><NavLinks /></nav>
              <div className="p-4 border-t border-slate-800 shrink-0">
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm">
                  <LogOut className="w-5 h-5" /> Secure Logout
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 md:p-8 flex-1 overflow-auto bg-slate-50/50 relative">
          
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <Server className="w-8 h-8 text-blue-500 animate-pulse" />
                <div className="text-slate-500 font-mono text-sm animate-pulse">Establishing secure connection to telemetry matrix...</div>
              </div>
            </div>
          ) : activeTab === 'overview' && stats ? (
            
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 md:mb-4">Ecosystem Participants</h2>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
                  <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm col-span-2 lg:col-span-1">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 mb-2 md:mb-3"><Users className="w-4 h-4 md:w-5 md:h-5" /></div>
                    <div className="text-2xl md:text-3xl font-black text-slate-800">{stats.user_stats?.total_users || 0}</div>
                    <div className="text-[10px] md:text-xs font-bold text-slate-500 uppercase mt-1">Total Users</div>
                  </div>
                  <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm border-b-4 border-b-blue-500">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-2 md:mb-3"><MapPin className="w-4 h-4 md:w-5 md:h-5" /></div>
                    <div className="text-2xl md:text-3xl font-black text-slate-800">{stats.user_stats?.citizens || 0}</div>
                    <div className="text-[10px] md:text-xs font-bold text-slate-500 uppercase mt-1">Citizens</div>
                  </div>
                  <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm border-b-4 border-b-teal-500">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 mb-2 md:mb-3"><Building className="w-4 h-4 md:w-5 md:h-5" /></div>
                    <div className="text-2xl md:text-3xl font-black text-slate-800">{stats.user_stats?.government || 0}</div>
                    <div className="text-[10px] md:text-xs font-bold text-slate-500 uppercase mt-1">Govt. Officials</div>
                  </div>
                  <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm border-b-4 border-b-amber-500">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mb-2 md:mb-3"><BookOpen className="w-4 h-4 md:w-5 md:h-5" /></div>
                    <div className="text-2xl md:text-3xl font-black text-slate-800">{stats.user_stats?.universities || 0}</div>
                    <div className="text-[10px] md:text-xs font-bold text-slate-500 uppercase mt-1">Universities</div>
                  </div>
                  <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm border-b-4 border-b-emerald-500">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-2 md:mb-3"><Factory className="w-4 h-4 md:w-5 md:h-5" /></div>
                    <div className="text-2xl md:text-3xl font-black text-slate-800">{stats.user_stats?.industries || 0}</div>
                    <div className="text-[10px] md:text-xs font-bold text-slate-500 uppercase mt-1">Industry CSR</div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 md:mb-4">Innovation Pipeline Health</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  <div className="col-span-1 lg:col-span-2 bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm md:text-base font-bold text-slate-800 mb-4 md:mb-6 flex items-center gap-2">
                      <Activity className="w-4 h-4 md:w-5 md:h-5 text-indigo-500" /> Active Resolution Funnel
                    </h3>
                    <div className="overflow-x-auto w-full pb-2">
                      <div className="min-w-[450px] h-[250px] md:h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { name: 'Open Pool', count: stats.challenge_stats?.open_pool || 0, fill: '#64748b' },
                              { name: 'Univ Pitching', count: stats.challenge_stats?.university_requested || 0, fill: '#8b5cf6' },
                              { name: 'Awaiting CSR', count: stats.challenge_stats?.awaiting_csr || 0, fill: '#3b82f6' },
                              { name: 'In Progress', count: stats.challenge_stats?.in_progress || 0, fill: '#f59e0b' },
                              { name: 'Resolved', count: stats.challenge_stats?.resolved || 0, fill: '#10b981' },
                            ]}
                            margin={{ top: 10, right: 20, left: -20, bottom: 20 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} interval={0} axisLine={false} tickLine={false} dy={10} />
                            <YAxis allowDecimals={false} tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                            <RechartsTooltip cursor={{fill: 'rgba(0,0,0,0.02)'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={60}>
                              {
                                [
                                  { fill: '#94a3b8' }, { fill: '#c084fc' }, { fill: '#60a5fa' }, { fill: '#fbbf24' }, { fill: '#34d399' }
                                ].map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))
                              }
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-800 text-white flex flex-col relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 text-white/5">
                      <Globe className="w-64 h-64" />
                    </div>
                    
                    <h3 className="text-sm md:text-base font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                      <Target className="w-4 h-4 md:w-5 md:h-5 text-blue-400" /> Platform Velocity
                    </h3>
                    
                    <div className="space-y-6 relative z-10 flex-1 flex flex-col justify-center">
                      <div>
                        <div className="text-xs md:text-sm font-medium text-slate-400 uppercase tracking-wide mb-1">Total Challenges Logged</div>
                        <div className="text-4xl md:text-5xl font-black text-white">{stats.challenge_stats?.total_reports || 0}</div>
                      </div>
                      
                      <div className="pt-6 border-t border-slate-800">
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-xs md:text-sm font-medium text-slate-400">Resolution Rate</span>
                          <span className="text-lg md:text-xl font-bold text-emerald-400">
                            {stats.challenge_stats?.total_reports > 0 
                              ? Math.round((stats.challenge_stats.resolved / stats.challenge_stats.total_reports) * 100) 
                              : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                            style={{ width: `${stats.challenge_stats?.total_reports > 0 ? (stats.challenge_stats.resolved / stats.challenge_stats.total_reports) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          ) : activeTab === 'users' ? (

            <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
              <div className="flex flex-col mb-6 gap-4 border-b border-slate-200 pb-4 shrink-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Identity & Access Management</h2>
                    <p className="text-slate-500 mt-1 text-sm">Directory of all registered ecosystem participants.</p>
                  </div>
                  
                  <button 
                    onClick={openSecurityModal}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 shadow-sm transition-all shrink-0"
                  >
                    <ShieldAlert className="w-4 h-4" /> Global Security Config
                  </button>
                </div>

                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 w-full pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase mr-2">Filter Roles:</span>
                    {[
                      { id: 'ALL', label: 'All Users' },
                      { id: 'CITIZEN', label: 'Citizens' },
                      { id: 'GOVERNMENT_OFFICER', label: 'Government' },
                      { id: 'UNIVERSITY', label: 'Universities' },
                      { id: 'INDUSTRY', label: 'Industries' },
                      { id: 'ADMIN', label: 'Admins' }
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => setUserFilter(f.id)}
                        className={`px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all border ${
                          userFilter === f.id
                            ? 'bg-slate-800 text-white border-slate-800 shadow-md'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* Search Bar */}
                  <div className="relative w-full xl:w-72 shrink-0">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="Search by name, email, or org..." 
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead className="sticky top-0 bg-slate-50 shadow-[0_1px_0_rgba(226,232,240,1)] z-10">
                      <tr className="text-xs uppercase tracking-wider text-slate-500">
                        <th className="px-6 py-4 font-semibold">User / Organization</th>
                        <th className="px-6 py-4 font-semibold">Platform Role</th>
                        <th className="px-6 py-4 font-semibold">Contact Email</th>
                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {usersList.filter(usr => {
                        const matchesRole = userFilter === 'ALL' || (userFilter === 'ADMIN' ? (usr.role === 'ADMIN' || usr.role === 'SYSTEM_ADMIN') : usr.role === userFilter);
                        const searchStr = `${usr.first_name || ''} ${usr.last_name || ''} ${usr.email || ''} ${usr.organization_name || ''}`.toLowerCase();
                        const matchesSearch = searchStr.includes(userSearchQuery.toLowerCase());
                        return matchesRole && matchesSearch;
                      }).length === 0 ? (
                        <tr><td colSpan="4" className="p-8 text-center text-slate-500">No users found matching your filters.</td></tr>
                      ) : (
                        usersList
                          .filter(usr => {
                            const matchesRole = userFilter === 'ALL' || (userFilter === 'ADMIN' ? (usr.role === 'ADMIN' || usr.role === 'SYSTEM_ADMIN') : usr.role === userFilter);
                            const searchStr = `${usr.first_name || ''} ${usr.last_name || ''} ${usr.email || ''} ${usr.organization_name || ''}`.toLowerCase();
                            const matchesSearch = searchStr.includes(userSearchQuery.toLowerCase());
                            return matchesRole && matchesSearch;
                          })
                          .map((usr) => (
                          <tr key={usr.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-900 flex items-center gap-2">
                                <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold uppercase shrink-0">
                                  {(usr.organization_name ? usr.organization_name.charAt(0) : usr.first_name?.charAt(0)) || 'U'}
                                </div>
                                <div>
                                  <div className="truncate max-w-[200px]" title={usr.organization_name || `${usr.first_name} ${usr.last_name}`}>
                                    {usr.organization_name || `${usr.first_name} ${usr.last_name}`.trim() || 'Unnamed User'}
                                  </div>
                                  <div className="text-xs text-slate-500 font-mono">ID: {usr.id.toString().padStart(4, '0')}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {getRoleBadge(usr.role)}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                              {usr.email}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => { setTargetUser(usr); setPasswordModalOpen(true); }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded transition-colors"
                                >
                                  <Key className="w-3.5 h-3.5" /> Reset Pass
                                </button>
                                <button 
                                  onClick={() => setUserToDelete(usr)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          ) : activeTab === 'logs' ? (

            <div className="max-w-7xl mx-auto h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-slate-200 pb-4 shrink-0">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Terminal className="w-6 h-6 text-slate-600" /> Global Logging System</h2>
                  <p className="text-slate-500 mt-1 text-sm">Immutable audit trail of all actions across the entire network.</p>
                </div>
              </div>

              <div className="bg-[#0f172a] rounded-xl shadow-2xl border border-slate-800 flex-1 overflow-hidden flex flex-col min-h-0 relative">
                {/* FIXED TERMINAL HEADER */}
                <div className="h-12 bg-slate-900 border-b border-slate-800 flex items-center px-4 shrink-0 relative z-10">
                  <div className="flex gap-2 absolute left-4">
                    <div className="w-3 h-3 rounded-full bg-red-500 border border-red-600/50"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500 border border-amber-600/50"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500 border border-green-600/50"></div>
                  </div>
                  <div className="flex-1 flex justify-center text-xs text-slate-400 font-mono font-medium tracking-wide truncate px-16">
                    root@sankalp-core:~# tail -f /var/log/ecosystem.log
                  </div>
                </div>
                
                {/* TERMINAL BODY with natural scrolling, auto-scroll ref, and custom scrollbar */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 font-mono text-sm leading-loose scroll-smooth [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:bg-[#0f172a] [&::-webkit-scrollbar-track]:rounded-b-xl [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-[#0f172a] hover:[&::-webkit-scrollbar-thumb]:bg-slate-600">
                  {systemLogs.length === 0 ? (
                    <div className="text-slate-500 italic">No logs found in the buffer...</div>
                  ) : (
                    systemLogs.map((log, index) => {
                      let colorClass = "text-emerald-400";
                      let prefixClass = "text-slate-500";

                      if (log.includes("ERROR") || log.includes("REJECTED") || log.includes("WITHDRAWN")) {
                        colorClass = "text-red-400";
                      } else if (log.includes("APPROVED") || log.includes("DEPLOYED") || log.includes("RESOLVED")) {
                        colorClass = "text-cyan-400 font-semibold";
                        prefixClass = "text-cyan-700";
                      } else if (log.includes("SUBMITTED") || log.includes("UPDATED")) {
                        colorClass = "text-amber-400";
                      } else if (log.includes("Issue logged by citizen")) {
                        colorClass = "text-indigo-300";
                      }

                      return (
                        <div key={index} className={`mb-2 break-words hover:bg-slate-800/30 px-2 py-1 rounded transition-colors ${colorClass}`}>
                          <span className={`select-none mr-3 ${prefixClass}`}>{'>'}</span>
                          <span className="opacity-90">{log}</span>
                        </div>
                      );
                    })
                  )}
                  {/* Invisible div to act as the scroll target */}
                  <div ref={logsEndRef} />
                </div>
              </div>
            </div>

          ) : (
             <div className="flex h-full items-center justify-center">
              <div className="text-red-500 font-mono text-sm bg-red-50 p-4 rounded-xl border border-red-200 shadow-sm flex items-center gap-2">
                <ShieldCheck className="w-5 h-5"/> Error loading dashboard component.
              </div>
            </div>
          )}

        </div>
      </main>

      {/* NEW MODAL: DELETE USER CONFIRMATION */}
      {userToDelete && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete User?</h3>
              <p className="text-slate-500 mb-2 text-sm">
                Are you sure you want to permanently delete <span className="font-bold text-slate-700">{userToDelete.email}</span>?
              </p>
              <p className="text-xs text-red-600 font-bold mb-6 bg-red-50 p-2 rounded border border-red-200">
                Warning: This will also permanently delete any challenges reported by this user!
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteUser}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 shadow-sm transition-colors flex justify-center items-center gap-2"
                >
                  {isUpdating ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RESET USER PASSWORD */}
      {passwordModalOpen && targetUser && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <h3 className="text-lg font-bold flex items-center gap-2"><Key className="w-5 h-5 text-blue-400" /> Reset Password</h3>
              <button onClick={() => setPasswordModalOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-500 mb-4">
                You are forcing a password reset for <span className="font-bold text-slate-900">{targetUser.email}</span>.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters" 
                      className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono" 
                    />
                  </div>
                </div>
                <button 
                  onClick={handlePasswordReset}
                  disabled={isUpdating}
                  className="w-full py-2.5 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> {isUpdating ? 'Saving...' : 'Apply New Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SYSTEM SECURITY CODES */}
      {securityModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <h3 className="text-lg font-bold flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-red-400" /> Master Security Codes</h3>
              <button onClick={() => setSecurityModalOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-500 mb-6">
                Update the global secret codes required for high-level officials to register on the platform. Keep these highly secure.
              </p>
              <div className="space-y-5">
                
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl">
                  <label className="block text-sm font-bold text-teal-900 mb-1">Government Registration Code</label>
                  <p className="text-xs text-teal-700 mb-2">Required for Govt. Officials to sign up.</p>
                  <div className="relative">
                    <Key className="w-4 h-4 text-teal-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      value={securityCodes.gov_code}
                      onChange={(e) => setSecurityCodes({...securityCodes, gov_code: e.target.value})}
                      className="w-full pl-9 pr-4 py-2 rounded-lg border border-teal-300 focus:ring-2 focus:ring-teal-500 outline-none text-sm font-mono text-teal-900" 
                    />
                  </div>
                </div>

                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <label className="block text-sm font-bold text-red-900 mb-1">System Admin Registration Code</label>
                  <p className="text-xs text-red-700 mb-2">Required for Root System Admins to sign up.</p>
                  <div className="relative">
                    <Key className="w-4 h-4 text-red-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      value={securityCodes.admin_code}
                      onChange={(e) => setSecurityCodes({...securityCodes, admin_code: e.target.value})}
                      className="w-full pl-9 pr-4 py-2 rounded-lg border border-red-300 focus:ring-2 focus:ring-red-500 outline-none text-sm font-mono text-red-900" 
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button onClick={() => setSecurityModalOpen(false)} className="px-4 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                  <button 
                    onClick={saveSecurityCodes}
                    disabled={isUpdating}
                    className="px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" /> {isUpdating ? 'Saving...' : 'Update Master Codes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;