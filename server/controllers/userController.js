const User = require('../models/User');
const Post = require('../models/Post');
const { uploadStream } = require('../config/cloudinary');
const { notify, unnotify } = require('../utils/notify');

exports.getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User @${username} not found`,
      });
    }

    const currentUserId = req.user ? req.user._id.toString() : null;
    const savedPostIds = req.user ? (req.user.savedPosts || []).map((id) => id.toString()) : [];
    const posts = (
      await Post.find({ author: user._id })
        .sort({ createdAt: -1 })
        .populate('author', 'username fullName avatar isVerified')
        .lean()
    ).map((post) => ({
      ...post,
      isLiked: currentUserId
        ? post.likes.some((likeId) => likeId.toString() === currentUserId)
        : false,
      isSaved: savedPostIds.includes(post._id.toString()),
      likesCount: post.likes ? post.likes.length : 0,
    }));

    let isFollowing = false;
    if (req.user) {
      isFollowing = user.followers.some(
        (followerId) => followerId.toString() === req.user._id.toString()
      );
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          username: user.username,
          fullName: user.fullName,
          email: req.user && req.user._id.toString() === user._id.toString() ? user.email : undefined,
          avatar: user.avatar,
          coverPhoto: user.coverPhoto,
          bio: user.bio,
          website: user.website,
          location: user.location,
          isVerified: user.isVerified,
          followersCount: user.followers.length,
          followingCount: user.following.length,
          postsCount: posts.length,
          createdAt: user.createdAt,
          isFollowing,
        },
        posts,
      },
    });
  } catch (error) {
    console.error('getUserProfile error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching user profile',
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { fullName, bio, website, location } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (fullName !== undefined) user.fullName = fullName.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (website !== undefined) user.website = website.trim();
    if (location !== undefined) user.location = location.trim();

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    console.error('updateProfile error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating profile',
    });
  }
};

exports.updateUserMedia = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { type } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded',
      });
    }

    const uploadResult = await uploadStream(req.file.buffer, 'vibely_profiles');

    if (type === 'coverPhoto') {
      user.coverPhoto = uploadResult.url;
    } else {
      user.avatar = uploadResult.url;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: `${type === 'coverPhoto' ? 'Cover photo' : 'Avatar'} updated successfully`,
      data: {
        avatar: user.avatar,
        coverPhoto: user.coverPhoto,
      },
    });
  } catch (error) {
    console.error('updateUserMedia error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating media',
    });
  }
};

exports.toggleFollow = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId.toString() === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself',
      });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== targetUserId.toString()
      );
      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== currentUserId.toString()
      );
    } else {
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
    }

    await currentUser.save();
    await targetUser.save();

    if (isFollowing) {
      await unnotify({ recipient: targetUser._id, sender: currentUserId, type: 'follow' });
    } else {
      await notify({ recipient: targetUser._id, sender: currentUserId, type: 'follow' });
    }

    return res.status(200).json({
      success: true,
      isFollowing: !isFollowing,
      followersCount: targetUser.followers.length,
      followingCount: currentUser.following.length,
      message: !isFollowing
        ? `You are now following @${targetUser.username}`
        : `Unfollowed @${targetUser.username}`,
    });
  } catch (error) {
    console.error('toggleFollow error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error following/unfollowing user',
    });
  }
};

exports.getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      'followers',
      'username fullName avatar bio isVerified'
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const myFollowing = req.user ? req.user.following.map((id) => id.toString()) : [];

    return res.status(200).json({
      success: true,
      data: user.followers.filter(Boolean).map((follower) => ({
        ...follower.toObject(),
        isFollowing: myFollowing.includes(follower._id.toString()),
      })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error retrieving followers',
    });
  }
};

exports.getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      'following',
      'username fullName avatar bio isVerified'
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const myFollowing = req.user ? req.user.following.map((id) => id.toString()) : [];

    return res.status(200).json({
      success: true,
      data: user.following.filter(Boolean).map((followed) => ({
        ...followed.toObject(),
        isFollowing: myFollowing.includes(followed._id.toString()),
      })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error retrieving following list',
    });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(200).json({ success: true, data: [] });
    }

    const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    const users = await User.find({
      $or: [{ username: regex }, { fullName: regex }],
    })
      .select('username fullName avatar bio isVerified')
      .limit(20)
      .lean();

    const myFollowing = req.user ? req.user.following.map((id) => id.toString()) : [];

    return res.status(200).json({
      success: true,
      data: users.map((u) => ({
        ...u,
        isFollowing: myFollowing.includes(u._id.toString()),
      })),
    });
  } catch (error) {
    console.error('searchUsers error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error searching users',
    });
  }
};

exports.getSuggestedUsers = async (req, res) => {
  try {
    let excludeIds = [];
    let followingIdsSet = new Set();
    if (req.user) {
      const currentUser = await User.findById(req.user._id);
      if (currentUser) {
        excludeIds = [...(currentUser.following || []), currentUser._id];
        followingIdsSet = new Set(
          (currentUser.following || []).map((id) => id.toString())
        );
      }
    }

    const suggested = await User.aggregate([
      { $match: { _id: { $nin: excludeIds } } },
      {
        $addFields: {
          followersCount: { $size: { $ifNull: ['$followers', []] } },
        },
      },
      { $sort: { followersCount: -1, createdAt: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 1,
          username: 1,
          fullName: 1,
          avatar: 1,
          bio: 1,
          isVerified: 1,
          followers: 1,
          followersCount: 1,
        },
      },
    ]);

    const formattedSuggested = suggested.map((u) => {
      const candidateFollowers = (u.followers || []).map((id) => id.toString());
      const mutualCount = candidateFollowers.filter((id) =>
        followingIdsSet.has(id)
      ).length;
      return {
        ...u,
        mutualCount,
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedSuggested,
    });
  } catch (error) {
    console.error('getSuggestedUsers error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error getting suggestions',
    });
  }
};

exports.getContacts = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id).populate({
      path: 'following',
      select: 'fullName username avatar lastActive',
      options: { sort: { lastActive: -1 }, limit: 8 },
    });

    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const contacts = (currentUser.following || []).map((u) => ({
      _id: u._id,
      name: u.fullName,
      username: u.username,
      avatarUrl: u.avatar,
      lastActive: u.lastActive || u.updatedAt || new Date(0),
    }));

    return res.status(200).json({
      success: true,
      data: contacts,
    });
  } catch (error) {
    console.error('getContacts error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error retrieving contacts',
    });
  }
};

exports.getSavedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedPosts',
      options: { sort: { createdAt: -1 } },
      populate: {
        path: 'author',
        select: 'username fullName avatar isVerified',
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const savedPosts = (user.savedPosts || []).filter(Boolean);

    const formattedPosts = savedPosts.map((post) => {
      const postObj = post.toObject ? post.toObject() : post;
      return {
        ...postObj,
        isLiked: postObj.likes
          ? postObj.likes.some(
              (likeId) => likeId.toString() === req.user._id.toString()
            )
          : false,
        isSaved: true,
        likesCount: postObj.likes ? postObj.likes.length : 0,
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedPosts,
    });
  } catch (error) {
    console.error('getSavedPosts error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching saved posts',
    });
  }
};
