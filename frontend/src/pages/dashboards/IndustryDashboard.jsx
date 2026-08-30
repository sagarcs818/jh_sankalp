import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  LogOut, MapPin, Building, Briefcase, Bell, Search, 
  Factory, X, FileText, CheckCircle, TrendingUp,
  User, Edit, Save, Handshake, Users, Menu
} from 'lucide-react';

const IndustryDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('open'); // 'open', 'my_investments', 'profile'
  
  const [challenges, setChallenges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [selectedReport, setSelectedReport] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [userProfile, setUserProfile] = useState({
    organization_name: '', first_name: '', last_name: '', email: '', 
    phone: '', district: '', expertise_domain: ''
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
      setProfileMessage({ text: 'CSR profile updated successfully!', type: 'success' });
      setTimeout(() => setProfileMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      console.error(error);
      setProfileMessage({ text: 'Failed to update profile.', type: 'error' });
    }
  };

  const handleApproveFunding = async () => {
    if (!window.confirm("Approve CSR funding and mentorship for this University proposal?")) return;
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await axios.patch(
        `http://127.0.0.1:8000/api/challenges/reports/${selectedReport.id}/`,
        { 
            status: 'in_progress', // Move it from proposed to implementation
            assigned_industry: userProfile.id 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setChallenges(challenges.map(c => c.id === selectedReport.id ? response.data : c));
      setSelectedReport(null); 
    } catch (error) {
      console.error("Error submitting funding:", error);
      alert("Failed to approve funding.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // CSR Pipeline Logic
  // Show challenges that have a proposal from a university
  const openProposals = challenges.filter(c => c.status === 'proposal_submitted');
  // Show challenges this specific company funded
  const myInvestments = challenges.filter(c => c.assigned_industry === userProfile?.id);
  
  const displayList = activeTab === 'open' ? openProposals : myInvestments;

  const NavLinks = () => (
    <>
      <button onClick={() => {setActiveTab('open'); setMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg shadow-sm transition-colors ${activeTab === 'open' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
        <FileText className="w-5 h-5" /> University Proposals
      </button>
      <button onClick={() => {setActiveTab('my_investments'); setMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg shadow-sm transition-colors ${activeTab === 'my_investments' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
        <Handshake className="w-5 h-5" /> Our CSR Investments
      </button>
      <button onClick={() => {setActiveTab('profile'); setMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg shadow-sm transition-colors ${activeTab === 'profile' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
        <Building className="w-5 h-5" /> Company Profile
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col h-screen sticky top-0 shrink-0">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-1">
            <Factory className="w-8 h-8 text-indigo-400" />
            <h2 className="text-2xl font-bold tracking-tight">SANKALP</h2>
          </div>
          <p className="text-slate-400 text-sm">Industry CSR Portal</p>
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
              {activeTab === 'profile' ? 'CSR Settings' : userProfile?.organization_name || 'Industry Partner'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-indigo-600 transition-colors">
              <Bell className="w-6 h-6" />
            </button>
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 uppercase">
              {userProfile?.organization_name ? userProfile.organization_name.charAt(0) : 'I'}
            </div>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-slate-900/60 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-64 bg-slate-900 h-full flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Factory className="w-6 h-6 text-indigo-400" />
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
          
          {/* BANNER FOR MISSING PROFILE */}
          {activeTab === 'open' && !userProfile?.expertise_domain && !isLoading && (
            <div className="mb-6 p-5 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 border border-indigo-800">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center shrink-0">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Define CSR Focus Areas</h3>
                  <p className="text-slate-300 text-sm mt-1 max-w-2xl">
                    Add your company's CSR mandate (e.g., Environment, Education) to help universities send you tailored R&D proposals for funding.
                  </p>
                </div>
              </div>
              <button onClick={() => setActiveTab('profile')} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-colors w-full md:w-auto">
                Set Up Profile
              </button>
            </div>
          )}

          {(activeTab === 'open' || activeTab === 'my_investments') && (
            <>
              <div className="mb-6 border-b border-slate-200 pb-4">
                <h2 className="text-2xl font-bold text-slate-900">
                  {activeTab === 'open' ? 'Academic R&D Proposals' : 'Our Active CSR Implementations'}
                </h2>
                <p className="text-slate-500 mt-1 text-sm">
                  {activeTab === 'open' 
                    ? 'Review solutions proposed by Universities and provide funding & mentorship.' 
                    : 'Track the progress of civic solutions funded by your organization.'}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {isLoading ? (
                  <div className="col-span-full p-12 text-center text-slate-500">Loading proposals...</div>
                ) : displayList.length === 0 ? (
                  <div className="col-span-full p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
                    <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium text-lg">No active proposals found.</p>
                  </div>
                ) : (
                  displayList.map((report) => (
                    <div key={report.id} className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow relative">
                      
                      {/* Priority Tag */}
                      <div className="absolute top-4 right-4">
                         <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                            report.priority === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {report.priority}
                         </span>
                      </div>

                      <div className="p-5 border-b border-slate-100 flex-1 pt-8">
                        <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold mb-2 uppercase tracking-wide">
                           <Building className="w-3.5 h-3.5" /> Proposed by {report.university_name}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2">{report.title}</h3>
                        <p className="text-sm text-slate-600 line-clamp-3 mb-4">{report.description}</p>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" /> <span className="truncate">Implementation: {report.location}</span>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 flex justify-between items-center">
                         <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                            {report.category}
                         </div>
                         <button onClick={() => setSelectedReport(report)} className="text-indigo-700 font-bold text-sm hover:text-indigo-800 bg-indigo-100 hover:bg-indigo-200 px-4 py-1.5 rounded-lg transition-colors">
                            {activeTab === 'open' ? 'Review & Fund' : 'Track ROI'}
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
                    <h2 className="text-2xl font-bold">Company CSR Profile</h2>
                    <p className="text-slate-400 text-sm mt-1">Define your Corporate Social Responsibility mandate.</p>
                  </div>
                  {!isEditingProfile && (
                    <button onClick={() => setIsEditingProfile(true)} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 border border-white/20">
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
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Company Name</label>
                        <input type="text" disabled={!isEditingProfile} value={userProfile.organization_name || ''} onChange={(e) => setUserProfile({...userProfile, organization_name: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-500 text-sm" placeholder="e.g., Tata Steel" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Headquarters Location</label>
                        <input type="text" disabled={!isEditingProfile} value={userProfile.district || ''} onChange={(e) => setUserProfile({...userProfile, district: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-500 text-sm" placeholder="e.g., Jamshedpur" />
                      </div>
                    </div>

                    <div className="md:col-span-2 pt-4 border-t border-slate-100">
                      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Handshake className="w-5 h-5 text-indigo-500" /> CSR Mandate & Funding Goals
                      </h3>
                    </div>

                    <div className="md:col-span-2 space-y-5">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Target Sectors (Keywords)</label>
                        <p className="text-xs text-slate-500 mb-2">What causes does your company support? (e.g., Education, Clean Water, Smart City)</p>
                        <input type="text" disabled={!isEditingProfile} value={userProfile.expertise_domain || ''} onChange={(e) => setUserProfile({...userProfile, expertise_domain: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-700 text-sm font-medium" placeholder="e.g., Sustainability, Rural Infrastructure" />
                      </div>
                    </div>

                    {isEditingProfile && (
                      <div className="md:col-span-2 flex justify-end gap-3 pt-6 border-t border-slate-100 mt-2">
                        <button type="button" onClick={() => setIsEditingProfile(false)} className="px-6 py-2.5 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors w-full sm:w-auto">Cancel</button>
                        <button type="submit" className="px-6 py-2.5 rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors flex items-center justify-center gap-2 w-full sm:w-auto">
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

      {/* Review Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start bg-slate-900 text-white shrink-0">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <Handshake className="w-6 h-6 text-indigo-400" />
                  <h3 className="text-xl font-bold">University CSR Proposal Review</h3>
                </div>
                <p className="text-sm text-slate-400">Project ID: SANKALP-{selectedReport.id.toString().padStart(4, '0')}</p>
              </div>
              <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto bg-slate-50 flex-1 grid md:grid-cols-2">
              
              {/* Left Side: Original Problem */}
              <div className="p-6 border-b md:border-b-0 md:border-r border-slate-200 space-y-6 bg-white">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Original Civic Problem</h4>
                  <p className="text-xl font-bold text-slate-900">{selectedReport.title}</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-indigo-600"/> {selectedReport.location}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="uppercase text-indigo-700">{selectedReport.category}</span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Context</h4>
                  <div className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
                    {selectedReport.description}
                  </div>
                </div>
              </div>

              {/* Right Side: University Solution */}
              <div className="p-6 flex flex-col bg-indigo-50/30">
                <div className="flex items-center gap-2 text-indigo-800 text-sm font-bold mb-4 bg-indigo-100 px-4 py-2 rounded-lg border border-indigo-200">
                  <Building className="w-4 h-4" /> Academic Solution by: {selectedReport.university_name || 'University'}
                </div>

                <div className="flex-1 flex flex-col">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Technical Proposal & R&D Strategy</h4>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 text-slate-700 text-sm whitespace-pre-wrap leading-relaxed shadow-sm flex-1 font-mono overflow-y-auto">
                    {selectedReport.proposal_details || 'No proposal text provided.'}
                  </div>
                  
                  {selectedReport.status === 'proposal_submitted' ? (
                    <button 
                      onClick={handleApproveFunding}
                      disabled={isSubmitting}
                      className="mt-6 w-full py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle className="w-5 h-5" /> {isSubmitting ? 'Processing...' : 'Approve Mentorship & CSR Funding'}
                    </button>
                  ) : (
                    <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center shadow-sm">
                      <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
                      <h4 className="text-emerald-900 font-bold">Funding Active</h4>
                      <p className="text-emerald-700 text-sm">Your organization is officially mentoring this project.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndustryDashboard;