// controllers/authController.js
const userService = require('../services/user');
const authService = require('../services/auth');

/**
 * Validates an email format
 * @param {string} email - The email to validate
 * @returns {boolean} True if email format is valid, false otherwise
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Handles user registration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function register(req, res) {
  try {
    const { email, username, password, confirmPassword } = req.body;
    const errors = [];

    // Validate email
    if (!email) {
      errors.push({ field: 'email', message: 'Email is required' });
    } else if (!isValidEmail(email)) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }

    // Validate username
    if (!username) {
      errors.push({ field: 'username', message: 'Username is required' });
    }

    // Validate password
    if (!password) {
      errors.push({ field: 'password', message: 'Password is required' });
    } else {
      // Check password strength
      const passwordValidation = authService.validatePasswordStrength(password);
      if (!passwordValidation.valid) {
        errors.push({ field: 'password', message: passwordValidation.message });
      }
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      errors.push({ field: 'confirmPassword', message: 'Passwords do not match' });
    }

    // Return validation errors if any
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Attempt to create user
    try {
      const user = await userService.createUser(email, username, password);
      
      // Generate JWT token
      const token = authService.generateToken(user.id);
      
      // Return successful response
      return res.status(201).json({ 
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        token
      });
    } catch (error) {
      // Handle duplicate email
      if (error.message === 'Email already in use') {
        return res.status(400).json({ 
          errors: [{ field: 'email', message: 'Email already in use' }]
        });
      }
      
      // Re-throw other errors to be caught by the outer catch block
      throw error;
    }
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      errors: [{ field: 'general', message: 'Server error during registration' }]
    });
  }
}

module.exports = {
  register,
  isValidEmail // Exported for testing
};