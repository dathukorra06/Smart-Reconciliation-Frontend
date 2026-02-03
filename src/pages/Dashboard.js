import React, { useState, useEffect, useCallback } from 'react';
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

  // Fetch available users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('/api/admin/users');
        setUsers(response.data.data || []);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      }
    };
    fetchUsers();
  }, []);

  // FIXED: useCallback for ESLint
  const fetchDashboardStats = useCallback(async () => {
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
  }, [filters]);

  // FIXED dependency
  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

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
            'rgba(75, 192, 192, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(153, 102, 255, 0.6)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const barOptions = {
    responsive: true,
    plugins: {
      title: { display: true, text: 'Upload Jobs by Status' },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      title: { display: true, text: 'Reconciliation Results' },
    },
  };

  if (loading) return <div className="text-center p-10">Loading...</div>;
  if (error) return <div className="text-red-600 text-center p-10">{error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-4 rounded shadow">
          {getUploadJobChartData() && <Bar data={getUploadJobChartData()} options={barOptions} />}
        </div>

        <div className="bg-white p-4 rounded shadow">
          {getReconciliationChartData() && (
            <Doughnut data={getReconciliationChartData()} options={doughnutOptions} />
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 shadow rounded">Total Jobs: {Object.values(stats.uploadJobs || {}).reduce((a,b)=>a+b,0)}</div>
        <div className="bg-white p-4 shadow rounded">Total Records: {stats.records?.totalRecords || 0}</div>
        <div className="bg-white p-4 shadow rounded">Total Amount: ${stats.records?.totalAmount || 0}</div>
        <div className="bg-white p-4 shadow rounded">Matched: {stats.reconciliation?.matched || 0}</div>
      </div>
    </div>
  );
};

export default Dashboard;
