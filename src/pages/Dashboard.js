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
  const [filters, setFilters] = useState({
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

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Dashboard</h1>

      <Bar
        data={{
          labels: Object.keys(stats?.uploadJobs || {}),
          datasets: [{ label: 'Uploads', data: Object.values(stats?.uploadJobs || {}) }],
        }}
      />

      <Doughnut
        data={{
          labels: Object.keys(stats?.reconciliation || {}),
          datasets: [{ label: 'Reconciliation', data: Object.values(stats?.reconciliation || {}) }],
        }}
      />
    </div>
  );
};

export default Dashboard;
