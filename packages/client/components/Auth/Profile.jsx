import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

/**
 * Profile component that displays user information
 * @param {Object} props - Component props
 * @param {Function} props.onLogout - Optional callback function called when user logs out
 * @returns {JSX.Element} Profile component
 */
const Profile = ({ onLogout }) => {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    /**
     * Fetches user data from the API
     */
    const fetchUserData = async () => {
      try {
        const response = await axios.get('/api/me');
        
        if (response.status === 200) {
          setUserData(response.data);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          // Unauthorized - redirect to login
          navigate('/login');
        } else {
          setError('Failed to load profile information. Please try again later.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  /**
   * Handles user logout
   */
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post('/api/logout');
      
      if (response.status === 200) {
        if (onLogout) {
          onLogout();
        }
        navigate('/login');
      }
    } catch (error) {
      setError('Failed to logout. Please try again.');
      setIsLoading(false);
    }
  };

  // Loading skeleton UI
  if (isLoading) {
    return (
      <div className="login-container" data-testid="profile-loading">
        <h2>Your Profile</h2>
        <div className="profile-card">
          <div className="profile-skeleton">
            <div className="skeleton-label"></div>
            <div className="skeleton-value"></div>
          </div>
          <div className="profile-skeleton">
            <div className="skeleton-label"></div>
            <div className="skeleton-value"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="login-container" data-testid="profile-error">
        <h2>Your Profile</h2>
        <div className="server-error-container">
          <p className="server-error" data-testid="profile-error-message">{error}</p>
          <button 
            className="submit-button" 
            onClick={() => window.location.reload()}
            data-testid="retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container" data-testid="profile-container">
      <h2>Your Profile</h2>
      {userData && (
        <div className="profile-card" data-testid="profile-data">
          <div className="profile-field">
            <label className="form-label">Name</label>
            <div className="profile-value" data-testid="profile-name">
              {userData.name}
            </div>
          </div>
          
          <div className="profile-field">
            <label className="form-label">Email</label>
            <div className="profile-value" data-testid="profile-email">
              {userData.email}
            </div>
          </div>
          
          {/* Additional fields can be added here */}
          
          <div className="profile-actions">
            <button 
              className="secondary-button" 
              onClick={() => navigate('/edit-profile')}
              data-testid="edit-profile-button"
            >
              Edit Profile
            </button>
            
            <button 
              className="submit-button" 
              onClick={handleLogout}
              data-testid="logout-button"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

Profile.propTypes = {
  onLogout: PropTypes.func
};

export default Profile;