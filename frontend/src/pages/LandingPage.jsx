import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldAlert, Lightbulb, Users, TrendingUp, 
  ArrowRight, MapPin, Activity, Cpu 
} from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-8 w-8 text-blue-700" />
            <span className="text-xl font-bold text-blue-900 tracking-tight">JH-SANKALP</span>
          </div>
          <div className="flex gap-4">
            <Link to="/login" className="text-slate-600 hover:text-blue-700 px-3 py-2 font-medium transition-colors">
              Login
            </Link>
            <Link to="/login" className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md font-medium transition-all shadow-md hover:shadow-lg">
              Report Challenge
            </Link>
          </div>
        </div>
      </nav>

      <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-teal-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block py-1 px-3 rounded-full bg-blue-800/50 border border-blue-400 text-blue-200 text-sm font-semibold mb-6 uppercase tracking-wider backdrop-blur-sm">
              Govt. of Jharkhand Initiative (SIH26043)
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
              Every Problem Can Become an <span className="text-teal-400">Innovation.</span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-10 leading-relaxed">
              JH-SANKALP connects citizens, government, universities, and industry to transform societal challenges into measurable, tech-driven solutions.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/login" className="bg-teal-500 hover:bg-teal-400 text-slate-900 px-8 py-3 rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-teal-500/30 flex items-center justify-center gap-2">
                Submit a Challenge <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/login" className="bg-white/10 hover:bg-white/20 border border-white/30 text-white px-8 py-3 rounded-lg font-bold text-lg transition-all backdrop-blur-sm">
                Explore Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-slate-200 shadow-sm relative -mt-8 mx-4 md:mx-auto max-w-5xl rounded-xl z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
          <div className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-700 mb-1">1,204</div>
            <div className="text-sm text-slate-500 font-medium uppercase tracking-wide">Challenges Logged</div>
          </div>
          <div className="p-6 text-center">
            <div className="text-3xl font-bold text-teal-600 mb-1">86</div>
            <div className="text-sm text-slate-500 font-medium uppercase tracking-wide">Active Projects</div>
          </div>
          <div className="p-6 text-center">
            <div className="text-3xl font-bold text-amber-500 mb-1">14</div>
            <div className="text-sm text-slate-500 font-medium uppercase tracking-wide">Partner Universities</div>
          </div>
          <div className="p-6 text-center">
            <div className="text-3xl font-bold text-indigo-600 mb-1">24k+</div>
            <div className="text-sm text-slate-500 font-medium uppercase tracking-wide">Citizens Impacted</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">The Societal Innovation Ecosystem</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">An end-to-end lifecycle powered by Artificial Intelligence, bringing together the right minds to solve the right problems.</p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">1. Citizen Reports</h3>
            <p className="text-slate-600 text-sm leading-relaxed">Citizens submit localized issues with GPS, photos, and video evidence via mobile or web.</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative">
            <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 text-slate-300">
              <ArrowRight className="w-8 h-8" />
            </div>
            <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center mb-4">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">2. AI Triage</h3>
            <p className="text-slate-600 text-sm leading-relaxed">Our AI Engine automatically categorizes the problem, detects duplicates, and assigns a priority score.</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative">
            <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 text-slate-300">
              <ArrowRight className="w-8 h-8" />
            </div>
            <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-lg flex items-center justify-center mb-4">
              <Lightbulb className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">3. University Match</h3>
            <p className="text-slate-600 text-sm leading-relaxed">Validated challenges are routed to HEIs based on faculty expertise and lab capabilities for prototyping.</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">4. Industry Scale</h3>
            <p className="text-slate-600 text-sm leading-relaxed">Industry partners provide CSR funding, mentorship, and hardware to deploy the solution in the real world.</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-semibold border border-red-500/30">
                <Activity className="w-4 h-4" /> Live SIH Demo Scenario
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">Disaster Management & Flood Early Warning</h2>
              <p className="text-slate-400 text-lg">
                Watch how a single citizen's report of a flooded village road triggers an automated workflow, resulting in an IoT & GIS-based early warning system deployed by a local university and funded by industry partners.
              </p>
              <Link to="/login" className="inline-flex items-center gap-2 text-teal-400 font-bold hover:text-teal-300 transition-colors group">
                Run the interactive demo <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="flex-1 w-full relative">
              <div className="aspect-video bg-slate-800 rounded-xl border border-slate-700 shadow-2xl flex items-center justify-center overflow-hidden relative">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-500 via-slate-900 to-slate-900"></div>
                <TrendingUp className="w-24 h-24 text-teal-500/50 absolute" />
                <div className="z-10 text-center">
                  <div className="text-sm font-mono text-slate-400 mb-2">System Status: ACTIVE</div>
                  <div className="text-2xl font-bold text-teal-400">Monitoring 12 Risk Zones</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-slate-50 py-8 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>Built for Smart India Hackathon (SIH26043) • Government of Jharkhand</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;