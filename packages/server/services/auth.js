/**
 * Auth service for password-related security operations and JWT tokens
 * @module services/auth
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Number of salt rounds for bcrypt hashing
const SALT_ROUNDS = 12;

// In-memory token denylist (consider using Redis or DB in production)
const TOKEN_DENYLIST = new Set();

/**
 * Hashes a plaintext password using bcrypt
 * 
 * @async
 * @param {string} plainText - The plaintext password to hash
 * @returns {Promise<string>} A promise that resolves to the hashed password
 * @throws {Error} If plainText is empty, null, or undefined
 */
async function hashPassword(plainText) {
  // Explicit check for empty, null, or undefined password
  if (!plainText) {
    throw new Error('Password cannot be empty');
  }

  try {
    return await bcrypt.hash(plainText, SALT_ROUNDS);
  } catch (error) {
    throw new Error(`Failed to hash password: ${error.message}`);
  }
}

/**
 * Verifies a plaintext password against a stored hash
 * 
 * @async
 * @param {string} plainText - The plaintext password to verify
 * @param {string} hash - The stored hash to compare against
 * @returns {Promise<boolean>} A promise that resolves to true if the password matches, false otherwise
 */
async function verifyPassword(plainText, hash) {
  // Handle null, undefined, or empty strings directly
  if (!plainText || !hash) {
    return false;
  }

  try {
    return await bcrypt.compare(plainText, hash);
  } catch (error) {
    // Log error but return false for security
    console.error('Error verifying password:', error);
    return false;
  }
}

/**
 * Validates password strength based on length and character requirements
 * 
 * @param {string} password - The password to validate
 * @returns {object} An object with 'valid' boolean and 'message' string properties
 */
function validatePasswordStrength(password) {
  // Check if password exists
  if (!password) {
    return {
      valid: false,
      message: 'Password cannot be empty'
    };
  }

  // Check minimum length requirement
  if (password.length < 8) {
    return {
      valid: false,
      message: 'Password must be at least 8 characters long'
    };
  }

  // Check for at least one number or special character
  const hasNumberOrSpecial = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  if (!hasNumberOrSpecial) {
    return {
      valid: false,
      message: 'Password must contain at least one number or special character'
    };
  }

  // All requirements passed
  return {
    valid: true,
    message: 'Password meets strength requirements'
  };
}

/**
 * Generates a JSON Web Token for a user
 * 
 * @param {string|number} userId - The user ID to include in the token payload
 * @param {string|number} [expiry='1d'] - The expiration time for the token (e.g., '1h', '7d', '60m')
 * @returns {string} A signed JWT token
 * @throws {Error} If JWT_SECRET environment variable is not set or signing fails
 */
function generateToken(userId, expiry = '1d') {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  try {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: expiry }
    );
  } catch (error) {
    throw new Error(`Failed to generate token: ${error.message}`);
  }
}

/**
 * Verifies and decodes a JWT token
 * 
 * @param {string} token - The JWT token to verify
 * @returns {object} The decoded token payload
 * @throws {Error} If token is invalid, expired, or JWT_SECRET is not set
 * @throws {Error} If token verification fails for any reason
 */
function verifyToken(token) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    } else {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }
}

/**
 * Invalidates a token by adding it to the denylist
 * 
 * @param {string} token - The JWT token to invalidate
 * @returns {boolean} True if the token was successfully invalidated, false otherwise
 * @throws {Error} If token is null, undefined, or not a string
 */
function invalidateToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid token format');
  }

  try {
    // Verify the token is valid before adding to denylist
    const decoded = verifyToken(token);
    
    // Add the token to the denylist
    TOKEN_DENYLIST.add(token);
    
    return true;
  } catch (error) {
    // If token is already invalid or expired, no need to invalidate
    console.error('Error invalidating token:', error.message);
    return false;
  }
}

/**
 * Checks if a token is in the denylist (invalidated)
 * 
 * @param {string} token - The JWT token to check
 * @returns {boolean} True if the token is in the denylist, false otherwise
 */
function isTokenInvalid(token) {
  if (!token || typeof token !== 'string') {
    // Consider non-existent or malformed tokens as invalid
    return true;
  }
  
  return TOKEN_DENYLIST.has(token);
}

/**
 * Clears the token denylist (mainly for testing purposes)
 * 
 * @returns {void}
 */
function clearTokenDenylist() {
  TOKEN_DENYLIST.clear();
}

module.exports = {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  generateToken,
  verifyToken,
  invalidateToken,
  isTokenInvalid,
  clearTokenDenylist
};