// Tests for auth middleware

const auth = require('../../src/middleware/auth');
const User = require('../../src/models/User');
const { generateToken } = require('../../src/utils/auth');

// Mock the User model
jest.mock('../../src/models/User');

// Mock the auth utils
jest.mock('../../src/utils/auth');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      header: jest.fn(),
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Valid Token Scenarios', () => {
    it('should authenticate user with valid token', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        isActive: true,
      };

      const mockToken = 'valid.jwt.token';
      const mockDecoded = { id: 'user123' };

      req.header.mockReturnValue(`Bearer ${mockToken}`);
      
      // Mock the auth utils
      const { extractTokenFromHeader, verifyToken } = require('../../src/utils/auth');
      extractTokenFromHeader.mockReturnValue(mockToken);
      verifyToken.mockReturnValue(mockDecoded);

      // Mock User.findById
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await auth(req, res, next);

      expect(req.header).toHaveBeenCalledWith('Authorization');
      expect(extractTokenFromHeader).toHaveBeenCalledWith(`Bearer ${mockToken}`);
      expect(verifyToken).toHaveBeenCalledWith(mockToken);
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle user with no password field', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        isActive: true,
      };

      const mockToken = 'valid.jwt.token';
      const mockDecoded = { id: 'user123' };

      req.header.mockReturnValue(`Bearer ${mockToken}`);
      
      const { extractTokenFromHeader, verifyToken } = require('../../src/utils/auth');
      extractTokenFromHeader.mockReturnValue(mockToken);
      verifyToken.mockReturnValue(mockDecoded);

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await auth(req, res, next);

      expect(User.findById().select).toHaveBeenCalledWith('-password');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Invalid Token Scenarios', () => {
    it('should reject request with no authorization header', async () => {
      req.header.mockReturnValue(undefined);
      
      const { extractTokenFromHeader } = require('../../src/utils/auth');
      extractTokenFromHeader.mockReturnValue(null);

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. No token provided.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with malformed authorization header', async () => {
      req.header.mockReturnValue('InvalidFormat token123');
      
      const { extractTokenFromHeader } = require('../../src/utils/auth');
      extractTokenFromHeader.mockReturnValue(null);

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. No token provided.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid JWT token', async () => {
      req.header.mockReturnValue('Bearer invalid.token');
      
      const { extractTokenFromHeader, verifyToken } = require('../../src/utils/auth');
      extractTokenFromHeader.mockReturnValue('invalid.token');
      
      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';
      verifyToken.mockImplementation(() => {
        throw error;
      });

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid token.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject expired JWT token', async () => {
      req.header.mockReturnValue('Bearer expired.token');
      
      const { extractTokenFromHeader, verifyToken } = require('../../src/utils/auth');
      extractTokenFromHeader.mockReturnValue('expired.token');
      
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      verifyToken.mockImplementation(() => {
        throw error;
      });

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Token expired.',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('User Validation Scenarios', () => {
    it('should reject token for non-existent user', async () => {
      const mockToken = 'valid.jwt.token';
      const mockDecoded = { id: 'nonexistent123' };

      req.header.mockReturnValue(`Bearer ${mockToken}`);
      
      const { extractTokenFromHeader, verifyToken } = require('../../src/utils/auth');
      extractTokenFromHeader.mockReturnValue(mockToken);
      verifyToken.mockReturnValue(mockDecoded);

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid token. User not found.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject token for inactive user', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        isActive: false, // User is deactivated
      };

      const mockToken = 'valid.jwt.token';
      const mockDecoded = { id: 'user123' };

      req.header.mockReturnValue(`Bearer ${mockToken}`);
      
      const { extractTokenFromHeader, verifyToken } = require('../../src/utils/auth');
      extractTokenFromHeader.mockReturnValue(mockToken);
      verifyToken.mockReturnValue(mockDecoded);

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Account is deactivated.',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Database Error Scenarios', () => {
    it('should handle database connection errors', async () => {
      const mockToken = 'valid.jwt.token';
      const mockDecoded = { id: 'user123' };

      req.header.mockReturnValue(`Bearer ${mockToken}`);
      
      const { extractTokenFromHeader, verifyToken } = require('../../src/utils/auth');
      extractTokenFromHeader.mockReturnValue(mockToken);
      verifyToken.mockReturnValue(mockDecoded);

      const dbError = new Error('Database connection failed');
      User.findById.mockReturnValue({
        select: jest.fn().mockRejectedValue(dbError),
      });

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Token verification failed.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle unexpected errors gracefully', async () => {
      const mockToken = 'valid.jwt.token';
      req.header.mockReturnValue(`Bearer ${mockToken}`);
      
      const { extractTokenFromHeader } = require('../../src/utils/auth');
      extractTokenFromHeader.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Token verification failed.',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty bearer token', async () => {
      req.header.mockReturnValue('Bearer ');
      
      const { extractTokenFromHeader } = require('../../src/utils/auth');
      extractTokenFromHeader.mockReturnValue(null);

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. No token provided.',
      });
    });

    it('should handle authorization header with only "Bearer"', async () => {
      req.header.mockReturnValue('Bearer');
      
      const { extractTokenFromHeader } = require('../../src/utils/auth');
      extractTokenFromHeader.mockReturnValue(null);

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. No token provided.',
      });
    });

    it('should handle null user ID in token', async () => {
      const mockToken = 'valid.jwt.token';
      const mockDecoded = { id: null };

      req.header.mockReturnValue(`Bearer ${mockToken}`);
      
      const { extractTokenFromHeader, verifyToken } = require('../../src/utils/auth');
      extractTokenFromHeader.mockReturnValue(mockToken);
      verifyToken.mockReturnValue(mockDecoded);

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid token. User not found.',
      });
    });
  });
});
