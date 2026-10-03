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
const upload = require('../middleware/upload');

const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return protect(req, res, next);
  }
  next();
};

router.get('/me/saved', protect, getSavedPosts);
router.get('/me/contacts', protect, getContacts);
router.get('/search', searchUsers);
router.get('/suggested', optionalAuth, getSuggestedUsers);
router.put('/profile', protect, updateProfile);
router.put('/media', protect, upload.single('image'), updateUserMedia);
router.post('/:id/follow', protect, toggleFollow);
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowing);
router.get('/:username', optionalAuth, getUserProfile);

module.exports = router;
