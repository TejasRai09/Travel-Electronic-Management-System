import { useState, useEffect } from 'react';
import { Activity, RefreshCw, Search, Filter, Calendar, User, Clock } from 'lucide-react';
import { showErrorToast, showSuccessToast } from '../utils/toast';

interface ActivityLogEntry {
  _id: string;
  userEmail: string;
  userName: string;
  action: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface ActivityStats {
  totalLogs: number;
  uniqueUsers: number;
  actionCounts: { _id: string; count: number }[];
  recentLogs: ActivityLogEntry[];
}

export default function ActivityLog() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(20);
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [page, actionFilter, userFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(actionFilter && { action: actionFilter }),
        ...(userFilter && { userEmail: userFilter }),
      });

      const token = localStorage.getItem('travelDeskToken');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch(`http://localhost:8787/api/admin/activity-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const data = await response.json();
      if (!data.ok || !data.logs) {
        throw new Error('Invalid response format from server');
      }
      
      setLogs(data.logs || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (error: any) {
      showErrorToast(error.message || 'Failed to load activity logs');
      console.error('Activity log fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('travelDeskToken');
      if (!token) {
        console.error('No token found for stats fetch');
        return;
      }

      const response = await fetch('http://localhost:8787/api/admin/activity-stats', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const data = await response.json();
      if (!data.ok || !data.stats) {
        throw new Error('Invalid stats response format');
      }
      
      setStats(data.stats);
    } catch (error: any) {
      console.error('Failed to load stats:', error.message || error);
    }
  };

  const handleRefresh = () => {
    setPage(1);
    fetchLogs();
    fetchStats();
    showSuccessToast('Activity logs refreshed');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getActionBadgeColor = (action: string) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('login')) return 'bg-green-100 text-green-800';
    if (lowerAction.includes('logout')) return 'bg-gray-100 text-gray-800';
    if (lowerAction.includes('create')) return 'bg-blue-100 text-blue-800';
    if (lowerAction.includes('update') || lowerAction.includes('edit')) return 'bg-yellow-100 text-yellow-800';
    if (lowerAction.includes('delete')) return 'bg-red-100 text-red-800';
    if (lowerAction.includes('approve') || lowerAction.includes('poc_approve') || lowerAction.includes('manager_approve')) return 'bg-purple-100 text-purple-800';
    if (lowerAction.includes('reject')) return 'bg-orange-100 text-orange-800';
    if (lowerAction.includes('bulk') || lowerAction.includes('upload')) return 'bg-indigo-100 text-indigo-800';
    if (lowerAction.includes('admin')) return 'bg-pink-100 text-pink-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-7 h-7 text-blue-600" />
            Activity Log
          </h1>
          <p className="text-gray-600 mt-1">Monitor all user activities and system events</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Activities</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalLogs}</p>
              </div>
              <Activity className="w-10 h-10 text-blue-600 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Unique Users</p>
                <p className="text-2xl font-bold text-purple-900">{stats.uniqueUsers}</p>
              </div>
              <User className="w-10 h-10 text-purple-600 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Action Types</p>
                <p className="text-2xl font-bold text-green-900">{stats.actionCounts.length}</p>
              </div>
              <Filter className="w-10 h-10 text-green-600 opacity-50" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-gray-700 font-medium hover:text-gray-900"
        >
          <Filter className="w-4 h-4" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                Filter by User Email
              </label>
              <input
                type="text"
                value={userFilter}
                onChange={(e) => {
                  setUserFilter(e.target.value);
                  setPage(1);
                }}
                placeholder="Enter email address..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Filter by Action
              </label>
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Actions</option>
                {stats?.actionCounts.map((ac) => (
                  <option key={ac._id} value={ac._id}>
                    {ac._id} ({ac.count})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {(actionFilter || userFilter) && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {actionFilter && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Action: {actionFilter}
              </span>
            )}
            {userFilter && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                User: {userFilter}
              </span>
            )}
            <button
              onClick={() => {
                setActionFilter('');
                setUserFilter('');
                setPage(1);
              }}
              className="text-xs text-red-600 hover:text-red-800 underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Activity Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <User className="w-4 h-4 inline mr-1" />
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Activity className="w-4 h-4 inline mr-1" />
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">
                  Activity Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading activity logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    No activity logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-900">{log.userName}</div>
                      <div className="text-gray-500 text-xs">{log.userEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {log.details}
                      {log.ipAddress && (
                        <div className="text-xs text-gray-400 mt-1">IP: {log.ipAddress}</div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
