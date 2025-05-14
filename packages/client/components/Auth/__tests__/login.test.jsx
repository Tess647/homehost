import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Login from '../Login';

// Mock the dependencies
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

jest.mock('axios');

describe('Login Component', () => {
  const mockNavigate = jest.fn();
  const mockOnLoginSuccess = jest.fn();

  beforeEach(() => {
    useNavigate.mockReturnValue(mockNavigate);
    jest.clearAllMocks();
  });

  it('renders login form correctly', () => {
    render(<Login />);
    
    // Check if all elements are rendered
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-button')).toBeInTheDocument();
    expect(screen.getByText('Login to Your Account')).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    render(<Login />);
    
    // Submit the empty form
    fireEvent.click(screen.getByTestId('login-button'));
    
    // Check if validation errors appear
    await waitFor(() => {
      expect(screen.getByTestId('email-error')).toBeInTheDocument();
      expect(screen.getByTestId('password-error')).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email format', async () => {
    render(<Login />);
    
    // Fill inputs with invalid data
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'invalid-email' },
    });
    
    // Trigger blur event to validate email
    fireEvent.blur(screen.getByTestId('email-input'));
    
    // Check if email validation error appears
    await waitFor(() => {
      expect(screen.getByTestId('email-error')).toBeInTheDocument();
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('submits the form successfully and redirects', async () => {
    axios.post.mockResolvedValueOnce({
      status: 200,
      data: { user: { id: 1, email: 'test@example.com' } },
    });

    render(<Login onLoginSuccess={mockOnLoginSuccess} />);
    
    // Fill inputs with valid data
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByTestId('login-button'));
    
    // Wait for the API call to resolve
    await waitFor(() => {
      // Verify axios was called with the right params
      expect(axios.post).toHaveBeenCalledWith('/api/login', {
        email: 'test@example.com',
        password: 'password123',
      });
      
      // Verify navigation and callback
      expect(mockNavigate).toHaveBeenCalledWith('/profile');
      expect(mockOnLoginSuccess).toHaveBeenCalledWith({ user: { id: 1, email: 'test@example.com' } });
    });
  });

  it('displays server error when login fails', async () => {
    // Mock a failed API call
    axios.post.mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } },
    });

    render(<Login />);
    
    // Fill inputs with valid data
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'wrongpassword' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByTestId('login-button'));
    
    // Wait for the API call to resolve
    await waitFor(() => {
      // Verify server error is displayed
      expect(screen.getByTestId('server-error')).toBeInTheDocument();
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});