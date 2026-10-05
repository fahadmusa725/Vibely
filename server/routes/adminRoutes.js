const express = require('express');
const router = express.Router();
const {
  getStats,
  getRecentPosts,
  listUsers,
  toggleVerify,
  deleteUser,
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

router.use(protect, adminOnly);

router.get('/stats', getStats);
router.get('/posts/recent', getRecentPosts);
router.get('/users', listUsers);
router.patch('/users/:id/verify', toggleVerify);
router.delete('/users/:id', deleteUser);

module.exports = router;
