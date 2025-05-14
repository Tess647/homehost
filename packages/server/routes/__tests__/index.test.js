const request = require('supertest');
const express = require('express');
const authController = require('../../controller/authController');

// Mock the services with all required methods
jest.mock('../../services/user', () => ({
  createUser: jest.fn(),
  verifyCredentials: jest.fn(),
  getUserById: jest.fn(), // Mock for getUserById method
  // Add other userService methods if needed
}));

jest.mock('../../services/auth', () => ({
  generateToken: jest.fn(),
  invalidateToken: jest.fn(),
  validatePasswordStrength: jest.fn(),
  verifyToken: jest.fn(), // Mock for verifyToken method
  // Add other authService methods if needed
}));

// Import the mocked services
const userService = require('../../services/user');
const authService = require('../../services/auth');

// Create Express app
const app = express();
app.use(express.json());

// Middleware to mock cookie-parser functionality
app.use((req, res, next) => {
  // Simulate cookie-parser middleware
  req.cookies = {};
  
  // Parse cookies from headers if they exist
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies = cookieHeader.split(';');
    cookies.forEach(cookie => {
      const parts = cookie.split('=');
      const name = parts[0].trim();
      const value = parts[1] ? parts[1].trim() : '';
      req.cookies[name] = value;
    });
  }
  
  next();
});

// Set up routes
app.post('/register', authController.register);
app.post('/login', authController.login);
app.post('/logout', authController.logout);
app.get('/api/me', authController.authenticate, authController.getProfile);

describe('Authentication Routes', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Default mock implementations
    authService.validatePasswordStrength.mockReturnValue({
      valid: true,
      message: 'Password is strong'
    });
    
    authService.generateToken.mockReturnValue('mock-token');
  });

  describe('POST /register', () => {
    it('should register a new user with valid data', async () => {
      const mockUser = {
        id: '123',
        username: 'testuser',
        email: 'test@example.com'
      };
      
      userService.createUser.mockResolvedValue(mockUser);
      
      const response = await request(app)
        .post('/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'StrongP@ss123',
          confirmPassword: 'StrongP@ss123'
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        user: {
          id: '123',
          username: 'testuser',
          email: 'test@example.com'
        },
        token: 'mock-token'
      });
    });

    it('should return validation errors for invalid data', async () => {
      authService.validatePasswordStrength.mockReturnValue({
        valid: false,
        message: 'Password too weak'
      });
      
      const response = await request(app)
        .post('/register')
        .send({
          email: 'invalid',
          username: '',
          password: 'weak',
          confirmPassword: 'mismatch'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'email' }),
          expect.objectContaining({ field: 'username' }),
          expect.objectContaining({ field: 'password' }),
          expect.objectContaining({ field: 'confirmPassword' })
        ])
      );
    });
  });

  describe('POST /login', () => {
    it('should login user with valid credentials', async () => {
      const mockUser = {
        id: '123',
        username: 'testuser',
        email: 'test@example.com'
      };
      
      userService.verifyCredentials.mockResolvedValue(mockUser);
      
      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: 'correctPassword'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.token).toBe('mock-token');
      expect(userService.verifyCredentials).toHaveBeenCalledWith(
        'test@example.com',
        'correctPassword'
      );
    });

    it('should return 401 for invalid credentials', async () => {
      userService.verifyCredentials.mockRejectedValue(new Error('Invalid credentials'));
      
      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: 'wrongPassword'
        });
      
      expect(response.status).toBe(401);
      expect(response.body.errors[0].message).toContain('Invalid email or password');
    });
  });

  describe('POST /logout', () => {
    it('should successfully logout user', async () => {
      authService.invalidateToken.mockResolvedValue(true);
      
      const response = await request(app)
        .post('/logout')
        .set('Authorization', 'Bearer valid-token');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle logout without token', async () => {
      const response = await request(app)
        .post('/logout')
        .send();
      
      expect(response.status).toBe(200);
      expect(authService.invalidateToken).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/me', () => {
    it('should return user profile with valid token', async () => {
      // Mock the token verification
      const mockDecodedToken = { userId: '123' };
      authService.verifyToken.mockResolvedValue(mockDecodedToken);
      
      // Mock the user data
      const mockUser = {
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-02T00:00:00.000Z'
      };
      userService.getUserById.mockResolvedValue(mockUser);
      
      // Set up mock cookie
      const response = await request(app)
        .get('/api/me')
        .set('Cookie', 'auth_token=valid-token');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        user: {
          id: '123',
          username: 'testuser',
          email: 'test@example.com',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-02T00:00:00.000Z'
        }
      });
      expect(authService.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(userService.getUserById).toHaveBeenCalledWith('123');
    });
    
    it('should return 401 when token is missing', async () => {
      const response = await request(app)
        .get('/api/me');
      
      expect(response.status).toBe(401);
      expect(response.body.errors[0].message).toContain('Authentication token missing');
      expect(userService.getUserById).not.toHaveBeenCalled();
    });
    
    it('should return 401 when token is invalid', async () => {
      // Mock the token verification to fail with isTokenError flag
      authService.verifyToken.mockRejectedValue({ 
        name: 'JsonWebTokenError',
        message: 'invalid token',
        isTokenError: true
      });
      
      const response = await request(app)
        .get('/api/me')
        .set('Cookie', 'auth_token=invalid-token');
      
      expect(response.status).toBe(401);
      expect(response.body.errors[0].message).toContain('Invalid authentication token');
      expect(userService.getUserById).not.toHaveBeenCalled();
    });
    
    it('should return 401 when user not found after token verification', async () => {
      // Mock the token verification
      const mockDecodedToken = { userId: '999' };
      authService.verifyToken.mockResolvedValue(mockDecodedToken);
      
      // Mock user not found
      userService.getUserById.mockResolvedValue(null);
      
      const response = await request(app)
        .get('/api/me')
        .set('Cookie', 'auth_token=valid-token');
      
      expect(response.status).toBe(401);
      expect(response.body.errors[0].message).toContain('Invalid authentication token');
    });
  });
});