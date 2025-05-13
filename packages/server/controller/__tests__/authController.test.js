const authController = require('../authController');
const userService = require('../../services/user');
const authService = require('../../services/auth');

// Mock the services
jest.mock('../../services/user');
jest.mock('../../services/auth');

describe('AuthController', () => {
  let req, res;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default request and response objects
    req = {
      body: {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Default mock for password validation
    authService.validatePasswordStrength.mockReturnValue({
      valid: true,
      message: 'Password meets strength requirements'
    });

    // Mock console.error globally for all tests
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clean up the spy
    consoleErrorSpy.mockRestore();
  });
  
  describe('register', () => {
    describe('Validation Tests', () => {
      test('should return 400 with errors when email is missing', async () => {
        req.body.email = '';
        
        await authController.register(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'email',
              message: 'Email is required'
            })
          ])
        });
      });
      
      test('should return 400 with errors when email format is invalid', async () => {
        req.body.email = 'invalid-email';
        
        await authController.register(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'email',
              message: 'Invalid email format'
            })
          ])
        });
      });
      
      test('should return 400 with errors when username is missing', async () => {
        req.body.username = '';
        
        await authController.register(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'username',
              message: 'Username is required'
            })
          ])
        });
      });
      
      test('should return 400 with errors when password is missing', async () => {
        req.body.password = '';
        
        await authController.register(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'password',
              message: 'Password is required'
            })
          ])
        });
      });
      
      test('should return 400 with errors when password fails strength validation', async () => {
        req.body.password = 'weak';
        req.body.confirmPassword = 'weak';
        
        authService.validatePasswordStrength.mockReturnValue({
          valid: false,
          message: 'Password must be at least 8 characters long'
        });
        
        await authController.register(req, res);
        
        expect(authService.validatePasswordStrength).toHaveBeenCalledWith('weak');
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'password',
              message: 'Password must be at least 8 characters long'
            })
          ])
        });
      });
      
      test('should return 400 with errors when passwords do not match', async () => {
        req.body.password = 'Password123!';
        req.body.confirmPassword = 'DifferentPassword123!';
        
        await authController.register(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'confirmPassword',
              message: 'Passwords do not match'
            })
          ])
        });
      });
      
      test('should return 400 with errors when multiple validation errors occur', async () => {
        req.body.email = 'invalid';
        req.body.username = '';
        req.body.password = 'weak';
        req.body.confirmPassword = 'different';
        
        authService.validatePasswordStrength.mockReturnValue({
          valid: false,
          message: 'Password must be at least 8 characters long'
        });
        
        await authController.register(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          errors: expect.arrayContaining([
            expect.objectContaining({ field: 'email' }),
            expect.objectContaining({ field: 'username' }),
            expect.objectContaining({ field: 'password' }),
            expect.objectContaining({ field: 'confirmPassword' })
          ])
        });
        expect(res.json.mock.calls[0][0].errors.length).toBe(4);
      });
    });
    
    describe('Service Integration Tests', () => {
      test('should return 400 when email is already in use', async () => {
        userService.createUser.mockRejectedValue(new Error('Email already in use'));
        
        await authController.register(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          errors: [{ field: 'email', message: 'Email already in use' }]
        });
      });
      
      test('should return 500 when an unexpected server error occurs', async () => {
        userService.createUser.mockRejectedValue(new Error('Database error'));
        
        await authController.register(req, res);
        
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          errors: [{ field: 'general', message: 'Server error during registration' }]
        });
        
        // Verify error was logged
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Registration error:',
          expect.any(Error)
        );
      });
      
      test('should successfully register a user and return 201 with user data and token', async () => {
        const mockUser = {
          id: 1,
          email: 'test@example.com',
          username: 'testuser',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const mockToken = 'jwt-token-123';
        
        userService.createUser.mockResolvedValue(mockUser);
        authService.generateToken.mockReturnValue(mockToken);
        
        await authController.register(req, res);
        
        expect(userService.createUser).toHaveBeenCalledWith(
          'test@example.com',
          'testuser',
          'Password123!'
        );
        
        expect(authService.generateToken).toHaveBeenCalledWith(mockUser.id);
        
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
          user: {
            id: mockUser.id,
            username: mockUser.username,
            email: mockUser.email
          },
          token: mockToken
        });
      });
    });
  });
  
  describe('isValidEmail', () => {
    test('should return true for valid email formats', () => {
      expect(authController.isValidEmail('test@example.com')).toBe(true);
      expect(authController.isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(authController.isValidEmail('user+tag@example.org')).toBe(true);
    });
    
    test('should return false for invalid email formats', () => {
      expect(authController.isValidEmail('test')).toBe(false);
      expect(authController.isValidEmail('test@')).toBe(false);
      expect(authController.isValidEmail('@example.com')).toBe(false);
      expect(authController.isValidEmail('test@example')).toBe(false);
      expect(authController.isValidEmail('')).toBe(false);
      expect(authController.isValidEmail('test@.com')).toBe(false);
      expect(authController.isValidEmail('test@example.')).toBe(false);
    });
  });
});