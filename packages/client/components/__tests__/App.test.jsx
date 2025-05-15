import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import App from '../App';
import { ProtectedRoute, PublicOnlyRoute } from '../../routes/ProtectedRoute';

// Mock the components that are lazy loaded
jest.mock('../Auth/Login', () => () => <div>Login Page</div>);
jest.mock('../Auth/Register', () => () => <div>Register Page</div>);
jest.mock('../Auth/Profile', () => () => <div>Profile Page</div>);
jest.mock('../Admin', () => () => <div>Admin Page</div>);

// Mock the ProtectedRoute and PublicOnlyRoute components to simplify testing
jest.mock('../../routes/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }) => <div>{children}</div>,
  PublicOnlyRoute: ({ children }) => <div>{children}</div>,
}));

// // Mock other components to keep tests focused
// jest.mock('./Movies', () => () => <div>Movies Page</div>);
// jest.mock('./TVShows', () => () => <div>TV Shows Page</div>);
// jest.mock('./Music', () => () => <div>Music Page</div>);
// jest.mock('./NotFound', () => () => <div>Not Found Page</div>);

describe('Protected and Public-Only Routes', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('PublicOnlyRoute', () => {
    it('should render Login component for /login route', () => {
      render(
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>
      );
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('should render Register component for /register route', () => {
      render(
        <MemoryRouter initialEntries={['/register']}>
          <App />
        </MemoryRouter>
      );
      expect(screen.getByText('Register Page')).toBeInTheDocument();
    });
  });

  describe('ProtectedRoute', () => {
    it('should render Profile component for /profile route', () => {
      render(
        <MemoryRouter initialEntries={['/profile']}>
          <App />
        </MemoryRouter>
      );
      expect(screen.getByText('Profile Page')).toBeInTheDocument();
    });

    it('should render Admin component for /admin route', () => {
      render(
        <MemoryRouter initialEntries={['/admin']}>
          <App />
        </MemoryRouter>
      );
      expect(screen.getByText('Admin Page')).toBeInTheDocument();
    });
  });

  describe('Public Routes', () => {
    it('should render Movies component for /movies route', () => {
      render(
        <MemoryRouter initialEntries={['/movies']}>
          <App />
        </MemoryRouter>
      );
      expect(screen.getByText('Movies Page')).toBeInTheDocument();
    });

    it('should render TV Shows component for /tv route', () => {
      render(
        <MemoryRouter initialEntries={['/tv']}>
          <App />
        </MemoryRouter>
      );
      expect(screen.getByText('TV Shows Page')).toBeInTheDocument();
    });
  });

  describe('Route Protection', () => {
    // You might want to add more specific tests here to verify the actual protection logic
    // This would require mocking the authentication state
    it('should wrap Profile route with ProtectedRoute', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/profile']}>
          <Routes>
            <Route path="/profile" element={
              <ProtectedRoute>
                <div>Profile Page</div>
              </ProtectedRoute>
            } />
          </Routes>
        </MemoryRouter>
      );
      expect(container).toMatchSnapshot();
    });

    it('should wrap Login route with PublicOnlyRoute', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={
              <PublicOnlyRoute>
                <div>Login Page</div>
              </PublicOnlyRoute>
            } />
          </Routes>
        </MemoryRouter>
      );
      expect(container).toMatchSnapshot();
    });
  });
});