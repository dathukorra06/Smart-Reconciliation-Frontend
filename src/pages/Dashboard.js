import React, { useState, useEffect } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import axios from 'axios';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    uploadedBy: ''
  });
  const [users, setUsers] = useState([]);

  // Fetch available users for filter dropdown
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

  useEffect(() => {
    fetchDashboardStats();
  }, [filters]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.uploadedBy) queryParams.append('uploadedBy', filters.uploadedBy);

      const response = await axios.get(`/api/reconciliation/dashboard?${queryParams}`);
      setStats(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard statistics');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      status: '',
      uploadedBy: ''
    });
  };

  // ... existing chart data functions remain the same ...

  const getUploadJobChartData = () => {
    if (!stats) return null;
    
    const labels = Object.keys(stats.uploadJobs || {});
    const data = Object.values(stats.uploadJobs || {});
    
    return {
      labels,
      datasets: [
        {
          label: 'Upload Jobs Count',
          data,
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(255, 99, 132, 0.6)',
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(255, 99, 132, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const getReconciliationChartData = () => {
    if (!stats) return null;
    
    const labels = Object.keys(stats.reconciliation || {});
    const data = Object.values(stats.reconciliation || {});
    
    return {
      labels,
      datasets: [
        {
          label: 'Reconciliation Results',
          data,
          backgroundColor: [
            'rgba(75, 192, 192, 0.6)', // matched
            'rgba(255, 206, 86, 0.6)', // partially_matched
            'rgba(255, 99, 132, 0.6)', // not_matched
            'rgba(153, 102, 255, 0.6)', // duplicate
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Upload Jobs by Status',
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Reconciliation Results Distribution',
      },
    },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl text-red-600">{error}</h2>
        <button 
          onClick={fetchDashboardStats}
          className="btn btn-primary mt-4"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      {/* Dynamic Filters */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="form-control"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="form-control"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="form-control"
            >
              <option value="">All Statuses</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Uploaded By</label>
            <select
              value={filters.uploadedBy}
              onChange={(e) => handleFilterChange('uploadedBy', e.target.value)}
              className="form-control"
            >
              <option value="">All Users</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex justify-end mt-4 space-x-2">
          <button
            onClick={resetFilters}
            className="btn btn-secondary"
          >
            Reset Filters
          </button>
          <button
            onClick={fetchDashboardStats}
            className="btn btn-primary"
          >
            Apply Filters
          </button>
        </div>
      </div>
      
      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Upload Jobs</h3>
          <p className="text-3xl font-bold text-blue-600">
            {Object.values(stats?.uploadJobs || {}).reduce((a, b) => a + b, 0)}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Records</h3>
          <p className="text-3xl font-bold text-green-600">
            {stats?.records?.totalRecords || 0}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Amount</h3>
          <p className="text-3xl font-bold text-purple-600">
            ${stats?.records?.totalAmount?.toFixed(2) || '0.00'}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Matched Records</h3>
          <p className="text-3xl font-bold text-teal-600">
            {stats?.reconciliation?.matched || 0}
          </p>
        </div>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          {getUploadJobChartData() && (
            <Bar data={getUploadJobChartData()} options={barOptions} />
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          {getReconciliationChartData() && (
            <Doughnut data={getReconciliationChartData()} options={doughnutOptions} />
          )}
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Reconciliation Activity</h2>
        {stats?.recentActivity && stats.recentActivity.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Uploaded Record</th>
                  <th>System Record</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentActivity.map((activity, index) => (
                  <tr key={index}>
                    <td>
                      <div className="font-medium">{activity.uploadedRecordId?.transactionId}</div>
                      <div className="text-sm">${activity.uploadedRecordId?.amount}</div>
                    </td>
                    <td>
                      <div className="font-medium">{activity.systemRecordId?.transactionId}</div>
                      <div className="text-sm">${activity.systemRecordId?.amount}</div>
                    </td>
                    <td>
                      <span className={`status-badge ${
                        activity.matchStatus === 'matched' ? 'status-match' :
                        activity.matchStatus === 'partially_matched' ? 'status-partial' :
                        activity.matchStatus === 'not_matched' ? 'status-no-match' : 'status-duplicate'
                      }`}>
                        {activity.matchStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td>{new Date(activity.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No recent activity</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;