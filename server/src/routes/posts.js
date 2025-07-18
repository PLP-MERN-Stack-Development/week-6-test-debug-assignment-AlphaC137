const express = require('express');
const { body, validationResult, param, query } = require('express-validator');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Validation middleware
const validatePost = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('content')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long'),
  body('category')
    .isMongoId()
    .withMessage('Category must be a valid MongoDB ObjectId'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be between 1 and 30 characters'),
];

const validatePostUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('content')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long'),
  body('category')
    .optional()
    .isMongoId()
    .withMessage('Category must be a valid MongoDB ObjectId'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be draft, published, or archived'),
];

const validateObjectId = [
  param('id').isMongoId().withMessage('Invalid post ID'),
];

const validateQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('category')
    .optional()
    .isMongoId()
    .withMessage('Category must be a valid MongoDB ObjectId'),
  query('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be draft, published, or archived'),
];

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

// @route   GET /api/posts
// @desc    Get all posts with pagination and filtering
// @access  Public
router.get('/', validateQuery, handleValidationErrors, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    } else {
      // Only show published posts by default for public access
      filter.status = 'published';
    }
    if (req.query.author) {
      filter.author = req.query.author;
    }
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    const posts = await Post.find(filter)
      .populate('author', 'username firstName lastName avatar')
      .populate('category', 'name slug')
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Post.countDocuments(filter);

    logger.info(`Retrieved ${posts.length} posts`, {
      filter,
      page,
      limit,
      total,
    });

    res.json({
      posts,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    logger.error('Error fetching posts:', error);
    res.status(501).json({ error: 'Failed to fetch posts' });
  }
});

// @route   GET /api/posts/:id
// @desc    Get single post by ID
// @access  Public
router.get('/:id', validateObjectId, handleValidationErrors, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username firstName lastName avatar')
      .populate('category', 'name slug')
      .populate('comments.user', 'username firstName lastName avatar');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Increment view count
    await post.incrementViews();

    logger.info(`Retrieved post: ${post.title}`, { postId: post._id });

    res.json(post);
  } catch (error) {
    logger.error('Error fetching post:', error);
    res.status(501).json({ error: 'Failed to fetch post' });
  }
});

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post('/', auth, validatePost, handleValidationErrors, async (req, res) => {
  try {
    const postData = {
      ...req.body,
      author: req.user.id,
    };

    const post = new Post(postData);
    await post.save();

    await post.populate('author', 'username firstName lastName avatar');
    await post.populate('category', 'name slug');

    logger.info(`Created new post: ${post.title}`, {
      postId: post._id,
      author: req.user.id,
    });

    res.status(201).json(post);
  } catch (error) {
    logger.error('Error creating post:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Post with this slug already exists' });
    }
    res.status(501).json({ error: 'Failed to create post' });
  }
});

// @route   PUT /api/posts/:id
// @desc    Update a post
// @access  Private
router.put('/:id', auth, validateObjectId, validatePostUpdate, handleValidationErrors, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user is the author
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ error: 'User not authorized to update this post' });
    }

    // Update fields
    Object.assign(post, req.body);

    // If status is changed to 'published', set the publishedAt date
    if (req.body.status === 'published' && !post.publishedAt) {
      post.publishedAt = new Date();
    }

    await post.save();

    await post.populate('author', 'username firstName lastName avatar');
    await post.populate('category', 'name slug');

    logger.info(`Updated post: ${post.title}`, {
      postId: post._id,
      author: req.user.id,
    });

    res.json(post);
  } catch (error) {
    logger.error('Error updating post:', error);
    res.status(501).json({ error: 'Failed to update post' });
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete('/:id', auth, validateObjectId, handleValidationErrors, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user is the author
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ error: 'User not authorized to delete this post' });
    }

    await post.remove();

    logger.info(`Deleted post: ${post.title}`, {
      postId: post._id,
      author: req.user.id,
    });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    logger.error('Error deleting post:', error);
    res.status(501).json({ error: 'Failed to delete post' });
  }
});

// @route   POST /api/posts/:id/like
// @desc    Like a post
// @access  Private
router.post('/:id/like', auth, validateObjectId, handleValidationErrors, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if already liked
    if (post.likes.some(like => like.user.toString() === req.user.id)) {
      return res.status(400).json({ error: 'Post already liked' });
    }

    post.likes.unshift({ user: req.user.id });
    await post.save();

    res.json(post.likes);
  } catch (error) {
    logger.error('Error liking post:', error);
    res.status(501).json({ error: 'Failed to like post' });
  }
});

// @route   POST /api/posts/:id/unlike
// @desc    Unlike a post
// @access  Private
router.post('/:id/unlike', auth, validateObjectId, handleValidationErrors, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if not liked yet
    if (!post.likes.some(like => like.user.toString() === req.user.id)) {
      return res.status(400).json({ error: 'Post has not been liked' });
    }

    // Remove the like
    post.likes = post.likes.filter(
      ({ user }) => user.toString() !== req.user.id
    );
    await post.save();

    res.json(post.likes);
  } catch (error) {
    logger.error('Error unliking post:', error);
    res.status(501).json({ error: 'Failed to unlike post' });
  }
});

// @route   POST /api/posts/:id/comments
// @desc    Add a comment to a post
// @access  Private
router.post(
  '/:id/comments',
  auth,
  validateObjectId,
  [
    body('content')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Comment must be between 1 and 1000 characters'),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      const newComment = {
        user: req.user.id,
        content: req.body.content,
      };

      post.comments.unshift(newComment);
      await post.save();

      await post.populate('comments.user', 'username firstName lastName avatar');

      res.status(201).json(post.comments);
    } catch (error) {
      logger.error('Error adding comment:', error);
      res.status(501).json({ error: 'Failed to add comment' });
    }
  }
);

// @route   DELETE /api/posts/:id/comments/:commentId
// @desc    Delete a comment
// @access  Private
router.delete(
  '/:id/comments/:commentId',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid post ID'),
    param('commentId').isMongoId().withMessage('Invalid comment ID'),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Find comment
      const comment = post.comments.id(req.params.commentId);

      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      // Check if user is the author of the comment or the post
      if (
        comment.user.toString() !== req.user.id &&
        post.author.toString() !== req.user.id
      ) {
        return res.status(403).json({ error: 'User not authorized' });
      }

      comment.remove();
      await post.save();

      res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
      logger.error('Error deleting comment:', error);
      res.status(501).json({ error: 'Failed to delete comment' });
    }
  }
);

module.exports = router;
