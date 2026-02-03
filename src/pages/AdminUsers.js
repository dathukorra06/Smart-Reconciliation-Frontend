import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role !== 'admin') {
      setError('Access denied. You must be an admin to view this page.');
      setLoading(false);
      return;
    }
    fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/users');
      setUsers(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(`/api/admin/users/${userId}`, { role: newRole });
      setUsers(users.map(u => (u._id === userId ? { ...u, role: newRole } : u)));
    } catch (err) {
      console.error('Error updating role:', err);
      alert('Failed to update role');
    }
  };

  const handleStatusChange = async (userId, currentStatus) => {
    const url = currentStatus
      ? `/api/admin/users/${userId}`
      : `/api/admin/users/${userId}/activate`;

    try {
      if (currentStatus) {
        if (!window.confirm('Are you sure you want to deactivate this user?')) return;
        await axios.delete(url);
      } else {
        await axios.put(url);
      }

      setUsers(users.map(u => (u._id === userId ? { ...u, isActive: !currentStatus } : u)));
    } catch (err) {
      console.error('Error changing status:', err);
      alert('Failed to update user status');
    }
  };

  if (loading) return <div className="text-center mt-10">Loading users...</div>;
  if (error) return <div className="text-center mt-10 text-red-600 font-bold">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>

      <table className="min-w-full bg-white shadow rounded">
        <thead>
          <tr>
            <th className="p-3">Name</th>
            <th className="p-3">Email</th>
            <th className="p-3">Role</th>
            <th className="p-3">Status</th>
            <th className="p-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id}>
              <td className="p-3">{u.name}</td>
              <td className="p-3">{u.email}</td>
              <td className="p-3">
                <select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u._id, e.target.value)}
                  disabled={u._id === user._id}
                >
                  <option value="admin">Admin</option>
                  <option value="analyst">Analyst</option>
                  <option value="viewer">Viewer</option>
                </select>
              </td>
              <td className="p-3">{u.isActive ? 'Active' : 'Inactive'}</td>
              <td className="p-3">
                <button
                  onClick={() => handleStatusChange(u._id, u.isActive)}
                  disabled={u._id === user._id}
                >
                  {u.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminUsers;
