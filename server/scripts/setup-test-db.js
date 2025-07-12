#!/usr/bin/env node

// setup-test-db.js - Script to set up test database

const mongoose = require('mongoose');
const User = require('../src/models/User');
const Post = require('../src/models/Post');
require('dotenv').config();

const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/mern-testing-test';

async function setupTestDatabase() {
  try {
    console.log('🔧 Setting up test database...');
    
    // Connect to test database
    await mongoose.connect(TEST_DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to test database');
    
    // Clear existing data
    await User.deleteMany({});
    await Post.deleteMany({});
    console.log('🧹 Cleared existing data');
    
    // Create test users
    const testUsers = [
      {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        emailVerified: true,
      },
      {
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isActive: true,
        emailVerified: true,
      },
      {
        username: 'author',
        email: 'author@example.com',
        password: 'author123',
        firstName: 'Content',
        lastName: 'Author',
        isActive: true,
        emailVerified: true,
      },
    ];
    
    const createdUsers = await User.create(testUsers);
    console.log(`👥 Created ${createdUsers.length} test users`);
    
    // Create test categories (mock ObjectIds for now)
    const categoryIds = [
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
    ];
    
    // Create test posts
    const testPosts = [
      {
        title: 'Introduction to React Testing',
        content: 'This is a comprehensive guide to testing React applications. We will cover unit tests, integration tests, and end-to-end tests. Testing is crucial for maintaining code quality and ensuring that your application works as expected.',
        author: createdUsers[2]._id,
        category: categoryIds[0],
        status: 'published',
        publishedAt: new Date(),
        slug: 'introduction-to-react-testing',
        excerpt: 'A comprehensive guide to testing React applications.',
        readingTime: 5,
        tags: ['react', 'testing', 'javascript'],
      },
      {
        title: 'Node.js Best Practices',
        content: 'Learn the best practices for building scalable Node.js applications. This post covers error handling, security, performance optimization, and testing strategies. Following these practices will help you build robust backend applications.',
        author: createdUsers[1]._id,
        category: categoryIds[1],
        status: 'published',
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        slug: 'nodejs-best-practices',
        excerpt: 'Best practices for building scalable Node.js applications.',
        readingTime: 8,
        tags: ['nodejs', 'backend', 'best-practices'],
      },
      {
        title: 'Database Design Fundamentals',
        content: 'Understanding database design principles is essential for any developer. This post covers normalization, indexing, relationships, and performance considerations. We will also discuss when to use SQL vs NoSQL databases.',
        author: createdUsers[2]._id,
        category: categoryIds[2],
        status: 'published',
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        slug: 'database-design-fundamentals',
        excerpt: 'Essential database design principles for developers.',
        readingTime: 12,
        tags: ['database', 'sql', 'nosql', 'design'],
      },
      {
        title: 'Draft Post Example',
        content: 'This is a draft post that should not appear in public listings. It is used for testing purposes to ensure that draft posts are properly filtered.',
        author: createdUsers[2]._id,
        category: categoryIds[0],
        status: 'draft',
        slug: 'draft-post-example',
        excerpt: 'A draft post for testing purposes.',
        readingTime: 3,
        tags: ['draft', 'testing'],
      },
    ];
    
    const createdPosts = await Post.create(testPosts);
    console.log(`📝 Created ${createdPosts.length} test posts`);
    
    // Add some likes and comments to posts
    const post1 = createdPosts[0];
    post1.likes.push({ user: createdUsers[0]._id });
    post1.likes.push({ user: createdUsers[1]._id });
    post1.comments.push({
      user: createdUsers[0]._id,
      content: 'Great post! Very helpful for learning React testing.',
      isApproved: true,
    });
    await post1.save();
    
    const post2 = createdPosts[1];
    post2.likes.push({ user: createdUsers[0]._id });
    post2.comments.push({
      user: createdUsers[2]._id,
      content: 'Thanks for sharing these best practices.',
      isApproved: true,
    });
    await post2.save();
    
    console.log('💬 Added likes and comments to posts');
    
    console.log('\n🎉 Test database setup completed!');
    console.log('\nTest accounts created:');
    console.log('📧 test@example.com / password123 (regular user)');
    console.log('📧 admin@example.com / admin123 (admin user)');
    console.log('📧 author@example.com / author123 (content author)');
    
  } catch (error) {
    console.error('❌ Error setting up test database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  setupTestDatabase();
}

module.exports = setupTestDatabase;
