const express = require('express');
const Bug = require('../models/Bug');
const router = express.Router();

// Create a new bug
router.post('/', async (req, res, next) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required.' });
    }
    const bug = new Bug({ title, description });
    await bug.save();
    res.status(201).json(bug);
  } catch (err) {
    next(err);
  }
});

// Get all bugs
router.get('/', async (req, res, next) => {
  try {
    const bugs = await Bug.find();
    res.json(bugs);
  } catch (err) {
    next(err);
  }
});

// Update bug status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['open', 'in-progress', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }
    const bug = await Bug.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    );
    if (!bug) return res.status(404).json({ error: 'Bug not found.' });
    res.json(bug);
  } catch (err) {
    next(err);
  }
});

// Delete a bug
router.delete('/:id', async (req, res, next) => {
  try {
    const bug = await Bug.findByIdAndDelete(req.params.id);
    if (!bug) return res.status(404).json({ error: 'Bug not found.' });
    res.json({ message: 'Bug deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
