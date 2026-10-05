const express = require('express');
const router = express.Router();
const {
  createPost,
  getFeed,
  getDiscover,
  getTrendingTags,
  getPostById,
  toggleLike,
  toggleSave,
  deletePost,
  editPost,
} = require('../controllers/postController');
const { protect } = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const upload = require('../middleware/upload');

router.post('/', protect, upload.array('images', 10), createPost);
router.get('/feed', protect, getFeed);
router.get('/discover', optionalAuth, getDiscover);
router.get('/trending-tags', getTrendingTags);
router.get('/:id', optionalAuth, getPostById);
router.post('/:id/like', protect, toggleLike);
router.post('/:id/save', protect, toggleSave);
router.delete('/:id', protect, deletePost);
router.patch('/:id', protect, upload.array('images', 10), editPost);

module.exports = router;
