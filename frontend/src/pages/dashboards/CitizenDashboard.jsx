import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  LogOut, PlusCircle, MapPin, AlertTriangle, 
  Clock, CheckCircle, Activity, Bell, X, Camera, UploadCloud,
  Trash2, Edit, User, Save, Loader2, Search, BookOpen, Factory, Menu
} from 'lucide-react';

const CitizenDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview'); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile Menu State
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); 
  
  const [formData, setFormData] = useState({
    title: '',
    category: 'disaster',
    location: '',
    description: ''
  });
  const [evidenceFile, setEvidenceFile] = useState(null);
  
  const [isLocating, setIsLocating] = useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!isModalOpen) return;

    let mapInstance = null;

    const initMap = () => {
      if (!window.L || !document.getElementById('citizen-map')) return;
      
      if (window.L.DomUtil.get('citizen-map') !== null) {
          window.L.DomUtil.get('citizen-map')._leaflet_id = null;
      }

      mapInstance = window.L.map('citizen-map').setView([23.3441, 85.3096], 7);
      mapRef.current = mapInstance;

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap'
      }).addTo(mapInstance);

      const customIcon = window.L.divIcon({
        className: 'bg-transparent',
        html: `<div class="text-red-600 drop-shadow-lg -mt-8 -ml-4 cursor-pointer hover:scale-110 transition-transform"><svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36]
      });

      // Handle Map Click
      mapInstance.on('click', (e) => {
          const { lat, lng } = e.latlng;
          
          if (markerRef.current) {
              markerRef.current.setLatLng([lat, lng]);
          } else {
              markerRef.current = window.L.marker([lat, lng], { icon: customIcon, draggable: true }).addTo(mapInstance);
              markerRef.current.on('dragend', (event) => {
                  const position = event.target.getLatLng();
                  setFormData(prev => ({ ...prev, location: `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}` }));
              });
          }
          
          setFormData(prev => ({ ...prev, location: `${lat.toFixed(6)}, ${lng.toFixed(6)}` }));
      });

      // Existing report coordinates
      if (formData.location && formData.location.includes(',')) {
          const [lat, lng] = formData.location.split(',').map(Number);
          if (!isNaN(lat) && !isNaN(lng)) {
             markerRef.current = window.L.marker([lat, lng], { icon: customIcon, draggable: true }).addTo(mapInstance);
             markerRef.current.on('dragend', (event) => {
                 const position = event.target.getLatLng();
                 setFormData(prev => ({ ...prev, location: `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}` }));
             });
             mapInstance.setView([lat, lng], 14);
          }
      }
    };

    if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
    }

    if (!document.getElementById('leaflet-js')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => setTimeout(initMap, 100);
        document.head.appendChild(script);
    } else {
        setTimeout(initMap, 100);
    }

    return () => {
        if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
            markerRef.current = null;
        }
    };
  }, [isModalOpen]);

  const [selectedReport, setSelectedReport] = useState(null);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  const modalTopRef = useRef(null);

  useEffect(() => {
    if (errorMessage && modalTopRef.current) {
      modalTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [errorMessage]);

  const [myReports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [profileData, setProfileData] = useState({
    first_name: '', last_name: '', email: '', phone: '', district: '', role: ''
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });

  const getMediaUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `http://127.0.0.1:8000${path}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const headers = { Authorization: `Bearer ${token}` };

        const reportsRes = await axios.get('http://127.0.0.1:8000/api/challenges/reports/', { headers });
        setReports(reportsRes.data);

        const profileRes = await axios.get('http://127.0.0.1:8000/api/auth/profile/', { headers });
        setProfileData(profileRes.data);

      } catch (error) {
        console.error("Error fetching data", error);
        if (error.response?.status === 401) handleLogout();
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileMessage({ text: 'Saving...', type: 'info' });
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.patch('http://127.0.0.1:8000/api/auth/profile/', profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfileData(response.data);
      setIsEditingProfile(false);
      setProfileMessage({ text: 'Profile updated successfully!', type: 'success' });
      setTimeout(() => setProfileMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      console.error(error);
      setProfileMessage({ text: 'Failed to update profile.', type: 'error' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  const openEditModal = (report) => {
    setErrorMessage('');
    setFormData({
      title: report.title,
      category: report.category,
      location: report.location,
      description: report.description
    });
    setEditingId(report.id);
    setEvidenceFile(null);
    setSelectedReport(null); 
    setIsModalOpen(true);
  };

  const handleGetLocation = (e) => {
    e.preventDefault();
    if (!navigator.geolocation) {
      setErrorMessage("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData({ ...formData, location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` });
        setIsLocating(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        setErrorMessage("Unable to retrieve your location. Please check browser permissions.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSearchAddress = async () => {
    if (!formData.location) return;
    setIsSearchingAddress(true);
    setErrorMessage('');
    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.location)}`);
      if (response.data && response.data.length > 0) {
        const { lat, lon, display_name } = response.data[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);
        
        setFormData(prev => ({ ...prev, location: display_name }));
        
        if (mapRef.current && window.L) {
          if (markerRef.current) {
            markerRef.current.setLatLng([newLat, newLng]);
          } else {
             const customIcon = window.L.divIcon({
               className: 'bg-transparent',
               html: `<div class="text-red-600 drop-shadow-lg -mt-8 -ml-4 cursor-pointer hover:scale-110 transition-transform"><svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg></div>`,
               iconSize: [36, 36],
               iconAnchor: [18, 36]
             });
             markerRef.current = window.L.marker([newLat, newLng], { icon: customIcon, draggable: true }).addTo(mapRef.current);
          }
          mapRef.current.setView([newLat, newLng], 15, { animate: true, duration: 1 });
        }
      } else {
        setErrorMessage("Address not found! Please select a location by clicking/dragging on the map or enter a proper name.");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setErrorMessage("Error searching for address. Please check your connection.");
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      const token = localStorage.getItem('access_token');
      const submitData = new FormData();
      
      submitData.append('title', formData.title);
      submitData.append('category', formData.category);
      submitData.append('location', formData.location);
      submitData.append('description', formData.description);
      
      if (evidenceFile) {
        submitData.append('evidence', evidenceFile);
      }
      
      let response;
      if (editingId) {
        response = await axios.patch(`http://127.0.0.1:8000/api/challenges/reports/${editingId}/`, submitData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        setReports(myReports.map(r => r.id === editingId ? response.data : r));
      } else {
        response = await axios.post('http://127.0.0.1:8000/api/challenges/reports/', submitData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        setReports([response.data, ...myReports]);
      }
      
      setIsModalOpen(false); 
      setEditingId(null);
      setFormData({ title: '', category: 'disaster', location: '', description: '' }); 
      setEvidenceFile(null);
    } catch (error) {
      console.error("Error saving challenge:", error);
      setErrorMessage("Failed to save challenge. Please check your connection.");
    }
  };

  const executeDelete = async () => {
    if (!reportToDelete) return;
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`http://127.0.0.1:8000/api/challenges/reports/${reportToDelete.id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(myReports.filter(r => r.id !== reportToDelete.id));
      setReportToDelete(null);
      setSelectedReport(null); 
    } catch (error) {
      console.error("Error deleting report:", error);
      setErrorMessage("Failed to delete the report.");
      setReportToDelete(null);
    }
  };

  // NavLinks Component for reuse in sidebar and mobile menu
  const NavLinks = () => (
    <>
      <button 
        onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'overview' ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800/50'}`}
      >
        <Activity className="w-5 h-5" /> My Dashboard
      </button>
      <button 
        onClick={() => { setActiveTab('profile'); setMobileMenuOpen(false); }}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'profile' ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800/50'}`}
      >
        <User className="w-5 h-5" /> My Profile
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      {/* Sidebar - Desktop */}
      <aside className="w-64 bg-blue-900 text-white hidden md:flex flex-col h-screen sticky top-0 shrink-0">
        <div className="p-6">
          <h2 className="text-2xl font-bold tracking-tight">JH-SANKALP</h2>
          <p className="text-blue-300 text-sm mt-1">Citizen Portal</p>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavLinks />
        </nav>
        <div className="p-4 border-t border-blue-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-blue-200 hover:text-white transition-colors">
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Responsive Header */}
        <header className="min-h-[64px] py-3 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 z-10">
          <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-slate-500 hover:text-slate-800 shrink-0">
              <Menu className="w-6 h-6" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-bold text-slate-800 leading-tight truncate sm:whitespace-normal">
                {activeTab === 'profile' ? 'Profile Settings' : `Welcome back, ${profileData.first_name || 'Citizen'}`}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button className="text-slate-400 hover:text-blue-600 transition-colors hidden sm:block">
              <Bell className="w-6 h-6" />
            </button>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold border border-blue-200 shrink-0 uppercase">
              {profileData.first_name ? profileData.first_name.charAt(0) : 'C'}
            </div>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-slate-900/60 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-64 bg-blue-900 h-full flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-blue-800 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">JH-SANKALP</h2>
                  <p className="text-blue-300 text-xs mt-0.5">Citizen Portal</p>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="text-blue-200 hover:text-white"><X className="w-5 h-5"/></button>
              </div>
              <nav className="flex-1 px-4 space-y-2 mt-6">
                <NavLinks />
              </nav>
              {/* FIX: Added the Logout button to the bottom of the mobile menu! */}
              <div className="p-4 border-t border-blue-800 shrink-0">
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-blue-200 hover:text-white transition-colors">
                  <LogOut className="w-5 h-5" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 md:p-8 flex-1 overflow-auto">
          {activeTab === 'overview' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 md:mb-8">
                <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-slate-500 text-xs md:text-sm font-medium mb-1 md:mb-2 uppercase tracking-wide">Total Reports</div>
                  <div className="text-2xl md:text-3xl font-bold text-slate-800">{myReports.length}</div>
                </div>
                <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-slate-500 text-xs md:text-sm font-medium mb-1 md:mb-2 uppercase tracking-wide">In Progress</div>
                  <div className="text-2xl md:text-3xl font-bold text-amber-500">
                    {myReports.filter(r => r.status === 'in_progress').length}
                  </div>
                </div>
                <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-slate-500 text-xs md:text-sm font-medium mb-1 md:mb-2 uppercase tracking-wide">Resolved</div>
                  <div className="text-2xl md:text-3xl font-bold text-teal-600">
                    {myReports.filter(r => r.status === 'resolved').length}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-6 gap-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900">Recent Challenges</h2>
                  <p className="text-slate-500 text-sm mt-1">Track the status of the issues you've reported.</p>
                </div>
                <button 
                  onClick={() => {
                    setErrorMessage('');
                    setFormData({ title: '', category: 'disaster', location: '', description: '' });
                    setEditingId(null);
                    setEvidenceFile(null);
                    setIsModalOpen(true);
                  }}
                  className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-lg text-sm md:text-base font-medium shadow-sm transition-all flex items-center justify-center gap-2 w-full sm:w-auto shrink-0"
                >
                  <PlusCircle className="w-5 h-5" /> Report New Issue
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {isLoading ? (
                  <div className="p-8 md:p-10 text-center text-slate-500 font-medium text-sm">Loading your reports...</div>
                ) : myReports.length === 0 ? (
                  <div className="p-8 md:p-10 text-center text-slate-500 font-medium text-sm">You haven't reported any issues yet. Click 'Report New Issue' to start.</div>
                ) : (
                  myReports.map((report) => (
                    <div key={report.id} className="p-4 md:p-6 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                      
                      {/* Left Side: Icon, Title, Location */}
                      <div className="flex gap-3 md:gap-4 items-start w-full md:w-auto">
                        <div className={`p-2.5 md:p-3 rounded-lg shrink-0 ${report.status === 'resolved' ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'}`}>
                          {report.status === 'resolved' ? <CheckCircle className="w-5 h-5 md:w-6 md:h-6" /> : <Clock className="w-5 h-5 md:w-6 md:h-6" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base md:text-lg font-bold text-slate-900 truncate sm:whitespace-normal">{report.title}</h3>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-slate-500 text-xs md:text-sm mt-1">
                            <span className="flex items-start sm:items-center gap-1"><MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 sm:mt-0" /> <span className="line-clamp-2 sm:line-clamp-1">{report.location}</span></span>
                            <span className="hidden sm:inline">•</span>
                            <span className="whitespace-nowrap">{report.date_formatted}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Priority Badge & Track Button */}
                      {/* FIX: Made this container flex-row on ALL screens, added top border on mobile for separation */}
                      <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider whitespace-nowrap ${
                          report.priority === 'Critical' ? 'bg-red-100 text-red-800 border border-red-200 animate-pulse' : 
                          report.priority === 'High' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 
                          'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}>
                          {report.priority} Priority
                        </span>
                        <button 
                          onClick={() => setSelectedReport(report)} 
                          className="text-blue-700 hover:text-blue-900 font-bold text-xs md:text-sm bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap border border-blue-200"
                        >
                          Track Progress
                        </button>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-blue-900 px-6 py-6 md:px-8 text-white flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold">Personal Information</h2>
                    <p className="text-blue-200 text-xs md:text-sm mt-1">Manage your account details and contact info.</p>
                  </div>
                  {!isEditingProfile && (
                    <button 
                      onClick={() => setIsEditingProfile(true)}
                      className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 border border-white/20 w-full sm:w-auto text-sm"
                    >
                      <Edit className="w-4 h-4" /> Edit Profile
                    </button>
                  )}
                </div>
                
                <div className="p-6 md:p-8">
                  {profileMessage.text && (
                    <div className={`mb-6 p-3 md:p-4 rounded-lg flex items-center gap-2 text-sm ${profileMessage.type === 'success' ? 'bg-teal-50 text-teal-700 border border-teal-200' : profileMessage.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                      <CheckCircle className="w-4 h-4 md:w-5 md:h-5 shrink-0" /> {profileMessage.text}
                    </div>
                  )}

                  <form onSubmit={handleProfileUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-1">First Name</label>
                      <input 
                        type="text" 
                        disabled={!isEditingProfile}
                        value={profileData.first_name}
                        onChange={(e) => setProfileData({...profileData, first_name: e.target.value})}
                        className="w-full px-3 md:px-4 py-2 md:py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-1">Last Name</label>
                      <input 
                        type="text" 
                        disabled={!isEditingProfile}
                        value={profileData.last_name}
                        onChange={(e) => setProfileData({...profileData, last_name: e.target.value})}
                        className="w-full px-3 md:px-4 py-2 md:py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-1">Email Address (Read Only)</label>
                      <input 
                        type="email" 
                        disabled
                        value={profileData.email}
                        className="w-full px-3 md:px-4 py-2 md:py-2.5 rounded-lg border border-slate-200 bg-slate-100 text-slate-500 outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-1">Phone Number</label>
                      <input 
                        type="text" 
                        disabled={!isEditingProfile}
                        value={profileData.phone || ''}
                        onChange={(e) => {
                          const onlyNums = e.target.value.replace(/\D/g, '');
                          if (onlyNums.length <= 10) {
                            setProfileData({...profileData, phone: onlyNums});
                          }
                        }}
                        maxLength={10}
                        className="w-full px-3 md:px-4 py-2 md:py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500 text-sm"
                        placeholder="e.g., 9876543210"
                      />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-1">District / Region</label>
                      <input 
                        type="text" 
                        disabled={!isEditingProfile}
                        value={profileData.district || ''}
                        onChange={(e) => setProfileData({...profileData, district: e.target.value})}
                        className="w-full px-3 md:px-4 py-2 md:py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500 text-sm"
                        placeholder="e.g., Ranchi"
                      />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-1">Account Role</label>
                      <div className="w-full px-3 md:px-4 py-2 md:py-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center text-sm">
                        <span className="px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                          {profileData.role}
                        </span>
                      </div>
                    </div>

                    {isEditingProfile && (
                      <div className="md:col-span-2 flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-100 mt-2 md:mt-4">
                        <button 
                          type="button" 
                          onClick={() => setIsEditingProfile(false)}
                          className="px-6 py-2.5 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors w-full sm:w-auto text-sm"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="px-6 py-2.5 rounded-lg font-medium text-white bg-blue-700 hover:bg-blue-800 shadow-sm transition-colors flex items-center justify-center gap-2 w-full sm:w-auto text-sm"
                        >
                          <Save className="w-4 h-4" /> Save Changes
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* REPORT SUBMISSION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-0 sm:p-4">
          <div className="bg-white sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto max-w-2xl overflow-hidden flex flex-col sm:max-h-[90vh]">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex justify-between items-center bg-blue-900 text-white shrink-0">
              <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                {editingId ? <Edit className="w-5 h-5"/> : <PlusCircle className="w-5 h-5"/>} 
                {editingId ? "Edit Issue" : "Report Issue"}
              </h3>
              <button 
                onClick={() => { setIsModalOpen(false); setEditingId(null); }} 
                className="text-blue-200 hover:text-white transition-colors bg-blue-800 hover:bg-blue-700 p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <div ref={modalTopRef}></div>
              
              {errorMessage && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5" />
                  <p className="font-medium">{errorMessage}</p>
                </div>
              )}

              <form id="challenge-form" onSubmit={handleReportSubmit} className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">Issue Title</label>
                  <input 
                    type="text" required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g., Major flooding on Highway 33"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:gap-5">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">Category</label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-sm"
                    >
                      <option value="disaster">Disaster & Flooding</option>
                      <option value="infrastructure">Infrastructure & Roads</option>
                      <option value="water">Water & Sanitation</option>
                      <option value="electricity">Power & Electricity</option>
                    </select>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 flex items-center gap-1.5 sm:gap-2">
                        <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" /> Location Details
                      </label>
                      <button 
                        type="button" 
                        onClick={handleGetLocation}
                        disabled={isLocating}
                        className="text-[10px] sm:text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md transition-colors flex items-center gap-1 sm:gap-1.5 border border-blue-200 whitespace-nowrap"
                      >
                        {isLocating ? <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" /> : <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                        {isLocating ? 'Detecting...' : 'Use My GPS'}
                      </button>
                    </div>
                    
                    <div className="mb-2 sm:mb-3 rounded-xl border border-slate-300 shadow-inner overflow-hidden relative group">
                      <div id="citizen-map" className="w-full h-40 sm:h-56 z-10"></div>
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-slate-900/10 group-hover:opacity-0 transition-opacity z-20">
                         <div className="bg-white/95 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg text-xs sm:text-sm font-bold text-slate-700 border border-slate-200 flex items-center gap-1.5 sm:gap-2">
                           <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 shrink-0" /> <span className="hidden sm:inline">Pan, zoom, click, or drag the pin!</span><span className="sm:hidden">Tap map to drop pin</span>
                         </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                          type="text" required
                          value={formData.location}
                          onChange={(e) => setFormData({...formData, location: e.target.value})}
                          placeholder="Type address..."
                          className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-xs sm:text-sm font-medium text-slate-700"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSearchAddress}
                        disabled={isSearchingAddress || !formData.location}
                        className="px-4 py-2 sm:py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto"
                      >
                        {isSearchingAddress ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                        Find
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">Detailed Description</label>
                  <textarea 
                    required rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe the severity..."
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none text-sm"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                    Evidence (Photo/Video) {editingId && <span className="text-slate-400 font-normal ml-1 sm:ml-2 text-[10px] sm:text-xs">- Optional</span>}
                  </label>
                  <label className="border-2 border-dashed border-slate-300 rounded-xl p-4 sm:p-8 text-center hover:bg-slate-50 hover:border-blue-400 transition-colors cursor-pointer group block">
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*,video/mp4"
                      onChange={(e) => setEvidenceFile(e.target.files[0])}
                    />
                    <div className="flex justify-center gap-3 sm:gap-4 mb-2 sm:mb-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-slate-700 truncate px-2">
                      {evidenceFile ? (
                        <span className="text-blue-600 font-bold">{evidenceFile.name}</span>
                      ) : (
                        'Tap to upload or drag & drop'
                      )}
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-500 mt-1">SVG, PNG, JPG or MP4 (max. 10MB)</p>
                  </label>
                </div>
              </form>
            </div>

            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 sm:gap-3 shrink-0">
              <button 
                type="button" 
                onClick={() => { setIsModalOpen(false); setEditingId(null); }}
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-medium text-slate-600 hover:bg-slate-200 transition-colors text-xs sm:text-sm"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="challenge-form"
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-medium text-white bg-blue-700 hover:bg-blue-800 shadow-sm transition-colors text-xs sm:text-sm whitespace-nowrap"
              >
                {editingId ? "Save Changes" : "Submit Challenge"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CITIZEN REVIEW & TRACKING MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-0 sm:p-4">
          <div className="bg-white sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto max-w-4xl overflow-hidden flex flex-col sm:max-h-[90vh]">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex justify-between items-start bg-blue-900 text-white shrink-0">
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-0.5 sm:mb-1">
                  <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 shrink-0" />
                  <h3 className="text-lg sm:text-xl font-bold truncate">My Report Tracking</h3>
                </div>
                <p className="text-xs sm:text-sm text-blue-200 truncate">Report ID: SANKALP-{selectedReport.id.toString().padStart(4, '0')}</p>
              </div>
              <button 
                onClick={() => setSelectedReport(null)} 
                className="text-slate-400 hover:text-white transition-colors bg-blue-800 hover:bg-blue-700 p-1 sm:p-1.5 rounded-full shrink-0"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto bg-slate-50 flex-1 grid md:grid-cols-2 gap-4 sm:gap-6">
              
              {/* Left Column: The Report */}
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h4 className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Issue Title</h4>
                  <p className="text-base sm:text-lg font-bold text-slate-900">{selectedReport.title}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <span className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 truncate">Location</span>
                    <span className="flex items-start gap-1 text-xs sm:text-sm font-semibold text-slate-800"><MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0 mt-0.5"/> <span className="line-clamp-2">{selectedReport.location}</span></span>
                  </div>
                  <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <span className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 truncate">AI Priority</span>
                    <span className={`text-xs sm:text-sm font-bold uppercase truncate ${selectedReport.priority === 'Critical' ? 'text-red-600' : selectedReport.priority === 'High' ? 'text-orange-600' : 'text-blue-600'}`}>
                      {selectedReport.priority}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 sm:mb-2">My Description</h4>
                  <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 text-slate-700 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed shadow-sm">
                    {selectedReport.description}
                  </div>
                </div>

                {/* --- THIS IS THE NEW TIMELINE TRACKING FOR THE CITIZEN --- */}
                <div className="pt-3 sm:pt-4 border-t border-slate-200">
                  <h4 className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                    <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600" /> Live Ecosystem Tracking
                  </h4>
                  {selectedReport.action_logs ? (
                    <div className="bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-800 text-teal-400 text-[10px] sm:text-xs font-mono whitespace-pre-wrap leading-relaxed shadow-inner max-h-40 sm:max-h-48 overflow-y-auto">
                      {selectedReport.action_logs}
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 text-slate-500 text-xs sm:text-sm italic">
                      Your report is securely logged and is awaiting government triage...
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Partners & Evidence */}
              <div className="flex flex-col space-y-4 sm:space-y-6">
                
                {/* --- SHOW WHO IS FIXING THE PROBLEM --- */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-indigo-50 p-3 sm:p-4 rounded-xl border border-indigo-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 shrink-0" />
                      <span className="text-[8px] sm:text-[10px] font-bold text-indigo-500 uppercase tracking-wide truncate">University Partner</span>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-indigo-900 line-clamp-2">
                      {selectedReport.university_name !== "Open to all Universities" ? selectedReport.university_name : "Pending Match"}
                    </span>
                  </div>
                  <div className="bg-emerald-50 p-3 sm:p-4 rounded-xl border border-emerald-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <Factory className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                      <span className="text-[8px] sm:text-[10px] font-bold text-emerald-600 uppercase tracking-wide truncate">Industry Sponsor</span>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-emerald-900 line-clamp-2">
                      {selectedReport.industry_name !== "Awaiting CSR Funding" ? selectedReport.industry_name : "Pending Funding"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col flex-1 min-h-[150px] sm:min-h-[200px]">
                  <h4 className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 sm:mb-2">Uploaded Evidence</h4>
                  {selectedReport.evidence ? (
                    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-black flex-1 flex items-center justify-center">
                      <img 
                        src={getMediaUrl(selectedReport.evidence)} 
                        alt="Evidence" 
                        className="w-full h-full object-contain" 
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-100 flex-1 flex flex-col items-center justify-center text-slate-500 p-4">
                      <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 mb-2 opacity-50" />
                      <p className="text-xs sm:text-sm font-medium text-center">No visual evidence provided</p>
                    </div>
                  )}
                </div>

              </div>
            </div>
            
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 shrink-0">
              <div className="text-xs sm:text-sm font-semibold text-slate-500 w-full sm:w-auto text-center sm:text-left flex items-center justify-center sm:justify-start gap-2">
                Status: <span className="text-slate-800 bg-slate-100 px-2 py-1 rounded font-bold uppercase text-[10px] sm:text-xs">{selectedReport.status_display}</span>
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto">
                {selectedReport.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => openEditModal(selectedReport)}
                      className="flex-1 sm:flex-none items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium text-xs sm:text-sm text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors flex"
                    >
                      <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Edit
                    </button>
                    <button 
                      onClick={() => setReportToDelete(selectedReport)}
                      className="flex-1 sm:flex-none items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium text-xs sm:text-sm text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors flex"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Delete
                    </button>
                  </>
                )}
                <button 
                  onClick={() => setSelectedReport(null)}
                  className="flex-1 sm:flex-none px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-bold text-white bg-slate-800 hover:bg-slate-900 shadow-sm transition-colors text-xs sm:text-sm"
                >
                  Close Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {reportToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95">
            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1.5 sm:mb-2">Delete Report?</h3>
              <p className="text-slate-500 mb-5 sm:mb-6 text-sm">
                Are you sure you want to permanently delete the report <span className="font-bold text-slate-700">"{reportToDelete.title}"</span>? This action cannot be undone.
              </p>
              <div className="flex gap-2 sm:gap-3 w-full">
                <button 
                  onClick={() => setReportToDelete(null)}
                  className="flex-1 px-4 py-2 sm:py-2.5 rounded-lg font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={executeDelete}
                  className="flex-1 px-4 py-2 sm:py-2.5 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 shadow-sm transition-colors text-sm"
                >
                  Yes, Delete it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CitizenDashboard;