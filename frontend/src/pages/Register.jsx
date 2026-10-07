import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    gender: 'Male',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.dateOfBirth || !formData.gender || !formData.email || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password should be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      localStorage.removeItem('medikiosk_token');
      const response = await apiRequest('/auth/register', 'POST', {
        name: formData.name,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        email: formData.email,
        password: formData.password
      });

      if (response.success) {
        navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main class="w-full pt-28 pb-16 bg-surface min-h-screen flex items-center justify-center px-space-md">
      <div class="w-full max-w-xl bg-surface-container-lowest p-space-xl lg:p-space-2xl rounded-xl shadow-[0_12px_32px_-4px_rgba(15,23,42,0.08)] border border-surface-container flex flex-col gap-space-lg">
        
        {/* Card Header */}
        <div class="flex flex-col gap-space-xs text-center">
          <div class="inline-flex items-center justify-center gap-space-xs text-primary font-label-md text-label-md mb-space-2xs">
            <span class="material-symbols-outlined text-[24px]">shield</span>
            <span class="tracking-wide uppercase font-label-sm text-label-sm font-semibold">Patient Intake Onboarding</span>
          </div>
          <h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">Create MEDIGUARD AI Account</h1>
          <p class="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider">
            Smart Medication Safety System
          </p>
          <p class="font-body-md text-body-md text-on-surface-variant">
            Register your health record to generate your unique MediGuard Health ID.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div class="p-space-md bg-error-container text-on-error-container rounded-lg flex items-start gap-space-sm border border-error/20">
            <span class="material-symbols-outlined text-error text-[20px] mt-0.5">error</span>
            <span class="font-body-sm text-body-sm">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} class="flex flex-col gap-space-md">
          {/* Full Name */}
          <div class="flex flex-col gap-space-2xs">
            <label class="font-label-md text-label-md text-on-surface font-semibold">
              Full Name <span class="text-error">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Rahul Kumar"
              required
              class="h-14 px-space-md rounded-lg bg-surface-container-low border border-outline/30 text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Grid: DOB & Gender */}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            <div class="flex flex-col gap-space-2xs">
              <label class="font-label-md text-label-md text-on-surface font-semibold">
                Date of Birth <span class="text-error">*</span>
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
                class="h-14 px-space-md rounded-lg bg-surface-container-low border border-outline/30 text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div class="flex flex-col gap-space-2xs">
              <label class="font-label-md text-label-md text-on-surface font-semibold">
                Gender <span class="text-error">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                class="h-14 px-space-md rounded-lg bg-surface-container-low border border-outline/30 text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Email Address */}
          <div class="flex flex-col gap-space-2xs">
            <label class="font-label-md text-label-md text-on-surface font-semibold">
              Email Address <span class="text-error">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. rahul@example.com"
              required
              class="h-14 px-space-md rounded-lg bg-surface-container-low border border-outline/30 text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Grid: Password & Confirm Password */}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            <div class="flex flex-col gap-space-2xs">
              <label class="font-label-md text-label-md text-on-surface font-semibold">
                Password <span class="text-error">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                class="h-14 px-space-md rounded-lg bg-surface-container-low border border-outline/30 text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div class="flex flex-col gap-space-2xs">
              <label class="font-label-md text-label-md text-on-surface font-semibold">
                Confirm Password <span class="text-error">*</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
                class="h-14 px-space-md rounded-lg bg-surface-container-low border border-outline/30 text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            class="h-touch-target-min w-full mt-space-sm bg-primary hover:bg-primary-container text-on-primary font-title text-title rounded-lg shadow-md flex items-center justify-center gap-space-xs transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <span class="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                <span>Creating Account & Sending OTP...</span>
              </>
            ) : (
              <>
                <span>Register Patient Account</span>
                <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div class="text-center pt-space-xs border-t border-surface-container">
          <p class="font-body-md text-body-md text-on-surface-variant">
            Already registered?{' '}
            <Link to="/login" class="text-primary font-semibold hover:underline">
              Sign in to your account
            </Link>
          </p>
        </div>

      </div>
    </main>
  );
}
