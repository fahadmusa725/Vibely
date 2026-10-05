const Post = require('../models/Post');

const getTrendingTagList = (limit = 5) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  return Post.aggregate([
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
};

module.exports = { getTrendingTagList };
