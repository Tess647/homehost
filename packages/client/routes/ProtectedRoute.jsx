// packages/client/routes/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';
import LoadingSpinner from '../components/LoadingSpinner';

/**
 * ProtectedRoute component that restricts access to authenticated users only
 * Redirects to login if user is not authenticated
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render when authenticated
 * @param {string} [props.redirectTo='/login'] - Path to redirect to when not authenticated
 * @returns {React.ReactNode} Protected content or redirect
 */
export const ProtectedRoute = ({ children, redirectTo = '/login' }) => {
  const { user, isLoading, error } = useAuth();
  
  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  // If authentication check failed, show an error
  if (error) {
    return (
      <div className="auth-error">
        <p>Authentication Error: {error}</p>
        <Navigate to={redirectTo} replace />
      </div>
    );
  }
  
  // Redirect to login if user is not authenticated
  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }
  
  // Render children if user is authenticated
  return children;
};

/**
 * PublicOnlyRoute component that restricts access to non-authenticated users only
 * Redirects to profile if user is already authenticated
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render when not authenticated
 * @param {string} [props.redirectTo='/profile'] - Path to redirect to when authenticated
 * @returns {React.ReactNode} Public content or redirect
 */
export const PublicOnlyRoute = ({ children, redirectTo = '/profile' }) => {
  const { user, isLoading, error } = useAuth();
  
  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  // If authentication check failed, we'll still show the public route
  // as it's safer to show public content in case of auth errors
  if (error) {
    // Use process.env.NODE_ENV check to avoid console noise in tests
    if (process.env.NODE_ENV !== 'test') {
      console.error('Authentication error in PublicOnlyRoute:', error);
    }
    return children;
  }
  
  // Redirect to profile if user is authenticated
  if (user) {
    return <Navigate to={redirectTo} replace />;
  }
  
  // Render children if user is not authenticated
  return children;
};

export default {
  ProtectedRoute,
  PublicOnlyRoute
};