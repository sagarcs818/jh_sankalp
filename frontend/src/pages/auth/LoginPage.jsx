import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ShieldAlert, Loader2, CheckCircle, Shield, 
  User, Building, BookOpen, Factory, AlertCircle,
  Mail, Lock, ArrowRight, Key, ShieldCheck, Eye, EyeOff
} from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Added organization_name to state
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '',
    first_name: '',
    last_name: '',
    organization_name: '', 
    role: 'CITIZEN',
    secret_code: '' 
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (isLogin) {
        // --- LOGIN FLOW ---
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login/`, {
          email: formData.email,
          password: formData.password
        });
        
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
        
        const role = response.data.user?.role || 'CITIZEN';
        
        if (role === 'CITIZEN') navigate('/citizen/dashboard');
        else if (role === 'GOVERNMENT_OFFICER') navigate('/government/dashboard');
        else if (role === 'ADMIN') navigate('/admin/dashboard');
        else if (role === 'UNIVERSITY') navigate('/university/dashboard');
        else if (role === 'INDUSTRY') navigate('/industry/dashboard'); // <-- FIX THIS LINE
        else navigate('/dashboard');

      } else {
        // --- REGISTRATION FLOW ---
        const submitData = { ...formData };

        // SMART FIX: If University or Industry, split the Org Name into First/Last name 
        // to satisfy Django's base User model requirements behind the scenes!
        if (submitData.role === 'UNIVERSITY' || submitData.role === 'INDUSTRY') {
            const nameParts = submitData.organization_name.trim().split(' ');
            submitData.first_name = nameParts[0] || 'Admin';
            submitData.last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Hub';
        }

        await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register/`, submitData);
        setSuccessMsg('Account created successfully! Please sign in with your new credentials.');
        setIsLogin(true);
        setFormData({ ...formData, password: '', secret_code: '' });
      }
    } catch (err) {
      console.error("Backend Error:", err.response?.data);
      if (err.response && err.response.data) {
        const data = err.response.data;
        if (data.secret_code) setError("Security Clearance Failed: " + data.secret_code[0]);
        else if (data.email) setError("Email error: " + data.email[0]);
        else if (data.password) setError("Password error: " + data.password[0]);
        else {
          const firstKey = Object.keys(data)[0];
          if (firstKey && Array.isArray(data[firstKey])) {
            setError(`${firstKey.replace('_', ' ').toUpperCase()}: ${data[firstKey][0]}`);
          } else {
            setError(data.detail || JSON.stringify(data));
          }
        }
      } else {
        setError('Network error. Please ensure the backend server is running.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    { id: 'CITIZEN', label: 'Citizen', icon: User },
    { id: 'GOVERNMENT_OFFICER', label: 'Govt. Official', icon: Building },
    { id: 'UNIVERSITY', label: 'University', icon: BookOpen },
    { id: 'INDUSTRY', label: 'Industry', icon: Factory },
    { id: 'ADMIN', label: 'System Admin', icon: ShieldCheck }
  ];

  return (
    <div className="min-h-screen w-full flex bg-slate-50 font-sans">
      
      {/* Left Column: Form Area */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 sm:p-12 overflow-y-auto bg-white shadow-[10px_0_30px_-15px_rgba(0,0,0,0.1)] z-10">
        <div className="w-full max-w-[420px] space-y-8">
          
          <div className="text-center sm:text-left">
            <Link to="/" className="inline-flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center shadow-md">
                <ShieldAlert className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-blue-900 tracking-tight">JH-SANKALP</span>
            </Link>
            
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-slate-500 text-sm">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMsg(''); }}
                className="font-bold text-blue-700 hover:text-blue-800 hover:underline underline-offset-4 transition-all"
              >
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>

          {successMsg && (
            <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl flex items-start gap-3 border border-emerald-200 text-sm font-medium">
              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> 
              <p>{successMsg}</p>
            </div>
          )}

          {/* Form starts here */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            
            {!isLogin && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                {/* Role Selector MOVED TO TOP */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Account Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {roleOptions.map((option) => {
                      const isSelected = formData.role === option.id;
                      const Icon = option.icon;
                      return (
                        <label 
                          key={option.id} 
                          className={`relative border rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 
                            ${option.id === 'ADMIN' ? 'col-span-2' : ''}
                            ${isSelected 
                              ? 'border-blue-700 bg-blue-700 text-white shadow-md shadow-blue-700/20' 
                              : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50'}`}
                        >
                          <input type="radio" name="role" value={option.id} className="sr-only" checked={isSelected} onChange={handleChange} />
                          <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                          <span className="text-xs font-bold text-center">{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* DYNAMIC RENDER: Changed to appear AFTER the role is selected! */}
                {(formData.role === 'UNIVERSITY' || formData.role === 'INDUSTRY') ? (
                  <div className="space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
                    <label className="block text-sm font-medium text-slate-700">
                      {formData.role === 'UNIVERSITY' ? 'Institution / University Name' : 'Company Name'}
                    </label>
                    <input name="organization_name" type="text" required value={formData.organization_name} onChange={handleChange} 
                      className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 text-sm text-slate-900" 
                      placeholder={formData.role === 'UNIVERSITY' ? "e.g., NIT Jamshedpur" : "e.g., Tata Steel"} />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-700">First Name</label>
                      <input name="first_name" type="text" required value={formData.first_name} onChange={handleChange} 
                        className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 text-sm text-slate-900" 
                        placeholder="John" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-700">Last Name</label>
                      <input name="last_name" type="text" required value={formData.last_name} onChange={handleChange} 
                        className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 text-sm text-slate-900" 
                        placeholder="Doe" />
                    </div>
                  </div>
                )}

                {/* Security Code Input for Government & Admin */}
                {(formData.role === 'GOVERNMENT_OFFICER' || formData.role === 'ADMIN') && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-2 text-blue-900">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-bold">
                        {formData.role === 'ADMIN' ? 'Master System Clearance' : 'Official Security Clearance'}
                      </span>
                    </div>
                    <p className="text-xs text-blue-800/80">
                      {formData.role === 'ADMIN' 
                        ? 'Authorized superuser access code is required.' 
                        : 'A verified departmental access code is required.'}
                    </p>
                    <div className="relative">
                      <Key className="w-4 h-4 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input name="secret_code" type="password" required value={formData.secret_code} onChange={handleChange} 
                        placeholder="Enter clearance code" 
                        className="block w-full pl-9 pr-4 py-2.5 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 text-sm text-blue-900 font-mono shadow-sm" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Email & Password */}
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Email address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input name="email" type="email" required value={formData.email} onChange={handleChange} 
                    className="block w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 text-sm text-slate-900" 
                    placeholder="you@example.com" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    name="password" 
                    type={showPassword ? "text" : "password"} 
                    required 
                    minLength={6}
                    value={formData.password} 
                    onChange={handleChange} 
                    className="block w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 text-sm text-slate-900" 
                    placeholder="••••••••" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-600 text-sm font-medium bg-red-50 p-3.5 rounded-lg border border-red-200 flex items-start gap-2.5 animate-in fade-in zoom-in-95 duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>
          
        </div>
      </div>

      {/* Right Column: Branded Presentation Area */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-blue-900 via-blue-800 to-teal-800 items-center justify-center p-12 overflow-hidden">
        
        <div className="absolute inset-0 bg-black opacity-10 pointer-events-none"></div>
        
        <div className="relative z-10 w-full max-w-lg text-white space-y-10">
          
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold border border-white/20 mb-6 backdrop-blur-sm tracking-wide text-teal-100">
              <Shield className="w-3.5 h-3.5" /> Secure Enterprise Network
            </div>
            <h3 className="text-4xl font-extrabold leading-tight tracking-tight mb-4">
              Every Problem Can Become an <span className="text-teal-400">Innovation.</span>
            </h3>
            <p className="text-blue-100 text-lg leading-relaxed">
              Secure, role-based access connects citizens with officials, universities, and industry partners to solve critical state challenges together.
            </p>
          </div>

          <div className="space-y-6 pt-8 border-t border-white/20">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20 backdrop-blur-sm">
                <User className="w-5 h-5 text-teal-300" />
              </div>
              <div>
                <h4 className="font-bold text-white text-lg">Citizens</h4>
                <p className="text-blue-200 text-sm mt-1 leading-relaxed">Report verified localized issues directly to the state command center with GPS and media evidence.</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20 backdrop-blur-sm">
                <Building className="w-5 h-5 text-teal-300" />
              </div>
              <div>
                <h4 className="font-bold text-white text-lg">Govt. Officials</h4>
                <p className="text-blue-200 text-sm mt-1 leading-relaxed">Access AI-prioritized triage boards for immediate action, tracking, and inter-department dispatch.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20 backdrop-blur-sm">
                <BookOpen className="w-5 h-5 text-teal-300" />
              </div>
              <div>
                <h4 className="font-bold text-white text-lg">Universities & Industry</h4>
                <p className="text-blue-200 text-sm mt-1 leading-relaxed">Collaborate on cutting-edge engineering solutions, localized R&D, and real-world deployment funding.</p>
              </div>
            </div>
          </div>
          
        </div>
      </div>

    </div>
  );
};

export default LoginPage;