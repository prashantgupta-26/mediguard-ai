import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../services/api';

export default function VerifyOTP({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [verifiedHealthId, setVerifiedHealthId] = useState(null);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!email) {
      setError('Please provide your registered email address.');
      return;
    }

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP verification code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiRequest('/auth/verify-email', 'POST', { email, otp });

      if (response.success) {
        const hid = response.healthId || response.user?.healthId;
        setVerifiedHealthId(hid);
        if (response.token) {
          localStorage.setItem('medikiosk_token', response.token);
        }
        // Update top-level authenticated user state
        if (onLoginSuccess && response.user) {
          onLoginSuccess(response.user, response.token);
        }
        setSuccessMessage('Email verified successfully!');
      } else {
        setError(response.message || 'Verification failed');
      }
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Please enter your email address below to resend code.');
      return;
    }

    setResending(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await apiRequest('/auth/resend-otp', 'POST', { email });
      if (response.success) {
        setSuccessMessage('A fresh 6-digit OTP code has been sent to your email.');
      } else {
        setError(response.message || 'Failed to resend OTP');
      }
    } catch (err) {
      setError(err.message || 'Failed to resend verification code');
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="w-full pt-28 pb-16 bg-surface min-h-screen flex items-center justify-center px-space-md">
      <div className="w-full max-w-lg bg-surface-container-lowest p-space-xl lg:p-space-2xl rounded-xl shadow-[0_12px_32px_-4px_rgba(15,23,42,0.08)] border border-surface-container flex flex-col gap-space-lg">
        
        {/* Verification Success View */}
        {verifiedHealthId ? (
          <div className="flex flex-col items-center gap-space-lg text-center py-space-sm">
            <div className="w-16 h-16 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[36px]">verified</span>
            </div>
            <div className="flex flex-col gap-space-xs">
              <h2 className="font-headline-md text-headline-md text-on-surface">Email Verified Successfully</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Your MEDIGUARD AI patient account is now fully active.
              </p>
            </div>

            {/* Generated Health ID Card */}
            <div className="w-full bg-surface-container p-space-md rounded-xl border border-primary/20 flex flex-col items-center gap-space-xs my-space-xs">
              <span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider">Your MediGuard Health ID</span>
              <span className="font-headline-lg text-headline-lg text-on-surface font-extrabold tracking-widest text-primary">
                {verifiedHealthId}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Keep this ID for future consultations & kiosk intake logins.
              </span>
            </div>

            <Link
              to="/dashboard"
              className="h-touch-target-min w-full bg-primary hover:bg-primary-container text-on-primary font-title text-title rounded-lg shadow-md flex items-center justify-center gap-space-xs transition-all active:scale-[0.99]"
            >
              <span>Go to Patient Dashboard</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </Link>
            <Link
              to={`/login?email=${encodeURIComponent(email)}`}
              className="text-on-surface-variant font-label-md text-label-md hover:text-primary transition-colors text-center"
            >
              Sign In with password instead
            </Link>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-col gap-space-xs text-center">
              <div className="inline-flex items-center justify-center gap-space-xs text-primary font-label-md text-label-md mb-space-2xs">
                <span className="material-symbols-outlined text-[24px]">mark_email_unread</span>
                <span className="tracking-wide uppercase font-label-sm text-label-sm font-semibold">Security Verification</span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Verify Your Email</h1>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Enter the 6-digit verification code sent to your email address.
              </p>
            </div>

            {/* Alerts */}
            {error && (
              <div className="p-space-md bg-error-container text-on-error-container rounded-lg flex items-start gap-space-sm border border-error/20">
                <span className="material-symbols-outlined text-error text-[20px] mt-0.5">error</span>
                <span className="font-body-sm text-body-sm">{error}</span>
              </div>
            )}

            {successMessage && !verifiedHealthId && (
              <div className="p-space-md bg-tertiary-container/20 text-tertiary-container rounded-lg flex items-start gap-space-sm border border-tertiary/20">
                <span className="material-symbols-outlined text-tertiary text-[20px] mt-0.5">check_circle</span>
                <span className="font-body-sm text-body-sm">{successMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleVerify} className="flex flex-col gap-space-md">
              {/* Email Input */}
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

              {/* 6-Digit OTP Code Input */}
              <div className="flex flex-col gap-space-2xs">
                <label className="font-label-md text-label-md text-on-surface font-semibold">6-Digit Verification Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 123456"
                  required
                  className="h-16 px-space-md rounded-lg bg-surface-container-low border border-outline/30 text-on-surface font-headline-md tracking-[8px] text-center font-mono focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <span className="font-label-sm text-label-sm text-on-surface-variant text-center mt-1">
                  Code expires in 10 minutes. Check your spam folder if not received.
                </span>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="h-touch-target-min w-full mt-space-xs bg-primary hover:bg-primary-container text-on-primary font-title text-title rounded-lg shadow-md flex items-center justify-center gap-space-xs transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Code & Generate Health ID</span>
                    <span className="material-symbols-outlined text-[20px]">verified_user</span>
                  </>
                )}
              </button>
            </form>

            {/* Resend Link */}
            <div className="flex items-center justify-between pt-space-xs border-t border-surface-container">
              <span className="font-body-sm text-body-sm text-on-surface-variant">Didn't receive the email?</span>
              <button
                onClick={handleResend}
                disabled={resending}
                className="font-label-md text-label-md text-primary hover:underline font-semibold disabled:opacity-50 cursor-pointer"
              >
                {resending ? 'Sending...' : 'Resend Code'}
              </button>
            </div>
          </>
        )}

      </div>
    </main>
  );
}
