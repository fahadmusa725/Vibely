const Notification = require('../models/Notification');

const TYPE_FILTERS = {
  likes: { type: 'like' },
  comments: { type: { $in: ['comment', 'reply'] } },
  follows: { type: 'follow' },
};

exports.getNotifications = async (req, res) => {
  try {
    const { type = 'all' } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);

    const filter = { recipient: req.user._id, ...(TYPE_FILTERS[type] || {}) };

    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'username fullName avatar isVerified')
      .populate('post', 'images')
      .populate('comment', 'text')
      .lean();

    const followingIds = new Set((req.user.following || []).map((id) => id.toString()));
    const data = notifications.map((n) =>
      n.type === 'follow'
        ? { ...n, isFollowingSender: !!n.sender && followingIds.has(n.sender._id.toString()) }
        : n
    );

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        hasMore: total > (page - 1) * limit + notifications.length,
      },
      unreadCount,
    });
  } catch (error) {
    console.error('getNotifications error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error loading notifications',
    });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    return res.status(200).json({ success: true, count });
  } catch (error) {
    console.error('getUnreadCount error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error loading unread count',
    });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { $set: { read: true } }
    );

    return res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('markAllRead error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error marking notifications read',
    });
  }
};

exports.markRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { $set: { read: true } }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('markRead error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error marking notification read',
    });
  }
};
