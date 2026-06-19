import React from 'react';

/* ── News skeleton ── */
export const NewsSkeleton = () => (
  <div className="bg-white rounded-2xl p-6 border border-slate-100 animate-pulse space-y-3">
    <div className="h-3 w-24 bg-slate-100 rounded-full" />
    <div className="h-5 w-3/4 bg-slate-100 rounded-full" />
    <div className="space-y-2">
      <div className="h-3 bg-slate-100 rounded-full" />
      <div className="h-3 bg-slate-100 rounded-full w-5/6" />
      <div className="h-3 bg-slate-100 rounded-full w-4/6" />
    </div>
  </div>
);

/* ── Campaign skeleton (Home/Carousel style) ── */
export const CampaignSkeleton = () => (
  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden animate-pulse">
    <div className="h-28 bg-gradient-to-br from-slate-200 to-slate-300" />
    <div className="p-5 space-y-4">
      <div className="h-5 w-3/4 bg-slate-100 rounded-full" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-14 bg-slate-100 rounded-xl" />
        <div className="h-14 bg-slate-100 rounded-xl" />
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full" />
    </div>
  </div>
);

/* ── Campaign Search skeleton ── */
export const CampaignSearchSkeleton = () => (
  <div className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden animate-pulse">
    <div className="aspect-[16/10] bg-slate-100" />
    <div className="p-5 space-y-4">
      <div className="h-4 bg-slate-100 rounded w-1/4" />
      <div className="h-5 bg-slate-100 rounded w-3/4" />
      <div className="space-y-2">
        <div className="h-3 bg-slate-100 rounded w-full" />
        <div className="h-2.5 bg-slate-100 rounded-full w-full" />
      </div>
    </div>
  </div>
);

/* ── News Search skeleton ── */
export const NewsSearchSkeleton = () => (
  <div className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden animate-pulse">
    <div className="aspect-[16/10] bg-slate-100" />
    <div className="p-6 space-y-4">
      <div className="flex justify-between">
        <div className="h-3 bg-slate-100 rounded w-1/4" />
        <div className="h-3 bg-slate-100 rounded w-1/6" />
      </div>
      <div className="h-5 bg-slate-100 rounded w-3/4" />
      <div className="space-y-2">
        <div className="h-3 bg-slate-100 rounded w-full" />
        <div className="h-3 bg-slate-100 rounded w-5/6" />
      </div>
    </div>
  </div>
);
