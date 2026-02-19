import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Calendar, 
  MapPin, 
  User, 
  Plane,
  Clock,
  FileText,
  Package
} from 'lucide-react';
import { DashboardSkeleton } from './Skeletons';
import { TravelRequest, TravelStatus } from '../types';

interface VendorDashboardProps {
  onViewRequest: (request: TravelRequest) => void;
}

const VendorDashboard: React.FC<VendorDashboardProps> = ({ onViewRequest }) => {
  const [pendingRequests, setPendingRequests] = useState<TravelRequest[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'pending' | 'approved'>('pending');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('travelDeskToken');
      
      // Fetch pending (approved by POC, awaiting vendor action) requests
      const pendingRes = await fetch('/api/vendor/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const pendingData = await pendingRes.json();
      
      // Fetch approved/completed requests
      const approvedRes = await fetch('/api/vendor/approved', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const approvedData = await approvedRes.json();
      
      if (pendingData.ok) setPendingRequests(pendingData.requests || []);
      if (approvedData.ok) setApprovedRequests(approvedData.requests || []);
    } catch (error) {
      console.error('Error fetching vendor requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const RequestCard = ({ request }: { request: TravelRequest }) => (
    <div 
      onClick={() => onViewRequest(request)}
      className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
            <Package size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-800">{request.uniqueId}</h3>
            <p className="text-sm text-slate-500">{request.purpose}</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
          request.status === TravelStatus.APPROVED 
            ? 'bg-emerald-100 text-emerald-700' 
            : 'bg-blue-100 text-blue-700'
        }`}>
          {request.status === TravelStatus.APPROVED ? 'Handled' : 'Pending'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2 text-slate-600">
          <User size={16} />
          <span className="text-sm">{request.passengerName}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <Plane size={16} />
          <span className="text-sm">{request.mode}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <MapPin size={16} />
          <span className="text-sm">{request.origin} → {request.destination}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <Calendar size={16} />
          <span className="text-sm">{formatDate(request.travelDate)}</span>
        </div>
      </div>

      {request.returnDate && (
        <div className="flex items-center gap-2 text-slate-600 mb-4">
          <Clock size={16} />
          <span className="text-sm">Return: {formatDate(request.returnDate)}</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <span className="text-xs text-slate-500">
          Requested by: {request.originator}
        </span>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onViewRequest(request);
          }}
          className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-1"
        >
          <FileText size={16} />
          View Details
        </button>
      </div>
    </div>
  );

  if (loading) {
    return <DashboardSkeleton />;
  }

  const displayRequests = activeView === 'pending' ? pendingRequests : approvedRequests;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Vendor Dashboard</h1>
        <p className="text-slate-600">Manage travel booking requests</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveView('pending')}
          className={`pb-3 px-1 font-semibold transition-colors relative ${
            activeView === 'pending'
              ? 'text-blue-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Pending Requests
          {pendingRequests.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs">
              {pendingRequests.length}
            </span>
          )}
          {activeView === 'pending' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>
        <button
          onClick={() => setActiveView('approved')}
          className={`pb-3 px-1 font-semibold transition-colors relative ${
            activeView === 'approved'
              ? 'text-blue-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Handled Requests
          {activeView === 'approved' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>
      </div>

      {/* Requests Grid */}
      {displayRequests.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
            {activeView === 'pending' ? <Clock size={32} className="text-slate-400" /> : <CheckCircle size={32} className="text-slate-400" />}
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            No {activeView === 'pending' ? 'Pending' : 'Handled'} Requests
          </h3>
          <p className="text-slate-500">
            {activeView === 'pending' 
              ? 'New requests will appear here when POC approves them'
              : 'Completed requests will be shown here'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayRequests.map(request => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;
