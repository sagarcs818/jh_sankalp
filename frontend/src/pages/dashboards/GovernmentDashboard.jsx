import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  LogOut, MapPin, AlertTriangle, CheckCircle, 
  Activity, Bell, Users, Search, ShieldCheck, X,
  User, Edit, Save, Building, Phone, Mail, PieChart
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell 
} from 'recharts';

// Helper function to generate mock GPS coordinates around Jharkhand based on text
// (Used as a fallback if the citizen only provided a text address instead of GPS)
const getCoordinates = (locationStr) => {
  let hash = 0;
  if (locationStr) {
    for (let i = 0; i < locationStr.length; i++) {
      hash = locationStr.charCodeAt(i) + ((hash << 5) - hash);
    }
  }
  const baseLat = 23.3441; // Ranchi Lat
  const baseLng = 85.3096; // Ranchi Lng
  
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
  
  const [selectedReport, setSelectedReport] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [profileData, setProfileData] = useState({
    first_name: '', last_name: '', email: '', phone: '', district: '', role: '', organization_name: ''
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });

  // Map References
  const mapRef = useRef(null);
  const markersRef = useRef([]);

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
        setChallenges(reportsRes.data);

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

  // NEW: Real Interactive GIS Command Map Logic
  useEffect(() => {
    if (activeTab !== 'map' || isLoading) return;

    let mapInstance = null;

    const initMap = () => {
      if (!window.L || !document.getElementById('govt-command-map')) return;

      if (window.L.DomUtil.get('govt-command-map') !== null) {
          window.L.DomUtil.get('govt-command-map')._leaflet_id = null;
      }

      // Initialize map (Centered on Jharkhand)
      mapInstance = window.L.map('govt-command-map').setView([23.6, 85.5], 7);
      mapRef.current = mapInstance;

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap'
      }).addTo(mapInstance);

      const bounds = window.L.latLngBounds();
      let hasValidCoords = false;

      challenges.forEach(report => {
        let lat = null;
        let lng = null;
        
        if (report.location) {
          // Strictly check if it's an exact GPS coordinate (e.g. "23.344, 85.309")
          const gpsRegex = /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/;
          if (gpsRegex.test(report.location)) {
            const parts = report.location.split(',');
            lat = parseFloat(parts[0]);
            lng = parseFloat(parts[1]);
          } else {
            // Fallback for addresses containing text/commas (e.g. "Kurud, Dhamtari")
            const coords = getCoordinates(report.location);
            lat = coords[0];
            lng = coords[1];
          }
        }

        if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
          hasValidCoords = true;
          bounds.extend([lat, lng]);

          let colorClass = 'text-blue-600';
          let badgeClass = 'bg-blue-100 text-blue-700';
          let pulseClass = '';

          if (report.priority === 'Critical') {
            colorClass = 'text-red-600';
            badgeClass = 'bg-red-100 text-red-700';
            pulseClass = 'animate-bounce';
          } else if (report.priority === 'High') {
            colorClass = 'text-orange-600';
            badgeClass = 'bg-orange-100 text-orange-700';
          } else if (report.status === 'resolved') {
            colorClass = 'text-teal-600';
            badgeClass = 'bg-teal-100 text-teal-700';
          }

          const customIcon = window.L.divIcon({
            className: 'bg-transparent',
            html: `<div class="${colorClass} drop-shadow-xl -mt-8 -ml-4 ${pulseClass} cursor-pointer transition-transform hover:scale-125">
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                      <circle cx="12" cy="10" r="3" fill="white"></circle>
                    </svg>
                  </div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 36]
          });

          const marker = window.L.marker([lat, lng], { icon: customIcon }).addTo(mapInstance);

          marker.bindPopup(`
            <div class="p-1 min-w-[220px] font-sans">
              <div class="text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Report #${report.id}</div>
              <div class="font-bold text-slate-900 text-sm mb-2 leading-tight">${report.title}</div>
              <div class="flex gap-2 mb-3">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded uppercase ${badgeClass}">${report.priority}</span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-slate-100 text-slate-700">${report.status_display || report.status}</span>
              </div>
              <p class="text-xs text-slate-600 line-clamp-2 mb-2">${report.description}</p>
              <div class="text-xs font-semibold text-teal-600 mt-2">Click pin to review full details ➔</div>
            </div>
          `);

          marker.on('click', () => {
            setSelectedReport(report);
          });

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

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
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
      console.error(error);
      setProfileMessage({ text: 'Failed to update profile.', type: 'error' });
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
      alert("Failed to update status. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredChallenges = challenges.filter(c => {
    if (filter === 'critical') return c.priority === 'Critical';
    if (filter === 'pending') return c.status === 'pending';
    return true;
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
          <p className="text-slate-400 text-sm">State Command Center</p>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-6">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg shadow-sm transition-colors ${activeTab === 'overview' ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <Activity className="w-5 h-5" /> Triage Board
          </button>
          
          <button 
            onClick={() => setActiveTab('map')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg shadow-sm transition-colors ${activeTab === 'map' ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <MapPin className="w-5 h-5" /> GIS Map View
          </button>

          <button 
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg shadow-sm transition-colors ${activeTab === 'analytics' ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <PieChart className="w-5 h-5" /> State Analytics
          </button>

          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg shadow-sm transition-colors ${activeTab === 'profile' ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <User className="w-5 h-5" /> Official Profile
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white transition-colors">
            <LogOut className="w-5 h-5" /> Secure Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-xl font-semibold text-slate-800">
            {activeTab === 'profile' ? 'Official Identity & Settings' : `Welcome, Officer ${profileData.last_name || ''}`}
          </h1>
          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-teal-600 transition-colors relative">
              <Bell className="w-6 h-6" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold border border-teal-200 uppercase">
              {profileData.first_name ? profileData.first_name.charAt(0) : 'G'}
            </div>
          </div>
        </header>

        <div className="p-8 flex-1 overflow-auto bg-slate-50/50">
          
          {activeTab === 'overview' ? (
            <>
              {/* Top Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-slate-500 text-xs font-bold mb-1 uppercase tracking-wider">Total Active</div>
                    <div className="text-2xl font-bold text-slate-800">{challenges.length}</div>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600"><Activity className="w-6 h-6" /></div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between ring-1 ring-red-100 bg-red-50/20">
                  <div>
                    <div className="text-red-500 text-xs font-bold mb-1 uppercase tracking-wider">AI Critical Alerts</div>
                    <div className="text-2xl font-bold text-red-700">{challenges.filter(c => c.priority === 'Critical').length}</div>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 animate-pulse"><AlertTriangle className="w-6 h-6" /></div>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
                <div className="flex gap-2 bg-slate-200/50 p-1 rounded-lg">
                  <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${filter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>All Reports</button>
                  <button onClick={() => setFilter('critical')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${filter === 'critical' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Critical Only</button>
                  <button onClick={() => setFilter('pending')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${filter === 'pending' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Requires Action</button>
                </div>
                
                <div className="relative w-full md:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" placeholder="Search locations or ID..." className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-4 font-semibold">Issue Details</th>
                      <th className="px-6 py-4 font-semibold">Location</th>
                      <th className="px-6 py-4 font-semibold">AI Priority</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr><td colSpan="5" className="p-8 text-center text-slate-500">Loading state data...</td></tr>
                    ) : filteredChallenges.length === 0 ? (
                      <tr><td colSpan="5" className="p-8 text-center text-slate-500">No reports found matching your criteria.</td></tr>
                    ) : (
                      filteredChallenges.map((report) => (
                        <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800">{report.title}</div>
                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                              <span className="uppercase text-teal-600 font-semibold">{report.category}</span>
                              <span>•</span> {report.date_formatted}
                              <span>•</span> <span className="flex items-center gap-1"><User className="w-3 h-3" /> {report.reporter_name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-slate-400" /> {report.location}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                              report.priority === 'Critical' ? 'bg-red-100 text-red-800 border border-red-200 animate-pulse' : 
                              report.priority === 'High' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 
                              'bg-blue-100 text-blue-700 border border-blue-200'
                            }`}>
                              {report.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                               report.status === 'resolved' ? 'bg-teal-100 text-teal-700' : 
                               report.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 
                               'bg-amber-100 text-amber-700'
                            }`}>
                              {report.status_display}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => setSelectedReport(report)}
                              className="text-teal-600 hover:text-teal-800 text-sm font-semibold bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded transition-colors"
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : activeTab === 'analytics' ? (
            <div className="space-y-6">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900">State Command Analytics</h2>
                <p className="text-slate-500 mt-1">Real-time breakdown of societal challenges and ecosystem progress.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Chart 1: Issue Distribution by Category */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-teal-600" /> Issues by Category
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
                        <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Project Lifecycle Funnel */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-600" /> Resolution Funnel
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
                        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} maxBarSize={60} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            </div>
          ) : activeTab === 'map' ? (
            /* REAL INTERACTIVE GIS COMMAND MAP */
            <div className="h-full flex flex-col min-h-[600px] animate-in fade-in duration-300">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">GIS Command Map</h2>
                <p className="text-slate-500 mt-1">Real-time geospatial tracking of active and resolved challenges across Jharkhand.</p>
              </div>
              
              <div className="flex gap-4 mb-4 bg-white p-3 rounded-lg shadow-sm border border-slate-200 inline-flex w-fit">
                 <div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><div className="w-3 h-3 rounded-full bg-red-500 shadow-sm border border-white"></div> Critical</div>
                 <div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><div className="w-3 h-3 rounded-full bg-orange-500 shadow-sm border border-white"></div> High</div>
                 <div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm border border-white"></div> Normal</div>
                 <div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><div className="w-3 h-3 rounded-full bg-teal-500 shadow-sm border border-white"></div> Resolved</div>
              </div>

              {/* The Real Map Container */}
              <div className="flex-1 bg-slate-200 rounded-2xl overflow-hidden border border-slate-300 shadow-md relative z-0 flex flex-col">
                  <div id="govt-command-map" className="flex-1 w-full z-10"></div>
                  
                  <div className="absolute bottom-6 right-6 z-20 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-slate-200 text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-teal-600" />
                    Tracking {challenges.length} Active Zones
                  </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-8 py-6 text-white flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Official Credentials</h2>
                    <p className="text-slate-400 text-sm mt-1">Manage your department details and contact info.</p>
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
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Last Name</label>
                      <input 
                        type="text" 
                        disabled={!isEditingProfile}
                        value={profileData.last_name}
                        onChange={(e) => setProfileData({...profileData, last_name: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Official Email (Read Only)</label>
                      <input 
                        type="email" 
                        disabled
                        value={profileData.email}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-100 text-slate-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Contact Number</label>
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
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                        placeholder="e.g., 9876543210"
                      />
                    </div>
                    
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-slate-50 rounded-xl border border-slate-200 mt-2">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
                          <Building className="w-4 h-4 text-slate-400" /> Department / Organization
                        </label>
                        <input 
                          type="text" 
                          disabled={!isEditingProfile}
                          value={profileData.organization_name || ''}
                          onChange={(e) => setProfileData({...profileData, organization_name: e.target.value})}
                          placeholder="e.g., Municipal Corporation"
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none disabled:bg-white disabled:text-slate-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Jurisdiction / District</label>
                        <input 
                          type="text" 
                          disabled={!isEditingProfile}
                          value={profileData.district || ''}
                          onChange={(e) => setProfileData({...profileData, district: e.target.value})}
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none disabled:bg-white disabled:text-slate-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-1">System Role</label>
                        <div className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white flex items-center">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800 text-white">
                            {profileData.role}
                          </span>
                        </div>
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
                          className="px-6 py-2.5 rounded-lg font-medium text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-colors flex items-center gap-2"
                        >
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

      {/* GOV MODAL: Review & Action Report */}
      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start bg-slate-900 text-white">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <ShieldCheck className="w-6 h-6 text-teal-400" />
                  <h3 className="text-xl font-bold">Official Triage Review</h3>
                </div>
                <p className="text-sm text-slate-400">Report ID: SANKALP-{selectedReport.id.toString().padStart(4, '0')}</p>
              </div>
              <button 
                onClick={() => setSelectedReport(null)} 
                className="text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 p-1.5 rounded-full"
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
                    <span className="flex items-center gap-1 text-sm font-semibold text-slate-800"><MapPin className="w-4 h-4 text-teal-600"/> {selectedReport.location}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">AI Priority</span>
                    <span className={`text-sm font-bold uppercase ${selectedReport.priority === 'Critical' ? 'text-red-600' : selectedReport.priority === 'High' ? 'text-orange-600' : 'text-blue-600'}`}>
                      {selectedReport.priority}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-200/50 p-4 rounded-xl border border-slate-200 flex flex-col gap-3 shadow-inner">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Reported By</h4>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-800">
                      <div className="w-10 h-10 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center border border-teal-200 shadow-sm shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-base text-slate-900">{selectedReport.reporter_name}</div>
                        {selectedReport.reporter_email && (
                          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3.5 h-3.5" /> {selectedReport.reporter_email}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      {selectedReport.reporter_phone ? (
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                          <Phone className="w-4 h-4 text-teal-600" />
                          {selectedReport.reporter_phone}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-400 bg-white/50 px-3 py-2 rounded-lg border border-slate-200 border-dashed">
                          <Phone className="w-4 h-4 opacity-50" />
                          No phone provided
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Citizen Description</h4>
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
            
            <div className="px-6 py-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm font-semibold text-slate-500">
                Current Status: <span className="text-slate-800 bg-slate-100 px-2 py-1 rounded">{selectedReport.status_display}</span>
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto flex-wrap justify-end">
                <button 
                  disabled={isUpdating || selectedReport.status !== 'pending'}
                  onClick={() => handleUpdateStatus('forwarded_to_univ')}
                  className="px-4 py-2 rounded-lg font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors disabled:opacity-50 shadow-sm"
                >
                  Route to University
                </button>
                <button 
                  disabled={isUpdating || selectedReport.status === 'in_progress'}
                  onClick={() => handleUpdateStatus('in_progress')}
                  className="px-4 py-2 rounded-lg font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50"
                >
                  In Progress
                </button>
                <button 
                  disabled={isUpdating || selectedReport.status === 'resolved'}
                  onClick={() => handleUpdateStatus('resolved')}
                  className="px-4 py-2 rounded-lg font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-colors disabled:opacity-50"
                >
                  Mark Resolved
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default GovernmentDashboard;