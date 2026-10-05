const express = require('express');
const router = express.Router();
const {
  getNotifications,
  getUnreadCount,
  markAllRead,
  markRead,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.patch('/read-all', protect, markAllRead);
router.patch('/:id/read', protect, markRead);

module.exports = router;
