const User = require('../models/User');

const MIN_PASSWORD_LENGTH = 6;

const deriveUsername = async (email) => {
  const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 24) || 'admin';
  const padded = base.length < 3 ? `${base}_admin` : base;

  let username = padded;
  while (await User.exists({ username })) {
    username = `${padded}_${Math.floor(1000 + Math.random() * 9000)}`;
  }

  return username;
};

const ensureAdmin = async () => {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';

  if (!email || !password) {
    console.log('Admin account skipped: ADMIN_EMAIL or ADMIN_PASSWORD is not set');
    return;
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`Admin account skipped: ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters`);
    return;
  }

  try {
    const existing = await User.findOne({ email }).select('_id role');

    if (existing) {
      if (existing.role !== 'admin') {
        await User.updateOne({ _id: existing._id }, { $set: { role: 'admin' } });
        console.log('Admin role granted to the ADMIN_EMAIL account');
      }
      return;
    }

    await User.create({
      username: await deriveUsername(email),
      fullName: 'Vibely Admin',
      email,
      password,
      role: 'admin',
    });
    console.log('Admin account created from ADMIN_EMAIL');
  } catch (error) {
    console.error('ensureAdmin failed:', error.name);
  }
};

module.exports = ensureAdmin;
