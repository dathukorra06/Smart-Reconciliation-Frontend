import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuditTimeline = ({ recordId }) => {
  const [auditEvents, setAuditEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    actionType: '',
    dateFrom: '',
    dateTo: '',
    user: ''
  });
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [users, setUsers] = useState([]);

  // Fetch available users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('/api/admin/users');
        setUsers(response.data.data);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      }
    };
    fetchUsers();
  }, []);

  // ✅ Wrap in useCallback so ESLint is happy
  const fetchAuditTrail = useCallback(async () => {
    if (!recordId) return;

    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      if (filters.actionType) queryParams.append('action', filters.actionType);
      if (filters.dateFrom) queryParams.append('startDate', filters.dateFrom);
      if (filters.dateTo) queryParams.append('endDate', filters.dateTo);
      if (filters.user) queryParams.append('userId', filters.user);

      const response = await axios.get(`/api/audit/${recordId}?${queryParams}`);
      setAuditEvents(response.data.data.auditTrail);
      setError(null);
    } catch (err) {
      console.error('Audit trail fetch error:', err);
      setError('Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  }, [recordId, filters]);

  // ✅ ESLint-correct dependency
  useEffect(() => {
    fetchAuditTrail();
  }, [fetchAuditTrail]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      actionType: '',
      dateFrom: '',
      dateTo: '',
      user: ''
    });
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'create': return '➕';
      case 'update': return '✏️';
      case 'delete': return '🗑️';
      case 'reconcile': return '🔄';
      default: return '📋';
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'create': return 'text-green-600';
      case 'update': return 'text-blue-600';
      case 'delete': return 'text-red-600';
      case 'reconcile': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-6">Audit Timeline</h3>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div>
          <label className="block text-gray-700 mb-2 text-sm">Action Type</label>
          <select
            value={filters.actionType}
            onChange={(e) => handleFilterChange('actionType', e.target.value)}
            className="form-control text-sm"
          >
            <option value="">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="reconcile">Reconcile</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-700 mb-2 text-sm">From Date</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="form-control text-sm"
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-2 text-sm">To Date</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="form-control text-sm"
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-2 text-sm">User</label>
          <select
            value={filters.user}
            onChange={(e) => handleFilterChange('user', e.target.value)}
            className="form-control text-sm"
          >
            <option value="">All Users</option>
            {users.map(user => (
              <option key={user._id} value={user._id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button onClick={resetFilters} className="btn btn-secondary text-sm w-full">
            Reset
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        {auditEvents.length > 0 ? (
          <div className="space-y-8">
            {auditEvents.map(event => (
              <div key={event._id} className="relative">
                <div className="absolute left-0 w-8 h-8 rounded-full bg-white border-4 border-blue-500 flex items-center justify-center z-10">
                  <span className={`text-lg ${getActionColor(event.action)}`}>
                    {getActionIcon(event.action)}
                  </span>
                </div>

                <div className="ml-12">
                  <div
                    className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100"
                    onClick={() => setExpandedEvent(expandedEvent === event._id ? null : event._id)}
                  >
                    <h4 className="font-semibold">{event.action}</h4>
                    <p className="text-sm">{formatDate(event.timestamp)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No audit events found
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditTimeline;
