import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import CitizenDashboard from './pages/dashboards/CitizenDashboard';
import GovernmentDashboard from './pages/dashboards/GovernmentDashboard';
import UniversityDashboard from './pages/dashboards/UniversityDashboard';
import IndustryDashboard from './pages/dashboards/IndustryDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        {/* Auth Route */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Dashboard Routes */}
        <Route path="/citizen/dashboard" element={<CitizenDashboard />} />
        <Route path="/government/dashboard" element={<GovernmentDashboard />} />
        <Route path="/university/dashboard" element={<UniversityDashboard />} />
        <Route path="/industry/dashboard" element={<IndustryDashboard />} />
        
        {/* Fallback Dashboard Route */}
        <Route path="/dashboard" element={
          <div className="p-10 text-3xl font-bold text-slate-700">Welcome to your Dashboard!</div>
        } />
      </Routes>
    </Router>
  );
}

export default App;