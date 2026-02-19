
import React, { useState } from 'react';
import { Search, Download, Plane, Train, Car, MoreVertical, MapPin, User } from 'lucide-react';
import { TravelRequest, TravelStatus, TravelMode } from '../types';

interface NfaListProps {
  requests: TravelRequest[];
  title: string;
  onViewDetails?: (request: TravelRequest) => void;
  showOriginator?: boolean;
}

const NfaList: React.FC<NfaListProps> = ({ requests, title, onViewDetails, showOriginator = false }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRequests = requests.filter(req => {
    return req.purpose.toLowerCase().includes(searchTerm.toLowerCase()) || 
           req.uniqueId.toLowerCase().includes(searchTerm.toLowerCase()) ||
           req.destination.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getStatusStyle = (status: TravelStatus) => {
    switch (status) {
      case TravelStatus.APPROVED: return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case TravelStatus.PENDING: return 'bg-amber-50 text-amber-700 border-amber-100';
      case TravelStatus.REJECTED: return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const ModeIcon = ({ mode }: { mode: TravelMode }) => {
    if (mode === TravelMode.FLIGHT) return <Plane size={16} className="text-indigo-500" />;
    if (mode === TravelMode.TRAIN) return <Train size={16} className="text-emerald-500" />;
    return <Car size={16} className="text-slate-500" />;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search destination, ID..."
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200">
            <Download size={18} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Trip ID</th>
              {showOriginator && <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Requested By</th>}
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Route & Purpose</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Mode</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Travel Date</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Created</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRequests.map((req) => (
              <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4 text-sm font-medium">
                  <button 
                    onClick={() => onViewDetails?.(req)}
                    className="text-blue-600 hover:text-blue-800 hover:underline font-semibold transition-colors"
                  >
                    #{req.uniqueId}
                  </button>
                </td>
                {showOriginator && (
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{req.originator}</p>
                        <p className="text-xs text-slate-500">{req.originatorEmail || ''}</p>
                      </div>
                    </div>
                  </td>
                )}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-slate-800">{req.origin}</span>
                    <span className="text-slate-300">→</span>
                    <span className="text-sm font-bold text-slate-800">{req.destination}</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1 italic">"{req.purpose}"</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 w-fit px-2 py-1 rounded-lg border border-slate-100">
                    <ModeIcon mode={req.mode} />
                    <span className="font-medium">{req.mode}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                  {new Date(req.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs text-slate-500">
                    {new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    <div className="text-[10px] text-slate-400">
                      {new Date(req.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(req.status)}`}>
                    {req.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NfaList;
