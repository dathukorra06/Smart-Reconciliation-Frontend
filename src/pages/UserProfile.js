import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const UserProfile = () => {
  const { user, updateUserProfile, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email
      });
    }
  }, [user]);

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) clearError();
    if (successMessage) setSuccessMessage('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const result = await updateUserProfile(formData);
    
    if (result.success) {
      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);
    }
    
    setIsLoading(false);
  };

  const toggleEdit = () => {
    if (isEditing) {
      // Cancel edit and revert to saved data
      setFormData({
        name: user.name,
        email: user.email
      });
      setSuccessMessage('');
    }
    setIsEditing(!isEditing);
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">User Profile</h1>
      
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {successMessage}
            </div>
          )}
          
          <form onSubmit={onSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="name" className="block text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={onChange}
                  disabled={!isEditing}
                  className={`form-control ${!isEditing ? 'bg-gray-100' : ''}`}
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={onChange}
                  disabled={!isEditing}
                  className={`form-control ${!isEditing ? 'bg-gray-100' : ''}`}
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Role</label>
              <div className="bg-gray-100 px-3 py-2 rounded-md">
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Member Since</label>
              <div className="bg-gray-100 px-3 py-2 rounded-md">
                {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={toggleEdit}
                  className="btn btn-primary"
                >
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={toggleEdit}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`btn btn-primary ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    {isLoading ? (
                      <>
                        <span className="loading-spinner mr-2"></span>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
        
        <div className="card mt-8">
          <h2 className="text-xl font-semibold mb-4">Account Security</h2>
          <p className="text-gray-600 mb-4">To change your password, please contact your administrator.</p>
          <button className="btn btn-danger">
            Change Password
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;