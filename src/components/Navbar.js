import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-xl font-bold flex items-center">
            <span className="mr-2">📊</span>
            Smart Reconciliation System
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="hover:text-blue-200 transition">
                Dashboard
              </Link>
              <Link to="/upload" className="hover:text-blue-200 transition">
                Upload
              </Link>
              <Link to="/reconciliation" className="hover:text-blue-200 transition">
                Reconciliation
              </Link>

              {user?.role === 'admin' && (
                <Link to="/admin/users" className="hover:text-blue-200 transition">
                  Manage Users
                </Link>
              )}

              <div className="relative group">
                <button className="flex items-center space-x-1 hover:text-blue-200 transition">
                  <span>{user?.name}</span>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-md shadow-lg py-2 hidden group-hover:block z-10">
                  <Link to="/profile" className="block px-4 py-2 hover:bg-gray-100">
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <Link to="/login" className="hover:text-blue-200 transition mr-4">
                Login
              </Link>
              <Link to="/register" className="hover:text-blue-200 transition">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;