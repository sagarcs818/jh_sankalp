import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  LogOut, MapPin, BookOpen, Lightbulb, Bell, Search, 
  GraduationCap, X, FileText, CheckCircle, Upload, Microscope,
  User, Edit, Save, Zap, Users, Shield, Menu, Clock, DollarSign,
  FileUp, Paperclip, Trash2, AlertTriangle
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
  const [proposalFile, setProposalFile] = useState(null);
  
  const [deploymentNotes, setDeploymentNotes] = useState('');
  const [resolutionEvidence, setResolutionEvidence] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); 
  const [isEditingProposal, setIsEditingProposal] = useState(false); 
  const [proposalToWithdraw, setProposalToWithdraw] = useState(null);
  
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
      const actionLogEntry = `\n[${new Date().toLocaleDateString()}] UNIVERSITY PROPOSAL ${isEditingProposal ? 'UPDATED' : 'SUBMITTED'}: ${userProfile.organization_name} ${isEditingProposal ? 'updated their' : 'submitted an'} R&D proposal. Awaiting Industry CSR funding.`;

      const formData = new FormData();
      formData.append('status', 'proposal_submitted');
      formData.append('proposal_details', formattedProposal);
      formData.append('assigned_university', userProfile.id);
      formData.append('action_logs', (selectedReport.action_logs || '') + actionLogEntry);
      
      if (proposalFile) {
        formData.append('proposal_document', proposalFile);
      }

      const response = await axios.patch(
        `http://127.0.0.1:8000/api/challenges/reports/${selectedReport.id}/`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data' 
          } 
        }
      );
      
      setChallenges(challenges.map(c => c.id === selectedReport.id ? response.data : c));
      setSelectedReport(response.data); 
      setIsEditingProposal(false);
      setProposalFile(null); 
    } catch (error) {
      console.error("Error submitting proposal:", error);
      alert("Failed to submit proposal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProposalClick = () => {
    const details = selectedReport.proposal_details || '';
    
    // SMART REGEX: Handles any type of line breaks
    const leadMatch = details.match(/FACULTY LEAD:\s*([^\n]+)/);
    const sizeMatch = details.match(/STUDENT TEAM SIZE:\s*([^\n]+)/);
    const propMatch = details.match(/PROPOSAL:\s*([\s\S]+)/); 

    setFacultyLead(leadMatch ? leadMatch[1].trim() : '');
    setTeamSize(sizeMatch ? sizeMatch[1].trim() : '');
    setProposalText(propMatch ? propMatch[1].trim() : '');
    
    setProposalFile(null); 
    setIsEditingProposal(true);
  };

  const executeWithdraw = async () => {
    if (!proposalToWithdraw) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      const actionLogEntry = `\n[${new Date().toLocaleDateString()}] PROPOSAL WITHDRAWN: ${userProfile.organization_name} withdrew their R&D proposal. The challenge is open again.`;

      const formData = new FormData();
      formData.append('status', 'forwarded_to_univ');
      formData.append('proposal_details', '');
      formData.append('action_logs', (proposalToWithdraw.action_logs || '') + actionLogEntry);

      const response = await axios.patch(
        `http://127.0.0.1:8000/api/challenges/reports/${proposalToWithdraw.id}/`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setChallenges(challenges.map(c => c.id === proposalToWithdraw.id ? response.data : c));
      setSelectedReport(null);
      setIsEditingProposal(false);
      setProposalToWithdraw(null); 
    } catch (error) {
      console.error("Error withdrawing:", error);
      alert("Failed to withdraw proposal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkResolved = async () => {
    if (!deploymentNotes.trim()) {
      return alert("Please provide deployment notes or a summary before resolving.");
    }
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      const actionLogEntry = `\n[${new Date().toLocaleDateString()}] PROJECT DEPLOYED: ${userProfile.organization_name} has successfully implemented the solution. Notes: ${deploymentNotes}`;

      const formData = new FormData();
      formData.append('status', 'resolved');
      formData.append('action_logs', (selectedReport.action_logs || '') + actionLogEntry);
      formData.append('deployment_notes', deploymentNotes); 
      
      if (resolutionEvidence) {
        formData.append('resolution_evidence', resolutionEvidence); 
      }

      const response = await axios.patch(
        `http://127.0.0.1:8000/api/challenges/reports/${selectedReport.id}/`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data' 
          } 
        }
      );
      
      setChallenges(challenges.map(c => c.id === selectedReport.id ? response.data : c));
      setSelectedReport(null); 
      setDeploymentNotes('');
      setResolutionEvidence(null);
    } catch (error) {
      console.error("Error resolving project:", error);
      alert("Failed to mark as resolved.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          
          {(activeTab === 'open' || activeTab === 'my_projects') && (
            <>
              {/* Smart Onboarding Banner for missing skills */}
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
                          <span className="text-xs font-bold px-2 py-0.5 rounded uppercase bg-slate-100 text-slate-600">
                            {report.status_display}
                          </span>
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

      {/* R&D PROPOSAL MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start bg-slate-900 text-white shrink-0">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <BookOpen className="w-6 h-6 text-amber-400" />
                  <h3 className="text-xl font-bold">Academic Project Review</h3>
                </div>
                <p className="text-sm text-slate-400">Govt Routed ID: SANKALP-{selectedReport.id.toString().padStart(4, '0')}</p>
              </div>
              <button onClick={() => {setSelectedReport(null); setProposalText(''); setProposalFile(null); setResolutionEvidence(null); setDeploymentNotes(''); setIsEditingProposal(false);}} className="text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-full transition-colors">
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
                {selectedReport.status === 'forwarded_to_univ' || isEditingProposal ? (
                  // STATE 1: Open Challenge, Needs a proposal
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-amber-600" /> {isEditingProposal ? 'Edit R&D Proposal' : 'Submit R&D Proposal'}
                      </h4>
                      {isEditingProposal && (
                        <button onClick={() => setIsEditingProposal(false)} className="text-xs text-slate-500 hover:text-slate-800 font-bold bg-slate-200 px-2 py-1 rounded">Cancel Edit</button>
                      )}
                    </div>
                    
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
                      className="w-full p-3 mb-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none resize-none text-sm bg-white min-h-[120px]"
                    ></textarea>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Upload Diagram / Pitch Deck (Optional)</label>
                      <div className="relative">
                        <input 
                          type="file" 
                          accept="image/*,.pdf,.ppt,.pptx"
                          onChange={(e) => setProposalFile(e.target.files[0])}
                          className="hidden" 
                          id="proposal-upload"
                        />
                        <label 
                          htmlFor="proposal-upload" 
                          className="flex items-center gap-2 w-full p-3 rounded-xl border border-slate-300 border-dashed bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors text-sm text-slate-600"
                        >
                          <Paperclip className="w-4 h-4 text-slate-400" />
                          {proposalFile ? (
                            <span className="font-semibold text-amber-700 truncate">{proposalFile.name}</span>
                          ) : selectedReport.proposal_document && isEditingProposal ? (
                            <span className="font-semibold text-blue-600 truncate">Existing file saved. Click to replace.</span>
                          ) : (
                            <span>{isEditingProposal ? 'Upload a new presentation or photo (Max 10MB)' : 'Click to upload presentation or photos (Max 10MB)'}</span>
                          )}
                        </label>
                      </div>
                    </div>
                    
                    <button 
                      onClick={handleSubmitProposal}
                      disabled={isSubmitting}
                      className="mt-4 w-full py-3 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Upload className="w-5 h-5" /> {isSubmitting ? 'Saving...' : (isEditingProposal ? 'Update Proposal' : 'Submit Proposal & Claim')}
                    </button>
                  </div>
                ) : selectedReport.status === 'proposal_submitted' ? (
                  // STATE 2: Awaiting Industry CSR
                  <div className="flex-1 flex flex-col">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6 text-center shadow-sm">
                      <Clock className="w-10 h-10 text-blue-600 mx-auto mb-2" />
                      <h4 className="text-blue-900 font-bold">Awaiting CSR Funding</h4>
                      <p className="text-blue-700 text-sm mt-1">Proposal submitted successfully. Awaiting industry partner review.</p>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Your R&D Proposal</h4>
                      <div className="flex gap-2">
                        <button onClick={handleEditProposalClick} className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded border border-blue-200 flex items-center gap-1 transition-colors"><Edit className="w-3 h-3"/> Edit</button>
                        <button onClick={() => setProposalToWithdraw(selectedReport)} disabled={isSubmitting} className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 px-2 py-1 rounded border border-red-200 flex items-center gap-1 transition-colors"><Trash2 className="w-3 h-3"/> Withdraw</button>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 text-slate-700 text-sm whitespace-pre-wrap leading-relaxed shadow-sm font-mono mb-4">
                      {selectedReport.proposal_details}
                    </div>

                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Ecosystem Activity Timeline</h4>
                    <div className="bg-slate-900 text-slate-300 p-4 rounded-xl text-xs font-mono whitespace-pre-wrap flex-1 overflow-y-auto">
                      {selectedReport.action_logs || "Timeline initialized..."}
                    </div>
                  </div>
                ) : selectedReport.status === 'in_progress' ? (
                   // STATE 3: Funded & In Progress
                   <div className="flex-1 flex flex-col">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-6 text-center shadow-sm">
                      <DollarSign className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                      <h4 className="text-emerald-900 font-bold">CSR Funding Approved!</h4>
                      <p className="text-emerald-700 text-sm mt-1">Industry partner has funded this project. Please proceed with R&D and deployment.</p>
                    </div>
                    
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Ecosystem Activity Timeline</h4>
                    <div className="bg-slate-900 text-slate-300 p-4 rounded-xl text-xs font-mono whitespace-pre-wrap mb-4 h-32 overflow-y-auto">
                      {selectedReport.action_logs || "Timeline initialized..."}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <FileUp className="w-5 h-5 text-teal-600" /> Proof of Deployment
                    </h4>
                    <p className="text-xs text-slate-500 mb-3">Upload multimedia evidence (Images, PDFs, or PPTs) and final notes to officially close this project.</p>
                    
                    <div className="space-y-4 mb-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Final Deployment Notes</label>
                        <textarea 
                          value={deploymentNotes}
                          onChange={(e) => setDeploymentNotes(e.target.value)}
                          placeholder="Summarize the implementation, impact metrics, and final prototype details..."
                          className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none resize-none text-sm bg-white min-h-[100px]"
                        ></textarea>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Multimedia Evidence (Optional)</label>
                        <div className="relative">
                          <input 
                            type="file" 
                            accept="image/*,.pdf,.ppt,.pptx"
                            onChange={(e) => setResolutionEvidence(e.target.files[0])}
                            className="hidden" 
                            id="resolution-upload"
                          />
                          <label 
                            htmlFor="resolution-upload" 
                            className="flex items-center gap-2 w-full p-3 rounded-xl border border-slate-300 border-dashed bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors text-sm text-slate-600"
                          >
                            <Paperclip className="w-4 h-4 text-slate-400" />
                            {resolutionEvidence ? (
                              <span className="font-semibold text-teal-700 truncate">{resolutionEvidence.name}</span>
                            ) : (
                              <span>Click to upload presentation or photos (Max 10MB)</span>
                            )}
                          </label>
                        </div>
                      </div>
                    </div>
      
                    <div className="mt-auto">
                      <button 
                        onClick={handleMarkResolved}
                        disabled={isSubmitting}
                        className="w-full py-3.5 rounded-xl font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <CheckCircle className="w-5 h-5" /> {isSubmitting ? 'Processing...' : 'Submit Deployment & Mark Resolved'}
                      </button>
                    </div>
                   </div>
                ) : (
                  // STATE 4: Resolved
                  <div className="flex-1 flex flex-col justify-center items-center text-center p-8">
                    <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mb-4 border border-teal-200 shadow-inner">
                      <CheckCircle className="w-10 h-10 text-teal-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Project Successfully Deployed</h3>
                    <p className="text-slate-500 max-w-md">
                      Congratulations! Your university team has successfully implemented the solution and resolved this societal challenge.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WITHDRAW CONFIRMATION MODAL */}
      {proposalToWithdraw && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col transform transition-all">
            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Withdraw Proposal?</h3>
              <p className="text-slate-500 mb-6">
                Are you sure you want to withdraw your R&D proposal for <span className="font-bold text-slate-700">"{proposalToWithdraw.title}"</span>? This action cannot be undone and will release the problem back to the state pool.
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setProposalToWithdraw(null)}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={executeWithdraw}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 shadow-sm transition-colors flex justify-center items-center"
                >
                  {isSubmitting ? 'Withdrawing...' : 'Yes, Withdraw'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UniversityDashboard;