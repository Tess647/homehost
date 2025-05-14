// packages/client/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Create the authentication context
const AuthContext = createContext();

/**
 * AuthProvider component that wraps the application to provide authentication context
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const AuthProvider = ({ children }) => {
  // State for authenticated user, loading status, and errors
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Checks if the user is authenticated by making a request to /api/me
   * If authenticated, sets the user state. If not, clears the user state.
   */
  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/me', {
        withCredentials: true // Include cookies in the request
      });
      
      if (response.status === 200 && response.data.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Authentication check failed:', err);
      
      // Clear user if 401 Unauthorized
      if (err.response && err.response.status === 401) {
        setUser(null);
      }
      
      setError(err.response?.data?.message || 'Authentication check failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logs in a user with email and password
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise} Promise that resolves on successful login
   */
  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/login', {
        email,
        password
      }, {
        withCredentials: true // Include cookies in the request
      });
      
      if (response.status === 200 && response.data.user) {
        setUser(response.data.user);
        return response.data;
      } else {
        throw new Error('Invalid login response');
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logs out the current user
   * @returns {Promise} Promise that resolves on successful logout
   */
  const logout = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/logout', {}, {
        withCredentials: true // Include cookies in the request
      });
      
      if (response.status === 200) {
        setUser(null);
        return response.data;
      } else {
        throw new Error('Invalid logout response');
      }
    } catch (err) {
      console.error('Logout failed:', err);
      setError(err.response?.data?.message || 'Logout failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Check authentication status on component mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // The value provided to consumers of this context
  const contextValue = {
    user,
    isLoading,
    error,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook that provides access to the authentication context
 * @returns {Object} Authentication context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;