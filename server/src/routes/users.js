const express = require('express');
const router = express.Router();

// @route   GET /api/users
// @desc    Get all users
// @access  Public
router.get('/', (req, res) => {
  res.status(501).json({ error: 'Users endpoint not implemented yet' });
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Public
router.get('/:id', (req, res) => {
  res.status(501).json({ error: 'User by ID endpoint not implemented yet' });
});

module.exports = router;
