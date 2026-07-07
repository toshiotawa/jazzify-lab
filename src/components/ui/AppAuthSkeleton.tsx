import React from 'react';

const AppAuthSkeleton: React.FC = () => (
  <div className="w-full min-h-screen bg-slate-950 text-white">
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6 animate-pulse">
      <div className="h-10 w-48 rounded-lg bg-slate-800" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-40 rounded-xl bg-slate-800/80" />
        <div className="h-40 rounded-xl bg-slate-800/80" />
      </div>
      <div className="h-56 rounded-xl bg-slate-800/60" />
      <div className="h-32 rounded-xl bg-slate-800/40" />
    </div>
  </div>
);

export default AppAuthSkeleton;
