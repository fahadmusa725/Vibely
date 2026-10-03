const Story = require('../models/Story');
const User = require('../models/User');
const { uploadStream } = require('../config/cloudinary');

const STORY_TTL_HOURS = 24;

const groupStoriesByUser = (stories, currentUserId) => {
  const map = new Map();

  for (const story of stories) {
    const uid = story.user._id.toString();
    if (!map.has(uid)) {
      map.set(uid, {
        user: {
          _id: story.user._id,
          username: story.user.username,
          fullName: story.user.fullName,
          avatar: story.user.avatar,
          isVerified: story.user.isVerified,
        },
        stories: [],
        hasUnseenStories: false,
      });
    }
    const group = map.get(uid);
    const isSeen = story.viewers.some(
      (v) => v.user.toString() === currentUserId.toString()
    );
    group.stories.push({
      _id: story._id,
      mediaUrl: story.mediaUrl,
      mediaType: story.mediaType,
      createdAt: story.createdAt,
      expiresAt: story.expiresAt,
      viewersCount: story.viewers.length,
      isSeen,
    });
    if (!isSeen) group.hasUnseenStories = true;
  }

  return [...map.values()];
};

exports.createStory = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an image for your story.',
      });
    }

    const uploaded = await uploadStream(req.file.buffer, 'vibely_stories');

    const expiresAt = new Date(Date.now() + STORY_TTL_HOURS * 60 * 60 * 1000);

    const story = await Story.create({
      user: req.user._id,
      mediaUrl: uploaded.url,
      mediaType: 'image',
      expiresAt,
    });

    const populated = await Story.findById(story._id).populate(
      'user',
      'username fullName avatar isVerified'
    );

    return res.status(201).json({
      success: true,
      message: 'Story created successfully',
      data: populated,
    });
  } catch (error) {
    console.error('createStory error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating story',
    });
  }
};

exports.getStoryFeed = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const followingIds = currentUser.following.map((id) => id.toString());

    const authorIds = [req.user._id, ...currentUser.following];

    const stories = await Story.find({
      user: { $in: authorIds },
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .populate('user', 'username fullName avatar isVerified')
      .lean();

    const groups = groupStoriesByUser(stories, req.user._id);

    const myId = req.user._id.toString();
    groups.sort((a, b) => {
      const aIsMe = a.user._id.toString() === myId;
      const bIsMe = b.user._id.toString() === myId;
      if (aIsMe) return -1;
      if (bIsMe) return 1;
      return (
        new Date(b.stories[0].createdAt) - new Date(a.stories[0].createdAt)
      );
    });

    return res.status(200).json({
      success: true,
      data: groups,
    });
  } catch (error) {
    console.error('getStoryFeed error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error loading story feed',
    });
  }
};

exports.markViewed = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    const alreadySeen = story.viewers.some(
      (v) => v.user.toString() === req.user._id.toString()
    );
    if (!alreadySeen) {
      story.viewers.push({ user: req.user._id, viewedAt: new Date() });
      await story.save();
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('markViewed error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error marking story viewed',
    });
  }
};

exports.deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    if (story.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorised to delete this story',
      });
    }

    await story.deleteOne();

    return res.status(200).json({ success: true, message: 'Story deleted' });
  } catch (error) {
    console.error('deleteStory error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting story',
    });
  }
};
