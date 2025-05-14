import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

/**
 * Login component that provides authentication functionality
 * @param {Object} props - Component props
 * @param {Function} props.onLoginSuccess - Optional callback function called after successful login
 * @returns {JSX.Element} Login form component
 */
const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  /**
   * Validates the form fields
   * @returns {boolean} Whether the form is valid
   */
  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Validate email format when user types or submits
  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      return false;
    }
    return true;
  };

  /**
   * Handles the form submission
   * @param {Event} e - Form submission event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post('/api/login', {
        email,
        password
      });

      setIsLoading(false);

      if (response.status === 200) {
        if (onLoginSuccess) {
          onLoginSuccess(response.data);
        }
        navigate('/profile');
      }
    } catch (error) {
      setIsLoading(false);
      if (error.response?.data?.message) {
        setServerError(error.response.data.message);
      } else {
        setServerError('An error occurred during login. Please try again.');
      }
    }
  };

  return (
    <div className="login-container">
      <h2>Login to Your Account</h2>
      <form onSubmit={handleSubmit} className="login-form" data-testid="login-form">
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => {
            setEmail(e.target.value);
            // Clear email error when user starts typing
            if (errors.email) {
              setErrors(prev => ({ ...prev, email: '' }));
            }
          }}
          onBlur={validateEmail} // Validate email when user leaves the field
            className={`form-input ${errors.email ? 'input-error' : ''}`}
            placeholder="Enter your email"
            aria-describedby={errors.email ? "email-error" : undefined}
            data-testid="email-input"
          />
          {errors.email && (
            <span id="email-error" className="error-message" data-testid="email-error">
              {errors.email}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`form-input ${errors.password ? 'input-error' : ''}`}
            placeholder="Enter your password"
            aria-describedby={errors.password ? "password-error" : undefined}
            data-testid="password-input"
          />
          {errors.password && (
            <span id="password-error" className="error-message" data-testid="password-error">
              {errors.password}
            </span>
          )}
        </div>

        {serverError && (
          <div className="server-error-container" data-testid="server-error">
            <p className="server-error">{serverError}</p>
          </div>
        )}

        <button 
          type="submit" 
          className="submit-button" 
          disabled={isLoading}
          data-testid="login-button"
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

Login.propTypes = {
  onLoginSuccess: PropTypes.func
};

export default Login;