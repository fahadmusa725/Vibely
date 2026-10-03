const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Post = require('../models/Post');

const extractHashtags = (caption) => {
  if (!caption) return [];
  const matches = caption.match(/#(\w+)/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
};

const backfillHashtags = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vibely';
    console.log('Connecting to MongoDB for hashtag backfill...');
    await mongoose.connect(mongoUri);

    const posts = await Post.find({});
    console.log(`Found ${posts.length} posts to process.`);

    let updatedCount = 0;
    for (const post of posts) {
      const hashtags = extractHashtags(post.caption);
      post.hashtags = hashtags;
      await post.save();
      updatedCount++;
    }

    console.log(`Backfill complete. Updated ${updatedCount} posts.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error backfilling hashtags:', error);
    process.exit(1);
  }
};

backfillHashtags();
