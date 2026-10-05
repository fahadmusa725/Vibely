const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateProfile,
  updateUserMedia,
  toggleFollow,
  getFollowers,
  getFollowing,
  searchUsers,
  getSuggestedUsers,
  getSavedPosts,
  getContacts,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const upload = require('../middleware/upload');

router.get('/me/saved', protect, getSavedPosts);
router.get('/me/contacts', protect, getContacts);
router.get('/search', optionalAuth, searchUsers);
router.get('/suggested', optionalAuth, getSuggestedUsers);
router.put('/profile', protect, updateProfile);
router.put('/media', protect, upload.single('image'), updateUserMedia);
router.post('/:id/follow', protect, toggleFollow);
router.get('/:id/followers', optionalAuth, getFollowers);
router.get('/:id/following', optionalAuth, getFollowing);
router.get('/:username', optionalAuth, getUserProfile);

module.exports = router;
