import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

/**
 * Register component that provides user registration functionality
 * @param {Object} props - Component props
 * @param {Function} props.onRegisterSuccess - Optional callback function called after successful registration
 * @param {Function} props.showToast - Optional function to display toast notifications
 * @returns {JSX.Element} Registration form component
 */
const Register = ({ onRegisterSuccess, showToast }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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

  // Validate password length
  const validatePassword = () => {
    if (password && password.length < 8) {
      setErrors(prev => ({ ...prev, password: 'Password must be at least 8 characters long' }));
      return false;
    }
    return true;
  };

  // Validate password match
  const validatePasswordMatch = () => {
    if (confirmPassword && password !== confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
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
      const response = await axios.post('/api/register', {
        name,
        email,
        password
      });

      setIsLoading(false);

      if (response.status === 200 || response.status === 201) {
        if (onRegisterSuccess) {
          onRegisterSuccess(response.data);
        }
        
        if (showToast) {
          showToast('Registration successful! Please log in.', 'success');
        }
        
        navigate('/login');
      }
    } catch (error) {
      setIsLoading(false);
      if (error.response?.data?.message) {
        setServerError(error.response.data.message);
      } else {
        setServerError('An error occurred during registration. Please try again.');
      }
    }
  };

  return (
    <div className="login-container">
      <h2>Create Your Account</h2>
      <form onSubmit={handleSubmit} className="login-form" data-testid="register-form">
        <div className="form-group">
          <label htmlFor="name" className="form-label">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              // Clear name error when user starts typing
              if (errors.name) {
                setErrors(prev => ({ ...prev, name: '' }));
              }
            }}
            onBlur={() => {
              if (!name.trim()) {
                setErrors(prev => ({ ...prev, name: 'Name is required' }));
              }
            }}
            className={`form-input ${errors.name ? 'input-error' : ''}`}
            placeholder="Enter your full name"
            aria-describedby={errors.name ? "name-error" : undefined}
            data-testid="name-input"
          />
          {errors.name && (
            <span id="name-error" className="error-message" data-testid="name-error">
              {errors.name}
            </span>
          )}
        </div>

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
            onChange={(e) => {
              setPassword(e.target.value);
              // Clear password error when user starts typing
              if (errors.password) {
                setErrors(prev => ({ ...prev, password: '' }));
              }
              // Update confirmPassword validation if it exists
              if (confirmPassword) {
                validatePasswordMatch();
              }
            }}
            onBlur={validatePassword} // Validate password when user leaves the field
            className={`form-input ${errors.password ? 'input-error' : ''}`}
            placeholder="Create a password (min. 8 characters)"
            aria-describedby={errors.password ? "password-error" : undefined}
            data-testid="password-input"
          />
          {errors.password && (
            <span id="password-error" className="error-message" data-testid="password-error">
              {errors.password}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label">
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              // Clear confirmPassword error when user starts typing
              if (errors.confirmPassword) {
                setErrors(prev => ({ ...prev, confirmPassword: '' }));
              }
            }}
            onBlur={validatePasswordMatch} // Validate password match when user leaves the field
            className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
            placeholder="Confirm your password"
            aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
            data-testid="confirm-password-input"
          />
          {errors.confirmPassword && (
            <span id="confirm-password-error" className="error-message" data-testid="confirm-password-error">
              {errors.confirmPassword}
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
          data-testid="register-button"
        >
          {isLoading ? 'Registering...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
};

Register.propTypes = {
  onRegisterSuccess: PropTypes.func,
  showToast: PropTypes.func
};

export default Register;