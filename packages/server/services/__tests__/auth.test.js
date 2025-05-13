const { hashPassword, verifyPassword, generateToken, verifyToken, validatePasswordStrength, invalidateToken, isTokenInvalid, clearTokenDenylist } = require('../auth');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

jest.mock('bcrypt');

// Mock environment variables
process.env.JWT_SECRET = 'test_secret_key';

describe('Auth Service', () => {
  // Password Utilities Tests
  describe('Password Utilities', () => {
    describe('hashPassword', () => {

      beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
      });

      it('should hash a password successfully', async () => {
        // Arrange
        const plainText = 'StrongP@ssw0rd!';
        const mockHash = '$2b$12$someRandomHash123456789';
        
        // Mock bcrypt.hash to return a successful hash
        bcrypt.hash.mockResolvedValueOnce(mockHash);
        
        // Act
        const hash = await hashPassword(plainText);
        
        // Assert
        expect(hash).toBeTruthy();
        expect(hash).not.toEqual(plainText);
        expect(hash.startsWith('$2b$')).toBeTruthy(); // bcrypt hash signature
        expect(bcrypt.hash).toHaveBeenCalledWith(plainText, 12);
      });

      it('should throw an error when password is empty', async () => {
        // Arrange & Act & Assert
        await expect(hashPassword('')).rejects.toThrow('Password cannot be empty');
      });

      it('should throw an error when password is null', async () => {
        // Arrange & Act & Assert
        await expect(hashPassword(null)).rejects.toThrow('Password cannot be empty');
      });

      it('should throw an error when password is undefined', async () => {
        // Arrange & Act & Assert
        await expect(hashPassword(undefined)).rejects.toThrow('Password cannot be empty');
      });

      it('should throw an error when bcrypt.hash fails', async () => {
        // Arrange
        const mockErrorMessage = 'Bcrypt hash operation failed';
        bcrypt.hash.mockRejectedValueOnce(new Error(mockErrorMessage));
        
        // Act & Assert
        await expect(hashPassword('StrongP@ssw0rd!')).rejects.toThrow(
          `Failed to hash password: ${mockErrorMessage}`
        );
        
        // Verify bcrypt.hash was called with expected parameters
        expect(bcrypt.hash).toHaveBeenCalledWith('StrongP@ssw0rd!', 12);
      });

    });

    describe('verifyPassword', () => {

      beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        
        // Spy on console.error
        jest.spyOn(console, 'error').mockImplementation(() => {});
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });
      
      it('should return true for matching password', async () => {
        // Arrange
        const plainText = 'StrongP@ssw0rd!';
        const hash = '$2b$12$someRandomHash123456789';
        
        // Mock bcrypt.compare to return true for matching password
        bcrypt.compare.mockResolvedValueOnce(true);
        
        // Act
        const result = await verifyPassword(plainText, hash);
        
        // Assert
        expect(result).toBe(true);
        expect(bcrypt.compare).toHaveBeenCalledWith(plainText, hash);
      });

      it('should return false for non-matching password', async () => {
        // Arrange
        const plainText = 'WrongPassword123';
        const hash = '$2b$12$someRandomHash123456789';
        
        // Mock bcrypt.compare to return false for non-matching password
        bcrypt.compare.mockResolvedValueOnce(false);
        
        // Act
        const result = await verifyPassword(plainText, hash);
        
        // Assert
        expect(result).toBe(false);
        expect(bcrypt.compare).toHaveBeenCalledWith(plainText, hash);
      });

      it('should return false when plaintext is empty', async () => {
        // Arrange
        const hash = '$2b$12$someRandomHash123456789';
        
        // Act
        const result = await verifyPassword('', hash);
        
        // Assert
        expect(result).toBe(false);
        // Verify bcrypt.compare is not called when plaintext is empty
        expect(bcrypt.compare).not.toHaveBeenCalled();
      });

      it('should return false when hash is empty', async () => {
        // Arrange & Act
        const result = await verifyPassword('StrongP@ssw0rd!', '');
        
        // Assert
        expect(result).toBe(false);
        // Verify bcrypt.compare is not called when hash is empty
        expect(bcrypt.compare).not.toHaveBeenCalled();
      });

      it('should return false when both inputs are empty', async () => {
        // Arrange & Act
        const result = await verifyPassword('', '');
        
        // Assert
        expect(result).toBe(false);
        // Verify bcrypt.compare is not called when both inputs are empty
        expect(bcrypt.compare).not.toHaveBeenCalled();
      });

      it('should log error and return false when bcrypt.compare fails', async () => {
        // Arrange
        const plainText = 'StrongP@ssw0rd!';
        const hash = '$2b$12$some.valid.bcrypt.hash';
        const mockError = new Error('Bcrypt compare operation failed');
        
        bcrypt.compare.mockRejectedValueOnce(mockError);
        
        // Act
        const result = await verifyPassword(plainText, hash);
        
        // Assert
        expect(result).toBe(false);
        expect(console.error).toHaveBeenCalledWith('Error verifying password:', mockError);
        expect(bcrypt.compare).toHaveBeenCalledWith(plainText, hash);
      });

    });

    // New test suite for password validation
    describe('validatePasswordStrength', () => {
      it('should return valid for strong password', () => {
        // Arrange
        const password = 'StrongP@ssw0rd';
        
        // Act
        const result = validatePasswordStrength(password);
        
        // Assert
        expect(result.valid).toBe(true);
        expect(result.message).toBe('Password meets strength requirements');
      });

      it('should return valid for password with numbers', () => {
        // Arrange
        const password = 'Password123';
        
        // Act
        const result = validatePasswordStrength(password);
        
        // Assert
        expect(result.valid).toBe(true);
        expect(result.message).toBe('Password meets strength requirements');
      });

      it('should return valid for password with special characters', () => {
        // Arrange
        const password = 'Password!@#';
        
        // Act
        const result = validatePasswordStrength(password);
        
        // Assert
        expect(result.valid).toBe(true);
        expect(result.message).toBe('Password meets strength requirements');
      });

      it('should fail validation for short password', () => {
        // Arrange
        const password = 'Pass1';  // Less than 8 characters
        
        // Act
        const result = validatePasswordStrength(password);
        
        // Assert
        expect(result.valid).toBe(false);
        expect(result.message).toBe('Password must be at least 8 characters long');
      });

      it('should fail validation for password without numbers or special characters', () => {
        // Arrange
        const password = 'PasswordOnly';  // No numbers or special chars
        
        // Act
        const result = validatePasswordStrength(password);
        
        // Assert
        expect(result.valid).toBe(false);
        expect(result.message).toBe('Password must contain at least one number or special character');
      });

      it('should fail validation for empty password', () => {
        // Arrange
        const password = '';
        
        // Act
        const result = validatePasswordStrength(password);
        
        // Assert
        expect(result.valid).toBe(false);
        expect(result.message).toBe('Password cannot be empty');
      });

      it('should fail validation for null password', () => {
        // Arrange
        const password = null;
        
        // Act
        const result = validatePasswordStrength(password);
        
        // Assert
        expect(result.valid).toBe(false);
        expect(result.message).toBe('Password cannot be empty');
      });

      it('should fail validation for undefined password', () => {
        // Arrange
        const password = undefined;
        
        // Act
        const result = validatePasswordStrength(password);
        
        // Assert
        expect(result.valid).toBe(false);
        expect(result.message).toBe('Password cannot be empty');
      });

      it('should pass validation for exactly 8 characters with required elements', () => {
        // Arrange
        const password = 'Exact8!1';  // Exactly 8 characters with special char and number
        
        // Act
        const result = validatePasswordStrength(password);
        
        // Assert
        expect(result.valid).toBe(true);
        expect(result.message).toBe('Password meets strength requirements');
      });

      it('should accept multiple special characters and numbers', () => {
        // Arrange
        const password = 'P@$$w0rd!123';  // Multiple special chars and numbers
        
        // Act
        const result = validatePasswordStrength(password);
        
        // Assert
        expect(result.valid).toBe(true);
        expect(result.message).toBe('Password meets strength requirements');
      });
    });
  });


  // JWT Utilities Tests
  describe('JWT Utilities', () => {
    describe('generateToken', () => {
      afterEach(() => {
        jest.restoreAllMocks();
      });

      it('should generate a valid JWT token with default expiry', () => {
        // Arrange
        const userId = '12345';
        
        // Act
        const token = generateToken(userId);
        
        // Assert
        expect(token).toBeTruthy();
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        expect(decoded.userId).toBe(userId);
        expect(decoded.exp).toBeTruthy(); // Should have expiration
      });

      it('should generate a token with custom expiry', () => {
        // Arrange
        const userId = '12345';
        const expiry = '2h'; // 2 hours
        
        // Act
        const token = generateToken(userId, expiry);
        
        // Assert
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        expect(decoded.userId).toBe(userId);
        
        // Calculate expected expiration time (with small buffer for test execution time)
        const expectedExp = Math.floor(Date.now() / 1000) + (2 * 60 * 60);
        const timeDiff = Math.abs(decoded.exp - expectedExp);
        expect(timeDiff).toBeLessThan(5); // Allow 5 seconds difference due to test execution time
      });

      it('should throw error when JWT_SECRET is not set', () => {
        // Arrange
        const originalSecret = process.env.JWT_SECRET;
        delete process.env.JWT_SECRET;
        
        // Act & Assert
        expect(() => generateToken('12345')).toThrow('JWT_SECRET environment variable is not set');
        
        // Cleanup
        process.env.JWT_SECRET = originalSecret;
      });

      it('should throw error when jwt.sign fails', () => {
        // Arrange
        jest.spyOn(jwt, 'sign').mockImplementationOnce(() => {
          throw new Error('JWT signing error');
        });
        
        // Act & Assert
        expect(() => generateToken('12345')).toThrow('Failed to generate token: JWT signing error');
      });
      
      it('should handle null or undefined userId', () => {
        // Arrange & Act & Assert
        const tokenWithNull = generateToken(null);
        const tokenWithUndefined = generateToken(undefined);
        
        // Verify tokens were created
        expect(tokenWithNull).toBeTruthy();
        expect(tokenWithUndefined).toBeTruthy();
        
        // Verify payload contains null/undefined userId
        const decodedNull = jwt.verify(tokenWithNull, process.env.JWT_SECRET);
        const decodedUndefined = jwt.verify(tokenWithUndefined, process.env.JWT_SECRET);
        
        expect(decodedNull.userId).toBeNull();
        expect(decodedUndefined.userId).toBeUndefined();
      });
    });

    describe('verifyToken', () => {
      afterEach(() => {
        jest.restoreAllMocks();
      });

      it('should verify and return payload for valid token', () => {
        // Arrange
        const userId = '12345';
        const token = generateToken(userId);
        
        // Act
        const payload = verifyToken(token);
        
        // Assert
        expect(payload).toBeTruthy();
        expect(payload.userId).toBe(userId);
      });

      it('should throw error for invalid token', () => {
        // Arrange
        const invalidToken = 'invalid.token.string';
        
        // Act & Assert
        expect(() => verifyToken(invalidToken)).toThrow('Invalid token');
      });

      it('should throw error for expired token', () => {
        // Arrange - Create a token that is already expired
        const userId = '12345';
        const expiredToken = jwt.sign(
          { userId },
          process.env.JWT_SECRET,
          { expiresIn: '-1ms' } // Expired 1ms ago
        );
        
        // Act & Assert
        expect(() => verifyToken(expiredToken)).toThrow('Token has expired');
      });

      it('should throw error for token with wrong signature', () => {
        // Arrange
        const userId = '12345';
        const tokenWithWrongSignature = jwt.sign(
          { userId },
          'wrong_secret_key' // Different secret than what will be used to verify
        );
        
        // Act & Assert
        expect(() => verifyToken(tokenWithWrongSignature)).toThrow('Invalid token');
      });

      it('should throw error when JWT_SECRET is not set', () => {
        // Arrange
        const originalSecret = process.env.JWT_SECRET;
        delete process.env.JWT_SECRET;
        const token = jwt.sign({ userId: '12345' }, 'test_secret_key');
        
        // Act & Assert
        expect(() => verifyToken(token)).toThrow('JWT_SECRET environment variable is not set');
        
        // Cleanup
        process.env.JWT_SECRET = originalSecret;
      });

      it('should throw error for generic verification error', () => {
        // Arrange
        const token = generateToken('12345');
        jest.spyOn(jwt, 'verify').mockImplementationOnce(() => {
          throw new Error('Generic JWT error');
        });
        
        // Act & Assert
        expect(() => verifyToken(token)).toThrow('Token verification failed: Generic JWT error');
      });

      it('should handle different types of JWT errors', () => {
        // Arrange
        const token = 'valid.looking.token';
        
        // Test TokenExpiredError
        jest.spyOn(jwt, 'verify').mockImplementationOnce(() => {
          const error = new Error('Token expired');
          error.name = 'TokenExpiredError';
          throw error;
        });
        
        // Act & Assert
        expect(() => verifyToken(token)).toThrow('Token verification failed: Token expired');
        
        // Test JsonWebTokenError
        jest.spyOn(jwt, 'verify').mockImplementationOnce(() => {
          const error = new Error('Invalid token');
          error.name = 'JsonWebTokenError';
          throw error;
        });
        
        // Act & Assert
        expect(() => verifyToken(token)).toThrow('Invalid token');
      });
      
      it('should throw a general error for non-specific JWT errors', () => {
        // Arrange
        const token = generateToken('12345');
        jest.spyOn(jwt, 'verify').mockImplementationOnce(() => {
          // Create an error that's neither TokenExpiredError nor JsonWebTokenError
          const error = new Error('Some other JWT error');
          error.name = 'OtherError';
          throw error;
        });
        
        // Act & Assert
        expect(() => verifyToken(token)).toThrow('Token verification failed: Some other JWT error');
      });
      
      it('should handle null token input', () => {
        // Arrange, Act & Assert
        expect(() => verifyToken(null)).toThrow('Invalid token');
      });
    });

    // Token Denylist Tests
    describe('Token Denylist', () => {
      beforeEach(() => {
        // Clear token denylist before each test
        clearTokenDenylist();
        
        // Spy on console.error
        jest.spyOn(console, 'error').mockImplementation(() => {});
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      it('should successfully invalidate a valid token', () => {
        // Arrange
        const userId = '12345';
        const token = generateToken(userId);
        
        // Act
        const result = invalidateToken(token);
        
        // Assert
        expect(result).toBe(true);
        expect(isTokenInvalid(token)).toBe(true);
      });

      it('should throw error for null or undefined token in invalidateToken', () => {
        // Arrange & Act & Assert
        expect(() => invalidateToken(null)).toThrow('Invalid token format');
        expect(() => invalidateToken(undefined)).toThrow('Invalid token format');
      });

      it('should throw error for non-string token in invalidateToken', () => {
        // Arrange & Act & Assert
        expect(() => invalidateToken(123)).toThrow('Invalid token format');
        expect(() => invalidateToken({})).toThrow('Invalid token format');
        expect(() => invalidateToken([])).toThrow('Invalid token format');
      });

      it('should return false when invalidating an already expired token', () => {
        // Arrange - Create a token that is already expired
        const userId = '12345';
        const expiredToken = jwt.sign(
          { userId },
          process.env.JWT_SECRET,
          { expiresIn: '-1ms' } // Expired 1ms ago
        );
        
        // Act
        const result = invalidateToken(expiredToken);
        
        // Assert
        expect(result).toBe(false);
        expect(console.error).toHaveBeenCalled();
      });

      it('should return false when invalidating an invalid token', () => {
        // Arrange
        const invalidToken = 'invalid.token.string';
        
        // Act
        const result = invalidateToken(invalidToken);
        
        // Assert
        expect(result).toBe(false);
        expect(console.error).toHaveBeenCalled();
      });

      it('should consider null, undefined, or non-string tokens as invalid', () => {
        // Arrange & Act & Assert
        expect(isTokenInvalid(null)).toBe(true);
        expect(isTokenInvalid(undefined)).toBe(true);
        expect(isTokenInvalid(123)).toBe(true);
        expect(isTokenInvalid({})).toBe(true);
      });

      it('should consider a token valid if not in denylist', () => {
        // Arrange
        const userId = '12345';
        const token = generateToken(userId);
        
        // Act & Assert
        expect(isTokenInvalid(token)).toBe(false);
      });

      it('should verify token is invalid after invalidation', () => {
        // Arrange
        const userId = '12345';
        const token = generateToken(userId);
        
        // Act
        verifyToken(token); // Should not throw error
        invalidateToken(token);
        
        // Assert
        expect(isTokenInvalid(token)).toBe(true);
        
        // Token should still be verifiable (valid signature, not expired)
        // but marked as invalid in our system
        const payload = verifyToken(token);
        expect(payload.userId).toBe(userId);
      });

      it('should allow invalidating multiple tokens', () => {
        // Arrange
        const token1 = generateToken('user1');
        const token2 = generateToken('user2');
        const token3 = generateToken('user3');
        
        // Act
        invalidateToken(token1);
        invalidateToken(token2);
        
        // Assert
        expect(isTokenInvalid(token1)).toBe(true);
        expect(isTokenInvalid(token2)).toBe(true);
        expect(isTokenInvalid(token3)).toBe(false);
      });

      it('should clear the token denylist when clearTokenDenylist is called', () => {
        // Arrange
        const token = generateToken('12345');
        invalidateToken(token);
        expect(isTokenInvalid(token)).toBe(true);
        
        // Act
        clearTokenDenylist();
        
        // Assert
        expect(isTokenInvalid(token)).toBe(false);
      });
    });
  });
});