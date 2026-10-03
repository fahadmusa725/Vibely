const express = require('express');
const router = express.Router();
const {
  addComment,
  getComments,
  deleteComment,
  pinComment,
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

router.post('/:postId', protect, addComment);
router.get('/:postId', getComments);
router.delete('/:id', protect, deleteComment);
router.patch('/:id/pin', protect, pinComment);

module.exports = router;
