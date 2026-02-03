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

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    uploadedBy: '',
  });

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      const res = await axios.get(`/api/reconciliation/dashboard?${params}`);
      setStats(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="loading-spinner"></div>
      <span className="ml-3 text-gray-600">Loading dashboard data...</span>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your reconciliation statistics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Jobs Chart */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Jobs Overview</h2>
          <div className="h-80">
            <Bar
              data={{
                labels: Object.keys(stats?.uploadJobs || {}),
                datasets: [{ 
                  label: 'Uploads', 
                  data: Object.values(stats?.uploadJobs || {}),
                  backgroundColor: 'rgba(59, 130, 246, 0.8)',
                  borderColor: 'rgba(59, 130, 246, 1)',
                  borderWidth: 1,
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Reconciliation Chart */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Reconciliation Status</h2>
          <div className="h-80">
            <Doughnut
              data={{
                labels: Object.keys(stats?.reconciliation || {}),
                datasets: [{ 
                  label: 'Reconciliation', 
                  data: Object.values(stats?.reconciliation || {}),
                  backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(234, 179, 8, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(147, 51, 234, 0.8)',
                  ],
                  borderColor: [
                    'rgba(34, 197, 94, 1)',
                    'rgba(234, 179, 8, 1)',
                    'rgba(239, 68, 68, 1)',
                    'rgba(147, 51, 234, 1)',
                  ],
                  borderWidth: 1,
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600">
            {Object.values(stats?.uploadJobs || {}).reduce((a, b) => a + b, 0)}
          </div>
          <div className="text-gray-600 mt-1">Total Uploads</div>
        </div>
        
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600">
            {stats?.reconciliation?.match || 0}
          </div>
          <div className="text-gray-600 mt-1">Matches</div>
        </div>
        
        <div className="card text-center">
          <div className="text-3xl font-bold text-yellow-600">
            {stats?.reconciliation?.partial || 0}
          </div>
          <div className="text-gray-600 mt-1">Partial Matches</div>
        </div>
        
        <div className="card text-center">
          <div className="text-3xl font-bold text-red-600">
            {stats?.reconciliation?.no_match || 0}
          </div>
          <div className="text-gray-600 mt-1">No Matches</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
