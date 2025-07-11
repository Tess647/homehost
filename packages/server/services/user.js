// packages/server/services/user.js
const { PrismaClient } = require('@prisma/client');
const { hashPassword, validatePasswordStrength, verifyPassword } = require('./auth');

const prisma = new PrismaClient();

/**
 * Get a user by their ID
 * @param {number|string} id - The user ID
 * @returns {Promise<Object|null>} The user object without the password or null if not found
 */
async function getUserById(id) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: Number(id)
      },
    });
    
    if (!user) {
      return null;
    }
    
    // Explicitly remove the password field
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    throw new Error('Failed to fetch user');
  }
}

/**
 * Get a user by their email (case-insensitive)
 * @param {string} email - The user email
 * @returns {Promise<Object|null>} The user object without the password or null if not found
 */
async function getUserByEmail(email) {
  try {
    // Normalize email to lowercase for case-insensitive lookup
    const normalizedEmail = email.toLowerCase();
    
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
        }
      },
    });
    
    if (!user) {
      return null;
    }
    
    // Explicitly remove the password field
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    throw new Error('Failed to fetch user by email');
  }
}

/**
 * Create a new user with validated credentials
 * @param {string} email - User's email
 * @param {string} username - User's username
 * @param {string} password - User's password (plaintext)
 * @returns {Promise<Object>} The created user object without password
 * @throws {Error} If password validation fails or email already exists
 */
async function createUser(email, username, password) {
  try {
    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message);
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase();
    
    // Check if user with email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
        }
      },
    });
    
    if (existingUser) {
      throw new Error('Email already in use');
    }
    
    // Hash the password
    const hashedPassword = await hashPassword(password);
    
    // Create the user
    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        username,
        password: hashedPassword,
      },
    });
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  } catch (error) {
    // Re-throw specific errors for validation and duplicate email
    if (error.message === 'Email already in use' || 
        error.message.includes('Password')) {
      throw error;
    }
    
    console.error('Error creating user:', error);
    throw new Error('Failed to create user');
  }
}

/**
 * Verify user credentials (email and password)
 * @param {string} email - User's email
 * @param {string} password - User's password (plaintext)
 * @returns {Promise<Object>} The user object without password if credentials are valid
 * @throws {Error} If credentials are invalid or verification fails
 */
async function verifyCredentials(email, password) {
  try {
    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase();
    
    // Fetch the user with password for verification
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
        }
      },
    });
    
    // User not found or password verification failed
    if (!user || !(await verifyPassword(password, user.password))) {
      throw new Error('Invalid credentials');
    }
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    // Re-throw specific error for invalid credentials
    if (error.message === 'Invalid credentials') {
      throw error;
    }
    
    console.error('Error verifying credentials:', error);
    throw new Error('Failed to verify credentials');
  }
}

module.exports = {
  getUserById,
  getUserByEmail,
  createUser,
  verifyCredentials,
};