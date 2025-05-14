import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import Register from '../Register';

// Mock axios
jest.mock('axios');

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('Register Component', () => {
  const mockOnRegisterSuccess = jest.fn();
  const mockShowToast = jest.fn();

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  const renderRegisterComponent = () => {
    return render(
      <MemoryRouter>
        <Register onRegisterSuccess={mockOnRegisterSuccess} showToast={mockShowToast} />
      </MemoryRouter>
    );
  };

  test('renders registration form with all fields', () => {
    renderRegisterComponent();
    
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  test('validates name field as required', async () => {
    renderRegisterComponent();
    
    const nameInput = screen.getByTestId('name-input');
    fireEvent.blur(nameInput);
    
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
  });

  test('validates email format correctly', async () => {
    renderRegisterComponent();
    
    const emailInput = screen.getByTestId('email-input');
    await userEvent.type(emailInput, 'invalid-email');
    fireEvent.blur(emailInput);
    
    expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument();
    
    // Clear and type valid email
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'valid@example.com');
    fireEvent.blur(emailInput);
    
    expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
  });

  test('validates password length', async () => {
    renderRegisterComponent();
    
    const passwordInput = screen.getByTestId('password-input');
    await userEvent.type(passwordInput, 'short');
    fireEvent.blur(passwordInput);
    
    expect(await screen.findByText(/password must be at least 8 characters long/i)).toBeInTheDocument();
    
    // Clear and type valid password
    await userEvent.clear(passwordInput);
    await userEvent.type(passwordInput, 'validpassword123');
    fireEvent.blur(passwordInput);
    
    expect(screen.queryByText(/password must be at least 8 characters long/i)).not.toBeInTheDocument();
  });

  test('validates passwords match', async () => {
    renderRegisterComponent();
    
    const passwordInput = screen.getByTestId('password-input');
    const confirmPasswordInput = screen.getByTestId('confirm-password-input');
    
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(confirmPasswordInput, 'password456');
    fireEvent.blur(confirmPasswordInput);
    
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    
    // Fix the confirm password
    await userEvent.clear(confirmPasswordInput);
    await userEvent.type(confirmPasswordInput, 'password123');
    fireEvent.blur(confirmPasswordInput);
    
    expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
  });

  test('clears field error when user types', async () => {
    renderRegisterComponent();
    
    // Create an error first
    const emailInput = screen.getByTestId('email-input');
    await userEvent.type(emailInput, 'invalid-email');
    fireEvent.blur(emailInput);
    
    expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument();
    
    // Start typing again and error should clear
    await userEvent.type(emailInput, '.com');
    
    expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
  });

  test('shows validation errors when submitting with empty fields', async () => {
    renderRegisterComponent();
    
    const submitButton = screen.getByTestId('register-button');
    await userEvent.click(submitButton);
    
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/please confirm your password/i)).toBeInTheDocument();
  });

  test('handles successful registration', async () => {
    axios.post.mockResolvedValueOnce({ status: 201, data: { user: { id: 1, name: 'Test User' } } });
    renderRegisterComponent();
    
    // Fill out form
    await userEvent.type(screen.getByTestId('name-input'), 'Test User');
    await userEvent.type(screen.getByTestId('email-input'), 'test@example.com');
    await userEvent.type(screen.getByTestId('password-input'), 'password123');
    await userEvent.type(screen.getByTestId('confirm-password-input'), 'password123');
    
    // Submit form
    await userEvent.click(screen.getByTestId('register-button'));
    
    await waitFor(() => {
      // Check if axios.post was called with correct data
      expect(axios.post).toHaveBeenCalledWith('/api/register', {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
      
      // Check if success callback was called
      expect(mockOnRegisterSuccess).toHaveBeenCalledWith({ user: { id: 1, name: 'Test User' } });
      
      // Check if toast was shown
      expect(mockShowToast).toHaveBeenCalledWith('Registration successful! Please log in.', 'success');
      
      // Check if navigate was called to redirect to login
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  test('displays server error when registration fails', async () => {
    // Mock API error response
    axios.post.mockRejectedValueOnce({
      response: {
        data: {
          message: 'Email already exists'
        }
      }
    });
    
    renderRegisterComponent();
    
    // Fill out form with valid data
    await userEvent.type(screen.getByTestId('name-input'), 'Test User');
    await userEvent.type(screen.getByTestId('email-input'), 'existing@example.com');
    await userEvent.type(screen.getByTestId('password-input'), 'password123');
    await userEvent.type(screen.getByTestId('confirm-password-input'), 'password123');
    
    // Submit form
    await userEvent.click(screen.getByTestId('register-button'));
    
    // Check if server error is displayed
    expect(await screen.findByText(/email already exists/i)).toBeInTheDocument();
  });

  test('handles network errors during registration', async () => {
    // Mock network error
    axios.post.mockRejectedValueOnce(new Error('Network Error'));
    
    renderRegisterComponent();
    
    // Fill out form with valid data
    await userEvent.type(screen.getByTestId('name-input'), 'Test User');
    await userEvent.type(screen.getByTestId('email-input'), 'test@example.com');
    await userEvent.type(screen.getByTestId('password-input'), 'password123');
    await userEvent.type(screen.getByTestId('confirm-password-input'), 'password123');
    
    // Submit form
    await userEvent.click(screen.getByTestId('register-button'));
    
    // Check if generic error message is displayed
    expect(await screen.findByText(/an error occurred during registration/i)).toBeInTheDocument();
  });

  test('shows loading state during submission', async () => {
    // Create a promise that won't resolve immediately
    let resolvePromise;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    axios.post.mockImplementationOnce(() => promise);
    
    renderRegisterComponent();
    
    // Fill out form with valid data
    await userEvent.type(screen.getByTestId('name-input'), 'Test User');
    await userEvent.type(screen.getByTestId('email-input'), 'test@example.com');
    await userEvent.type(screen.getByTestId('password-input'), 'password123');
    await userEvent.type(screen.getByTestId('confirm-password-input'), 'password123');
    
    // Submit form
    await userEvent.click(screen.getByTestId('register-button'));
    
    // Check if button shows loading state
    expect(screen.getByRole('button', { name: /registering/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /registering/i })).toBeDisabled();
    
    // Resolve the promise
    resolvePromise({ status: 201, data: {} });
    
    // Wait for button to return to normal state
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /registering/i })).not.toBeInTheDocument();
    });
  });

  test('updates password match validation when password changes', async () => {
    renderRegisterComponent();
    
    // Set up initial passwords that match
    const passwordInput = screen.getByTestId('password-input');
    const confirmPasswordInput = screen.getByTestId('confirm-password-input');
    
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(confirmPasswordInput, 'password123');
    
    // Change the password but not confirm password
    await userEvent.clear(passwordInput);
    await userEvent.type(passwordInput, 'newpassword123');
    
    // Submit form to trigger all validations
    await userEvent.click(screen.getByTestId('register-button'));
    
    // Check that password match error appears
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });
});