import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import SmartIntake from './pages/SmartIntake';
import KioskMode from './pages/KioskMode';
import DrugInteractionChecker from './pages/DrugInteractionChecker';
import DoctorSummary from './pages/DoctorSummary';
import { apiRequest } from './services/api';

function MainLayout({ user, loading, onLogout, onLogin, onUpdateUser }) {
  const location = useLocation();
  const isKioskPath = location.pathname.startsWith('/kiosk');

  return (
    <div className="min-h-screen bg-surface flex flex-col font-body-md text-on-surface">
      {!isKioskPath && <Header user={user} onLogout={onLogout} />}
      <div className="flex-grow">
        <Routes>
          <Route
            path="/login"
            element={
              <Login
                currentUser={user}
                onLoginSuccess={(userData, token) => onLogin(userData, token)}
              />
            }
          />
          <Route
            path="/register"
            element={
              <Register
                currentUser={user}
              />
            }
          />
          <Route
            path="/verify-email"
            element={
              <VerifyOTP
                onLoginSuccess={(userData, token) => onLogin(userData, token)}
              />
            }
          />
          <Route path="/kiosk" element={<KioskMode />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute user={user} loading={loading}>
                <Dashboard user={user} onUpdateUser={onUpdateUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute user={user} loading={loading}>
                <Profile user={user} onUpdateUser={onUpdateUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/smart-intake"
            element={
              <ProtectedRoute user={user} loading={loading}>
                <SmartIntake user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interactions"
            element={
              <ProtectedRoute user={user} loading={loading}>
                <DrugInteractionChecker user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor-summary"
            element={
              <ProtectedRoute user={user} loading={loading}>
                <DoctorSummary user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              loading ? (
                <div className="min-h-screen bg-surface flex items-center justify-center pt-20">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {!isKioskPath && <Footer />}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('medikiosk_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await apiRequest('/patient/dashboard', 'GET');
      if (data.success && data.patient) {
        setUser(data.patient);
      } else {
        localStorage.removeItem('medikiosk_token');
        setUser(null);
      }
    } catch (err) {
      console.error('Session validation error:', err);
      localStorage.removeItem('medikiosk_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData, token) => {
    if (token) {
      localStorage.setItem('medikiosk_token', token);
    }
    // Cleanly set new user, avoiding merging stale user state
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('medikiosk_token');
    setUser(null);
  };

  const handleUpdateUser = (updatedData) => {
    setUser((prev) => (prev ? { ...prev, ...updatedData } : updatedData));
  };

  return (
    <BrowserRouter>
      <MainLayout
        user={user}
        loading={loading}
        onLogout={handleLogout}
        onLogin={handleLogin}
        onUpdateUser={handleUpdateUser}
      />
    </BrowserRouter>
  );
}
