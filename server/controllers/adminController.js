const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Story = require('../models/Story');
const Notification = require('../models/Notification');
const { getTrendingTagList } = require('../utils/trending');
const escapeRegex = require('../utils/escapeRegex');

const DAYS = 7;

const lastDays = () => {
  const days = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (let i = DAYS - 1; i >= 0; i -= 1) {
    const day = new Date(today);
    day.setUTCDate(today.getUTCDate() - i);
    days.push(day.toISOString().slice(0, 10));
  }

  return days;
};

const countPerDay = async (model) => {
  const days = lastDays();
  const start = new Date(`${days[0]}T00:00:00.000Z`);

  const rows = await model.aggregate([
    { $match: { createdAt: { $gte: start } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
  ]);

  const counts = new Map(rows.map((row) => [row._id, row.count]));
  return days.map((date) => ({ date, count: counts.get(date) || 0 }));
};

const deleteUserCascade = async (userId) => {
  const userPosts = await Post.find({ author: userId }).select('_id').lean();
  const postIds = userPosts.map((post) => post._id);

  const userComments = await Comment.find({ author: userId }).select('_id post').lean();
  const userCommentIds = userComments.map((comment) => comment._id);
  const replies = await Comment.find({ parentComment: { $in: userCommentIds } })
    .select('_id post')
    .lean();

  const doomedComments = [...userComments, ...replies];
  const doomedCommentIds = doomedComments.map((comment) => comment._id);
  const affectedPostIds = [...new Set(doomedComments.map((comment) => comment.post.toString()))];

  await Comment.deleteMany({
    $or: [{ post: { $in: postIds } }, { _id: { $in: doomedCommentIds } }],
  });

  const remainingPostIds = affectedPostIds.filter(
    (postId) => !postIds.some((id) => id.toString() === postId)
  );
  for (const postId of remainingPostIds) {
    const count = await Comment.countDocuments({ post: postId });
    await Post.updateOne({ _id: postId }, { $set: { commentsCount: count } });
  }

  await Post.deleteMany({ author: userId });
  await Post.updateMany({ likes: userId }, { $pull: { likes: userId } });
  await Comment.updateMany({ likes: userId }, { $pull: { likes: userId } });

  await Story.deleteMany({ user: userId });
  await Story.updateMany({ 'viewers.user': userId }, { $pull: { viewers: { user: userId } } });

  await Notification.deleteMany({
    $or: [{ recipient: userId }, { sender: userId }, { post: { $in: postIds } }],
  });

  await User.updateMany({ following: userId }, { $pull: { following: userId } });
  await User.updateMany({ followers: userId }, { $pull: { followers: userId } });
  await User.updateMany(
    { savedPosts: { $in: postIds } },
    { $pull: { savedPosts: { $in: postIds } } }
  );

  await User.deleteOne({ _id: userId });
};

exports.getStats = async (req, res) => {
  try {
    const [users, posts, comments, stories, newUsersByDay, newPostsByDay, trendingTags, topFollowed] =
      await Promise.all([
        User.countDocuments({}),
        Post.countDocuments({}),
        Comment.countDocuments({}),
        Story.countDocuments({}),
        countPerDay(User),
        countPerDay(Post),
        getTrendingTagList(5),
        User.aggregate([
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
              isVerified: 1,
              followersCount: { $size: { $ifNull: ['$followers', []] } },
            },
          },
          { $sort: { followersCount: -1, createdAt: -1 } },
          { $limit: 5 },
        ]),
      ]);

    return res.status(200).json({
      success: true,
      data: {
        totals: { users, posts, comments, stories },
        newUsersByDay,
        newPostsByDay,
        trendingTags,
        topFollowed,
      },
    });
  } catch (error) {
    console.error('admin getStats error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error loading dashboard stats',
    });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const q = (req.query.q || '').trim();

    const filter = {};
    if (q) {
      const pattern = new RegExp(escapeRegex(q), 'i');
      filter.$or = [{ username: pattern }, { email: pattern }];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('username email avatar createdAt role isVerified followers')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const ids = users.map((user) => user._id);
    const postCounts = await Post.aggregate([
      { $match: { author: { $in: ids } } },
      { $group: { _id: '$author', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(postCounts.map((row) => [row._id.toString(), row.count]));

    return res.status(200).json({
      success: true,
      data: users.map((user) => ({
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
        role: user.role,
        isVerified: user.isVerified,
        followersCount: (user.followers || []).length,
        postsCount: countMap.get(user._id.toString()) || 0,
      })),
      pagination: {
        page,
        limit,
        total,
        hasMore: total > (page - 1) * limit + users.length,
      },
    });
  } catch (error) {
    console.error('admin listUsers error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error loading users',
    });
  }
};

exports.toggleVerify = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('isVerified');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const nextValue = !user.isVerified;
    await User.updateOne({ _id: user._id }, { $set: { isVerified: nextValue } });

    return res.status(200).json({
      success: true,
      data: { _id: user._id, isVerified: nextValue },
    });
  } catch (error) {
    console.error('admin toggleVerify error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating verification',
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('role');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'The admin account cannot be deleted',
      });
    }

    await deleteUserCascade(user._id);

    return res.status(200).json({
      success: true,
      message: 'User account deleted',
    });
  } catch (error) {
    console.error('admin deleteUser error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting user',
    });
  }
};
