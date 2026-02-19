import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import NfaList from './NfaList';
import { TravelRequest } from '../types';

interface ApprovalsViewProps {
  onViewDetails: (request: TravelRequest) => void;
}

type TabType = 'pending' | 'approved' | 'rejected';

const ApprovalsView: React.FC<ApprovalsViewProps> = ({ onViewDetails }) => {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('travelDeskToken');
      const statusMap = {
        pending: 'Pending',
        approved: 'ManagerApproved',
        rejected: 'Rejected'
      };
      
      const response = await fetch(
        `/api/travel/approvals?status=${statusMap[activeTab]}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      const data = await response.json();
      
      if (data.ok) {
        setRequests(data.requests || []);
        if (data.counts) {
          setCounts(data.counts);
        }
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'pending':
        return 'Pending Approvals';
      case 'approved':
        return 'Approved Requests';
      case 'rejected':
        return 'Rejected Requests';
      default:
        return 'Approvals';
    }
  };

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-xs font-medium">Pending</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{counts.pending}</p>
            </div>
            <div className="bg-yellow-100 p-2.5 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-xs font-medium">Approved</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{counts.approved}</p>
            </div>
            <div className="bg-green-100 p-2.5 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-xs font-medium">Rejected</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{counts.rejected}</p>
            </div>
            <div className="bg-red-100 p-2.5 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-t-xl shadow-sm border border-slate-200 border-b-0">
        <div className="flex">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 px-6 py-3.5 text-sm font-semibold transition-all ${
              activeTab === 'pending'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              Pending
              {counts.pending > 0 && (
                <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {counts.pending}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => setActiveTab('approved')}
            className={`flex-1 px-6 py-3.5 text-sm font-semibold transition-all ${
              activeTab === 'approved'
                ? 'text-green-600 border-b-2 border-green-600 bg-green-50/50'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Approved
            </div>
          </button>

          <button
            onClick={() => setActiveTab('rejected')}
            className={`flex-1 px-6 py-3.5 text-sm font-semibold transition-all ${
              activeTab === 'rejected'
                ? 'text-red-600 border-b-2 border-red-600 bg-red-50/50'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <XCircle className="w-4 h-4" />
              Rejected
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="-mt-px">
        {loading ? (
          <div className="bg-white rounded-b-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-600 text-sm">Loading {activeTab} requests...</p>
          </div>
        ) : (
          <NfaList 
            requests={requests} 
            title={getTitle()} 
            onViewDetails={onViewDetails} 
            showOriginator={true}
          />
        )}
      </div>
    </div>
  );
};

export default ApprovalsView;
