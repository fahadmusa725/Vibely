const Comment = require('../models/Comment');
const Post = require('../models/Post');

exports.addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text, parentComment } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required',
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    if (parentComment) {
      const parent = await Comment.findOne({ _id: parentComment, post: postId });
      if (!parent) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found on this post',
        });
      }
      if (parent.parentComment) {
        return res.status(400).json({
          success: false,
          message: 'Cannot reply to a reply: only top-level comments can be replied to',
        });
      }
    }

    const comment = await Comment.create({
      post: postId,
      author: req.user._id,
      text: text.trim(),
      parentComment: parentComment || null,
    });

    post.commentsCount = (post.commentsCount || 0) + 1;
    await post.save();

    const populatedComment = await Comment.findById(comment._id).populate(
      'author',
      'username fullName avatar isVerified'
    );

    return res.status(201).json({
      success: true,
      message: 'Comment added',
      data: populatedComment,
    });
  } catch (error) {
    console.error('addComment error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error adding comment',
    });
  }
};

exports.getComments = async (req, res) => {
  try {
    const { postId } = req.params;

    const allComments = await Comment.find({ post: postId })
      .sort({ isPinned: -1, createdAt: 1 })
      .populate('author', 'username fullName avatar isVerified');

    const pinned = allComments.filter((c) => c.isPinned && !c.parentComment);
    const topLevel = allComments.filter((c) => !c.isPinned && !c.parentComment);
    const replies = allComments.filter((c) => c.parentComment);

    const replyMap = {};
    replies.forEach((reply) => {
      const pid = reply.parentComment.toString();
      if (!replyMap[pid]) replyMap[pid] = [];
      replyMap[pid].push(reply);
    });

    const attachReplies = (comments) =>
      comments.map((c) => ({
        ...c.toObject(),
        replies: (replyMap[c._id.toString()] || []).map((r) => r.toObject()),
      }));

    const result = [...attachReplies(pinned), ...attachReplies(topLevel)];

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('getComments error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error retrieving comments',
    });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    const post = await Post.findById(comment.post);

    const isAuthor = comment.author.toString() === req.user._id.toString();
    const isPostOwner = post && post.author.toString() === req.user._id.toString();

    if (!isAuthor && !isPostOwner) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this comment',
      });
    }

    const replyCount = await Comment.countDocuments({ parentComment: comment._id });

    await Comment.deleteMany({ parentComment: comment._id });
    await Comment.findByIdAndDelete(comment._id);

    const totalDeleted = 1 + replyCount;
    if (post && post.commentsCount >= totalDeleted) {
      post.commentsCount -= totalDeleted;
      await post.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('deleteComment error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting comment',
    });
  }
};

exports.pinComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (comment.parentComment) {
      return res.status(400).json({
        success: false,
        message: 'Only top-level comments can be pinned',
      });
    }

    const post = await Post.findById(comment.post);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the post owner can pin comments',
      });
    }

    const willPin = !comment.isPinned;

    if (willPin) {
      await Comment.updateMany(
        { post: comment.post, isPinned: true },
        { $set: { isPinned: false } }
      );
    }

    comment.isPinned = willPin;
    await comment.save();

    return res.status(200).json({
      success: true,
      message: willPin ? 'Comment pinned' : 'Comment unpinned',
      data: comment,
    });
  } catch (error) {
    console.error('pinComment error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error pinning comment',
    });
  }
};
