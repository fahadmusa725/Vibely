export const getAvatarUrl = (avatar, name) =>
  avatar ||
  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'user')}&backgroundColor=6c5ce7&textColor=ffffff`;
