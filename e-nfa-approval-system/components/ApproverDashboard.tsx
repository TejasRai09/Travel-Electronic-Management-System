import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { showSuccessToast, showErrorToast } from '../utils/toast';
import { DashboardSkeleton } from './Skeletons';

interface TravelRequest {
  id: string;
  _id: string;
  originatorName: string;
  originatorEmail: string;
  travelType: string;
  destination: string;
  fromDate: string;
  toDate: string;
  purpose: string;
  status: string;
  createdAt: string;
  managerApprovedBy?: string;
  managerApprovedAt?: string;
  rejectionReason?: string;
  estimatedCost?: number;
}

interface ApiResponse {
  ok: boolean;
  requests: TravelRequest[];
  counts: {
    pending: number;
    approved: number;
    rejected: number;
  };
}

type TabType = 'pending' | 'approved' | 'rejected';

const ApproverDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<TravelRequest | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
      
      const data: ApiResponse = await response.json();
      
      if (data.ok) {
        setRequests(data.requests);
        if (data.counts) {
          setCounts(data.counts);
        }
      } else {
        showErrorToast('Failed to fetch requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      showErrorToast('Error loading requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const token = localStorage.getItem('travelDeskToken');
      const response = await fetch(`/api/travel/${requestId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (data.ok) {
        showSuccessToast('Request approved successfully');
        fetchRequests();
        setSelectedRequest(null);
      } else {
        showErrorToast(data.error || 'Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      showErrorToast('Error approving request');
    }
  };

  const handleReject = async (requestId: string, reason: string) => {
    if (!reason.trim()) {
      showErrorToast('Please provide a rejection reason');
      return;
    }

    try {
      const token = localStorage.getItem('travelDeskToken');
      const response = await fetch(`/api/travel/${requestId}/reject`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });
      
      const data = await response.json();
      
      if (data.ok) {
        showSuccessToast('Request rejected');
        fetchRequests();
        setSelectedRequest(null);
      } else {
        showErrorToast(data.error || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      showErrorToast('Error rejecting request');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Pagination logic
  const totalPages = Math.ceil(requests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRequests = requests.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Approval Dashboard</h1>
        <p className="text-gray-600">Review and manage travel requests from your team</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Pending Approval</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{counts.pending}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Approved</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{counts.approved}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Rejected</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{counts.rejected}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="flex border-b">
          <button
            onClick={() => { setActiveTab('pending'); setCurrentPage(1); }}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'pending'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              Pending
              {counts.pending > 0 && (
                <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                  {counts.pending}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => { setActiveTab('approved'); setCurrentPage(1); }}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'approved'
                ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Approved
            </div>
          </button>

          <button
            onClick={() => { setActiveTab('rejected'); setCurrentPage(1); }}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'rejected'
                ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <XCircle className="w-4 h-4" />
              Rejected
            </div>
          </button>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {currentRequests.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No {activeTab} requests found</p>
            <p className="text-gray-500 text-sm mt-2">
              {activeTab === 'pending' 
                ? 'All requests have been processed' 
                : `No requests have been ${activeTab} yet`}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Travel Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Purpose
                    </th>
                    {activeTab !== 'pending' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        {activeTab === 'approved' ? 'Approved On' : 'Rejected On'}
                      </th>
                    )}
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{request.originatorName}</p>
                          <p className="text-xs text-gray-500">{request.originatorEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{request.travelType}</p>
                          <p className="text-xs text-gray-500">{request.destination}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <p>{formatDate(request.fromDate)}</p>
                          <p className="text-xs text-gray-500">to {formatDate(request.toDate)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900 max-w-xs truncate">{request.purpose}</p>
                      </td>
                      {activeTab !== 'pending' && (
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">
                            {request.managerApprovedAt 
                              ? formatDate(request.managerApprovedAt)
                              : formatDate(request.createdAt)}
                          </p>
                          {request.managerApprovedBy && (
                            <p className="text-xs text-gray-500">by {request.managerApprovedBy}</p>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm inline-flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, requests.length)} of {requests.length} requests
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`px-3 py-2 border rounded-md text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Travel Request Details</h2>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Employee Info */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Employee Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-lg font-semibold text-gray-900">{selectedRequest.originatorName}</p>
                  <p className="text-sm text-gray-600">{selectedRequest.originatorEmail}</p>
                </div>
              </div>

              {/* Travel Info */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Travel Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Type</p>
                      <p className="text-sm font-medium text-gray-900">{selectedRequest.travelType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Destination</p>
                      <p className="text-sm font-medium text-gray-900">{selectedRequest.destination}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">From Date</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(selectedRequest.fromDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">To Date</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(selectedRequest.toDate)}</p>
                    </div>
                  </div>
                  {selectedRequest.estimatedCost && (
                    <div>
                      <p className="text-xs text-gray-500">Estimated Cost</p>
                      <p className="text-sm font-medium text-gray-900">₹{selectedRequest.estimatedCost.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Purpose */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Purpose</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-900">{selectedRequest.purpose}</p>
                </div>
              </div>

              {/* Rejection Reason (if rejected) */}
              {activeTab === 'rejected' && selectedRequest.rejectionReason && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Rejection Reason</h3>
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <p className="text-sm text-red-900">{selectedRequest.rejectionReason}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons (only for pending) */}
              {activeTab === 'pending' && (
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => handleApprove(selectedRequest._id)}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium inline-flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approve Request
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Please provide a reason for rejection:');
                      if (reason) {
                        handleReject(selectedRequest._id, reason);
                      }
                    }}
                    className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium inline-flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject Request
                  </button>
                </div>
              )}

              {/* Close Button (for approved/rejected) */}
              {activeTab !== 'pending' && (
                <div className="pt-4 border-t">
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApproverDashboard;
