const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const { uploadStream } = require('../config/cloudinary');

const extractHashtags = (caption) => {
  if (!caption) return [];
  const matches = caption.match(/#(\w+)/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
};

exports.createPost = async (req, res) => {
  try {
    const { caption, location, tags } = req.body;
    const authorId = req.user._id;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one image for your post',
      });
    }

    const uploadPromises = req.files.map((file) =>
      uploadStream(file.buffer, 'vibely_posts')
    );
    const uploadedImages = await Promise.all(uploadPromises);

    const images = uploadedImages.map((img) => ({
      url: img.url,
      public_id: img.public_id,
    }));

    let parsedTags = [];
    if (tags) {
      if (Array.isArray(tags)) {
        parsedTags = tags;
      } else if (typeof tags === 'string') {
        parsedTags = tags.split(',').map((t) => t.trim().replace(/^#/, ''));
      }
    }

    const hashtags = extractHashtags(caption);

    const post = await Post.create({
      author: authorId,
      caption: caption || '',
      images,
      location: location || '',
      tags: parsedTags,
      hashtags,
    });

    const populatedPost = await Post.findById(post._id).populate(
      'author',
      'username fullName avatar isVerified'
    );

    return res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: populatedPost,
    });
  } catch (error) {
    console.error('createPost error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating post',
    });
  }
};

exports.getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const currentUser = await User.findById(req.user._id);
    const feedAuthors = [...currentUser.following, currentUser._id];

    const totalPosts = await Post.countDocuments({
      author: { $in: feedAuthors },
    });

    let posts = await Post.find({
      author: { $in: feedAuthors },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username fullName avatar isVerified')
      .lean();


    if (posts.length === 0 && page === 1) {
      posts = await Post.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('author', 'username fullName avatar isVerified')
        .lean();
    }

    const savedPostIds = (currentUser.savedPosts || []).map((id) => id.toString());

    const postsWithLikes = posts.map((post) => ({
      ...post,
      isLiked: post.likes.some(
        (likeId) => likeId.toString() === req.user._id.toString()
      ),
      isSaved: savedPostIds.includes(post._id.toString()),
      likesCount: post.likes.length,
    }));

    return res.status(200).json({
      success: true,
      data: postsWithLikes,
      pagination: {
        page,
        limit,
        total: totalPosts,
        hasMore: totalPosts > skip + posts.length,
      },
    });
  } catch (error) {
    console.error('getFeed error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error loading feed',
    });
  }
};

exports.getDiscover = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 18;
    const skip = (page - 1) * limit;
    const { tag } = req.query;

    const filter = {};
    if (tag && tag.trim()) {
      filter.hashtags = tag.trim().toLowerCase().replace(/^#/, '');
    }

    const totalPosts = await Post.countDocuments(filter);
    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username fullName avatar isVerified')
      .lean();

    let savedPostIds = [];
    const currentUserId = req.user ? req.user._id.toString() : null;
    if (req.user) {
      const user = await User.findById(req.user._id).select('savedPosts');
      if (user && user.savedPosts) {
        savedPostIds = user.savedPosts.map((id) => id.toString());
      }
    }

    const formattedPosts = posts.map((post) => ({
      ...post,
      isLiked: currentUserId
        ? post.likes.some((likeId) => likeId.toString() === currentUserId)
        : false,
      isSaved: currentUserId ? savedPostIds.includes(post._id.toString()) : false,
      likesCount: post.likes ? post.likes.length : 0,
    }));

    return res.status(200).json({
      success: true,
      data: formattedPosts,
      pagination: {
        page,
        limit,
        total: totalPosts,
        hasMore: totalPosts > skip + posts.length,
      },
    });
  } catch (error) {
    console.error('getDiscover error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching explore posts',
    });
  }
};

exports.getTrendingTags = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 5;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const trending = await Post.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $unwind: '$hashtags' },
      {
        $group: {
          _id: '$hashtags',
          count: { $sum: 1 },
          latestPostDate: { $max: '$createdAt' },
        },
      },
      { $sort: { count: -1, latestPostDate: -1, _id: 1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          tag: '$_id',
          count: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: trending,
    });
  } catch (error) {
    console.error('getTrendingTags error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching trending tags',
    });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      'author',
      'username fullName avatar isVerified'
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const comments = await Comment.find({ post: post._id })
      .sort({ createdAt: 1 })
      .populate('author', 'username fullName avatar isVerified');

    const currentUserId = req.user ? req.user._id.toString() : null;
    const isLiked = currentUserId
      ? post.likes.some((likeId) => likeId.toString() === currentUserId)
      : false;

    return res.status(200).json({
      success: true,
      data: {
        ...post.toObject(),
        isLiked,
        likesCount: post.likes.length,
        comments,
      },
    });
  } catch (error) {
    console.error('getPostById error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching post',
    });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const currentUserId = req.user._id;
    const isLiked = post.likes.some(
      (likeId) => likeId.toString() === currentUserId.toString()
    );

    if (isLiked) {
      post.likes = post.likes.filter(
        (id) => id.toString() !== currentUserId.toString()
      );
    } else {
      post.likes.push(currentUserId);
    }

    await post.save();

    return res.status(200).json({
      success: true,
      isLiked: !isLiked,
      likesCount: post.likes.length,
    });
  } catch (error) {
    console.error('toggleLike error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error liking post',
    });
  }
};

exports.toggleSave = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isSaved = user.savedPosts.some(
      (savedId) => savedId.toString() === post._id.toString()
    );

    if (isSaved) {
      user.savedPosts = user.savedPosts.filter(
        (id) => id.toString() !== post._id.toString()
      );
    } else {
      user.savedPosts.push(post._id);
    }

    await user.save();

    return res.status(200).json({
      success: true,
      isSaved: !isSaved,
      message: !isSaved ? 'Post saved' : 'Post unsaved',
    });
  } catch (error) {
    console.error('toggleSave error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error saving post',
    });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this post',
      });
    }

    await Comment.deleteMany({ post: post._id });
    await Post.findByIdAndDelete(post._id);

    return res.status(200).json({
      success: true,
      message: 'Post and comments deleted successfully',
    });
  } catch (error) {
    console.error('deletePost error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting post',
    });
  }
};

exports.editPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this post',
      });
    }

    const { caption, location, tags } = req.body;

    if (caption !== undefined) {
      post.caption = caption;
      post.hashtags = extractHashtags(caption);
    }
    if (location !== undefined) post.location = location;
    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        post.tags = tags;
      } else if (typeof tags === 'string') {
        post.tags = tags.split(',').map((t) => t.trim().replace(/^#/, ''));
      }
    }

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        uploadStream(file.buffer, 'vibely_posts')
      );
      const uploadedImages = await Promise.all(uploadPromises);
      post.images = uploadedImages.map((img) => ({
        url: img.url,
        public_id: img.public_id,
      }));
    }

    await post.save();

    const updatedPost = await Post.findById(post._id).populate(
      'author',
      'username fullName avatar isVerified'
    );

    return res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      data: updatedPost,
    });
  } catch (error) {
    console.error('editPost error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error editing post',
    });
  }
};
