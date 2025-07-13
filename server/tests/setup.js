// Test setup file for server-side tests
require('dotenv').config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Mock console.log in tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: console.error, // Keep error logging for debugging
};

// Set default timeout for all tests
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
  // Utility function to create test data
  createTestUser: () => ({
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
  }),
  
  createTestPost: (authorId) => ({
    title: 'Test Post Title',
    content: 'This is a test post content that is long enough to meet the minimum requirements.',
    author: authorId,
    category: require('mongoose').Types.ObjectId(),
    status: 'published',
  }),
};

// Clean up after each test
afterEach(async () => {
  // Clear all mocks
  jest.clearAllMocks();
});
