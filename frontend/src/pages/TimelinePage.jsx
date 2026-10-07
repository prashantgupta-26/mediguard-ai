import React from 'react';
import HealthTimeline from '../components/HealthTimeline';

export default function TimelinePage({ user }) {
  return (
    <main className="w-full pt-20 bg-gradient-to-br from-[#E4F3F1] via-[#D5ECE8] to-[#C7E5E0] min-h-screen pb-16">
      <div className="max-w-6xl mx-auto w-full px-4 lg:px-8 py-6">
        <HealthTimeline user={user} />
      </div>
    </main>
  );
}
