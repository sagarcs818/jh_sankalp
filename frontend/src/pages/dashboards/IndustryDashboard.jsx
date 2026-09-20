import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  LogOut, MapPin, Factory, Bell, 
  CheckCircle, Briefcase, FileText,
  User, Edit, Save, DollarSign, Target, Menu, X, Award,
  BookOpen, Shield, Download, AlertTriangle, Trash2
} from 'lucide-react';

const IndustryDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('open');

  const [challenges, setChallenges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedReport, setSelectedReport] = useState(null);
  const [fundingAmount, setFundingAmount] = useState('');
  const [mentorshipNotes, setMentorshipNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // NEW: Smart Match state for Industry
  const [smartMatchEnabled, setSmartMatchEnabled] = useState(false);
  
  // State for custom error message and withdraw confirmation
  const [uiError, setUiError] = useState('');
  const [investmentToWithdraw, setInvestmentToWithdraw] = useState(null);

  // Use this single declaration with expertise_domain included
  const [userProfile, setUserProfile] = useState({
    organization_name: '', first_name: '', last_name: '', email: '', 
    phone: '', district: '', role: '', expertise_domain: ''
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

        // Fetching reports
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
      setProfileMessage({ text: 'Corporate profile updated successfully!', type: 'success' });
      setTimeout(() => setProfileMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      console.error(error);
      setProfileMessage({ text: 'Failed to update profile.', type: 'error' });
    }
  };

  const handleApproveFunding = async () => {
    if (!fundingAmount.trim() || isNaN(fundingAmount) || Number(fundingAmount) <= 0) {
      setUiError("Please enter a valid CSR funding amount greater than zero.");
      return;
    }
    setUiError(''); 
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('access_token');
      const actionLogEntry = `\n[${new Date().toLocaleDateString()}] INDUSTRY FUNDING APPROVED: ${userProfile.organization_name} allocated ₹${Number(fundingAmount).toLocaleString('en-IN')} for this project. Notes: ${mentorshipNotes || 'None'}`;

      const response = await axios.patch(
        `http://127.0.0.1:8000/api/challenges/reports/${selectedReport.id}/`,
        { 
            status: 'in_progress', 
            assigned_industry: userProfile.id,
            action_logs: (selectedReport.action_logs || '') + actionLogEntry
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setChallenges(challenges.map(c => c.id === selectedReport.id ? response.data : c));
      setSelectedReport(response.data); 
      setFundingAmount('');
      setMentorshipNotes('');
    } catch (error) {
      console.error("Error approving funding:", error);
      setUiError("Failed to approve funding. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeWithdrawFunding = async () => {
    if (!investmentToWithdraw) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      const actionLogEntry = `\n[${new Date().toLocaleDateString()}] CSR FUNDING RETRACTED: ${userProfile.organization_name} has officially withdrawn their funding. The R&D proposal is open for new sponsors.`;

      const response = await axios.patch(
        `http://127.0.0.1:8000/api/challenges/reports/${investmentToWithdraw.id}/`,
        { 
            status: 'proposal_submitted', 
            assigned_industry: null,      
            action_logs: (investmentToWithdraw.action_logs || '') + actionLogEntry
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setChallenges(challenges.map(c => c.id === investmentToWithdraw.id ? response.data : c));
      setSelectedReport(null); 
      setInvestmentToWithdraw(null); 
    } catch (error) {
      console.error("Error withdrawing funding:", error);
      setUiError("Failed to withdraw funding. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // NEW: Filter logic with Smart Match for Industry!
  const getFilteredProposals = () => {
    let list = challenges.filter(c => c.status === 'proposal_submitted');
    
    if (smartMatchEnabled && userProfile?.expertise_domain) {
      const keywords = userProfile.expertise_domain
        .toLowerCase()
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);
      
      list = list.filter(challenge => {
        // Industry looks at the problem category AND the university's proposal!
        const textToSearch = `${challenge.title || ''} ${challenge.description || ''} ${challenge.category || ''} ${challenge.proposal_details || ''}`.toLowerCase();
        return keywords.some(keyword => textToSearch.includes(keyword));
      });
    }
    
    return list;
  };

  const openProposals = getFilteredProposals();
  const myInvestments = challenges.filter(c => c.assigned_industry && String(c.assigned_industry) === String(userProfile?.id) && (c.status === 'in_progress' || c.status === 'resolved'));
  const displayList = activeTab === 'open' ? openProposals : myInvestments;

  const getMediaUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `http://127.0.0.1:8000${path}`;
  };

  const NavLinks = () => (
    <>
      <button onClick={() => {setActiveTab('open'); setMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg shadow-sm transition-colors ${activeTab === 'open' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
        <Target className="w-5 h-5" /> Open Proposals
      </button>
      <button onClick={() => {setActiveTab('my_investments'); setMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg shadow-sm transition-colors ${activeTab === 'my_investments' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
        <Briefcase className="w-5 h-5" /> CSR Portfolio
      </button>
      <button onClick={() => {setActiveTab('profile'); setMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg shadow-sm transition-colors ${activeTab === 'profile' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
        <User className="w-5 h-5" /> Corporate Profile
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">

      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col h-screen sticky top-0 shrink-0">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-1">
            <Factory className="w-8 h-8 text-emerald-500" />
            <h2 className="text-2xl font-bold tracking-tight">SANKALP</h2>
          </div>
          <p className="text-slate-400 text-sm">Industry CSR Hub</p>
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

      <main className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* RESPONSIVE HEADER FIX */}
        <header className="min-h-[64px] py-3 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 z-10">
          <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-slate-500 hover:text-slate-800 shrink-0">
              <Menu className="w-6 h-6" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-bold text-slate-800 leading-tight truncate sm:whitespace-normal">
                {activeTab === 'profile' ? 'Corporate Settings' : userProfile?.organization_name || 'Industry Partner'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button className="text-slate-400 hover:text-emerald-600 transition-colors hidden sm:block">
              <Bell className="w-6 h-6" />
            </button>
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold border border-emerald-200 uppercase shrink-0">
              {userProfile?.organization_name ? userProfile.organization_name.charAt(0) : 'I'}
            </div>
          </div>
        </header>

        {/* MOBILE SIDEBAR OVERLAY FIX */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-slate-900/60 z-[9999] md:hidden" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-64 bg-slate-900 h-full flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-800 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <Factory className="w-6 h-6 text-emerald-500" />
                  <h2 className="text-xl font-bold text-white tracking-tight">SANKALP</h2>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400"><X className="w-5 h-5"/></button>
              </div>
              <nav className="flex-1 px-4 space-y-2 mt-6 overflow-y-auto"><NavLinks /></nav>
              {/* Added Secure Logout to mobile menu */}
              <div className="p-4 border-t border-slate-800 shrink-0">
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm">
                  <LogOut className="w-5 h-5" /> Secure Logout
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 md:p-8 flex-1 overflow-auto bg-slate-50/50">

          {(activeTab === 'open' || activeTab === 'my_investments') && (
            <>
              {/* NEW: Smart Onboarding Banner for Industry */}
              {activeTab === 'open' && !userProfile?.expertise_domain && !isLoading && (
                <div className="mb-6 p-5 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-700 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center shrink-0">
                      <Target className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Define Your CSR Focus Areas</h3>
                      <p className="text-slate-300 text-sm mt-1 max-w-2xl">
                        Add your corporate funding priorities (e.g., Water, Education, Technology) to unlock AI Smart Match and discover relevant academic proposals faster.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('profile')} 
                    className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-md hover:bg-emerald-700 transition-colors whitespace-nowrap w-full md:w-auto"
                  >
                    Set Funding Goals
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-slate-500 text-xs font-bold mb-1 uppercase tracking-wider">Active CSR Projects</div>
                    <div className="text-3xl font-bold text-slate-800">{myInvestments.length}</div>
                  </div>
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600"><Briefcase className="w-6 h-6" /></div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-slate-500 text-xs font-bold mb-1 uppercase tracking-wider">Total Proposals</div>
                    <div className="text-3xl font-bold text-slate-800">{openProposals.length}</div>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600"><FileText className="w-6 h-6" /></div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-6 gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {activeTab === 'open' ? 'Academic Innovation Proposals' : 'Our CSR Portfolio'}
                  </h2>
                  <p className="text-slate-500 mt-1 text-sm">
                    {activeTab === 'open' 
                      ? 'Review R&D proposals from universities and approve funding.' 
                      : 'Projects your organization is actively funding or has successfully resolved.'}
                  </p>
                </div>
                
                {/* NEW: Smart Match Toggle for Industry */}
                {activeTab === 'open' && (
                  <button 
                    onClick={() => setSmartMatchEnabled(!smartMatchEnabled)}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all shadow-sm border ${
                      smartMatchEnabled 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/20' 
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Target className={`w-4 h-4 ${smartMatchEnabled ? 'text-emerald-600' : 'text-slate-400'}`} />
                    AI Match {smartMatchEnabled ? 'ON' : 'OFF'}
                  </button>
                )}
              </div>

              {/* NEW: Warning if Smart Match is ON but profile is empty */}
              {activeTab === 'open' && smartMatchEnabled && !userProfile?.expertise_domain && (
                <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-xl border border-blue-200 flex items-start gap-3 text-sm font-medium">
                  <Shield className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>AI Match requires Funding Focus Areas to be set. Please update your <b>Corporate Profile</b> with your CSR priorities to see tailored results.</p>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {isLoading ? (
                  <div className="col-span-full p-12 text-center text-slate-500">Loading proposals...</div>
                ) : displayList.length === 0 ? (
                  <div className="col-span-full p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
                    <Factory className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium text-lg">No proposals currently available.</p>
                    {smartMatchEnabled && <p className="text-slate-400 text-sm mt-2">Try turning off AI Match or updating your CSR focus keywords.</p>}
                  </div>
                ) : (
                  displayList.map((report) => (
                    <div key={report.id} className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                      <div className="p-5 border-b border-slate-100 flex-1">
                        <div className="flex justify-between items-start mb-3">
                           <span className="text-xs text-slate-400 font-medium">#{report.id.toString().padStart(4, '0')}</span>
                           <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                             report.status === 'resolved' ? 'bg-teal-100 text-teal-800' : 'bg-emerald-100 text-emerald-800'
                           }`}>
                             {report.status === 'resolved' ? 'Resolved' : report.category}
                           </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2">{report.title}</h3>
                        <p className="text-sm text-slate-600 line-clamp-2 mb-4">{report.description}</p>

                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                           <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                             <MapPin className="w-4 h-4 text-slate-400 shrink-0" /> <span className="truncate">{report.location}</span>
                           </div>
                           <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                             <BookOpen className="w-4 h-4 text-slate-400 shrink-0" /> <span className="truncate">{report.university_name}</span>
                           </div>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                         <button onClick={() => setSelectedReport(report)} className="text-emerald-700 font-bold text-sm hover:text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 w-full justify-center">
                            {activeTab === 'open' ? 'Review Proposal' : 'View Project Details'}
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
                    <h2 className="text-2xl font-bold">Corporate Identity Setup</h2>
                    <p className="text-slate-400 text-sm mt-1">Manage your CSR profile and contact details.</p>
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
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Company / Organization Name</label>
                      <input type="text" disabled={!isEditingProfile} value={userProfile.organization_name || ''} onChange={(e) => setUserProfile({...userProfile, organization_name: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-slate-50 disabled:text-slate-500 text-sm" placeholder="e.g., Tata Steel CSR" />
                    </div>

                    {/* NEW: CSR Focus Areas Input */}
                    <div className="md:col-span-2 pt-4 border-t border-slate-100">
                      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5 text-emerald-600" /> CSR Funding Priorities
                      </h3>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Focus Areas (Keywords)</label>
                        <p className="text-xs text-slate-500 mb-2">Separate with commas. The AI uses these to match relevant university proposals to your company.</p>
                        <input type="text" disabled={!isEditingProfile} value={userProfile.expertise_domain || ''} onChange={(e) => setUserProfile({...userProfile, expertise_domain: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-slate-50 disabled:text-slate-700 text-sm font-medium" placeholder="e.g., Clean Water, Solar Energy, Infrastructure, Education" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">First Name (Rep)</label>
                      <input type="text" disabled={!isEditingProfile} value={userProfile.first_name || ''} onChange={(e) => setUserProfile({...userProfile, first_name: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-slate-50 disabled:text-slate-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Last Name (Rep)</label>
                      <input type="text" disabled={!isEditingProfile} value={userProfile.last_name || ''} onChange={(e) => setUserProfile({...userProfile, last_name: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-slate-50 disabled:text-slate-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Official Email</label>
                      <input type="email" disabled value={userProfile.email || ''} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-100 text-slate-500 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">HQ District</label>
                      <input type="text" disabled={!isEditingProfile} value={userProfile.district || ''} onChange={(e) => setUserProfile({...userProfile, district: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-slate-50 disabled:text-slate-500 text-sm" placeholder="e.g., Ranchi" />
                    </div>

                    {isEditingProfile && (
                      <div className="md:col-span-2 flex justify-end gap-3 pt-6 border-t border-slate-100 mt-2">
                        <button type="button" onClick={() => setIsEditingProfile(false)} className="px-6 py-2.5 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors w-full sm:w-auto">Cancel</button>
                        <button type="submit" className="px-6 py-2.5 rounded-lg font-medium text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors flex items-center justify-center gap-2 w-full sm:w-auto">
                          <Save className="w-4 h-4" /> Save Corporate Profile
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

      {/* PROPOSAL REVIEW MODAL (FIXED FOR MOBILE SCROLLING AND FOOTER) */}
      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-0 sm:p-4">
          <div className="bg-white sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto max-w-5xl overflow-hidden flex flex-col sm:max-h-[90vh]">

            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex justify-between items-start bg-slate-900 text-white shrink-0">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <Target className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                  <h3 className="text-lg sm:text-xl font-bold">CSR Funding Review</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-400">Govt Routed ID: SANKALP-{selectedReport.id.toString().padStart(4, '0')}</p>
              </div>
              <button onClick={() => {setSelectedReport(null); setFundingAmount(''); setMentorshipNotes(''); setUiError('');}} className="text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-full transition-colors shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="overflow-y-auto flex-1 bg-slate-50">
              <div className="grid lg:grid-cols-2 h-full">

                {/* Left Side: Challenge & Proposal */}
                <div className="p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-slate-200 space-y-4 sm:space-y-6 bg-white h-full">

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 border-b border-slate-100 pb-2">1. Original Citizen Report</h4>
                    <div>
                      <p className="text-lg font-bold text-slate-900 leading-tight mb-2">{selectedReport.title}</p>
                      <p className="text-sm text-slate-600 mb-2 whitespace-pre-wrap">{selectedReport.description}</p>
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                        <MapPin className="w-3.5 h-3.5" /> {selectedReport.location}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                       <h4 className="text-[10px] sm:text-xs font-bold text-emerald-600 uppercase tracking-wide">2. Academic R&D Proposal</h4>
                       <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> {selectedReport.university_name}
                       </span>
                    </div>

                    <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 text-slate-700 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed font-mono">
                      {selectedReport.proposal_details || "No proposal details provided."}
                    </div>

                    {selectedReport.proposal_document && (
                      <div className="mt-3">
                        <a 
                          href={getMediaUrl(selectedReport.proposal_document)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs sm:text-sm font-bold hover:bg-blue-100 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Download Pitch Deck / Diagram
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Ecosystem Activity Timeline */}
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                     <h4 className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Ecosystem Activity Timeline</h4>
                     <div className="bg-slate-900 text-slate-300 p-3 sm:p-4 rounded-xl text-[10px] sm:text-xs font-mono whitespace-pre-wrap max-h-40 sm:max-h-48 overflow-y-auto">
                       {selectedReport.action_logs || "Timeline initialized..."}
                     </div>
                  </div>

                </div>

                {/* Right Side: Action Area */}
                <div className="p-4 sm:p-6 flex flex-col bg-slate-50 h-full">
                  {selectedReport.status === 'proposal_submitted' ? (
                    // Funding Action State
                    <div className="flex-1 flex flex-col">
                      <div className="bg-white p-4 sm:p-5 rounded-xl border border-emerald-200 shadow-sm mb-4 sm:mb-6">
                        <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                          <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" /> Allocate CSR Funding
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-500 mb-4">Sponsor this academic research to solve the societal challenge.</p>

                        <div className="space-y-3 sm:space-y-4">
                          <div>
                            <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">Funding Amount (₹) <span className="text-red-500">*</span></label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                              <input 
                                type="number" 
                                value={fundingAmount} 
                                onChange={(e) => {
                                  setFundingAmount(e.target.value);
                                }} 
                                placeholder="e.g., 500000" 
                                className={`w-full pl-8 pr-4 py-2 sm:py-2.5 rounded-lg border border-slate-300 focus:ring-emerald-500 focus:ring-2 outline-none text-xs sm:text-sm font-bold bg-white`} 
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">Mentorship & Resource Notes (Optional)</label>
                            <textarea 
                              value={mentorshipNotes}
                              onChange={(e) => setMentorshipNotes(e.target.value)}
                              placeholder="Will you provide engineering mentors or materials?"
                              className="w-full p-2.5 sm:p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none resize-none text-xs sm:text-sm bg-white min-h-[80px] sm:min-h-[100px]"
                            ></textarea>
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto">
                        <button 
                          onClick={handleApproveFunding}
                          disabled={isSubmitting}
                          className="w-full py-2.5 sm:py-3.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                        >
                          <Award className="w-4 h-4 sm:w-5 sm:h-5" /> {isSubmitting ? 'Processing...' : 'Approve Funding & Start Project'}
                        </button>
                        <p className="text-center text-[10px] sm:text-xs text-slate-400 mt-2 sm:mt-3 flex items-center justify-center gap-1">
                          <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> This action is recorded in the immutable ecosystem log.
                        </p>
                      </div>
                    </div>
                  ) : selectedReport.status === 'in_progress' ? (
                    // Active Investment State
                    <div className="flex-1 flex flex-col justify-center items-center text-center p-6 sm:p-8 min-h-[250px]">
                      
                      <div className="w-full flex justify-end mb-4">
                        <button 
                          onClick={() => setInvestmentToWithdraw(selectedReport)}
                          className="text-[10px] sm:text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded border border-red-200 flex items-center gap-1 sm:gap-1.5 transition-colors"
                        >
                          <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5"/> Retract Funding
                        </button>
                      </div>

                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-3 sm:mb-4 border border-emerald-200 shadow-inner">
                        <Award className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Project Funded</h3>
                      <p className="text-xs sm:text-sm text-slate-500 max-w-md">
                        Your organization has successfully sponsored this project. The University team is currently in the R&D and implementation phase.
                      </p>

                      <div className="mt-6 sm:mt-8 w-full max-w-md bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                         <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wide">Project Status</span>
                         <span className="bg-blue-100 text-blue-800 text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 rounded-full uppercase">
                           {selectedReport.status_display}
                         </span>
                      </div>
                    </div>
                  ) : (
                    // NEW: RESOLVED STATE FOR INDUSTRY
                    <div className="flex-1 flex flex-col justify-center items-center text-center p-6 sm:p-8 min-h-[250px]">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-teal-100 rounded-full flex items-center justify-center mb-3 sm:mb-4 border border-teal-200 shadow-inner">
                        <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-teal-600" />
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Project Successfully Deployed</h3>
                      <p className="text-xs sm:text-sm text-slate-500 max-w-md">
                        Congratulations! Your CSR funding successfully brought this academic solution to life and resolved the societal challenge.
                      </p>
                      
                      {selectedReport.resolution_evidence && (
                        <div className="mt-6 sm:mt-8 w-full max-w-md bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-sm">
                          <a 
                            href={getMediaUrl(selectedReport.resolution_evidence)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg text-xs sm:text-sm font-bold hover:bg-teal-100 transition-colors w-full"
                          >
                            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Download Deployment Proof
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* STICKY MODAL FOOTER */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 shrink-0">
              <div className="text-xs sm:text-sm font-semibold text-slate-500 w-full sm:w-auto text-center sm:text-left flex items-center justify-center sm:justify-start gap-2">
                Status: <span className="text-slate-800 bg-slate-100 px-2 py-1 rounded font-bold uppercase text-[10px] sm:text-xs">{selectedReport.status_display}</span>
              </div>
              <button 
                onClick={() => {setSelectedReport(null); setFundingAmount(''); setMentorshipNotes(''); setUiError('');}}
                className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 shadow-sm transition-colors text-xs sm:text-sm"
              >
                Close Window
              </button>
            </div>

          </div>
        </div>
      )}

      {/* WITHDRAW FUNDING CONFIRMATION MODAL */}
      {investmentToWithdraw && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95">
            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1.5 sm:mb-2">Retract CSR Funding?</h3>
              <p className="text-slate-500 mb-5 sm:mb-6 text-sm">
                Are you sure you want to withdraw your CSR funding for <span className="font-bold text-slate-700">"{investmentToWithdraw.title}"</span>? This will return the project to the "Awaiting Funding" stage and cancel your mentorship.
              </p>
              <div className="flex gap-2 sm:gap-3 w-full">
                <button 
                  onClick={() => setInvestmentToWithdraw(null)}
                  className="flex-1 px-4 py-2 sm:py-2.5 rounded-lg font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={executeWithdrawFunding}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 sm:py-2.5 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 shadow-sm transition-colors flex justify-center items-center gap-1.5 sm:gap-2 text-sm"
                >
                  {isSubmitting ? 'Retracting...' : 'Yes, Retract Funding'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM UI ERROR MODAL */}
      {uiError && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95">
            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1.5 sm:mb-2">Action Required</h3>
              <p className="text-slate-500 mb-5 sm:mb-6 text-sm">
                {uiError}
              </p>
              <button 
                onClick={() => setUiError('')}
                className="w-full px-4 py-2 sm:py-2.5 rounded-lg font-bold text-white bg-slate-800 hover:bg-slate-900 shadow-sm transition-colors text-sm"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default IndustryDashboard;