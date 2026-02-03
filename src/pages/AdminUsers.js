import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();

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
            // Optimistic update or refetch
            setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
        } catch (err) {
            console.error('Error updating role:', err);
            alert('Failed to update role');
        }
    };

    const handleStatusChange = async (userId, currentStatus) => {
        const action = currentStatus ? 'delete' : 'put';
        const url = currentStatus
            ? `/api/admin/users/${userId}` // DELETE request to deactivate
            : `/api/admin/users/${userId}/activate`; // PUT request to activate

        try {
            if (currentStatus) {
                if (!window.confirm('Are you sure you want to deactivate this user?')) return;
                await axios.delete(url);
            } else {
                await axios.put(url);
            }

            // Update local state
            setUsers(users.map(u => u._id === userId ? { ...u, isActive: !currentStatus } : u));
        } catch (err) {
            console.error('Error changing status:', err);
            alert('Failed to update user status');
        }
    };

    if (loading) return <div className="text-center mt-10"><div className="loading-spinner"></div> Loading users...</div>;
    if (error) return <div className="text-center mt-10 text-red-600 font-bold">{error}</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">User Management</h1>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full leading-normal">
                        <thead>
                            <tr>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u._id}>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        <div className="flex items-center">
                                            <div className="ml-3">
                                                <p className="text-gray-900 whitespace-no-wrap font-medium">
                                                    {u.name}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        <p className="text-gray-900 whitespace-no-wrap">{u.email}</p>
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        <select
                                            value={u.role}
                                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                            className="block w-full bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                                            disabled={u._id === user._id} // Prevent changing own role
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="analyst">Analyst</option>
                                            <option value="viewer">Viewer</option>
                                        </select>
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        <span
                                            className={`relative inline-block px-3 py-1 font-semibold leading-tight ${u.isActive ? 'text-green-900' : 'text-red-900'
                                                }`}
                                        >
                                            <span
                                                aria-hidden
                                                className={`absolute inset-0 opacity-50 rounded-full ${u.isActive ? 'bg-green-200' : 'bg-red-200'
                                                    }`}
                                            ></span>
                                            <span className="relative">{u.isActive ? 'Active' : 'Inactive'}</span>
                                        </span>
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        <button
                                            onClick={() => handleStatusChange(u._id, u.isActive)}
                                            className={`text-sm ${u.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                                                } font-semibold`}
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
            </div>
        </div>
    );
};

export default AdminUsers;
