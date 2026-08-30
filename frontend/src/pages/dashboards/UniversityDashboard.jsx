import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  LogOut, MapPin, BookOpen, Lightbulb, Bell, Search, 
  GraduationCap, X, FileText, CheckCircle, Upload, Microscope,
  User, Edit, Save, Zap, Users, Shield, Menu
} from 'lucide-react';

const UniversityDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('open'); // 'open', 'my_projects', 'profile'
  
  const [challenges, setChallenges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [smartMatchEnabled, setSmartMatchEnabled] = useState(false); // AI Smart Match Toggle
  
  const [selectedReport, setSelectedReport] = useState(null);
  const [proposalText, setProposalText] = useState('');
  const [facultyLead, setFacultyLead] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // NEW: Mobile sidebar toggle
  
  const [userProfile, setUserProfile] = useState({
    organization_name: '', first_name: '', last_name: '', email: '', 
    phone: '', district: '', expertise_domain: '', tech_capabilities: ''
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const headers = { Authorization: `Bearer ${token}` };

        const profileRes = await axios.get('http://127.0.0.1:8000/api/auth/profile/', { headers });
        setUserProfile(profileRes.data);

        const reportsRes = await axios.get('http://127.0.0.1:8000/api/challenges/reports/', { headers });
        setChallenges(reportsRes.data);

      } catch (error) {
        console.error("Error fetching data", error);
        if (error.response?.status === 401) handleLogout();
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

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
      const response = await axios.patch('http://127.0.0.1:8000/api/auth/profile/', userProfile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserProfile(response.data);
      setIsEditingProfile(false);
      setProfileMessage({ text: 'Academic profile updated successfully!', type: 'success' });
      setTimeout(() => setProfileMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      console.error(error);
      setProfileMessage({ text: 'Failed to update profile.', type: 'error' });
    }
  };

  const handleSubmitProposal = async () => {
    if (!proposalText.trim() || !facultyLead.trim() || !teamSize.trim()) {
      return alert("Please fill out the proposal, faculty lead, and team size.");
    }
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('access_token');
      const formattedProposal = `FACULTY LEAD: ${facultyLead}\nSTUDENT TEAM SIZE: ${teamSize}\n\nPROPOSAL:\n${proposalText}`;
      
      const response = await axios.patch(
        `http://127.0.0.1:8000/api/challenges/reports/${selectedReport.id}/`,
        { 
            status: 'proposal_submitted',
            proposal_details: formattedProposal,
            assigned_university: userProfile.id 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setChallenges(challenges.map(c => c.id === selectedReport.id ? response.data : c));
      setSelectedReport(null); 
      setProposalText('');
      setFacultyLead('');
      setTeamSize('');
    } catch (error) {
      console.error("Error submitting proposal:", error);
      alert("Failed to submit proposal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // SMART MATCH LOGIC: Filters challenges based on University's expertise
  const getFilteredChallenges = () => {
    let list = challenges.filter(c => c.status === 'forwarded_to_univ');
    
    if (smartMatchEnabled && userProfile.expertise_domain) {
      const expertiseKeywords = userProfile.expertise_domain.toLowerCase().split(',').map(k => k.trim());
      list = list.filter(challenge => {
        const textToSearch = `${challenge.title} ${challenge.description} ${challenge.category}`.toLowerCase();
        return expertiseKeywords.some(keyword => keyword && textToSearch.includes(keyword));
      });
    }
    return list;
  };

  const openChallenges = getFilteredChallenges();
  const myProjects = challenges.filter(c => c.assigned_university === userProfile?.id);
  const displayList = activeTab === 'open' ? openChallenges : myProjects;

  const NavLinks = () => (
    <>
      <button onClick={() => {setActiveTab('open'); setMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg shadow-sm transition-colors ${activeTab === 'open' ? 'bg-amber-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
        <Lightbulb className="w-5 h-5" /> State Challenges
      </button>
      <button onClick={() => {setActiveTab('my_projects'); setMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg shadow-sm transition-colors ${activeTab === 'my_projects' ? 'bg-amber-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
        <Microscope className="w-5 h-5" /> Active Projects
      </button>
      <button onClick={() => {setActiveTab('profile'); setMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg shadow-sm transition-colors ${activeTab === 'profile' ? 'bg-amber-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
        <User className="w-5 h-5" /> Hub Profile
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col h-screen sticky top-0 shrink-0">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-8 h-8 text-amber-500" />
            <h2 className="text-2xl font-bold tracking-tight">SANKALP</h2>
          </div>
          <p className="text-slate-400 text-sm">Academic R&D Hub</p>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-6">
          <NavLinks />
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white transition-colors">
            <LogOut className="w-5 h-5" /> Secure Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-slate-500 hover:text-slate-800">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-slate-800 hidden sm:block">
              {activeTab === 'profile' ? 'Institution Settings' : userProfile?.organization_name || 'University Innovation Center'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-amber-600 transition-colors">
              <Bell className="w-6 h-6" />
            </button>
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-bold border border-amber-200 uppercase">
              {userProfile?.organization_name ? userProfile.organization_name.charAt(0) : 'U'}
            </div>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-slate-900/60 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-64 bg-slate-900 h-full flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-amber-500" />
                  <h2 className="text-xl font-bold text-white tracking-tight">SANKALP</h2>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400"><X className="w-5 h-5"/></button>
              </div>
              <nav className="flex-1 px-4 space-y-2 mt-6"><NavLinks /></nav>
            </div>
          </div>
        )}

        {/* Scrollable Workspace */}
        <div className="p-4 md:p-8 flex-1 overflow-auto bg-slate-50/50">
          
          {}
          {(activeTab === 'open' || activeTab === 'my_projects') && (
            <>
              {/* NEW: Smart Onboarding Banner for missing skills */}
              {activeTab === 'open' && !userProfile?.expertise_domain && !isLoading && (
                <div className="mb-6 p-5 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-700 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center shrink-0">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Complete Your Academic Profile</h3>
                      <p className="text-slate-300 text-sm mt-1 max-w-2xl">
                        Add your university's domain expertise (e.g., IoT, Water Management) and lab infrastructure to unlock the AI Smart Match feature and receive targeted projects.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('profile')} 
                    className="px-6 py-2.5 bg-amber-600 text-white font-bold rounded-xl shadow-md hover:bg-amber-700 transition-colors whitespace-nowrap w-full md:w-auto"
                  >
                    Set Up Profile
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-6 gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {activeTab === 'open' ? 'Open State Challenges' : 'Our R&D Projects'}
                  </h2>
                  <p className="text-slate-500 mt-1 text-sm">
                    {activeTab === 'open' 
                      ? 'Societal issues routed by the Government seeking academic solutions.' 
                      : 'Challenges your institution is currently solving or prototyping.'}
                  </p>
                </div>
                
                {/* AI SMART MATCH TOGGLE */}
                {activeTab === 'open' && (
                  <button 
                    onClick={() => setSmartMatchEnabled(!smartMatchEnabled)}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all shadow-sm border ${
                      smartMatchEnabled 
                        ? 'bg-amber-100 text-amber-800 border-amber-300 ring-2 ring-amber-500/20' 
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Zap className={`w-4 h-4 ${smartMatchEnabled ? 'text-amber-600' : 'text-slate-400'}`} />
                    Smart Match {smartMatchEnabled ? 'ON' : 'OFF'}
                  </button>
                )}
              </div>

              {activeTab === 'open' && smartMatchEnabled && !userProfile?.expertise_domain && (
                <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-xl border border-blue-200 flex items-start gap-3 text-sm font-medium">
                  <Shield className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>Smart Match requires Domain Expertise to be set. Please update your <b>Hub Profile</b> with your academic specialties to see tailored results.</p>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {isLoading ? (
                  <div className="col-span-full p-12 text-center text-slate-500">Loading academic hub data...</div>
                ) : displayList.length === 0 ? (
                  <div className="col-span-full p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
                    <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium text-lg">No challenges found.</p>
                    {smartMatchEnabled && <p className="text-slate-400 text-sm mt-1">Try turning off Smart Match or updating your expertise keywords.</p>}
                  </div>
                ) : (
                  displayList.map((report) => (
                    <div key={report.id} className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                      <div className="p-5 border-b border-slate-100 flex-1">
                        <div className="flex justify-between items-start mb-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                            report.priority === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {report.priority} Priority
                          </span>
                          <span className="text-xs text-slate-400 font-medium">{report.date_formatted}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2">{report.title}</h3>
                        <p className="text-sm text-slate-600 line-clamp-3 mb-4">{report.description}</p>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" /> <span className="truncate">{report.location}</span>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 flex justify-between items-center">
                         <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                            {report.category}
                         </div>
                         <button onClick={() => setSelectedReport(report)} className="text-amber-700 font-bold text-sm hover:text-amber-800 bg-amber-100 hover:bg-amber-200 px-4 py-1.5 rounded-lg transition-colors">
                            {activeTab === 'open' ? 'View & Claim' : 'Manage Project'}
                         </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {}
          {activeTab === 'profile' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-6 py-6 md:px-8 text-white flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold">University & Lab Setup</h2>
                    <p className="text-slate-400 text-sm mt-1">Define your institution's expertise to get AI-matched challenges.</p>
                  </div>
                  {!isEditingProfile && (
                    <button onClick={() => setIsEditingProfile(true)} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 border border-white/20 whitespace-nowrap">
                      <Edit className="w-4 h-4" /> Edit Profile
                    </button>
                  )}
                </div>
                
                <div className="p-6 md:p-8">
                  {profileMessage.text && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${profileMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      <CheckCircle className="w-5 h-5 shrink-0" /> {profileMessage.text}
                    </div>
                  )}

                  <form onSubmit={handleProfileUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Institution Name</label>
                        <input type="text" disabled={!isEditingProfile} value={userProfile.organization_name || ''} onChange={(e) => setUserProfile({...userProfile, organization_name: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none disabled:bg-slate-50 disabled:text-slate-500 text-sm" placeholder="e.g., NIT Jamshedpur" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">District / Location</label>
                        <input type="text" disabled={!isEditingProfile} value={userProfile.district || ''} onChange={(e) => setUserProfile({...userProfile, district: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none disabled:bg-slate-50 disabled:text-slate-500 text-sm" placeholder="e.g., East Singhbhum" />
                      </div>
                    </div>

                    <div className="md:col-span-2 pt-4 border-t border-slate-100">
                      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-500" /> Research & Tech Capabilities
                      </h3>
                    </div>

                    {/* Smart Match Fields */}
                    <div className="md:col-span-2 space-y-5">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Domain Expertise (Keywords)</label>
                        <p className="text-xs text-slate-500 mb-2">Separate with commas. The AI uses these to route relevant challenges to your hub.</p>
                        <input type="text" disabled={!isEditingProfile} value={userProfile.expertise_domain || ''} onChange={(e) => setUserProfile({...userProfile, expertise_domain: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none disabled:bg-slate-50 disabled:text-slate-700 text-sm font-medium" placeholder="e.g., IoT, Machine Learning, Civil Engineering, Floods" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Lab Infrastructure & Tech Stack</label>
                        <textarea disabled={!isEditingProfile} value={userProfile.tech_capabilities || ''} onChange={(e) => setUserProfile({...userProfile, tech_capabilities: e.target.value})} rows="3" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none disabled:bg-slate-50 disabled:text-slate-700 text-sm resize-none" placeholder="e.g., 3D Printing Lab, Nvidia DGX Cluster, Drone Tech..." />
                      </div>
                    </div>

                    {isEditingProfile && (
                      <div className="md:col-span-2 flex justify-end gap-3 pt-6 border-t border-slate-100 mt-2">
                        <button type="button" onClick={() => setIsEditingProfile(false)} className="px-6 py-2.5 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors w-full sm:w-auto">Cancel</button>
                        <button type="submit" className="px-6 py-2.5 rounded-lg font-medium text-white bg-amber-600 hover:bg-amber-700 shadow-sm transition-colors flex items-center justify-center gap-2 w-full sm:w-auto">
                          <Save className="w-4 h-4" /> Save Profile
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
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start bg-slate-900 text-white shrink-0">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <BookOpen className="w-6 h-6 text-amber-400" />
                  <h3 className="text-xl font-bold">Academic Project Review</h3>
                </div>
                <p className="text-sm text-slate-400">Govt Routed ID: SANKALP-{selectedReport.id.toString().padStart(4, '0')}</p>
              </div>
              <button onClick={() => {setSelectedReport(null); setProposalText('');}} className="text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto bg-slate-50 flex-1 grid md:grid-cols-2">
              
              {/* Left Side: Challenge Details */}
              <div className="p-6 border-b md:border-b-0 md:border-r border-slate-200 space-y-6 bg-white">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Problem Statement</h4>
                  <p className="text-xl font-bold text-slate-900">{selectedReport.title}</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-amber-600"/> {selectedReport.location}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="uppercase text-amber-700">{selectedReport.category}</span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Issue Description</h4>
                  <div className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
                    {selectedReport.description}
                  </div>
                </div>
              </div>

              {/* Right Side: Academic Action Area */}
              <div className="p-6 flex flex-col bg-slate-50">
                {selectedReport.status === 'forwarded_to_univ' ? (
                  // STATE 1: Open Challenge, Needs a proposal
                  <div className="flex-1 flex flex-col">
                    <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-amber-600" /> Submit R&D Proposal
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Faculty Lead (Mentor)</label>
                        <input type="text" value={facultyLead} onChange={(e) => setFacultyLead(e.target.value)} placeholder="Dr. Name..." className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none text-sm bg-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Student Team Size</label>
                        <input type="number" value={teamSize} onChange={(e) => setTeamSize(e.target.value)} placeholder="e.g. 4" className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none text-sm bg-white" />
                      </div>
                    </div>

                    <label className="block text-xs font-bold text-slate-600 mb-1">Solution Architecture & Approach</label>
                    <textarea 
                      value={proposalText}
                      onChange={(e) => setProposalText(e.target.value)}
                      placeholder="Describe your tech stack, required lab equipment, and estimated timeframe..."
                      className="flex-1 w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none resize-none text-sm bg-white min-h-[150px]"
                    ></textarea>
                    
                    <button 
                      onClick={handleSubmitProposal}
                      disabled={isSubmitting}
                      className="mt-4 w-full py-3 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Upload className="w-5 h-5" /> {isSubmitting ? 'Submitting...' : 'Submit Proposal & Claim'}
                    </button>
                  </div>
                ) : (
                  // STATE 2: Already Claimed / Proposal Submitted
                  <div className="flex-1 flex flex-col">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-6 text-center shadow-sm">
                      <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                      <h4 className="text-emerald-900 font-bold">Proposal Submitted</h4>
                      <p className="text-emerald-700 text-sm mt-1">Project is active. Awaiting Industry CSR Review.</p>
                    </div>
                    
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Your R&D Proposal Details</h4>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 text-slate-700 text-sm whitespace-pre-wrap leading-relaxed shadow-sm flex-1 overflow-y-auto font-mono">
                      {selectedReport.proposal_details}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UniversityDashboard;