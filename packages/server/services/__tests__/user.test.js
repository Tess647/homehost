// packages/server/services/__tests__/user.test.js
const { getUserById, getUserByEmail, createUser, verifyCredentials } = require('../user');
const { PrismaClient } = require('@prisma/client');
const { validatePasswordStrength, hashPassword, verifyPassword } = require('../../services/auth');

// Mock the Prisma Client
jest.mock('@prisma/client', () => {
  const mockFindUnique = jest.fn();
  const mockFindFirst = jest.fn();
  const mockCreate = jest.fn();
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: {
        findUnique: mockFindUnique,
        findFirst: mockFindFirst,
        create: mockCreate
      }
    }))
  };
});

// Mock the auth service
jest.mock('../../services/auth', () => ({
  validatePasswordStrength: jest.fn(),
  hashPassword: jest.fn(),
  verifyPassword: jest.fn()
}));

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

describe('User Service', () => {
  let mockPrisma;
  
  beforeEach(() => {
    mockPrisma = new PrismaClient();
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    it('should return user data without password when user exists', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password', // This should be excluded in the result
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await getUserById(1);

      // Assert
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt
      });
      
      // Ensure password is not included
      expect(result).not.toHaveProperty('password');
    });

    it('should return null when user does not exist', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await getUserById(999);

      // Assert
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 999 }
      });
      
      expect(result).toBeNull();
    });

    it('should convert string ID to number', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act
      await getUserById('123');

      // Assert
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 123 }
      });
    });

    it('should throw an error when database query fails', async () => {
      // Arrange
      const errorMessage = 'Database connection error';
      mockPrisma.user.findUnique.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(getUserById(1)).rejects.toThrow('Failed to fetch user');
    });
  });

  describe('getUserByEmail', () => {
    it('should return user data without password when user exists', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password', // This should be excluded in the result
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);

      // Act
      const result = await getUserByEmail('test@example.com');

      // Assert
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: {
            equals: 'test@example.com',
            mode: 'insensitive'
          }
        }
      });
      
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt
      });
      
      // Ensure password is not included
      expect(result).not.toHaveProperty('password');
    });

    it('should normalize email to lowercase for case-insensitive lookup', async () => {
      // Arrange
      mockPrisma.user.findFirst.mockResolvedValue(null);

      // Act
      await getUserByEmail('Test@Example.COM');

      // Assert
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: {
            equals: 'test@example.com',
            mode: 'insensitive'
          }
        }
      });
    });

    it('should return null when user does not exist', async () => {
      // Arrange
      mockPrisma.user.findFirst.mockResolvedValue(null);

      // Act
      const result = await getUserByEmail('nonexistent@example.com');

      // Assert
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: {
            equals: 'nonexistent@example.com',
            mode: 'insensitive'
          }
        }
      });
      
      expect(result).toBeNull();
    });

    it('should throw an error when database query fails', async () => {
      // Arrange
      const errorMessage = 'Database connection error';
      mockPrisma.user.findFirst.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(getUserByEmail('test@example.com')).rejects.toThrow('Failed to fetch user by email');
    });
  });

  describe('createUser', () => {
    it('should validate password strength before creating user', async () => {
      // Arrange
      validatePasswordStrength.mockReturnValue({ valid: false, message: 'Password too weak' });
      
      // Act & Assert
      await expect(createUser('test@example.com', 'testuser', 'weak')).rejects.toThrow('Password too weak');
      expect(validatePasswordStrength).toHaveBeenCalledWith('weak');
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should successfully create a user and return without password', async () => {
      // Arrange
      validatePasswordStrength.mockReturnValue({ valid: true, message: 'Password meets strength requirements' });
      hashPassword.mockResolvedValue('hashed_secure_password');
      mockPrisma.user.findFirst.mockResolvedValue(null); // No existing user with email
      
      const mockCreatedUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashed_secure_password',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockPrisma.user.create.mockResolvedValue(mockCreatedUser);

      // Act
      const result = await createUser('test@example.com', 'testuser', 'SecurePassword123!');

      // Assert
      expect(validatePasswordStrength).toHaveBeenCalledWith('SecurePassword123!');
      expect(hashPassword).toHaveBeenCalledWith('SecurePassword123!');
      
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          username: 'testuser',
          password: 'hashed_secure_password',
        }
      });
      
      // Check result format
      expect(result).toEqual({
        id: mockCreatedUser.id,
        email: mockCreatedUser.email,
        username: mockCreatedUser.username,
        createdAt: mockCreatedUser.createdAt,
        updatedAt: mockCreatedUser.updatedAt
      });
      
      // Ensure password is not included
      expect(result).not.toHaveProperty('password');
    });

    it('should reject creation if email already exists', async () => {
      // Arrange
      validatePasswordStrength.mockReturnValue({ valid: true, message: 'Password meets strength requirements' });
      
      // Mock existing user with same email
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        username: 'existinguser'
      });

      // Act & Assert
      await expect(createUser('test@example.com', 'testuser', 'SecurePassword123!')).rejects.toThrow('Email already in use');
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should normalize email to lowercase before checking for duplicates', async () => {
      // Arrange
      validatePasswordStrength.mockReturnValue({ valid: true, message: 'Password meets strength requirements' });
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashed_password'
      });

      // Act
      await createUser('TEST@EXAMPLE.COM', 'testuser', 'SecurePassword123!');

      // Assert
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: {
            equals: 'test@example.com',
            mode: 'insensitive'
          }
        }
      });
      
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'test@example.com',  // Email should be normalized to lowercase
        })
      });
    });

    it('should throw a generic error when database create operation fails', async () => {
      // Arrange
      validatePasswordStrength.mockReturnValue({ valid: true, message: 'Password meets strength requirements' });
      hashPassword.mockResolvedValue('hashed_secure_password');
      mockPrisma.user.findFirst.mockResolvedValue(null); // No existing user with email
      
      // Mock a database error that's not related to validation or duplicate emails
      const databaseError = new Error('Database connection lost');
      mockPrisma.user.create.mockRejectedValue(databaseError);

      // Act & Assert
      await expect(createUser('test@example.com', 'testuser', 'SecurePassword123!')).rejects.toThrow('Failed to create user');
      
      // Verify the console.error was called with the database error
      expect(console.error).toHaveBeenCalledWith('Error creating user:', databaseError);
    });
  });

  describe('verifyCredentials', () => {
    it('should successfully verify credentials and return user without password', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashed_password', // This should be excluded in the result
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      verifyPassword.mockResolvedValue(true); // Password verification succeeds

      // Act
      const result = await verifyCredentials('test@example.com', 'correct_password');

      // Assert
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: {
            equals: 'test@example.com',
            mode: 'insensitive'
          }
        }
      });
      
      expect(verifyPassword).toHaveBeenCalledWith('correct_password', 'hashed_password');
      
      // Check result format
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt
      });
      
      // Ensure password is not included
      expect(result).not.toHaveProperty('password');
    });

    it('should throw "Invalid credentials" when user does not exist', async () => {
      // Arrange
      mockPrisma.user.findFirst.mockResolvedValue(null);
      
      // Act & Assert
      await expect(verifyCredentials('nonexistent@example.com', 'any_password')).rejects.toThrow('Invalid credentials');
      expect(verifyPassword).not.toHaveBeenCalled(); // Password verification should not be attempted
    });

    it('should throw "Invalid credentials" when password is incorrect', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashed_password',
      };
      
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      verifyPassword.mockResolvedValue(false); // Password verification fails
      
      // Act & Assert
      await expect(verifyCredentials('test@example.com', 'wrong_password')).rejects.toThrow('Invalid credentials');
      expect(verifyPassword).toHaveBeenCalledWith('wrong_password', 'hashed_password');
    });

    it('should normalize email to lowercase for case-insensitive lookup', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashed_password',
      };
      
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      verifyPassword.mockResolvedValue(true);
      
      // Act
      await verifyCredentials('TEST@EXAMPLE.COM', 'correct_password');
      
      // Assert
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: {
            equals: 'test@example.com',
            mode: 'insensitive'
          }
        }
      });
    });

    it('should throw a generic error when database query fails', async () => {
      // Arrange
      const databaseError = new Error('Database connection error');
      mockPrisma.user.findFirst.mockRejectedValue(databaseError);
      
      // Act & Assert
      await expect(verifyCredentials('test@example.com', 'any_password')).rejects.toThrow('Failed to verify credentials');
      
      // Verify the console.error was called with the database error
      expect(console.error).toHaveBeenCalledWith('Error verifying credentials:', databaseError);
    });
  });
});