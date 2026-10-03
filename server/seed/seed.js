const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Story = require('../models/Story');

const seedRichData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vibely';
    console.log('Connecting to database for full seeding...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB!');

    const seedUsernames = [
      'sophia_arts', 'marcus_vance', 'elena_codes', 'kai_zen', 'chloe_dupont',
      'liam_sound', 'maya_botanicals', 'mateo_visuals', 'avery_minimal',
      'hannah_brew', 'zack_fit', 'nina_illustrations', 'david_urban',
      'olivia_wellness', 'carlos_culinary'
    ];

    const existingSeededUsers = await User.find({
      $or: [
        { isSeeded: true },
        { email: { $regex: /@vibely\.app$/ } },
        { username: { $in: seedUsernames } },
      ],
    });
    const seededUserIds = existingSeededUsers.map((u) => u._id);

    if (seededUserIds.length > 0) {
      await Post.deleteMany({ author: { $in: seededUserIds } });
      await Comment.deleteMany({ author: { $in: seededUserIds } });
      await Story.deleteMany({ user: { $in: seededUserIds } });
      await User.deleteMany({ _id: { $in: seededUserIds } });
    }
    console.log('Cleared previous seeded records.');

    const defaultPassword = 'password123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    const usersList = [
      {
        username: 'sophia_arts',
        fullName: 'Sophia Chen',
        email: 'sophia@vibely.app',
        password: hashedPassword,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
        coverPhoto: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1400&auto=format&fit=crop&q=80',
        bio: 'Senior Art Director & Generative Visualist 🎨 | Designing brand universes & typography | San Francisco, CA',
        website: 'https://sophiachen.design',
        location: 'San Francisco, CA',
        isVerified: true,
        isSeeded: true,
      },
      {
        username: 'marcus_vance',
        fullName: 'Marcus Vance',
        email: 'marcus@vibely.app',
        password: hashedPassword,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
        coverPhoto: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1400&auto=format&fit=crop&q=80',
        bio: 'Expedition & Golden Hour photographer 🏔️ | Sony Alpha Ambassador | Chasing untamed landscapes worldwide',
        website: 'https://marcusvance.photo',
        location: 'Vancouver, Canada',
        isVerified: true,
        isSeeded: true,
      },
      {
        username: 'elena_codes',
        fullName: 'Elena Rostova',
        email: 'elena@vibely.app',
        password: hashedPassword,
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
        coverPhoto: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1400&auto=format&fit=crop&q=80',
        bio: 'Indie Hacker & Frontend Architect ⚡️ | Building aesthetic tools with React & WebGL | Coffee purist ☕️',
        website: 'https://elenarostova.dev',
        location: 'Stockholm, Sweden',
        isVerified: true,
        isSeeded: true,
      },
      {
        username: 'kai_zen',
        fullName: 'Kai Tanaka',
        email: 'kai@vibely.app',
        password: hashedPassword,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
        coverPhoto: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1400&auto=format&fit=crop&q=80',
        bio: 'Architectural photographer & Wabi-Sabi curator ⛩️ | Exploring brutalism, light, and wooden joinery',
        website: 'https://kaizendesign.jp',
        location: 'Kyoto, Japan',
        isVerified: true,
        isSeeded: true,
      },
      {
        username: 'chloe_dupont',
        fullName: 'Chloé Dupont',
        email: 'chloe@vibely.app',
        password: hashedPassword,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80',
        coverPhoto: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1400&auto=format&fit=crop&q=80',
        bio: 'Editorial fashion stylist & ceramicist 🏺 | Minimalist silhouettes, neutral tones, and vintage couture',
        website: 'https://chloedupont.fr',
        location: 'Paris, France',
        isVerified: false,
        isSeeded: true,
      },
      {
        username: 'liam_sound',
        fullName: 'Liam Thorne',
        email: 'liam@vibely.app',
        password: hashedPassword,
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80',
        coverPhoto: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1400&auto=format&fit=crop&q=80',
        bio: 'Ambient music producer & modular synth addict 🎹 | Sonic landscapes for deep focus sessions 🎧',
        website: 'https://liamthorneaudio.com',
        location: 'Berlin, Germany',
        isVerified: true,
        isSeeded: true,
      },
      {
        username: 'maya_botanicals',
        fullName: 'Maya Patel',
        email: 'maya@vibely.app',
        password: hashedPassword,
        avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=80',
        coverPhoto: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1400&auto=format&fit=crop&q=80',
        bio: 'Landscape architect & rare plant collector 🌿 | Creating urban jungle micro-habitats in Brooklyn',
        website: 'https://mayabotanicals.co',
        location: 'Brooklyn, NY',
        isVerified: false,
        isSeeded: true,
      },
      {
        username: 'mateo_visuals',
        fullName: 'Mateo Morales',
        email: 'mateo@vibely.app',
        password: hashedPassword,
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=80',
        coverPhoto: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=1400&auto=format&fit=crop&q=80',
        bio: 'Cinematographer & 35mm film documentarian 🎞️ | Capturing nocturnal cityscapes and skate culture',
        website: 'https://mateomorales.film',
        location: 'Barcelona, Spain',
        isVerified: true,
        isSeeded: true,
      },
      {
        username: 'avery_minimal',
        fullName: 'Avery Sterling',
        email: 'avery@vibely.app',
        password: hashedPassword,
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80',
        coverPhoto: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1400&auto=format&fit=crop&q=80',
        bio: 'Industrial Designer @ Studio K | Exploring aluminum textures, ergonomic keyboards, and clean desks 📐',
        website: 'https://averysterling.design',
        location: 'Seattle, WA',
        isVerified: true,
        isSeeded: true,
      },
      {
        username: 'hannah_brew',
        fullName: 'Hannah Wright',
        email: 'hannah@vibely.app',
        password: hashedPassword,
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
        coverPhoto: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1400&auto=format&fit=crop&q=80',
        bio: 'Specialty coffee roaster & pastry recipe developer 🥐 | V60 extraction science & sourdough obsession',
        website: 'https://hannahbrew.com',
        location: 'Melbourne, Australia',
        isVerified: false,
        isSeeded: true,
      },
      {
        username: 'zack_fit',
        fullName: 'Zack Callahan',
        email: 'zack@vibely.app',
        password: hashedPassword,
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=500&auto=format&fit=crop&q=80',
        coverPhoto: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1400&auto=format&fit=crop&q=80',
        bio: 'Ultra-trail marathoner & endurance coach 🏃‍♂️ | 100-mile mountain finishes | Plant-based fuel 🌱',
        website: 'https://zackendurance.com',
        location: 'Boulder, CO',
        isVerified: true,
        isSeeded: true,
      },
      {
        username: 'nina_illustrations',
        fullName: 'Nina Johansson',
        email: 'nina@vibely.app',
        password: hashedPassword,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
        coverPhoto: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1400&auto=format&fit=crop&q=80',
        bio: 'Children book illustrator & watercolorist 📖🎨 | Nordic folklore & cozy animal portraits',
        website: 'https://ninajohansson.art',
        location: 'Oslo, Norway',
        isVerified: true,
        isSeeded: true,
      },
      {
        username: 'david_urban',
        fullName: 'David Kim',
        email: 'david@vibely.app',
        password: hashedPassword,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
        coverPhoto: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1400&auto=format&fit=crop&q=80',
        bio: 'Cyberpunk & neon street photographer 🌃 | Seoul nightwalks | Leica Q3 shooter 📸',
        website: 'https://davidkim.photo',
        location: 'Seoul, South Korea',
        isVerified: true,
        isSeeded: true,
      },
      {
        username: 'olivia_wellness',
        fullName: 'Olivia Bennett',
        email: 'olivia@vibely.app',
        password: hashedPassword,
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80',
        coverPhoto: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1400&auto=format&fit=crop&q=80',
        bio: 'Mindfulness practitioner & yoga guide 🧘‍♀️ | Breathwork retreats & holistic habit coaching',
        website: 'https://oliviabennett.co',
        location: 'Bali, Indonesia',
        isVerified: false,
        isSeeded: true,
      },
      {
        username: 'carlos_culinary',
        fullName: 'Carlos Mendes',
        email: 'carlos@vibely.app',
        password: hashedPassword,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
        coverPhoto: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1400&auto=format&fit=crop&q=80',
        bio: 'Head Chef @ Ocaso | Modern Iberian gastronomy & fermentation wizardry 🍷🥘',
        website: 'https://carlosmendeschef.com',
        location: 'Lisbon, Portugal',
        isVerified: true,
        isSeeded: true,
      },
    ];

    const usersListWithActive = usersList.map((u) => ({
      ...u,
      lastActive: new Date(Date.now() - Math.floor(Math.random() * 48 * 60 * 60 * 1000)),
    }));

    const users = await User.insertMany(usersListWithActive);
    console.log(`Created ${users.length} creators.`);

    for (let i = 0; i < users.length; i++) {
      const current = users[i];
      const followCount = 5 + (i % 5);
      for (let j = 0; j < followCount; j++) {
        const targetIndex = (i + j + 1) % users.length;
        const target = users[targetIndex];
        if (!current.following.includes(target._id)) {
          current.following.push(target._id);
        }
        if (!target.followers.includes(current._id)) {
          target.followers.push(current._id);
        }
      }
    }

    await Promise.all(users.map((u) => u.save()));
    console.log('Setup creator social follow networks.');

    const postsData = [
      {
        author: users[0]._id,
        caption: 'Exploring color resonance and glass distortions in our latest design studio cycle. There is something mesmerizing about how violet light refacts across geometric plexi. 🎨✨ #design #creative #visualart',
        images: [
          { url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1080&auto=format&fit=crop&q=80' },
          { url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1080&auto=format&fit=crop&q=80' }
        ],
        location: 'Design Studio 8, San Francisco',
        tags: ['design', 'creative', 'visualart'],
      },
      {
        author: users[1]._id,
        caption: 'First light over the glacier peaks of Moraine Lake. Setting the alarm for 4:00 AM in sub-zero alpine air is always tough, but when the horizon ignites into molten gold, nothing else matters. 🏔️✨ #photography #travel #alberta',
        images: [
          { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1080&auto=format&fit=crop&q=80' },
          { url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1080&auto=format&fit=crop&q=80' }
        ],
        location: 'Banff National Park, Canada',
        tags: ['photography', 'travel', 'alberta'],
      },
      {
        author: users[2]._id,
        caption: 'Sunday workstation setup. Testing the new dynamic theme switcher and glass card shadows in Vibely. Clean aesthetic, zero clutter, and strong pour-over coffee. 💻☕️ #design #minimal #desksetup',
        images: [
          { url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=1080&auto=format&fit=crop&q=80' }
        ],
        location: 'Södermalm, Stockholm',
        tags: ['design', 'minimal', 'desksetup'],
      },
      {
        author: users[3]._id,
        caption: 'Silent symmetry inside the historic tea houses of Arashiyama. The relationship between raw cedar timber and natural rainfall creates an unmatched calming rhythm. 🎋⛩️ #architecture #travel #kyoto',
        images: [
          { url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1080&auto=format&fit=crop&q=80' },
          { url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1080&auto=format&fit=crop&q=80' }
        ],
        location: 'Arashiyama, Kyoto',
        tags: ['architecture', 'travel', 'kyoto'],
      },
      {
        author: users[4]._id,
        caption: 'Warm afternoon light casting sharp architectural shadows on raw ceramic vessels. The beauty of restrained styling and raw tactile materials. 🏺🕯️ #design #architecture #ceramics',
        images: [
          { url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1080&auto=format&fit=crop&q=80' }
        ],
        location: 'Le Marais, Paris',
        tags: ['design', 'architecture', 'ceramics'],
      },
      {
        author: users[5]._id,
        caption: 'Analog oscillators warming up for the evening ambient session. Filtering square waves through tape saturation adds such an organic heartbeat to electronic sound. 🎹🔊 #music #creative #sounddesign',
        images: [
          { url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1080&auto=format&fit=crop&q=80' }
        ],
        location: 'Kreuzberg Studio, Berlin',
        tags: ['music', 'creative', 'sounddesign'],
      },
      {
        author: users[6]._id,
        caption: 'Morning mist in the greenhouse! The new Philodendron billietiae leaf unfurled with incredible orange petioles. Nature’s gradient game is undefeated. 🌿✨ #photography #wellness #urbanjungle',
        images: [
          { url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1080&auto=format&fit=crop&q=80' }
        ],
        location: 'Greenpoint, Brooklyn',
        tags: ['photography', 'wellness', 'urbanjungle'],
      },
      {
        author: users[7]._id,
        caption: 'Late night 35mm roll from the Gothic Quarter. The grain on CineStill 800T gives wet cobblestones and neon signs an unforgettable cinematic mood. 🎞️🌃 #photography #streetphotography #35mm',
        images: [
          { url: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=1080&auto=format&fit=crop&q=80' }
        ],
        location: 'Barri Gòtic, Barcelona',
        tags: ['photography', 'streetphotography', '35mm'],
      },
      {
        author: users[8]._id,
        caption: 'CNC milled anodized aluminum prototype complete! Testing 65% gasket mount acoustics with hand-lubed linear switches. The tactile response is crisp. ⌨️⚙️ #design #creative #industrialdesign',
        images: [
          { url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1080&auto=format&fit=crop&q=80' }
        ],
        location: 'Industrial District, Seattle',
        tags: ['design', 'creative', 'industrialdesign'],
      },
      {
        author: users[9]._id,
        caption: 'Naturally leavened pain au chocolat with 27 flaky butter layers. Fresh out of the deck oven at 6:30 AM! The honeycomb crumb structure turned out sublime. 🥐☕️ #food #wellness #pastry',
        images: [
          { url: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1080&auto=format&fit=crop&q=80' }
        ],
        location: 'Fitzroy, Melbourne',
        tags: ['food', 'wellness', 'pastry'],
      },
      {
        author: users[10]._id,
        caption: '24-mile ridge run above the cloud inversion line. Hard climbs, thin air, and miles of pure singletrack bliss. Grateful for body, mind, and wild trails. 🏔️🏃‍♂️ #travel #minimal #trailrunning',
        images: [
          { url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1080&auto=format&fit=crop&q=80' }
        ],
        location: 'Flatirons Ridge, Boulder',
        tags: ['travel', 'minimal', 'trailrunning'],
      },
      {
        author: users[11]._id,
        caption: 'Finished the cover illustration for "The Secret of the Northern Pine"! Blending gouache with liquid ink gives these mystical forest creatures their ethereal glow. 📖🎨 #design #minimal #illustration',
        images: [
          { url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1080&auto=format&fit=crop&q=80' }
        ],
        location: 'Grünerløkka, Oslo',
        tags: ['design', 'minimal', 'illustration'],
      },
      {
        author: users[12]._id,
        caption: 'Rain reflections and neon holograms in Gangnam at 2:00 AM. Shooting wide open on the 28mm Summilux turns city raindrops into pure bokeh jewels. 🌧️📸 #photography #streetphotography #seoul',
        images: [
          { url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1080&auto=format&fit=crop&q=80' }
        ],
        location: 'Gangnam, Seoul',
        tags: ['photography', 'streetphotography', 'seoul'],
      },
      {
        author: users[13]._id,
        caption: 'Sunrise meditation overlooking the misty jungle ravines of Ubud. Reminding myself today: peace is not the absence of chaos, but the calm center within it. 🧘‍♀️🌴 #travel #wellness #bali',
        images: [
          { url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1080&auto=format&fit=crop&q=80' }
        ],
        location: 'Ubud, Bali',
        tags: ['travel', 'wellness', 'bali'],
      },
      {
        author: users[14]._id,
        caption: 'Tonight’s signature amuse-bouche: Charcoal-grilled wild octopus with fermented smoked paprika emulsion and pickled sea fennel. Pure coastal Portuguese heritage. 🐙🍷 #food #photography #gastronomy',
        images: [
          { url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1080&auto=format&fit=crop&q=80' }
        ],
        location: 'Alfama, Lisbon',
        tags: ['food', 'photography', 'gastronomy'],
      },
      {
        author: users[0]._id,
        caption: 'Editorial spread design for ISSUE 04 of KINETIC Mag. Playing with asymmetrical grid layouts and heavy monospace typography. 📐🖤 #design #architecture #typography',
        images: [
          { url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1080&auto=format&fit=crop&q=80' }
        ],
        location: 'San Francisco, CA',
        tags: ['design', 'architecture', 'typography'],
      },
      {
        author: users[1]._id,
        caption: 'Pristine emerald waters of Emerald Lake in Yoho National Park. The glacial rock flour creates this unbelievable natural color palette. 🛶🌲 #travel #photography #canadianrockies',
        images: [
          { url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1080&auto=format&fit=crop&q=80' }
        ],
        location: 'Yoho National Park, Canada',
        tags: ['travel', 'photography', 'canadianrockies'],
      },
      {
        author: users[3]._id,
        caption: 'Geometrical precision of raw concrete stairs bathed in filtered skylight. Simple architecture speaks the loudest when materials are left untouched. 🏛️📐 #architecture #photography #brutalism',
        images: [
          { url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1080&auto=format&fit=crop&q=80' }
        ],
        location: 'Minato, Tokyo',
        tags: ['architecture', 'photography', 'brutalism'],
      }
    ];

    const extractHashtags = (caption) => {
      if (!caption) return [];
      const matches = caption.match(/#(\w+)/g);
      if (!matches) return [];
      return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
    };

    const createdPosts = [];
    for (const postItem of postsData) {
      const likersCount = Math.floor(Math.random() * 8) + 3;
      const shuffledUsers = [...users].sort(() => 0.5 - Math.random());
      const likes = shuffledUsers.slice(0, likersCount).map((u) => u._id);

      const post = await Post.create({
        ...postItem,
        hashtags: extractHashtags(postItem.caption),
        likes,
        commentsCount: 0,
      });
      createdPosts.push(post);
    }
    console.log(`Created ${createdPosts.length} rich posts with realistic like counts.`);

    const realisticComments = [
      'The lighting on this frame is simply sublime! Great color balance.',
      'Adding this to my moodboard immediately. What focal length did you shoot this on?',
      'Pure aesthetic perfection. The violet glow brings everything together so nicely.',
      'Incredible composition as always! Keep inspiring the community.',
      'The textures here are so tactile you can almost feel them through the screen.',
      'This vibe is unmatched. Wonderful craft!',
      'Stunning work! What gear was used for this?',
      'Absolutely love the calm mood in this series.'
    ];

    let totalComments = 0;
    for (const post of createdPosts) {
      const numComments = Math.floor(Math.random() * 3) + 2;
      for (let c = 0; c < numComments; c++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomText = realisticComments[Math.floor(Math.random() * realisticComments.length)];
        
        await Comment.create({
          post: post._id,
          author: randomUser._id,
          text: randomText,
        });
        totalComments++;
      }
      post.commentsCount = numComments;
      await post.save();
    }

    console.log(`Created ${totalComments} natural comments across posts.`);

    const storyData = [
      {
        username: 'sophia_arts',
        stories: [
          { url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&auto=format&fit=crop&q=80', hoursAgo: 2 },
          { url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1080&auto=format&fit=crop&q=80', hoursAgo: 8 },
        ],
      },
      {
        username: 'marcus_vance',
        stories: [
          { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1080&auto=format&fit=crop&q=80', hoursAgo: 1 },
        ],
      },
      {
        username: 'elena_codes',
        stories: [
          { url: 'https://images.unsplash.com/photo-1555099962-4199c345e5dd?w=1080&auto=format&fit=crop&q=80', hoursAgo: 5 },
          { url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1080&auto=format&fit=crop&q=80', hoursAgo: 19 },
        ],
      },
      {
        username: 'kai_zen',
        stories: [
          { url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1080&auto=format&fit=crop&q=80', hoursAgo: 3 },
        ],
      },
      {
        username: 'maya_botanicals',
        stories: [
          { url: 'https://images.unsplash.com/photo-1466027397211-20d0f2449a3d?w=1080&auto=format&fit=crop&q=80', hoursAgo: 6 },
          { url: 'https://images.unsplash.com/photo-1490750967868-88df5691cc33?w=1080&auto=format&fit=crop&q=80', hoursAgo: 14 },
        ],
      },
      {
        username: 'mateo_visuals',
        stories: [
          { url: 'https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=1080&auto=format&fit=crop&q=80', hoursAgo: 4 },
        ],
      },
      {
        username: 'liam_sound',
        stories: [
          { url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1080&auto=format&fit=crop&q=80', hoursAgo: 9 },
        ],
      },
      {
        username: 'chloe_dupont',
        stories: [
          { url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1080&auto=format&fit=crop&q=80', hoursAgo: 11 },
          { url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1080&auto=format&fit=crop&q=80', hoursAgo: 20 },
        ],
      },
    ];

    let storyCount = 0;
    const now = new Date();
    const STORY_TTL_MS = 24 * 60 * 60 * 1000;

    for (const { username, stories } of storyData) {
      const storyUser = users.find((u) => u.username === username);
      if (!storyUser) continue;

      for (const { url, hoursAgo } of stories) {
        const createdAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
        const expiresAt = new Date(createdAt.getTime() + STORY_TTL_MS);
        await Story.create({
          user: storyUser._id,
          mediaUrl: url,
          mediaType: 'image',
          createdAt,
          expiresAt,
          viewers: [],
        });
        storyCount++;
      }
    }

    console.log(`Created ${storyCount} stories across 8 users.`);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const topTrending = await Post.aggregate([
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
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          tag: '$_id',
          count: 1,
        },
      },
    ]);

    console.log('\n=========================================');
    console.log('DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('Top 5 Trending Tags:');
    topTrending.forEach((item, index) => {
      console.log(` ${index + 1}. #${item.tag}: ${item.count} ${item.count === 1 ? 'post' : 'posts'}`);
    });
    console.log('Sample Accounts (Password: password123):');
    console.log(' - sophia_arts / sophia@vibely.app');
    console.log(' - marcus_vance / marcus@vibely.app');
    console.log(' - elena_codes / elena@vibely.app');
    console.log(' - kai_zen / kai@vibely.app');
    console.log('=========================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedRichData();
