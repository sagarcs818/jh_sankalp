import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  LogOut, MapPin, AlertTriangle, CheckCircle,
  Activity, Bell, Users, Search, ShieldCheck, X,
  User, Edit, Save, Building, Phone, Mail, PieChart,
  GraduationCap, Sparkles, Award, Check, Clock, BookOpen, Download, Menu
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, Legend
} from 'recharts';

const getCoordinates = (locationStr) => {
  let hash = 0;
  if (locationStr) {
    for (let i = 0; i < locationStr.length; i++) {
      hash = locationStr.charCodeAt(i) + ((hash << 5) - hash);
    }
  }
  const baseLat = 23.3441;
  const baseLng = 85.3096;
  const latOffset = (hash % 100) / 150;
  const lngOffset = ((hash >> 4) % 100) / 150;
  return [baseLat + latOffset, baseLng + lngOffset];
};

const GovernmentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [challenges, setChallenges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [selectedReport, setSelectedReport] = useState(null);
  const [universityMatches, setUniversityMatches] = useState([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [profileData, setProfileData] = useState({
    first_name: '', last_name: '', email: '', phone: '', district: '', role: '', organization_name: ''
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });

  const mapRef = useRef(null);
  const markersRef = useRef([]);

  const getMediaUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `http://127.0.0.1:8000${path}`;
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };

      const reportsRes = await axios.get('http://127.0.0.1:8000/api/challenges/reports/', { headers });
      setChallenges(reportsRes.data);

      const profileRes = await axios.get('http://127.0.0.1:8000/api/auth/profile/', { headers });
      setProfileData(profileRes.data);
    } catch (error) {
      console.error("Error fetching data", error);
      if (error?.response?.status === 401) handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenReportModal = async (report) => {
    setSelectedReport(report);

    // Only fetch matches if the problem is pending or forwarded_to_univ (Open Pool)
    if (report.status === 'pending' || (report.status === 'forwarded_to_univ' && !report.proposal_details)) {
      setIsLoadingMatches(true);
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get(`http://127.0.0.1:8000/api/challenges/reports/${report.id}/smart_match_universities/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUniversityMatches(res.data);
      } catch (err) {
        console.error("Smart match endpoint unavailable or failed", err);
        setUniversityMatches([]);
      } finally {
        setIsLoadingMatches(false);
      }
    }
  };

  const handleApproveUniversityRequest = async () => {
    if (!selectedReport) return;
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('access_token');
      const actionLogEntry = `\n[${new Date().toLocaleDateString()}] GOVERNMENT APPROVED: The state has approved ${selectedReport.university_name}'s proposal. Now awaiting Industry CSR funding.`;

      const response = await axios.patch(
        `http://127.0.0.1:8000/api/challenges/reports/${selectedReport.id}/`,
        { status: 'proposal_submitted', action_logs: (selectedReport.action_logs || '') + actionLogEntry },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setChallenges(challenges.map(c => c.id === selectedReport.id ? response.data : c));
      setSelectedReport(null);
    } catch (err) {
      console.error("Failed to approve", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRejectUniversityRequest = async () => {
    if (!selectedReport) return;
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('access_token');
      const actionLogEntry = `\n[${new Date().toLocaleDateString()}] GOVERNMENT REJECTED: The state declined the proposal from ${selectedReport.university_name}. Returned to Open Pool.`;

      const formData = new FormData();
      formData.append('status', 'pending');
      formData.append('assigned_university', '');
      formData.append('proposal_details', '');
      formData.append('proposal_document', '');
      formData.append('action_logs', (selectedReport.action_logs || '') + actionLogEntry);

      const response = await axios.patch(
        `http://127.0.0.1:8000/api/challenges/reports/${selectedReport.id}/`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setChallenges(challenges.map(c => c.id === selectedReport.id ? response.data : c));
      setSelectedReport(null);
    } catch (err) {
      console.error("Failed to reject", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAllocateToUniv = async (univId, univName) => {
    if (!selectedReport) return;
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(
        `http://127.0.0.1:8000/api/challenges/reports/${selectedReport.id}/assign_university/`,
        { university_id: univId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData(); // Refresh to pull updated logs and state
      setSelectedReport(null);
    } catch (error) {
      console.error("Allocation failed", error);
      alert("Failed to allocate to university.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedReport) return;
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.patch(
        `http://127.0.0.1:8000/api/challenges/reports/${selectedReport.id}/`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setChallenges(challenges.map(c => c.id === selectedReport.id ? response.data : c));
      setSelectedReport(null);
    } catch (error) {
      console.error("Error updating status:", error);
      if (error.response && error.response.data && error.response.data.detail) {
        alert(error.response.data.detail);
      } else {
        alert("Status update failed.");
      }
    } finally {
      setIsUpdating(false);
    }
  };

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
      setProfileMessage({ text: 'Official profile updated successfully!', type: 'success' });
      setTimeout(() => setProfileMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      setProfileMessage({ text: 'Failed to update profile.', type: 'error' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  useEffect(() => {
    if (activeTab !== 'map' || isLoading) return;
    let mapInstance = null;

    const initMap = () => {
      if (!window.L || !document.getElementById('govt-command-map')) return;
      if (window.L.DomUtil.get('govt-command-map') !== null) {
        window.L.DomUtil.get('govt-command-map')._leaflet_id = null;
      }

      mapInstance = window.L.map('govt-command-map').setView([23.6, 85.5], 7);
      mapRef.current = mapInstance;

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(mapInstance);

      const bounds = window.L.latLngBounds();
      let hasValidCoords = false;

      challenges.forEach(report => {
        let lat = null, lng = null;
        if (report.location) {
          const gpsRegex = /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/;
          if (gpsRegex.test(report.location)) {
            const parts = report.location.split(',');
            lat = parseFloat(parts[0]);
            lng = parseFloat(parts[1]);
          } else {
            const coords = getCoordinates(report.location);
            lat = coords[0];
            lng = coords[1];
          }
        }

        if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
          hasValidCoords = true;
          bounds.extend([lat, lng]);

          let colorClass = 'text-blue-600';
          let pulseClass = '';

          if (report.priority === 'Critical') {
            colorClass = 'text-red-600';
            pulseClass = 'animate-bounce';
          } else if (report.priority === 'High') {
            colorClass = 'text-orange-600';
          } else if (report.status === 'resolved') {
            colorClass = 'text-teal-600';
          }

          const customIcon = window.L.divIcon({
            className: 'bg-transparent',
            html: `<div class="${colorClass} drop-shadow-xl -mt-8 -ml-4 ${pulseClass} cursor-pointer transition-transform hover:scale-125">
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="2">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                      <circle cx="12" cy="10" r="3" fill="white"></circle>
                    </svg>
                  </div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 36]
          });

          const marker = window.L.marker([lat, lng], { icon: customIcon }).addTo(mapInstance);
          marker.bindPopup(`
            <div class="p-1 min-w-[200px] font-sans">
              <div class="text-[10px] font-bold text-slate-400 uppercase">Impact: ${report.report_count || 1} Report(s)</div>
              <div class="font-bold text-slate-900 text-sm mt-0.5 mb-1">${report.title}</div>
              <div class="text-xs text-teal-600 font-semibold cursor-pointer">Click pin to review details ➔</div>
            </div>
          `);
          marker.on('click', () => handleOpenReportModal(report));
          markersRef.current.push(marker);
        }
      });

      if (hasValidCoords) {
        mapInstance.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    };

    if (!document.getElementById('leaflet-css-govt')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css-govt';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!document.getElementById('leaflet-js-govt')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js-govt';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setTimeout(initMap, 200);
      document.head.appendChild(script);
    } else {
      setTimeout(initMap, 200);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = [];
      }
    };
  }, [activeTab, challenges, isLoading]);

  const filteredChallenges = challenges.filter(c => {
    const matchesFilter =
      filter === 'critical' ? c.priority === 'Critical' :
      filter === 'pending' ? c.status === 'pending' : 
      filter === 'requested' ? c.status === 'forwarded_to_univ' : true; 

    const matchesSearch =
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const renderActionArea = () => {
    if (!selectedReport) return null;

    if (selectedReport.proposal_details && selectedReport.status === 'forwarded_to_univ') {
      return (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 shadow-sm">
          <h4 className="text-lg font-bold text-purple-900 flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5" /> University Proposal Review
          </h4>
          <p className="text-sm text-purple-800 mb-4"><b>{selectedReport.university_name}</b> has claimed this challenge and submitted an R&D proposal for your approval.</p>

          <div className="bg-white p-3 rounded-lg border border-purple-100 text-sm font-mono text-slate-700 whitespace-pre-wrap mb-4 max-h-48 overflow-y-auto">
            {selectedReport.proposal_details}
          </div>

          {selectedReport.proposal_document && (
            <div className="mb-4">
              <a
                href={getMediaUrl(selectedReport.proposal_document)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold hover:bg-purple-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> View Uploaded Pitch Deck
              </a>
            </div>
          )}

          <div className="flex gap-3">
            <button
              disabled={isUpdating}
              onClick={handleApproveUniversityRequest}
              className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" /> Approve Proposal
            </button>
            <button
              disabled={isUpdating}
              onClick={handleRejectUniversityRequest}
              className="px-4 py-2.5 rounded-lg text-sm font-bold text-red-700 bg-red-100 hover:bg-red-200 transition-all disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      );
    }
    
    if (selectedReport.status === 'forwarded_to_univ' && selectedReport.assigned_university && !selectedReport.proposal_details) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 shadow-sm text-center">
          <Clock className="w-10 h-10 text-blue-600 mx-auto mb-2" />
          <h4 className="text-lg font-bold text-blue-900">Awaiting University Pitch</h4>
          <p className="text-sm text-blue-800 mb-4">
            You have manually allocated this problem to <b>{selectedReport.university_name}</b>. Awaiting their team to submit an R&D pitch deck and timeframe.
          </p>
          <button
            onClick={handleRejectUniversityRequest}
            disabled={isUpdating}
            className="px-4 py-2.5 rounded-lg text-sm font-bold text-red-700 bg-red-100 hover:bg-red-200 transition-all disabled:opacity-50 w-full"
          >
            Revoke Allocation & Return to Open Pool
          </button>
        </div>
      );
    }

    if (selectedReport.status === 'pending' || (selectedReport.status === 'forwarded_to_univ' && !selectedReport.assigned_university && !selectedReport.proposal_details)) {
      return (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-center">
            <p className="text-sm font-semibold text-blue-800">
              This problem is currently live in the Open State Pool. Universities can browse and claim it organically, or you can manually force an allocation to a top match below.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-teal-600" /> AI Academic Smart-Match Ranking
            </h4>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Potential Matches</span>
          </div>

          {isLoadingMatches ? (
            <div className="p-8 text-center text-sm text-slate-500 bg-white rounded-xl border border-slate-200">
              Calculating domain capabilities and institutional expertise...
            </div>
          ) : universityMatches.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
              No academic partners found. Universities must update their domain expertise to appear here.
            </div>
          ) : (
            <div className="space-y-3">
              {universityMatches.map((univ, idx) => (
                <div key={univ.id} className={`p-4 rounded-xl border transition-all ${idx === 0 ? 'bg-teal-50/40 border-teal-300 ring-1 ring-teal-200' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{univ.name}</span>
                        {idx === 0 && (
                          <span className="bg-teal-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Award className="w-3 h-3" /> Top Match
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-extrabold text-teal-700">{univ.match_score}%</span>
                      <span className="block text-[10px] text-slate-400 uppercase font-semibold">Match Score</span>
                    </div>
                  </div>

                  <div className="space-y-1 mb-3">
                    {univ.reasons?.map((reason, rIdx) => (
                      <div key={rIdx} className="text-xs text-slate-600 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" /> {reason}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleAllocateToUniv(univ.id, univ.name)}
                    disabled={isUpdating}
                    className={`w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    Allocate Problem to {univ.name}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          {selectedReport.status === 'resolved' ? <CheckCircle className="w-8 h-8 text-teal-500" /> : <Activity className="w-8 h-8 text-blue-500" />}
        </div>
        <h4 className="text-lg font-bold text-slate-900 mb-2">Project Lifecycle Active</h4>
        <p className="text-sm text-slate-600">This project has progressed past the academic allocation phase. Check the timeline on the left for live updates.</p>
      </div>
    );
  };

  const NavLinks = () => (
    <>
      <button onClick={() => {setActiveTab('overview'); setMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'overview' ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
        <Activity className="w-5 h-5" /> Triage Board
      </button>
      <button onClick={() => {setActiveTab('map'); setMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'map' ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
        <MapPin className="w-5 h-5" /> GIS Command Map
      </button>
      <button onClick={() => {setActiveTab('analytics'); setMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'analytics' ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
        <PieChart className="w-5 h-5" /> State Analytics
      </button>
      <button onClick={() => {setActiveTab('profile'); setMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'profile' ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
        <User className="w-5 h-5" /> Official Profile
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">

      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col h-screen sticky top-0 shrink-0">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-8 h-8 text-teal-500" />
            <h2 className="text-2xl font-bold tracking-tight">SANKALP</h2>
          </div>
          <p className="text-slate-400 text-xs">State Command Center (SIH26043)</p>
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

      {/* Main Container */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* RESPONSIVE HEADER FIX */}
        <header className="min-h-[64px] py-3 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 z-10">
          <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-slate-500 hover:text-slate-800 shrink-0">
              <Menu className="w-6 h-6" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-bold text-slate-800 leading-tight truncate sm:whitespace-normal">
                {activeTab === 'profile' ? 'Official Identity & Security Settings' : 'State Innovation & Triage Console'}
              </h1>
              <p className="text-xs text-slate-500 truncate sm:whitespace-normal">
                Department of Higher & Technical Education, Jharkhand
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold border border-teal-200 uppercase shrink-0">
              {profileData.first_name ? profileData.first_name.charAt(0) : 'G'}
            </div>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-slate-900/60 z-[9999] md:hidden" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-64 bg-slate-900 h-full flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-800 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-teal-500" />
                  <h2 className="text-xl font-bold text-white tracking-tight">SANKALP</h2>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400"><X className="w-5 h-5"/></button>
              </div>
              <nav className="flex-1 px-4 space-y-2 mt-6 overflow-y-auto">
                <NavLinks />
              </nav>
              {/* FIX: Added the Logout button to the bottom of the mobile menu! */}
              <div className="p-4 border-t border-slate-800 shrink-0">
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm">
                  <LogOut className="w-5 h-5" /> Secure Logout
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 md:p-8 flex-1 overflow-auto">
          {activeTab === 'overview' ? (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-slate-500 text-xs font-bold mb-1 uppercase tracking-wider">Active Challenges</div>
                    <div className="text-2xl font-bold text-slate-800">{challenges.length}</div>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shrink-0"><Activity className="w-6 h-6" /></div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between ring-1 ring-red-100 bg-red-50/20">
                  <div>
                    <div className="text-red-500 text-xs font-bold mb-1 uppercase tracking-wider">Critical Priority</div>
                    <div className="text-2xl font-bold text-red-700">{challenges.filter(c => c.priority === 'Critical').length}</div>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 animate-pulse shrink-0"><AlertTriangle className="w-6 h-6" /></div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-indigo-500 text-xs font-bold mb-1 uppercase tracking-wider">Univ Requests</div>
                    <div className="text-2xl font-bold text-indigo-700">{challenges.filter(c => c.status === 'forwarded_to_univ').length}</div>
                  </div>
                  <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 shrink-0"><BookOpen className="w-6 h-6" /></div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-teal-600 text-xs font-bold mb-1 uppercase tracking-wider">Impact Score</div>
                    <div className="text-2xl font-bold text-teal-700">{challenges.reduce((acc, c) => acc + (c.report_count || 1), 0)} Reports</div>
                  </div>
                  <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center text-teal-600 shrink-0"><Users className="w-6 h-6" /></div>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
                
                <div className="flex flex-wrap gap-2 bg-slate-200/50 p-1.5 rounded-lg w-full xl:w-auto">
                  <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${filter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>All Ranked</button>
                  <button onClick={() => setFilter('critical')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${filter === 'critical' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Critical Only</button>
                  <button onClick={() => setFilter('pending')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${filter === 'pending' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Open State Pool</button>
                  <button onClick={() => setFilter('requested')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${filter === 'requested' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>University Requests</button>
                </div>

                <div className="relative w-full xl:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search location or title..."
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
                  />
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-4 font-semibold whitespace-nowrap">Priority & Impact</th>
                      <th className="px-6 py-4 font-semibold">Problem Title & Domain</th>
                      <th className="px-6 py-4 font-semibold">Location</th>
                      <th className="px-6 py-4 font-semibold">Allocated Institution</th>
                      <th className="px-6 py-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr><td colSpan="5" className="p-8 text-center text-slate-500">Loading state challenges...</td></tr>
                    ) : filteredChallenges.length === 0 ? (
                      <tr><td colSpan="5" className="p-8 text-center text-slate-500">No challenges found matching this filter.</td></tr>
                    ) : (
                      filteredChallenges.map((report, idx) => (
                        <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1 items-start">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap ${report.priority === 'Critical' ? 'bg-red-100 text-red-800 border border-red-200 animate-pulse' :
                                  report.priority === 'High' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                    'bg-blue-100 text-blue-700 border border-blue-200'
                                }`}>
                                #{idx + 1} {report.priority}
                              </span>
                              {report.report_count > 1 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 whitespace-nowrap">
                                  <Users className="w-3 h-3" /> {report.report_count} Reports
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800 line-clamp-2">{report.title}</div>
                            <div className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">
                              <span className="uppercase text-teal-600 font-semibold">{report.category}</span> • {report.date_formatted}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            <span className="flex items-start gap-1"><MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" /> <span className="line-clamp-2">{report.location}</span></span>
                          </td>
                          
                          <td className="px-6 py-4 text-sm font-semibold">
                            {report.status === 'pending' ? (
                              <span className="text-slate-400 italic">Open State Pool</span>
                            ) : report.status === 'forwarded_to_univ' ? (
                              report.proposal_details ? (
                                <span className="text-purple-600 flex items-center gap-1.5 whitespace-nowrap" title="Review Proposal">
                                  <Clock className="w-4 h-4" /> Pending Approval: <br className="hidden md:block" /> {report.university_name}
                                </span>
                              ) : (
                                <span className="text-blue-600 flex items-center gap-1.5 whitespace-nowrap" title="Awaiting their pitch">
                                  <Clock className="w-4 h-4" /> Awaiting Pitch: <br className="hidden md:block" /> {report.university_name}
                                </span>
                              )
                            ) : report.university_name && report.university_name !== "Open to all Universities" ? (
                              <span className="text-indigo-600 flex items-center gap-1.5 whitespace-nowrap"><GraduationCap className="w-4 h-4" /> {report.university_name}</span>
                            ) : (
                              <span className="text-slate-400 italic">Open State Pool</span>
                            )}
                          </td>

                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleOpenReportModal(report)}
                              className="text-teal-600 hover:text-teal-800 text-sm font-semibold bg-teal-50 hover:bg-teal-100 px-3.5 py-1.5 rounded transition-colors whitespace-nowrap"
                            >
                              {report.status === 'forwarded_to_univ' && report.proposal_details ? 'Review Proposal' : 'View Details'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : activeTab === 'map' ? (
            <div className="h-full flex flex-col min-h-[600px]">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-900">Geospatial Command Map</h2>
                <p className="text-xs text-slate-500">Live multi-citizen challenge mapping across Jharkhand districts.</p>
              </div>
              <div className="flex-1 bg-slate-200 rounded-2xl overflow-hidden border border-slate-300 shadow-md relative z-0">
                <div id="govt-command-map" className="w-full h-full min-h-[500px] z-0"></div>
              </div>
            </div>
          ) : activeTab === 'analytics' ? (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">State Command Analytics</h2>
                <p className="text-slate-500 text-sm mt-1">Real-time breakdown of ecosystem participation and problem resolution funnel.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* RESPONSIVE CHART 1 */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-teal-600" /> Problem Distribution by Sector
                  </h3>
                  <div className="w-full overflow-x-auto pb-4">
                    <div className="min-w-[450px] h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart margin={{ top: 10, right: 40, left: 40, bottom: 20 }}>
                          <Pie
                            data={[
                              { name: 'Disaster', value: challenges.filter(c => c.category === 'disaster').length },
                              { name: 'Infrastructure', value: challenges.filter(c => c.category === 'infrastructure').length },
                              { name: 'Water', value: challenges.filter(c => c.category === 'water').length },
                              { name: 'Electricity', value: challenges.filter(c => c.category === 'electricity').length },
                            ].filter(d => d.value > 0)}
                            cx="50%" 
                            cy="50%" 
                            innerRadius={55} 
                            outerRadius={75} 
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {['#ef4444', '#f59e0b', '#3b82f6', '#10b981'].map((color, index) => (
                              <Cell key={`cell-${index}`} fill={color} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                          <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '15px' }} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* RESPONSIVE CHART 2 */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-600" /> Innovation Funnel
                  </h3>
                  <div className="w-full overflow-x-auto pb-4">
                    <div className="min-w-[450px] h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { name: 'Open Pool', count: challenges.filter(c => c.status === 'pending').length },
                            { name: 'Requested', count: challenges.filter(c => c.status === 'forwarded_to_univ').length },
                            { name: 'Awaiting CSR', count: challenges.filter(c => c.status === 'proposal_submitted').length },
                            { name: 'In Progress', count: challenges.filter(c => c.status === 'in_progress').length },
                            { name: 'Resolved', count: challenges.filter(c => c.status === 'resolved').length },
                          ]}
                          margin={{ top: 10, right: 20, left: -20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tick={{fontSize: 12}} interval={0} />
                          <YAxis allowDecimals={false} tick={{fontSize: 12}} />
                          <RechartsTooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                          <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} maxBarSize={50} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-6 py-6 md:px-8 text-white flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold">Official Credentials</h2>
                    <p className="text-slate-400 text-sm mt-1">Manage state department details.</p>
                  </div>
                  {!isEditingProfile && (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 border border-white/20 w-full sm:w-auto"
                    >
                      <Edit className="w-4 h-4" /> Edit Details
                    </button>
                  )}
                </div>

                <div className="p-6 md:p-8">
                  {profileMessage.text && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${profileMessage.type === 'success' ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      <CheckCircle className="w-5 h-5 shrink-0" /> {profileMessage.text}
                    </div>
                  )}

                  <form onSubmit={handleProfileUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">First Name</label>
                      <input
                        type="text"
                        disabled={!isEditingProfile}
                        value={profileData.first_name}
                        onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none disabled:bg-slate-50 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        disabled={!isEditingProfile}
                        value={profileData.last_name}
                        onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none disabled:bg-slate-50 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Department</label>
                      <input
                        type="text"
                        disabled={!isEditingProfile}
                        value={profileData.organization_name || ''}
                        onChange={(e) => setProfileData({ ...profileData, organization_name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none disabled:bg-slate-50 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">District</label>
                      <input
                        type="text"
                        disabled={!isEditingProfile}
                        value={profileData.district || ''}
                        onChange={(e) => setProfileData({ ...profileData, district: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none disabled:bg-slate-50 text-sm"
                      />
                    </div>

                    {isEditingProfile && (
                      <div className="md:col-span-2 flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-slate-100">
                        <button type="button" onClick={() => setIsEditingProfile(false)} className="px-6 py-2.5 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors w-full sm:w-auto">Cancel</button>
                        <button type="submit" className="px-6 py-2.5 rounded-lg font-medium text-white bg-teal-600 hover:bg-teal-700 shadow-sm flex items-center justify-center gap-2 transition-colors w-full sm:w-auto">
                          <Save className="w-4 h-4" /> Save Details
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

      {}
      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">

            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start bg-slate-900 text-white shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-6 h-6 text-teal-400" />
                  <h3 className="text-lg md:text-xl font-bold">Government Triage & Approval</h3>
                </div>
                <p className="text-xs text-slate-400">Master Ticket #{selectedReport.id} • Category: {selectedReport.category?.toUpperCase()}</p>
              </div>
              <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-white p-1.5 rounded-full bg-slate-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 md:p-6 overflow-y-auto bg-slate-50 flex-1 grid lg:grid-cols-2 gap-6">
              {/* Left Column: Problem Summary */}
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex flex-wrap justify-between items-start mb-2 gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Issue Overview</span>
                    <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700 whitespace-nowrap">
                      {selectedReport.report_count || 1} Citizen Report(s)
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-2">{selectedReport.title}</h4>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedReport.description}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Location / District</span>
                    <span className="text-xs font-semibold text-slate-800 flex items-start gap-1"><MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" /> <span className="line-clamp-2">{selectedReport.location}</span></span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">AI Evaluated Priority</span>
                    <span className="text-xs font-bold text-red-600 uppercase">{selectedReport.priority}</span>
                  </div>
                </div>

                {selectedReport.evidence && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 h-44 bg-black flex items-center justify-center">
                    <img src={getMediaUrl(selectedReport.evidence)} alt="Visual Proof" className="w-full h-full object-contain" />
                  </div>
                )}

                {selectedReport.action_logs && (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mt-4 hidden md:block">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">Ecosystem Activity Timeline</h4>
                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent max-h-48 overflow-y-auto pr-2">
                      {selectedReport.action_logs.split('\n').filter(log => log.trim() !== '').map((log, index) => {
                        const timeMatch = log.match(/\[(.*?)\]/);
                        const time = timeMatch ? timeMatch[1] : '';
                        const message = log.replace(/\[.*?\]/, '').trim();
                        return (
                          <div key={index} className="relative flex items-start gap-4">
                            <div className="absolute left-0 mt-1.5 w-5 h-5 rounded-full border-[3px] border-white bg-teal-500 shadow-sm z-10"></div>
                            <div className="ml-8">
                              <span className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">{time}</span>
                              <span className="text-sm font-medium text-slate-700">{message}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Dynamic Action Area */}
              <div className="space-y-3">
                {renderActionArea()}
              </div>
            </div>

            <div className="px-4 md:px-6 py-3.5 border-t border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
              <div className="flex flex-wrap justify-center gap-2 w-full sm:w-auto">
                {selectedReport.assigned_industry && selectedReport.status !== 'resolved' && (
                  <button
                    onClick={() => handleUpdateStatus('in_progress')}
                    className="px-4 py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 text-sm font-bold disabled:opacity-50 transition-colors"
                    disabled={isUpdating}
                  >
                    Force In Progress
                  </button>
                )}

                {selectedReport.status === 'in_progress' && (
                  <button
                    onClick={() => handleUpdateStatus('resolved')}
                    className="px-4 py-2 border border-emerald-200 text-emerald-600 rounded-lg hover:bg-emerald-50 text-sm font-bold disabled:opacity-50 transition-colors"
                    disabled={isUpdating}
                  >
                    Force Resolved
                  </button>
                )}
              </div>

              <button onClick={() => setSelectedReport(null)} className="px-6 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors w-full sm:w-auto">
                Close View
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default GovernmentDashboard;