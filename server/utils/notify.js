const Notification = require('../models/Notification');

const notify = async ({ recipient, sender, type, post, comment }) => {
  if (!recipient || !sender || recipient.toString() === sender.toString()) return;
  try {
    if (type === 'like' || type === 'follow') {
      await Notification.updateOne(
        { recipient, sender, type, post: post || null },
        { $set: { read: false } },
        { upsert: true }
      );
    } else {
      await Notification.create({ recipient, sender, type, post, comment });
    }
  } catch (error) {
    console.error('notify error:', error);
  }
};

const unnotify = async (filter) => {
  try {
    await Notification.deleteMany(filter);
  } catch (error) {
    console.error('unnotify error:', error);
  }
};

module.exports = { notify, unnotify };
