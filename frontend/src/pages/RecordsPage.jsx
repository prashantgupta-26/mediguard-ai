import React from 'react';
import HealthRecords from '../components/HealthRecords';

export default function RecordsPage({ user }) {
  return (
    <main className="w-full pt-20 bg-gradient-to-br from-[#E4F3F1] via-[#D5ECE8] to-[#C7E5E0] min-h-screen pb-16">
      <div className="max-w-6xl mx-auto w-full px-4 lg:px-8 py-6">
        <HealthRecords healthId={user?.healthId} />
      </div>
    </main>
  );
}
