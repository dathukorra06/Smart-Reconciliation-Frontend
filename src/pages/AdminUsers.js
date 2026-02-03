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
      console.error(err);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(`/api/admin/users/${userId}`, { role: newRole });
      setUsers(users.map(u => (u._id === userId ? { ...u, role: newRole } : u)));
    } catch (err) {
      alert('Failed to update role');
    }
  };

  const handleStatusChange = async (userId, currentStatus) => {
    try {
      if (currentStatus) {
        if (!window.confirm('Deactivate this user?')) return;
        await axios.delete(`/api/admin/users/${userId}`);
      } else {
        await axios.put(`/api/admin/users/${userId}/activate`);
      }

      setUsers(users.map(u =>
        u._id === userId ? { ...u, isActive: !currentStatus } : u
      ));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <h1>User Management</h1>
      <table border="1" width="100%">
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>
                <select
                  value={u.role}
                  onChange={e => handleRoleChange(u._id, e.target.value)}
                  disabled={u._id === user._id}
                >
                  <option value="admin">Admin</option>
                  <option value="analyst">Analyst</option>
                  <option value="viewer">Viewer</option>
                </select>
              </td>
              <td>{u.isActive ? 'Active' : 'Inactive'}</td>
              <td>
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
