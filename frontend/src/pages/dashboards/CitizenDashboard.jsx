import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  LogOut, PlusCircle, MapPin, AlertTriangle, 
  Clock, CheckCircle, Activity, Bell, X, Camera, UploadCloud,
  Trash2, Edit, User, Save, Loader2, Search
} from 'lucide-react';

const CitizenDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview'); 
  
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
              // Make pin draggable!
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

  // Live GPS Sync
  useEffect(() => {
    if (mapRef.current && window.L && formData.location) {
        const parts = formData.location.split(',');
        if(parts.length === 2) {
           const lat = parseFloat(parts[0]);
           const lng = parseFloat(parts[1]);
           if(!isNaN(lat) && !isNaN(lng)) {
               if (markerRef.current) {
                   markerRef.current.setLatLng([lat, lng]);
               } else {
                   const customIcon = window.L.divIcon({
                     className: 'bg-transparent',
                     html: `<div class="text-red-600 drop-shadow-lg -mt-8 -ml-4 cursor-pointer hover:scale-110 transition-transform"><svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg></div>`,
                     iconSize: [36, 36],
                     iconAnchor: [18, 36]
                   });
                   markerRef.current = window.L.marker([lat, lng], { icon: customIcon, draggable: true }).addTo(mapRef.current);
                   markerRef.current.on('dragend', (event) => {
                       const position = event.target.getLatLng();
                       setFormData(prev => ({ ...prev, location: `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}` }));
                   });
               }
               mapRef.current.setView([lat, lng], 15, { animate: true, duration: 1 });
           }
        }
    }
  }, [formData.location]);

  const [selectedReport, setSelectedReport] = useState(null);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  // NEW: Reference to the top of the modal for auto-scrolling
  const modalTopRef = useRef(null);

  // NEW: Auto-scroll to top whenever an error occurs
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
             markerRef.current.on('dragend', (event) => {
                 const position = event.target.getLatLng();
                 setFormData(prev => ({ ...prev, location: `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}` }));
             });
          }
          mapRef.current.setView([newLat, newLng], 15, { animate: true, duration: 1 });
        }
      } else {
        // UPDATED ERROR MESSAGE AS REQUESTED
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

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 bg-blue-900 text-white flex flex-col hidden md:flex">
        <div className="p-6">
          <h2 className="text-2xl font-bold tracking-tight">JH-SANKALP</h2>
          <p className="text-blue-300 text-sm mt-1">Citizen Portal</p>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'overview' ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800/50'}`}
          >
            <Activity className="w-5 h-5" /> My Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'profile' ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800/50'}`}
          >
            <User className="w-5 h-5" /> My Profile
          </button>
        </nav>
        <div className="p-4 border-t border-blue-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-blue-200 hover:text-white transition-colors">
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-xl font-semibold text-slate-800">
            {activeTab === 'profile' ? 'Profile Settings' : `Welcome back, ${profileData.first_name || 'Citizen'}`}
          </h1>
          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-blue-600 transition-colors">
              <Bell className="w-6 h-6" />
            </button>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold border border-blue-200">
              {profileData.first_name ? profileData.first_name.charAt(0).toUpperCase() : 'C'}
            </div>
          </div>
        </header>

        <div className="p-8 flex-1 overflow-auto">
          {activeTab === 'overview' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-slate-500 text-sm font-medium mb-2 uppercase tracking-wide">Total Reports</div>
                  <div className="text-3xl font-bold text-slate-800">{myReports.length}</div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-slate-500 text-sm font-medium mb-2 uppercase tracking-wide">In Progress</div>
                  <div className="text-3xl font-bold text-amber-500">
                    {myReports.filter(r => r.status === 'in_progress').length}
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-slate-500 text-sm font-medium mb-2 uppercase tracking-wide">Resolved</div>
                  <div className="text-3xl font-bold text-teal-600">
                    {myReports.filter(r => r.status === 'resolved').length}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Recent Challenges</h2>
                  <p className="text-slate-500 mt-1">Track the status of the issues you've reported.</p>
                </div>
                <button 
                  onClick={() => {
                    setErrorMessage('');
                    setFormData({ title: '', category: 'disaster', location: '', description: '' });
                    setEditingId(null);
                    setEvidenceFile(null);
                    setIsModalOpen(true);
                  }}
                  className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-all flex items-center gap-2"
                >
                  <PlusCircle className="w-5 h-5" /> Report New Issue
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {isLoading ? (
                  <div className="p-10 text-center text-slate-500 font-medium">Loading your reports...</div>
                ) : myReports.length === 0 ? (
                  <div className="p-10 text-center text-slate-500 font-medium">You haven't reported any issues yet. Click 'Report New Issue' to start.</div>
                ) : (
                  myReports.map((report) => (
                    <div key={report.id} className="p-6 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex gap-4 items-start">
                        <div className={`p-3 rounded-lg ${report.status === 'resolved' ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'}`}>
                          {report.status === 'resolved' ? <CheckCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{report.title}</h3>
                          <div className="flex items-center gap-3 text-slate-500 text-sm mt-1">
                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {report.location}</span>
                            <span>•</span>
                            <span>{report.date_formatted}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          report.priority === 'Critical' ? 'bg-red-100 text-red-800 border border-red-200 animate-pulse' : 
                          report.priority === 'High' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 
                          'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}>
                          {report.priority} Priority
                        </span>
                        <button onClick={() => setSelectedReport(report)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">Review</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-blue-900 px-8 py-6 text-white flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Personal Information</h2>
                    <p className="text-blue-200 text-sm mt-1">Manage your account details and contact info.</p>
                  </div>
                  {!isEditingProfile && (
                    <button 
                      onClick={() => setIsEditingProfile(true)}
                      className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 border border-white/20"
                    >
                      <Edit className="w-4 h-4" /> Edit Profile
                    </button>
                  )}
                </div>
                
                <div className="p-8">
                  {profileMessage.text && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${profileMessage.type === 'success' ? 'bg-teal-50 text-teal-700 border border-teal-200' : profileMessage.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                      <CheckCircle className="w-5 h-5" /> {profileMessage.text}
                    </div>
                  )}

                  <form onSubmit={handleProfileUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">First Name</label>
                      <input 
                        type="text" 
                        disabled={!isEditingProfile}
                        value={profileData.first_name}
                        onChange={(e) => setProfileData({...profileData, first_name: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Last Name</label>
                      <input 
                        type="text" 
                        disabled={!isEditingProfile}
                        value={profileData.last_name}
                        onChange={(e) => setProfileData({...profileData, last_name: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address (Read Only)</label>
                      <input 
                        type="email" 
                        disabled
                        value={profileData.email}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-100 text-slate-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number</label>
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
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                        placeholder="e.g., 9876543210"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">District / Region</label>
                      <input 
                        type="text" 
                        disabled={!isEditingProfile}
                        value={profileData.district || ''}
                        onChange={(e) => setProfileData({...profileData, district: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                        placeholder="e.g., Ranchi"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Account Role</label>
                      <div className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                          {profileData.role}
                        </span>
                      </div>
                    </div>

                    {isEditingProfile && (
                      <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
                        <button 
                          type="button" 
                          onClick={() => setIsEditingProfile(false)}
                          className="px-6 py-2.5 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="px-6 py-2.5 rounded-lg font-medium text-white bg-blue-700 hover:bg-blue-800 shadow-sm transition-colors flex items-center gap-2"
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-blue-900 text-white shrink-0">
              <h3 className="text-xl font-bold flex items-center gap-2">
                {editingId ? <Edit className="w-5 h-5"/> : <PlusCircle className="w-5 h-5"/>} 
                {editingId ? "Edit Issue Details" : "Report a New Issue"}
              </h3>
              <button 
                onClick={() => { setIsModalOpen(false); setEditingId(null); }} 
                className="text-blue-200 hover:text-white transition-colors bg-blue-800 hover:bg-blue-700 p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {/* Invisible div to scroll to */}
              <div ref={modalTopRef}></div>
              
              {errorMessage && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{errorMessage}</p>
                </div>
              )}

              <form id="challenge-form" onSubmit={handleReportSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Issue Title</label>
                  <input 
                    type="text" required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g., Major flooding on Highway 33"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                    >
                      <option value="disaster">Disaster & Flooding</option>
                      <option value="infrastructure">Infrastructure & Roads</option>
                      <option value="water">Water & Sanitation</option>
                      <option value="electricity">Power & Electricity</option>
                    </select>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-600" /> Location Details
                      </label>
                      <button 
                        type="button" 
                        onClick={handleGetLocation}
                        disabled={isLocating}
                        className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 border border-blue-200"
                      >
                        {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                        {isLocating ? 'Detecting...' : 'Use My Live GPS'}
                      </button>
                    </div>
                    
                    <div className="mb-3 rounded-xl border border-slate-300 shadow-inner overflow-hidden relative group">
                      <div id="citizen-map" className="w-full h-56 z-10"></div>
                      
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-slate-900/10 group-hover:opacity-0 transition-opacity z-20">
                         <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg text-sm font-bold text-slate-700 border border-slate-200 flex items-center gap-2">
                           <MapPin className="w-4 h-4 text-red-500" /> Pan, zoom, click, or drag the pin!
                         </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <MapPin className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                          type="text" required
                          value={formData.location}
                          onChange={(e) => setFormData({...formData, location: e.target.value})}
                          placeholder="Type an address and click Find..."
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-700"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSearchAddress}
                        disabled={isSearchingAddress || !formData.location}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {isSearchingAddress ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        Find
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Detailed Description</label>
                  <textarea 
                    required rows="4"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe the severity, how many people are affected, etc..."
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Evidence (Photo/Video) {editingId && <span className="text-slate-400 font-normal ml-2">- Optional when editing</span>}
                  </label>
                  <label className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 hover:border-blue-400 transition-colors cursor-pointer group block">
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*,video/mp4"
                      onChange={(e) => setEvidenceFile(e.target.files[0])}
                    />
                    <div className="flex justify-center gap-4 mb-3">
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Camera className="w-6 h-6" />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-slate-700">
                      {evidenceFile ? (
                        <span className="text-blue-600 font-bold">{evidenceFile.name}</span>
                      ) : (
                        'Click to upload or drag and drop'
                      )}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">SVG, PNG, JPG or MP4 (max. 10MB)</p>
                  </label>
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button 
                type="button" 
                onClick={() => { setIsModalOpen(false); setEditingId(null); }}
                className="px-5 py-2.5 rounded-lg font-medium text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="challenge-form"
                className="px-5 py-2.5 rounded-lg font-medium text-white bg-blue-700 hover:bg-blue-800 shadow-sm transition-colors"
              >
                {editingId ? "Save Changes" : "Submit Challenge"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start bg-blue-900 text-white shrink-0">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <Activity className="w-6 h-6 text-blue-400" />
                  <h3 className="text-xl font-bold">My Report Review</h3>
                </div>
                <p className="text-sm text-blue-200">Report ID: SANKALP-{selectedReport.id.toString().padStart(4, '0')}</p>
              </div>
              <button 
                onClick={() => setSelectedReport(null)} 
                className="text-slate-400 hover:text-white transition-colors bg-blue-800 hover:bg-blue-700 p-1.5 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-slate-50 flex-1 grid md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Issue Title</h4>
                  <p className="text-lg font-bold text-slate-900">{selectedReport.title}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Location</span>
                    <span className="flex items-center gap-1 text-sm font-semibold text-slate-800"><MapPin className="w-4 h-4 text-blue-600"/> {selectedReport.location}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">AI Priority</span>
                    <span className={`text-sm font-bold uppercase ${selectedReport.priority === 'Critical' ? 'text-red-600' : selectedReport.priority === 'High' ? 'text-orange-600' : 'text-blue-600'}`}>
                      {selectedReport.priority}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">My Description</h4>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-slate-700 text-sm whitespace-pre-wrap leading-relaxed shadow-sm">
                    {selectedReport.description}
                  </div>
                </div>
              </div>

              <div className="flex flex-col">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Uploaded Evidence</h4>
                {selectedReport.evidence ? (
                  <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-black flex-1 flex items-center justify-center min-h-[250px]">
                    <img 
                      src={getMediaUrl(selectedReport.evidence)} 
                      alt="Evidence" 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-100 flex-1 flex flex-col items-center justify-center text-slate-500 min-h-[250px]">
                    <AlertTriangle className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-sm font-medium">No visual evidence provided</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
              <div className="text-sm font-semibold text-slate-500">
                Current Status: <span className="text-slate-800 bg-slate-100 px-2 py-1 rounded">{selectedReport.status_display}</span>
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                {selectedReport.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => openEditModal(selectedReport)}
                      className="flex-1 sm:flex-none items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg font-medium text-sm text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors flex"
                    >
                      <Edit className="w-4 h-4" /> Edit
                    </button>
                    <button 
                      onClick={() => setReportToDelete(selectedReport)}
                      className="flex-1 sm:flex-none items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg font-medium text-sm text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors flex"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </>
                )}
                <button 
                  onClick={() => setSelectedReport(null)}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg font-bold text-white bg-slate-800 hover:bg-slate-900 shadow-sm transition-colors"
                >
                  Close Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {reportToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col transform transition-all">
            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Report?</h3>
              <p className="text-slate-500 mb-6">
                Are you sure you want to permanently delete the report <span className="font-bold text-slate-700">"{reportToDelete.title}"</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setReportToDelete(null)}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={executeDelete}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 shadow-sm transition-colors"
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