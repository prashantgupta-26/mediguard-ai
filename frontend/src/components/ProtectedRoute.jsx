import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ user, loading, children }) {
  if (loading) {
    return (
      <div class="min-h-screen bg-surface flex items-center justify-center pt-20">
        <div class="flex flex-col items-center gap-space-md">
          <div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p class="font-body-md text-on-surface-variant">Loading MEDIGUARD AI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
