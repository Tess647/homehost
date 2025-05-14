// packages/client/routes/__tests__/ProtectedRoute.test.jsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute } from '../ProtectedRoute';
import { useAuth } from '../../contexts/AuthProvider';

// Set test environment
process.env.NODE_ENV = 'test';

// Mock the AuthContext hook
jest.mock('../../contexts/AuthProvider');

// Mock the LoadingSpinner component
jest.mock('../../components/LoadingSpinner', () => () => (
  <div data-testid="loading-spinner">Loading...</div>
));

// Mock useNavigate
jest.mock('react-router-dom', () => {
  const originalModule = jest.requireActual('react-router-dom');
  const mockedNavigate = jest.fn();
  
  return {
    ...originalModule,
    useNavigate: () => mockedNavigate,
    Navigate: ({ to }) => {
      mockedNavigate(to);
      return null;
    }
  };
});

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render loading spinner when authentication is being checked', () => {
    // Mock authentication in loading state
    useAuth.mockReturnValue({
      user: null,
      isLoading: true,
      error: null
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  test('should redirect to login when user is not authenticated', async () => {
    // Mock unauthenticated state
    useAuth.mockReturnValue({
      user: null,
      isLoading: false,
      error: null
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/protected']}>
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    // Wait for navigation to complete
    await waitFor(() => {
      const navigate = jest.requireMock('react-router-dom').useNavigate();
      expect(navigate).toHaveBeenCalledWith('/login');
    });

    expect(container.innerHTML).toBe('');
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  test('should render children when user is authenticated', () => {
    // Mock authenticated state
    useAuth.mockReturnValue({
      user: { id: '123', name: 'Test User' },
      isLoading: false,
      error: null
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    
    // Ensure no navigation happened
    const navigate = jest.requireMock('react-router-dom').useNavigate();
    expect(navigate).not.toHaveBeenCalled();
  });

  test('should handle authentication errors', async () => {
    // Mock authentication error state
    useAuth.mockReturnValue({
      user: null,
      isLoading: false,
      error: 'Authentication failed'
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByText(/Authentication Error:/)).toBeInTheDocument();
    
    // Should still redirect on error
    await waitFor(() => {
      const navigate = jest.requireMock('react-router-dom').useNavigate();
      expect(navigate).toHaveBeenCalledWith('/login');
    });
  });

  test('should redirect to custom path when specified', async () => {
    // Mock unauthenticated state
    useAuth.mockReturnValue({
      user: null,
      isLoading: false,
      error: null
    });

    render(
      <MemoryRouter>
        <ProtectedRoute redirectTo="/custom-login">
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    // Wait for navigation to complete
    await waitFor(() => {
      const navigate = jest.requireMock('react-router-dom').useNavigate();
      expect(navigate).toHaveBeenCalledWith('/custom-login');
    });
  });
});

describe('PublicOnlyRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render loading spinner when authentication is being checked', () => {
    // Mock authentication in loading state
    useAuth.mockReturnValue({
      user: null,
      isLoading: true,
      error: null
    });

    render(
      <MemoryRouter>
        <PublicOnlyRoute>
          <div data-testid="public-content">Public Content</div>
        </PublicOnlyRoute>
      </MemoryRouter>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.queryByTestId('public-content')).not.toBeInTheDocument();
  });

  test('should redirect to profile when user is authenticated', async () => {
    // Mock authenticated state
    useAuth.mockReturnValue({
      user: { id: '123', name: 'Test User' },
      isLoading: false,
      error: null
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/login']}>
        <PublicOnlyRoute>
          <div data-testid="public-content">Public Content</div>
        </PublicOnlyRoute>
      </MemoryRouter>
    );

    // Wait for navigation to complete
    await waitFor(() => {
      const navigate = jest.requireMock('react-router-dom').useNavigate();
      expect(navigate).toHaveBeenCalledWith('/profile');
    });

    expect(container.innerHTML).toBe('');
    expect(screen.queryByTestId('public-content')).not.toBeInTheDocument();
  });

  test('should render children when user is not authenticated', () => {
    // Mock unauthenticated state
    useAuth.mockReturnValue({
      user: null,
      isLoading: false,
      error: null
    });

    render(
      <MemoryRouter>
        <PublicOnlyRoute>
          <div data-testid="public-content">Public Content</div>
        </PublicOnlyRoute>
      </MemoryRouter>
    );

    expect(screen.getByTestId('public-content')).toBeInTheDocument();
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    
    // Ensure no navigation happened
    const navigate = jest.requireMock('react-router-dom').useNavigate();
    expect(navigate).not.toHaveBeenCalled();
  });

  test('should show public content on authentication errors', () => {
    // Mock authentication error state
    useAuth.mockReturnValue({
      user: null,
      isLoading: false,
      error: 'Authentication failed'
    });

    render(
      <MemoryRouter>
        <PublicOnlyRoute>
          <div data-testid="public-content">Public Content</div>
        </PublicOnlyRoute>
      </MemoryRouter>
    );

    expect(screen.getByTestId('public-content')).toBeInTheDocument();
    
    // No redirection should happen on error in PublicOnlyRoute
    const navigate = jest.requireMock('react-router-dom').useNavigate();
    expect(navigate).not.toHaveBeenCalled();
  });

  test('should redirect to custom path when specified', async () => {
    // Mock authenticated state
    useAuth.mockReturnValue({
      user: { id: '123', name: 'Test User' },
      isLoading: false,
      error: null
    });

    render(
      <MemoryRouter>
        <PublicOnlyRoute redirectTo="/dashboard">
          <div data-testid="public-content">Public Content</div>
        </PublicOnlyRoute>
      </MemoryRouter>
    );

    // Wait for navigation to complete
    await waitFor(() => {
      const navigate = jest.requireMock('react-router-dom').useNavigate();
      expect(navigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});

// Integration tests with actual routes
describe('Route Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should correctly integrate with Router', async () => {
    // Mock authenticated state
    useAuth.mockReturnValue({
      user: { id: '123', name: 'Test User' },
      isLoading: false,
      error: null
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
          <Route path="/profile" element={<div data-testid="profile-page">Profile Page</div>} />
          <Route 
            path="/protected" 
            element={
              <ProtectedRoute>
                <div data-testid="protected-page">Protected Page</div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/public" 
            element={
              <PublicOnlyRoute>
                <div data-testid="public-page">Public Page</div>
              </PublicOnlyRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );

    // Protected page should be accessible when authenticated
    expect(screen.getByTestId('protected-page')).toBeInTheDocument();
  });

  test('should navigate between protected and public routes', async () => {
    // Mock the navigate function
    const navigate = jest.requireMock('react-router-dom').useNavigate();
    
    // First test: authenticated user accessing public-only route
    // Start with authenticated state
    useAuth.mockReturnValue({
      user: { id: '123', name: 'Test User' },
      isLoading: false,
      error: null
    });

    render(
      <MemoryRouter initialEntries={['/public']}>
        <Routes>
          <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
          <Route path="/profile" element={<div data-testid="profile-page">Profile Page</div>} />
          <Route 
            path="/public" 
            element={
              <PublicOnlyRoute>
                <div data-testid="public-page">Public Page</div>
              </PublicOnlyRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );

    // When authenticated, PublicOnlyRoute should redirect
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/profile');
    });
    
    // Clear mock data between tests
    jest.clearAllMocks();
    
    // Second test: unauthenticated user accessing protected route
    // Change to unauthenticated state
    useAuth.mockReturnValue({
      user: null,
      isLoading: false,
      error: null
    });

    // Render again with protected route
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
          <Route 
            path="/protected" 
            element={
              <ProtectedRoute>
                <div data-testid="protected-page">Protected Page</div>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );

    // When unauthenticated, ProtectedRoute should redirect
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/login');
    });
  });

  test('should handle transition from loading to authenticated state', async () => {
    // Start with loading state
    useAuth.mockReturnValue({
      user: null,
      isLoading: true,
      error: null
    });

    const { rerender } = render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route 
            path="/protected" 
            element={
              <ProtectedRoute>
                <div data-testid="protected-page">Protected Page</div>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );

    // Should show loading spinner initially
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    // Now transition to authenticated state
    useAuth.mockReturnValue({
      user: { id: '123', name: 'Test User' },
      isLoading: false,
      error: null
    });

    // Re-render with same route
    rerender(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route 
            path="/protected" 
            element={
              <ProtectedRoute>
                <div data-testid="protected-page">Protected Page</div>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );

    // Should now show protected content
    expect(screen.getByTestId('protected-page')).toBeInTheDocument();
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
  });
});