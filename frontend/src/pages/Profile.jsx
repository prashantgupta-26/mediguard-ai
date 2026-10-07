import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import AbhaLinkingView from '../components/AbhaLinkingView';

export default function Profile({ user, onUpdateUser }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    dateOfBirth: user?.dateOfBirth || '',
    gender: user?.gender || 'Male',
    healthId: user?.healthId || ''
  });

  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [user?.id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/patient/profile', 'GET');
      const patientInfo = data.profile || data.patient;
      if (data.success && patientInfo) {
        setFormData({
          name: patientInfo.name || '',
          email: patientInfo.email || '',
          dateOfBirth: patientInfo.dateOfBirth || '',
          gender: patientInfo.gender || 'Male',
          healthId: patientInfo.healthId || ''
        });
        if (onUpdateUser) {
          onUpdateUser(patientInfo);
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to fetch profile details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await apiRequest('/patient/profile', 'PUT', {
        name: formData.name,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender
      });

      if (response.success && response.patient) {
        setSuccessMessage('Profile updated successfully!');
        setEditing(false);
        if (onUpdateUser) {
          onUpdateUser(response.patient);
        }
      } else {
        setError(response.message || 'Failed to update profile');
      }
    } catch (err) {
      setError(err.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main class="w-full pt-28 pb-16 bg-surface min-h-screen flex justify-center px-space-md">
      <div class="w-full max-w-2xl bg-surface-container-lowest p-space-xl lg:p-space-2xl rounded-xl shadow-[0_12px_32px_-4px_rgba(15,23,42,0.08)] border border-surface-container flex flex-col gap-space-lg">
        
        {/* Header */}
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md border-b border-surface-container pb-space-md">
          <div class="flex items-center gap-space-md">
            <div class="w-14 h-14 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-headline-md text-headline-md font-bold shadow-sm">
              {formData.name ? formData.name.charAt(0).toUpperCase() : 'P'}
            </div>
            <div class="flex flex-col">
              <h1 class="font-headline-md text-headline-md text-on-surface">{formData.name || 'Patient Profile'}</h1>
              <p class="font-body-md text-body-md text-on-surface-variant">MEDIGUARD AI Verified Patient Profile</p>
            </div>
          </div>

          <div class="px-space-md py-space-xs rounded-lg bg-surface-container border border-primary/20 flex flex-col items-end">
            <span class="font-label-sm text-label-sm text-primary uppercase font-bold">Health ID</span>
            <span class="font-headline-sm text-headline-sm text-on-surface font-mono font-bold">{formData.healthId}</span>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div class="p-space-md bg-error-container text-on-error-container rounded-lg flex items-start gap-space-sm border border-error/20">
            <span class="material-symbols-outlined text-error text-[20px] mt-0.5">error</span>
            <span class="font-body-sm text-body-sm">{error}</span>
          </div>
        )}

        {successMessage && (
          <div class="p-space-md bg-tertiary-container/20 text-tertiary-container rounded-lg flex items-start gap-space-sm border border-tertiary/20">
            <span class="material-symbols-outlined text-tertiary text-[20px] mt-0.5">check_circle</span>
            <span class="font-body-sm text-body-sm">{successMessage}</span>
          </div>
        )}

        {/* Profile Form */}
        <form onSubmit={handleSubmit} class="flex flex-col gap-space-md">
          
          {/* Health ID (Immutable) */}
          <div class="flex flex-col gap-space-2xs">
            <label class="font-label-md text-label-md text-on-surface font-semibold">MediGuard Health ID (Immutable)</label>
            <input
              type="text"
              value={formData.healthId}
              disabled
              class="h-14 px-space-md rounded-lg bg-surface-container text-on-surface-variant font-mono font-bold border border-outline/20 cursor-not-allowed"
            />
          </div>

          {/* Email Address (Immutable) */}
          <div class="flex flex-col gap-space-2xs">
            <label class="font-label-md text-label-md text-on-surface font-semibold">Email Address (Verified)</label>
            <input
              type="email"
              value={formData.email}
              disabled
              class="h-14 px-space-md rounded-lg bg-surface-container text-on-surface-variant border border-outline/20 cursor-not-allowed"
            />
          </div>

          {/* Full Name */}
          <div class="flex flex-col gap-space-2xs">
            <label class="font-label-md text-label-md text-on-surface font-semibold">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={!editing}
              required
              class={`h-14 px-space-md rounded-lg font-body-md border transition-all ${
                editing
                  ? 'bg-surface-container-low border-primary/40 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20'
                  : 'bg-surface-container text-on-surface border-outline/20'
              }`}
            />
          </div>

          {/* Grid: DOB & Gender */}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            <div class="flex flex-col gap-space-2xs">
              <label class="font-label-md text-label-md text-on-surface font-semibold">Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                disabled={!editing}
                required
                class={`h-14 px-space-md rounded-lg font-body-md border transition-all ${
                  editing
                    ? 'bg-surface-container-low border-primary/40 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20'
                    : 'bg-surface-container text-on-surface border-outline/20'
                }`}
              />
            </div>

            <div class="flex flex-col gap-space-2xs">
              <label class="font-label-md text-label-md text-on-surface font-semibold">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                disabled={!editing}
                required
                class={`h-14 px-space-md rounded-lg font-body-md border transition-all ${
                  editing
                    ? 'bg-surface-container-low border-primary/40 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20'
                    : 'bg-surface-container text-on-surface border-outline/20'
                }`}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div class="flex items-center justify-end gap-space-md pt-space-md border-t border-surface-container">
            {!editing ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                class="h-touch-target-min px-space-xl bg-primary hover:bg-primary-container text-on-primary font-title text-title rounded-lg shadow-md flex items-center justify-center gap-space-xs transition-all cursor-pointer"
              >
                <span class="material-symbols-outlined text-[20px]">edit</span>
                <span>Edit Profile</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    fetchProfile();
                  }}
                  class="h-touch-target-min px-space-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-title text-title rounded-lg flex items-center justify-center transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  class="h-touch-target-min px-space-xl bg-primary hover:bg-primary-container text-on-primary font-title text-title rounded-lg shadow-md flex items-center justify-center gap-space-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>

        </form>

        {/* STEP 5: ABHA / ABDM IDENTITY LINKING MODULE */}
        <div class="pt-space-md border-t border-surface-container">
          <AbhaLinkingView patient={user} onUpdated={fetchProfile} />
        </div>

      </div>
    </main>
  );
}
