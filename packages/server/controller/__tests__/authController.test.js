const authController = require('../authController');
const userService = require('../../services/user');
const authService = require('../../services/auth');

// Mock the services
jest.mock('../../services/user', () => ({
  createUser: jest.fn(),
  verifyCredentials: jest.fn()
}));
jest.mock('../../services/auth', () => ({
  validatePasswordStrength: jest.fn(),
  generateToken: jest.fn(),
  invalidateToken: jest.fn()
}));

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
      },
      headers: {},
      cookies: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
      clearCookie: jest.fn()
    };

    // Default mock for password validation
    authService.validatePasswordStrength.mockReturnValue({
      valid: true,
      message: 'Password meets strength requirements'
    });
    
    // Setup mock for verifyCredentials method
    userService.verifyCredentials = jest.fn();

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
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          status: 400,
          message: 'Validation failed',
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'email',
              message: 'Email is required'
            })
          ])
        }));
      });
      
      test('should return 400 with errors when email format is invalid', async () => {
        req.body.email = 'invalid-email';
        
        await authController.register(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          status: 400,
          message: 'Validation failed',
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'email',
              message: 'Invalid email format'
            })
          ])
        }));
      });
      
      test('should return 400 with errors when username is missing', async () => {
        req.body.username = '';
        
        await authController.register(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          status: 400,
          message: 'Validation failed',
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'username',
              message: 'Username is required'
            })
          ])
        }));
      });
      
      test('should return 400 with errors when password is missing', async () => {
        req.body.password = '';
        
        await authController.register(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          status: 400,
          message: 'Validation failed',
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'password',
              message: 'Password is required'
            })
          ])
        }));
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
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          status: 400,
          message: 'Validation failed',
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'password',
              message: 'Password must be at least 8 characters long'
            })
          ])
        }));
      });
      
      test('should return 400 with errors when passwords do not match', async () => {
        req.body.password = 'Password123!';
        req.body.confirmPassword = 'DifferentPassword123!';
        
        await authController.register(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          status: 400,
          message: 'Validation failed',
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'confirmPassword',
              message: 'Passwords do not match'
            })
          ])
        }));
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
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          status: 400,
          message: 'Validation failed',
          errors: expect.arrayContaining([
            expect.objectContaining({ field: 'email' }),
            expect.objectContaining({ field: 'username' }),
            expect.objectContaining({ field: 'password' }),
            expect.objectContaining({ field: 'confirmPassword' })
          ])
        }));
        expect(res.json.mock.calls[0][0].errors.length).toBe(4);
      });
    });
    
    describe('Service Integration Tests', () => {
      test('should return 400 when email is already in use', async () => {
        userService.createUser.mockRejectedValue(new Error('Email already in use'));
        
        await authController.register(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          status: 400,
          message: 'Validation failed',
          errors: [{ field: 'email', message: 'Email already in use' }]
        }));
      });
      
      test('should return 500 when an unexpected server error occurs', async () => {
        userService.createUser.mockRejectedValue(new Error('Database error'));
        
        await authController.register(req, res);
        
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          status: 500,
          message: 'Server error',
          errors: [{ field: 'general', message: 'Server error during registration' }]
        }));
        
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
        
        expect(res.cookie).toHaveBeenCalledWith(
          'auth_token',
          mockToken,
          expect.objectContaining({
            httpOnly: true,
            maxAge: expect.any(Number)
          })
        );
        
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
  
  describe('login', () => {
    beforeEach(() => {
      // Setup request object specifically for login tests
      req = {
        body: {
          email: 'test@example.com',
          password: 'Password123!'
        },
        headers: {},
        cookies: {}
      };
    });

    describe('Validation Tests', () => {
      test('should return 400 with errors when email is missing', async () => {
        req.body.email = '';
        
        await authController.login(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          status: 400,
          message: 'Validation failed',
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'email',
              message: 'Email is required'
            })
          ])
        }));
      });
      
      test('should return 400 with errors when email format is invalid', async () => {
        req.body.email = 'invalid-email';
        
        await authController.login(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          status: 400,
          message: 'Validation failed',
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'email',
              message: 'Invalid email format'
            })
          ])
        }));
      });
      
      test('should return 400 with errors when password is missing', async () => {
        req.body.password = '';
        
        await authController.login(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          status: 400,
          message: 'Validation failed',
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'password',
              message: 'Password is required'
            })
          ])
        }));
      });
      
      test('should return 400 with errors when both email and password are missing', async () => {
        req.body.email = '';
        req.body.password = '';
        
        await authController.login(req, res);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          status: 400,
          message: 'Validation failed',
          errors: expect.arrayContaining([
            expect.objectContaining({ field: 'email' }),
            expect.objectContaining({ field: 'password' })
          ])
        }));
        expect(res.json.mock.calls[0][0].errors.length).toBe(2);
      });
    });
    
    describe('Authentication Tests', () => {
      test('should return 401 when credentials are invalid', async () => {
        userService.verifyCredentials.mockRejectedValue(new Error('Invalid credentials'));
        
        await authController.login(req, res);
        
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          status: 401,
          message: 'Authentication failed',
          errors: [{ field: 'general', message: 'Invalid email or password' }]
        }));
      });
      
      test('should return 500 when an unexpected server error occurs', async () => {
        userService.verifyCredentials.mockRejectedValue(new Error('Database error'));
        
        await authController.login(req, res);
        
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          status: 500,
          message: 'Server error',
          errors: [{ field: 'general', message: 'Server error during login' }]
        }));
        
        // Verify error was logged
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Login error:',
          expect.any(Error)
        );
      });
      
      test('should successfully authenticate user and return 200 with user data and token', async () => {
        const mockUser = {
          id: 1,
          email: 'test@example.com',
          username: 'testuser',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const mockToken = 'jwt-token-123';
        
        userService.verifyCredentials.mockResolvedValue(mockUser);
        authService.generateToken.mockReturnValue(mockToken);
        
        await authController.login(req, res);
        
        expect(userService.verifyCredentials).toHaveBeenCalledWith(
          'test@example.com',
          'Password123!'
        );
        
        expect(authService.generateToken).toHaveBeenCalledWith(mockUser.id);
        
        expect(res.cookie).toHaveBeenCalledWith(
          'auth_token',
          mockToken,
          expect.objectContaining({
            httpOnly: true,
            maxAge: expect.any(Number)
          })
        );
        
        expect(res.status).toHaveBeenCalledWith(200);
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
  
  describe('logout', () => {
    beforeEach(() => {
      // Setup request object specifically for logout tests
      req = {
        headers: {},
        cookies: {}
      };
    });
    
    test('should clear authentication cookie and return 200 success response', async () => {
      await authController.logout(req, res);
      
      expect(res.clearCookie).toHaveBeenCalledWith(
        'auth_token',
        expect.objectContaining({
          httpOnly: true,
          secure: expect.any(Boolean),
          sameSite: 'strict'
        })
      );
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Successfully logged out'
      });
    });
    
    test('should invalidate token from authorization header if present', async () => {
      // Setup token in authorization header
      const token = 'jwt-token-123';
      req.headers.authorization = `Bearer ${token}`;
      
      authService.invalidateToken.mockResolvedValue(true);
      
      await authController.logout(req, res);
      
      expect(authService.invalidateToken).toHaveBeenCalledWith(token);
      expect(res.clearCookie).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
    
    test('should invalidate token from cookie if present', async () => {
      // Setup token in cookie
      const token = 'jwt-token-456';
      req.cookies.auth_token = token;
      
      authService.invalidateToken.mockResolvedValue(true);
      
      await authController.logout(req, res);
      
      expect(authService.invalidateToken).toHaveBeenCalledWith(token);
      expect(res.clearCookie).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
    
    test('should handle case when no token is present', async () => {
      await authController.logout(req, res);
      
      expect(authService.invalidateToken).not.toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
    
    test('should still return success when token invalidation fails', async () => {
      const token = 'jwt-token-123';
      req.headers.authorization = `Bearer ${token}`;
      
      authService.invalidateToken.mockRejectedValue(new Error('Token blacklisting failed'));
      
      await authController.logout(req, res);
      
      expect(authService.invalidateToken).toHaveBeenCalledWith(token);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Token invalidation error:',
        expect.any(Error)
      );
      expect(res.clearCookie).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Successfully logged out'
      });
    });
    
    test('should return 500 when an unexpected server error occurs', async () => {
      // Mock clearCookie to throw an error
      res.clearCookie.mockImplementation(() => {
        throw new Error('Cookie processing error');
      });
      
      await authController.logout(req, res);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Logout error:',
        expect.any(Error)
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 500,
        message: 'Server error',
        errors: [{ field: 'general', message: 'Server error during logout' }]
      }));
    });
  });
  

// In your test file, replace the regex extraction with direct usage:
describe('formatErrorResponse', () => {
  test('should format error responses with provided parameters', () => {
    const testStatus = 400;
    const testMessage = 'Test error message';
    const testErrors = [{ field: 'test', message: 'Test error' }];
    
    const result = authController.formatErrorResponse(testStatus, testMessage, testErrors);
    
    expect(result).toEqual({
      status: 400,
      message: 'Test error message',
      errors: [{ field: 'test', message: 'Test error' }]
    });
  });

  test('should use empty array as default for errors parameter', () => {
    const result = authController.formatErrorResponse(404, 'Not found');
    
    expect(result).toEqual({
      status: 404,
      message: 'Not found',
      errors: []
    });
  });
});

});