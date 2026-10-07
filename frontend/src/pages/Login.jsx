import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../services/api';

export default function Login({ currentUser, onLoginSuccess }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Clear any prior session token first
      localStorage.removeItem('medikiosk_token');

      const response = await apiRequest('/auth/login', 'POST', { email, password });

      if (response.success && response.token) {
        localStorage.setItem('medikiosk_token', response.token);
        if (onLoginSuccess) {
          onLoginSuccess(response.user, response.token);
        }
        navigate('/dashboard');
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      if (err.code === 'EMAIL_NOT_VERIFIED' || err.data?.code === 'EMAIL_NOT_VERIFIED') {
        setError('Please verify your email address before signing in.');
        setTimeout(() => {
          navigate(`/verify-email?email=${encodeURIComponent(email)}`);
        }, 1500);
      } else {
        setError(err.message || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full pt-28 pb-16 bg-surface min-h-screen flex items-center justify-center px-space-md">
      <div className="w-full max-w-md bg-surface-container-lowest p-space-xl lg:p-space-2xl rounded-xl shadow-[0_12px_32px_-4px_rgba(15,23,42,0.08)] border border-surface-container flex flex-col gap-space-lg">
        
        {/* Card Header */}
        <div className="flex flex-col gap-space-xs text-center">
          <div className="inline-flex items-center justify-center gap-space-xs text-primary font-label-md text-label-md mb-space-2xs">
            <span className="material-symbols-outlined text-[24px]">shield</span>
            <span className="tracking-wide uppercase font-label-sm text-label-sm font-semibold">Patient Access Portal</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Sign In to MEDIGUARD AI</h1>
          <p className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider">
            Smart Medication Safety System
          </p>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Enter your credentials to access your health records & MediGuard Health ID.
          </p>
        </div>

        {/* Current Active User Banner if switching accounts */}
        {currentUser && (
          <div className="p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between gap-space-sm border border-outline/20">
            <div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
              <span className="material-symbols-outlined text-[18px] text-primary">account_circle</span>
              <span>Currently in: <strong className="text-on-surface">{currentUser.name}</strong></span>
            </div>
            <Link to="/dashboard" className="text-primary font-label-sm font-semibold hover:underline">
              Dashboard &rarr;
            </Link>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-space-md bg-error-container text-on-error-container rounded-lg flex items-start gap-space-sm border border-error/20">
            <span className="material-symbols-outlined text-error text-[20px] mt-0.5">error</span>
            <span className="font-body-sm text-body-sm">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-space-md">
          {/* Email Address */}
          <div className="flex flex-col gap-space-2xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. rahul@example.com"
              required
              className="h-14 px-space-md rounded-lg bg-surface-container-low border border-outline/30 text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-space-2xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="h-14 px-space-md rounded-lg bg-surface-container-low border border-outline/30 text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="h-touch-target-min w-full mt-space-xs bg-primary hover:bg-primary-container text-on-primary font-title text-title rounded-lg shadow-md flex items-center justify-center gap-space-xs transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <span className="material-symbols-outlined text-[20px]">login</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center pt-space-xs border-t border-surface-container">
          <p className="font-body-md text-body-md text-on-surface-variant">
            New patient?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>

      </div>
    </main>
  );
}
