import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Edit3, 
  Save, 
  X, 
  Calendar, 
  MapPin, 
  User, 
  Plane,
  Clock,
  AlertCircle,
  CheckCheck,
  FileText,
  MessageSquare
} from 'lucide-react';
import { showSuccessToast, showErrorToast, showLoadingToast, dismissToast, showWarningToast } from '../utils/toast';
import { DashboardSkeleton } from './Skeletons';
import { TravelRequest, TravelStatus, TravelMode, TripNature, DietaryPreference } from '../types';

interface POCDashboardProps {
  onViewRequest: (request: TravelRequest) => void;
}

const POCDashboard: React.FC<POCDashboardProps> = ({ onViewRequest }) => {
  const [pendingRequests, setPendingRequests] = useState<TravelRequest[]>([]);
  const [allRequests, setAllRequests] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'pending' | 'all'>('pending');
  const [editingRequest, setEditingRequest] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<TravelRequest>>({});
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('travelDeskToken');
      
      // Fetch pending (manager-approved) requests
      const pendingRes = await fetch('/api/poc/requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const pendingData = await pendingRes.json();
      
      // Fetch all requests for history
      const allRes = await fetch('/api/poc/all-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const allData = await allRes.json();
      
      if (pendingData.ok) setPendingRequests(pendingData.requests || []);
      if (allData.ok) setAllRequests(allData.requests || []);
    } catch (error) {
      console.error('Error fetching POC requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (request: TravelRequest) => {
    setEditingRequest(request.id);
    setEditForm({
      passengerName: request.passengerName,
      passengerPhone: request.passengerPhone,
      origin: request.origin,
      destination: request.destination,
      travelDate: request.travelDate,
      returnDate: request.returnDate,
      mode: request.mode,
      travelClass: request.travelClass,
      purpose: request.purpose,
      accommodationRequired: request.accommodationRequired,
      hotelPreference: request.hotelPreference,
      checkInDate: request.checkInDate,
      checkOutDate: request.checkOutDate,
      specialInstructions: request.specialInstructions,
      dietaryPreference: request.dietaryPreference,
      tripNature: request.tripNature,
      departureTimeSlot: request.departureTimeSlot
    });
  };

  const handleSaveEdit = async (requestId: string) => {
    const toastId = showLoadingToast('Saving changes...');
    try {
      setProcessing(requestId);
      const token = localStorage.getItem('travelDeskToken');
      
      const response = await fetch(`/api/poc/requests/${requestId}/edit`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();
      dismissToast(toastId);
      
      if (data.ok) {
        showSuccessToast('Request updated successfully!');
        setEditingRequest(null);
        await fetchRequests();
      } else {
        showErrorToast(data.error || 'Failed to update request');
      }
    } catch (error) {
      dismissToast(toastId);
      console.error('Error saving edits:', error);
      showErrorToast('Failed to save changes. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!window.confirm('Are you sure you want to give final approval for this travel request?')) return;
    
    const toastId = showLoadingToast('Approving request...');
    try {
      setProcessing(requestId);
      const token = localStorage.getItem('travelDeskToken');
      
      const response = await fetch(`/api/poc/requests/${requestId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      dismissToast(toastId);
      
      if (data.ok) {
        showSuccessToast('Request approved successfully! 🎉');
        await fetchRequests();
      } else {
        showErrorToast(data.error || 'Failed to approve request');
      }
    } catch (error) {
      dismissToast(toastId);
      console.error('Error approving request:', error);
      showErrorToast('Failed to approve request. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    const reason = window.prompt('Please provide a reason for rejection:');
    if (!reason) return;
    
    const toastId = showLoadingToast('Rejecting request...');
    try {
      setProcessing(requestId);
      const token = localStorage.getItem('travelDeskToken');
      
      const response = await fetch(`/api/poc/requests/${requestId}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });

      const data = await response.json();
      dismissToast(toastId);
      
      if (data.ok) {
        showWarningToast('Request rejected successfully');
        await fetchRequests();
      } else {
        showErrorToast(data.error || 'Failed to reject request');
      }
    } catch (error) {
      dismissToast(toastId);
      console.error('Error rejecting request:', error);
      showErrorToast('Failed to reject request. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: TravelStatus) => {
    const styles: Record<TravelStatus, string> = {
      [TravelStatus.PENDING]: 'bg-amber-100 text-amber-700',
      [TravelStatus.MANAGER_APPROVED]: 'bg-blue-100 text-blue-700',
      [TravelStatus.APPROVED]: 'bg-green-100 text-green-700',
      [TravelStatus.REJECTED]: 'bg-red-100 text-red-700',
      [TravelStatus.POC_REJECTED]: 'bg-red-100 text-red-700',
      [TravelStatus.DRAFT]: 'bg-slate-100 text-slate-700'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const renderRequestCard = (request: TravelRequest) => {
    const isEditing = editingRequest === request.id;
    const isProcessing = processing === request.id;

    return (
      <div key={request.id} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-bold text-slate-900">{request.uniqueId}</h3>
              {getStatusBadge(request.status)}
            </div>
            <p className="text-sm text-slate-600">
              <User size={14} className="inline mr-1" />
              {request.originator}
            </p>
          </div>
          {!isEditing && request.status === TravelStatus.MANAGER_APPROVED && (
            <button
              onClick={() => handleEdit(request)}
              disabled={isProcessing}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              <Edit3 size={16} />
              Edit
            </button>
          )}
        </div>

        {/* Editable Fields */}
        {isEditing ? (
          <div className="space-y-4 bg-blue-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Passenger Name</label>
                <input
                  type="text"
                  value={editForm.passengerName || ''}
                  onChange={(e) => setEditForm({ ...editForm, passengerName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={editForm.passengerPhone || ''}
                  onChange={(e) => setEditForm({ ...editForm, passengerPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">From</label>
                <input
                  type="text"
                  value={editForm.origin || ''}
                  onChange={(e) => setEditForm({ ...editForm, origin: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">To</label>
                <input
                  type="text"
                  value={editForm.destination || ''}
                  onChange={(e) => setEditForm({ ...editForm, destination: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Travel Date</label>
                <input
                  type="date"
                  value={editForm.travelDate?.split('T')[0] || ''}
                  onChange={(e) => setEditForm({ ...editForm, travelDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Travel Class</label>
                <input
                  type="text"
                  value={editForm.travelClass || ''}
                  onChange={(e) => setEditForm({ ...editForm, travelClass: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Purpose</label>
              <textarea
                value={editForm.purpose || ''}
                onChange={(e) => setEditForm({ ...editForm, purpose: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSaveEdit(request.id)}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Save size={16} />
                Save Changes
              </button>
              <button
                onClick={() => setEditingRequest(null)}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50"
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Request Details */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={16} className="text-blue-500" />
                <span className="text-slate-600">From:</span>
                <span className="font-semibold text-slate-900">{request.origin}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={16} className="text-green-500" />
                <span className="text-slate-600">To:</span>
                <span className="font-semibold text-slate-900">{request.destination}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={16} className="text-amber-500" />
                <span className="text-slate-600">Date:</span>
                <span className="font-semibold text-slate-900">
                  {new Date(request.travelDate).toLocaleDateString('en-IN')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Plane size={16} className="text-purple-500" />
                <span className="text-slate-600">Mode:</span>
                <span className="font-semibold text-slate-900">{request.mode} - {request.travelClass}</span>
              </div>
            </div>

            {/* Purpose */}
            <div className="bg-slate-50 rounded-lg p-3 mb-4">
              <p className="text-xs font-semibold text-slate-500 mb-1">PURPOSE</p>
              <p className="text-sm text-slate-700">{request.purpose}</p>
            </div>

            {/* Approval Timeline */}
            {request.managerApprovedAt && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <CheckCheck size={16} />
                  <span className="font-semibold">Manager Approved</span>
                  <span className="text-green-600">
                    {new Date(request.managerApprovedAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>
            )}

            {/* POC Edit History */}
            {request.pocEditedAt && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Edit3 size={16} />
                  <span className="font-semibold">Edited by POC</span>
                  <span className="text-blue-600">
                    {new Date(request.pocEditedAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Action Buttons */}
        {!isEditing && (
          <div className="flex gap-2 pt-4 border-t border-slate-100">
            <button
              onClick={() => onViewRequest(request)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <FileText size={16} />
              View Details
            </button>
            {request.status === TravelStatus.MANAGER_APPROVED && (
              <>
                <button
                  onClick={() => handleApprove(request.id)}
                  disabled={isProcessing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <CheckCircle size={16} />
                  Approve
                </button>
                <button
                  onClick={() => handleReject(request.id)}
                  disabled={isProcessing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <XCircle size={16} />
                  Reject
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  const displayRequests = activeView === 'pending' ? pendingRequests : allRequests;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Travel POC Dashboard</h1>
        <p className="text-blue-100">Manage and approve travel requests with full editing capabilities</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Pending Approval</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{pendingRequests.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Clock size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Total Requests</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{allRequests.length}</p>
            </div>
            <div className="bg-slate-100 p-3 rounded-lg">
              <FileText size={24} className="text-slate-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Approved Today</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {allRequests.filter(r => 
                  r.status === TravelStatus.APPROVED &&
                  r.pocApprovedAt &&
                  new Date(r.pocApprovedAt).toDateString() === new Date().toDateString()
                ).length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 bg-white border border-slate-200 rounded-xl p-2 w-fit">
        <button
          onClick={() => setActiveView('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeView === 'pending'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Pending Approval ({pendingRequests.length})
        </button>
        <button
          onClick={() => setActiveView('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeView === 'all'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Requests ({allRequests.length})
        </button>
      </div>

      {/* Requests List */}
      {displayRequests.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <AlertCircle size={48} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No requests found</h3>
          <p className="text-slate-600">
            {activeView === 'pending'
              ? 'There are no pending requests awaiting your approval.'
              : 'No travel requests to display.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {displayRequests.map(request => renderRequestCard(request))}
        </div>
      )}
    </div>
  );
};

export default POCDashboard;
