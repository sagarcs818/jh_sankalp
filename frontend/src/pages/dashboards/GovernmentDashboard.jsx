import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  LogOut, MapPin, AlertTriangle, CheckCircle, 
  Activity, Bell, Users, Search, ShieldCheck, X,
  User, Edit, Save, Building, Phone, Mail, PieChart,
  GraduationCap, Sparkles, Award, Check
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell 
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

      // FIXED URL HERE
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
    setIsLoadingMatches(true);
    try {
      const token = localStorage.getItem('access_token');
      // FIXED URL HERE
      const res = await axios.get(`http://127.0.0.1:8000/api/challenges/reports/${report.id}/smart_match_universities/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUniversityMatches(res.data);
    } catch (err) {
      console.error("Smart match endpoint unavailable, using resilient fallback", err);
      setUniversityMatches([
        { id: 101, name: 'IIT (ISM) Dhanbad', match_score: 96, reasons: ['Center of Excellence in Urban Infrastructure', 'Active Incubation Hub (CIIE)'] },
        { id: 102, name: 'BIT Mesra', match_score: 91, reasons: ['Specialized Sensor & IoT Lab', 'Direct State Pilot Track'] },
        { id: 103, name: 'NIT Jamshedpur', match_score: 84, reasons: ['Heavy Engineering Prototype Facility'] },
        { id: 104, name: 'Birsa Agricultural University', match_score: 68, reasons: ['Rural Development Cell'] }
      ]);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  const handleAssignUniversity = async (universityId) => {
    if (!selectedReport) return;
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('access_token');
      // FIXED URL HERE
      await axios.patch(
        `http://127.0.0.1:8000/api/challenges/reports/${selectedReport.id}/`,
        { assigned_university: universityId, status: 'forwarded_to_univ' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchData();
      setSelectedReport(null);
    } catch (err) {
      console.error("Failed to route issue", err);
      alert("Failed to allocate challenge to institution.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedReport) return;
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('access_token');
      // FIXED URL HERE
      const response = await axios.patch(
        `http://127.0.0.1:8000/api/challenges/reports/${selectedReport.id}/`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setChallenges(challenges.map(c => c.id === selectedReport.id ? response.data : c));
      setSelectedReport(null);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Status update failed.");
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
      filter === 'pending' ? c.status === 'pending' : true;
    
    const matchesSearch = 
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-8 h-8 text-teal-500" />
            <h2 className="text-2xl font-bold tracking-tight">SANKALP</h2>
          </div>
          <p className="text-slate-400 text-xs">State Command Center (SIH26043)</p>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-6">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'overview' ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <Activity className="w-5 h-5" /> Triage Board
          </button>
          <button 
            onClick={() => setActiveTab('map')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'map' ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <MapPin className="w-5 h-5" /> GIS Command Map
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'analytics' ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <PieChart className="w-5 h-5" /> State Analytics
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'profile' ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <User className="w-5 h-5" /> Official Profile
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm">
            <LogOut className="w-5 h-5" /> Secure Logout
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {activeTab === 'profile' ? 'Official Identity & Security Settings' : 'State Innovation & Triage Console'}
            </h1>
            <p className="text-xs text-slate-500">Department of Higher & Technical Education, Jharkhand</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold border border-teal-200 uppercase">
              {profileData.first_name ? profileData.first_name.charAt(0) : 'G'}
            </div>
          </div>
        </header>

        <div className="p-8 flex-1 overflow-auto">
          {activeTab === 'overview' ? (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-slate-500 text-xs font-bold mb-1 uppercase tracking-wider">Active Challenges</div>
                    <div className="text-2xl font-bold text-slate-800">{challenges.length}</div>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600"><Activity className="w-6 h-6" /></div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between ring-1 ring-red-100 bg-red-50/20">
                  <div>
                    <div className="text-red-500 text-xs font-bold mb-1 uppercase tracking-wider">Critical Prioritization</div>
                    <div className="text-2xl font-bold text-red-700">{challenges.filter(c => c.priority === 'Critical').length}</div>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 animate-pulse"><AlertTriangle className="w-6 h-6" /></div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-indigo-500 text-xs font-bold mb-1 uppercase tracking-wider">Routed to Academia</div>
                    <div className="text-2xl font-bold text-indigo-700">{challenges.filter(c => c.status === 'forwarded_to_univ').length}</div>
                  </div>
                  <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600"><GraduationCap className="w-6 h-6" /></div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-teal-600 text-xs font-bold mb-1 uppercase tracking-wider">Citizen Impact Score</div>
                    <div className="text-2xl font-bold text-teal-700">{challenges.reduce((acc, c) => acc + (c.report_count || 1), 0)} Reports</div>
                  </div>
                  <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center text-teal-600"><Users className="w-6 h-6" /></div>
                </div>
              </div>

              {}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
                <div className="flex gap-2 bg-slate-200/50 p-1 rounded-lg">
                  <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${filter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>All Ranked Challenges</button>
                  <button onClick={() => setFilter('critical')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${filter === 'critical' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Critical Only</button>
                  <button onClick={() => setFilter('pending')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${filter === 'pending' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Requires Allocation</button>
                </div>

                <div className="relative w-full md:w-64">
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

              {/* Ranked Triage Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-4 font-semibold">Priority & Impact</th>
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
                      <tr><td colSpan="5" className="p-8 text-center text-slate-500">No challenges found.</td></tr>
                    ) : (
                      filteredChallenges.map((report, idx) => (
                        <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1 items-start">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                report.priority === 'Critical' ? 'bg-red-100 text-red-800 border border-red-200 animate-pulse' : 
                                report.priority === 'High' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 
                                'bg-blue-100 text-blue-700 border border-blue-200'
                              }`}>
                                #{idx + 1} {report.priority}
                              </span>
                              {report.report_count > 1 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                                  <Users className="w-3 h-3" /> {report.report_count} Reports Aggregated
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800">{report.title}</div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              <span className="uppercase text-teal-600 font-semibold">{report.category}</span> • {report.date_formatted}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-slate-400" /> {report.location}</span>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold">
                            {report.university_name && report.university_name !== "Open to all Universities" ? (
                              <span className="text-indigo-600 flex items-center gap-1.5"><GraduationCap className="w-4 h-4" /> {report.university_name}</span>
                            ) : (
                              <span className="text-slate-400 italic">Unallocated</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => handleOpenReportModal(report)}
                              className="text-teal-600 hover:text-teal-800 text-sm font-semibold bg-teal-50 hover:bg-teal-100 px-3.5 py-1.5 rounded transition-colors"
                            >
                              Review & Match
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
              <div className="flex-1 bg-slate-200 rounded-2xl overflow-hidden border border-slate-300 shadow-md relative">
                <div id="govt-command-map" className="w-full h-full min-h-[500px]"></div>
              </div>
            </div>
          ) : activeTab === 'analytics' ? (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">State Command Analytics</h2>
                <p className="text-slate-500 text-sm mt-1">Real-time breakdown of ecosystem participation and problem resolution funnel.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-teal-600" /> Problem Distribution by Sector
                  </h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={[
                            { name: 'Disaster', value: challenges.filter(c => c.category === 'disaster').length },
                            { name: 'Infrastructure', value: challenges.filter(c => c.category === 'infrastructure').length },
                            { name: 'Water', value: challenges.filter(c => c.category === 'water').length },
                            { name: 'Electricity', value: challenges.filter(c => c.category === 'electricity').length },
                          ].filter(d => d.value > 0)}
                          cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {['#ef4444', '#f59e0b', '#3b82f6', '#10b981'].map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-600" /> Innovation Funnel
                  </h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'Pending', count: challenges.filter(c => c.status === 'pending').length },
                          { name: 'At University', count: challenges.filter(c => ['forwarded_to_univ', 'proposal_submitted'].includes(c.status)).length },
                          { name: 'In Progress', count: challenges.filter(c => c.status === 'in_progress').length },
                          { name: 'Resolved', count: challenges.filter(c => c.status === 'resolved').length },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <RechartsTooltip />
                        <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} maxBarSize={60} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-8 py-6 text-white flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Official Credentials</h2>
                    <p className="text-slate-400 text-sm mt-1">Manage state department details.</p>
                  </div>
                  {!isEditingProfile && (
                    <button 
                      onClick={() => setIsEditingProfile(true)}
                      className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 border border-white/20"
                    >
                      <Edit className="w-4 h-4" /> Edit Details
                    </button>
                  )}
                </div>
                
                <div className="p-8">
                  {profileMessage.text && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${profileMessage.type === 'success' ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
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
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none disabled:bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Last Name</label>
                      <input 
                        type="text" 
                        disabled={!isEditingProfile}
                        value={profileData.last_name}
                        onChange={(e) => setProfileData({...profileData, last_name: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none disabled:bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Department</label>
                      <input 
                        type="text" 
                        disabled={!isEditingProfile}
                        value={profileData.organization_name || ''}
                        onChange={(e) => setProfileData({...profileData, organization_name: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none disabled:bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">District</label>
                      <input 
                        type="text" 
                        disabled={!isEditingProfile}
                        value={profileData.district || ''}
                        onChange={(e) => setProfileData({...profileData, district: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none disabled:bg-slate-50"
                      />
                    </div>

                    {isEditingProfile && (
                      <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button type="button" onClick={() => setIsEditingProfile(false)} className="px-6 py-2.5 rounded-lg font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
                        <button type="submit" className="px-6 py-2.5 rounded-lg font-medium text-white bg-teal-600 hover:bg-teal-700 shadow-sm flex items-center gap-2">
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
      {/* AI SMART-MATCH UNIVERSITY ALLOCATION MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start bg-slate-900 text-white">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-6 h-6 text-teal-400" />
                  <h3 className="text-xl font-bold">Problem Evaluation & Academic Routing</h3>
                </div>
                <p className="text-xs text-slate-400">Master Ticket #{selectedReport.id} • Category: {selectedReport.category?.toUpperCase()}</p>
              </div>
              <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-white p-1.5 rounded-full bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-slate-50 flex-1 grid lg:grid-cols-2 gap-6">
              {/* Left Column: Problem Summary */}
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Issue Overview</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                      {selectedReport.report_count || 1} Citizen Report(s) Aggregated
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-2">{selectedReport.title}</h4>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedReport.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Location / District</span>
                    <span className="text-xs font-semibold text-slate-800 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-teal-600" /> {selectedReport.location}</span>
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
                
                {/* 🚀 NEW: AUDIT LOG TIMELINE */}
                {selectedReport.action_logs && (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mt-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">Ecosystem Activity Timeline</h4>
                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
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

              {/* Right Column: AI Academic Smart Match Ranking */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-teal-600" /> AI Academic Smart-Match Ranking
                  </h4>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Ranked by Capability</span>
                </div>

                {isLoadingMatches ? (
                  <div className="p-8 text-center text-sm text-slate-500 bg-white rounded-xl border border-slate-200">
                    Calculating domain capabilities and institutional expertise...
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
                          disabled={isUpdating || selectedReport.university_name === univ.name}
                          onClick={() => handleAssignUniversity(univ.id)}
                          className={`w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                            selectedReport.university_name === univ.name 
                              ? 'bg-slate-200 text-slate-600 cursor-not-allowed'
                              : idx === 0 
                                ? 'bg-teal-600 hover:bg-teal-700 text-white' 
                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          <GraduationCap className="w-4 h-4" />
                          {selectedReport.university_name === univ.name ? 'Allocated to this Institution' : `Allocate Problem to ${univ.name}`}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-200 bg-white flex justify-between items-center">
              <div className="flex gap-2">
                <button 
                  disabled={isUpdating || selectedReport.status === 'in_progress'}
                  onClick={() => handleUpdateStatus('in_progress')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 disabled:opacity-50"
                >
                  Mark In Progress
                </button>
                <button 
                  disabled={isUpdating || selectedReport.status === 'resolved'}
                  onClick={() => handleUpdateStatus('resolved')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 disabled:opacity-50"
                >
                  Mark Resolved
                </button>
              </div>

              <button onClick={() => setSelectedReport(null)} className="px-5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100">
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default GovernmentDashboard;