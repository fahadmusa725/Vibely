const express = require('express');
const router = express.Router();
const {
  createStory,
  getStoryFeed,
  markViewed,
  deleteStory,
} = require('../controllers/storyController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/', protect, upload.single('image'), createStory);
router.get('/feed', protect, getStoryFeed);
router.post('/:id/view', protect, markViewed);
router.delete('/:id', protect, deleteStory);

module.exports = router;
