import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import Profile from '../Profile';

// Mock axios
jest.mock('axios');

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('Profile Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUserData = {
    name: 'Test User',
    email: 'test@example.com'
  };

  // Helper to render the component within router
  const renderWithRouter = (ui) => {
    return render(
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    );
  };

  test('renders loading skeleton on initial render', () => {
    // Mock API call but don't resolve it yet
    axios.get.mockImplementation(() => new Promise(() => {}));
    
    renderWithRouter(<Profile />);
    
    expect(screen.getByTestId('profile-loading')).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledWith('/api/me');
  });

  test('fetches and displays user data successfully', async () => {
    // Mock successful API call
    axios.get.mockResolvedValue({
      status: 200,
      data: mockUserData
    });
    
    renderWithRouter(<Profile />);
    
    // Should start with loading state
    expect(screen.getByTestId('profile-loading')).toBeInTheDocument();
    
    // Wait for user data to be displayed
    await waitFor(() => {
      expect(screen.getByTestId('profile-data')).toBeInTheDocument();
    });
    
    // Check if user data is displayed correctly
    expect(screen.getByTestId('profile-name')).toHaveTextContent(mockUserData.name);
    expect(screen.getByTestId('profile-email')).toHaveTextContent(mockUserData.email);
  });

  test('redirects to login page on 401 unauthorized error', async () => {
    // Mock 401 error
    axios.get.mockRejectedValue({
      response: {
        status: 401
      }
    });
    
    renderWithRouter(<Profile />);
    
    // Wait for navigation to login page
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  test('displays error message on API failure', async () => {
    // Mock API error (non-401)
    axios.get.mockRejectedValue({
      response: {
        status: 500
      }
    });
    
    renderWithRouter(<Profile />);
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByTestId('profile-error')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('profile-error-message')).toHaveTextContent('Failed to load');
    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
  });

  test('logout functionality works correctly', async () => {
    // Mock successful API calls
    axios.get.mockResolvedValue({
      status: 200,
      data: mockUserData
    });
    
    axios.post.mockResolvedValue({
      status: 200
    });
    
    const mockOnLogout = jest.fn();
    
    renderWithRouter(<Profile onLogout={mockOnLogout} />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByTestId('logout-button')).toBeInTheDocument();
    });
    
    // Click logout button
    fireEvent.click(screen.getByTestId('logout-button'));
    
    // Wait for API call to be made
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/logout');
    });
    
    // Wait for onLogout to be called and navigation to happen
    await waitFor(() => {
      expect(mockOnLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  test('edit profile button navigates to edit profile page', async () => {
    // Mock successful API call
    axios.get.mockResolvedValue({
      status: 200,
      data: mockUserData
    });
    
    renderWithRouter(<Profile />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByTestId('edit-profile-button')).toBeInTheDocument();
    });
    
    // Click edit profile button
    fireEvent.click(screen.getByTestId('edit-profile-button'));
    
    // Check if navigation happened
    expect(mockNavigate).toHaveBeenCalledWith('/edit-profile');
  });
});