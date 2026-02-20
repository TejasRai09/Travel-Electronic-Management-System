import React from 'react';

export const CardSkeleton: React.FC = () => (
  <div className="bg-white border border-slate-200 rounded-xl p-6 animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <div className="h-6 bg-slate-200 rounded w-32 mb-2"></div>
        <div className="h-4 bg-slate-100 rounded w-48"></div>
      </div>
      <div className="h-8 bg-slate-200 rounded w-24"></div>
    </div>
    
    <div className="space-y-3">
      <div className="h-4 bg-slate-100 rounded w-full"></div>
      <div className="h-4 bg-slate-100 rounded w-3/4"></div>
      <div className="h-4 bg-slate-100 rounded w-5/6"></div>
    </div>
    
    <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
      <div className="h-10 bg-slate-200 rounded flex-1"></div>
      <div className="h-10 bg-slate-200 rounded flex-1"></div>
    </div>
  </div>
);

export const TableRowSkeleton: React.FC = () => (
  <tr className="animate-pulse">
    <td className="px-4 py-3">
      <div className="h-4 bg-slate-200 rounded w-24"></div>
    </td>
    <td className="px-4 py-3">
      <div className="h-4 bg-slate-100 rounded w-32"></div>
    </td>
    <td className="px-4 py-3">
      <div className="h-4 bg-slate-100 rounded w-28"></div>
    </td>
    <td className="px-4 py-3">
      <div className="h-6 bg-slate-200 rounded-full w-20"></div>
    </td>
    <td className="px-4 py-3">
      <div className="h-8 bg-slate-200 rounded w-16"></div>
    </td>
  </tr>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    {/* Header */}
    <div className="h-32 bg-gradient-to-r from-slate-200 to-slate-300 rounded-2xl"></div>
    
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="h-4 bg-slate-200 rounded w-24 mb-3"></div>
          <div className="h-10 bg-slate-300 rounded w-16"></div>
        </div>
      ))}
    </div>
    
    {/* Content Cards */}
    <div className="grid grid-cols-1 gap-6">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  </div>
);

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
    <div className="p-6 border-b border-slate-200">
      <div className="h-6 bg-slate-200 rounded w-48 animate-pulse"></div>
    </div>
    <div className="divide-y divide-slate-100">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-6 animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="h-5 bg-slate-200 rounded w-32"></div>
            <div className="h-6 bg-slate-100 rounded-full w-24"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-100 rounded w-full"></div>
            <div className="h-4 bg-slate-100 rounded w-3/4"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const ProfileSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="bg-white border border-slate-200 rounded-xl p-8">
      <div className="flex items-center gap-6 mb-6">
        <div className="w-24 h-24 bg-slate-300 rounded-full"></div>
        <div className="flex-1">
          <div className="h-7 bg-slate-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-slate-100 rounded w-32"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <div className="h-3 bg-slate-100 rounded w-24 mb-2"></div>
            <div className="h-5 bg-slate-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const FormSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="h-6 bg-slate-200 rounded w-48 mb-6"></div>
      
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i}>
            <div className="h-4 bg-slate-100 rounded w-32 mb-2"></div>
            <div className="h-10 bg-slate-200 rounded w-full"></div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 flex gap-3">
        <div className="h-10 bg-slate-300 rounded w-32"></div>
        <div className="h-10 bg-slate-200 rounded w-24"></div>
      </div>
    </div>
  </div>
);
