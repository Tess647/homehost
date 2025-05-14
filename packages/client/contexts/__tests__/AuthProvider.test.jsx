// packages/client/context/AuthContext.test.jsx
import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import axios from 'axios';
import { AuthProvider, useAuth } from '../AuthProvider';

// Mock axios
jest.mock('axios');

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  console.error.mockRestore();
  console.warn.mockRestore();
});

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

const TestComponent = () => {
  const { user, isLoading, error, login, logout, checkAuth } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{isLoading ? 'Loading' : 'Not loading'}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'No user'}</div>
      <div data-testid="error">{error || 'No error'}</div>
      <button onClick={() => login('test@example.com', 'password')} data-testid="login-btn">
        Login
      </button>
      <button onClick={() => logout()} data-testid="logout-btn">
        Logout
      </button>
      <button onClick={() => checkAuth()} data-testid="check-auth-btn">
        Check Auth
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should check authentication status on mount', async () => {
    // Mock successful authentication check
    axios.get.mockResolvedValueOnce({
      status: 200,
      data: {
        user: { id: '123', username: 'testuser', email: 'test@example.com' }
      }
    });

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    // Initial state should be loading
    expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
    expect(screen.getByTestId('user')).toHaveTextContent('{"id":"123","username":"testuser","email":"test@example.com"}');
    expect(axios.get).toHaveBeenCalledWith('/api/me', { withCredentials: true });
  });

  it('should handle authentication check failure with 401', async () => {
    // Mock unsuccessful authentication check with 401
    axios.get.mockRejectedValueOnce({
      response: {
        status: 401,
        data: { message: 'Unauthorized' }
      }
    });

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    // Should clear user on 401
    expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
    expect(screen.getByTestId('user')).toHaveTextContent('No user');
    expect(screen.getByTestId('error')).toHaveTextContent('Unauthorized');
  });

  it('should handle login correctly', async () => {
    // Mock successful login
    axios.get.mockResolvedValueOnce({
      status: 200,
      data: { user: null }
    });
    
    axios.post.mockResolvedValueOnce({
      status: 200,
      data: {
        user: { id: '123', username: 'testuser', email: 'test@example.com' },
        token: 'fake-token'
      }
    });

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    // Initial state
    expect(screen.getByTestId('user')).toHaveTextContent('No user');

    // Trigger login
    await act(async () => {
      screen.getByTestId('login-btn').click();
    });

    // After login
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
      expect(screen.getByTestId('user')).toHaveTextContent('{"id":"123","username":"testuser","email":"test@example.com"}');
      expect(axios.post).toHaveBeenCalledWith(
        '/api/login',
        { email: 'test@example.com', password: 'password' },
        { withCredentials: true }
      );
    });
  });

  it('should handle logout correctly', async () => {
    // Mock successful auth check with user
    axios.get.mockResolvedValueOnce({
      status: 200,
      data: {
        user: { id: '123', username: 'testuser', email: 'test@example.com' }
      }
    });
    
    // Mock successful logout
    axios.post.mockResolvedValueOnce({
      status: 200,
      data: { success: true, message: 'Successfully logged out' }
    });

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    // Initial state after auth check
    expect(screen.getByTestId('user')).toHaveTextContent('{"id":"123","username":"testuser","email":"test@example.com"}');

    // Trigger logout
    await act(async () => {
      screen.getByTestId('logout-btn').click();
    });

    // After logout
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
      expect(screen.getByTestId('user')).toHaveTextContent('No user');
      expect(axios.post).toHaveBeenCalledWith('/api/logout', {}, { withCredentials: true });
    });
  });

  it('should track loading state correctly during API calls', async () => {
    // Mock a delayed response for auth check to observe loading state
    axios.get.mockImplementationOnce(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            status: 200,
            data: {
              user: { id: '123', username: 'testuser', email: 'test@example.com' }
            }
          });
        }, 100);
      });
    });

    let getByTestId;
    
    await act(async () => {
      const rendered = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      getByTestId = rendered.getByTestId;
    });

    // Initial loading state during checkAuth on mount
    expect(getByTestId('loading')).toHaveTextContent('Loading');
    
    // Wait for auth check to complete
    await waitFor(() => {
      expect(getByTestId('loading')).toHaveTextContent('Not loading');
      expect(getByTestId('user')).toHaveTextContent('{"id":"123","username":"testuser","email":"test@example.com"}');
    });

    // Mock a delayed response for manual checkAuth to observe loading state again
    axios.get.mockImplementationOnce(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            status: 200,
            data: {
              user: { id: '456', username: 'updateduser', email: 'updated@example.com' }
            }
          });
        }, 100);
      });
    });

    // Trigger manual checkAuth
    act(() => {
      getByTestId('check-auth-btn').click();
    });

    // Should be loading again
    expect(getByTestId('loading')).toHaveTextContent('Loading');
    
    // Wait for manual checkAuth to complete
    await waitFor(() => {
      expect(getByTestId('loading')).toHaveTextContent('Not loading');
      expect(getByTestId('user')).toHaveTextContent('{"id":"456","username":"updateduser","email":"updated@example.com"}');
    });
  });
});

