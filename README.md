# Vibely

Vibely is a minimal, Instagram-style social media app built with the MERN stack. Users can post multi-image updates, follow creators, like and comment, save posts, share 24-hour stories, and discover new people.

## Features

- Authentication with JWT and bcrypt password hashing, plus forgot and reset password
- Profiles with avatar, cover photo, bio, location, website, and followers/following lists
- Multi-image posts with captions, hashtags, and edit/delete
- Feed from followed users, an explore grid, trending tags, and saved posts
- Likes, threaded comments with pinning, and a post detail view
- 24-hour stories with a viewer
- Live user search and suggested creators
- Light and dark theme, responsive layout with mobile navigation

## Tech Stack

- **Frontend:** React 18, Vite, React Router, Axios, Lucide icons, plain CSS
- **Backend:** Node.js, Express, MongoDB, Mongoose, Multer, Cloudinary, JSON Web Tokens, bcryptjs

## Local Setup

The project has two folders, `server/` and `client/`. Run each in its own terminal.

**1. Backend**

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

Set the values in `server/.env`:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

The server exits on startup if `JWT_SECRET` is not set.

**2. Frontend**

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Set the values in `client/.env` as needed. In development, Vite proxies `/api` to `http://localhost:5000`. `VITE_API_URL` is only needed for a deployed backend. The `VITE_EMAILJS_*` values enable the forgot-password email.

The app runs at `http://localhost:5173`, and the API at `http://localhost:5000/api`.

## Seed Demo Data

With MongoDB running and `server/.env` configured:

```bash
cd server
npm run seed
```

This replaces previously seeded records and creates 15 creators with posts, comments, stories, and follows. The seed script prints these sample accounts, all with the password `password123`:

| Username | Email |
| --- | --- |
| `sophia_arts` | `sophia@vibely.app` |
| `marcus_vance` | `marcus@vibely.app` |
| `elena_codes` | `elena@vibely.app` |
| `kai_zen` | `kai@vibely.app` |

## API Endpoints

All routes are prefixed with `/api`. Endpoints marked `(auth)` require an `Authorization: Bearer <token>` header.

**Auth** (`/api/auth`)

- `POST /register`: Create an account
- `POST /login`: Log in and receive a JWT
- `GET /me`: Current user (auth)
- `POST /forgot-password`: Request a password reset
- `POST /reset-password/:token`: Set a new password

**Users** (`/api/users`)

- `GET /search?q=query`: Search users
- `GET /suggested`: Suggested creators
- `GET /me/saved`: Saved posts (auth)
- `GET /me/contacts`: Contacts list (auth)
- `GET /:username`: Profile and posts
- `PUT /profile`: Update profile (auth)
- `PUT /media`: Upload avatar or cover photo (auth)
- `POST /:id/follow`: Follow or unfollow (auth)
- `GET /:id/followers`: Followers list
- `GET /:id/following`: Following list

**Posts** (`/api/posts`)

- `POST /`: Create a post with up to 10 images (auth)
- `GET /feed`: Posts from followed users (auth)
- `GET /discover`: Explore grid
- `GET /trending-tags`: Trending hashtags
- `GET /:id`: Post details with comments
- `PATCH /:id`: Edit a post (auth)
- `DELETE /:id`: Delete a post (auth)
- `POST /:id/like`: Toggle like (auth)
- `POST /:id/save`: Toggle save (auth)

**Comments** (`/api/comments`)

- `POST /:postId`: Add a comment (auth)
- `GET /:postId`: List comments for a post
- `PATCH /:id/pin`: Pin or unpin a comment (auth)
- `DELETE /:id`: Delete a comment (auth)

**Stories** (`/api/stories`)

- `POST /`: Create a story with one image (auth)
- `GET /feed`: Story feed grouped by user (auth)
- `POST /:id/view`: Mark a story as viewed (auth)
- `DELETE /:id`: Delete a story (auth)

**Notifications** (`/api/notifications`)

- `GET /`: Notifications for the current user. Query: `type` (all, likes, comments, follows), `page`, `limit` (auth)
- `GET /unread-count`: Unread count (auth)
- `PATCH /read-all`: Mark all as read (auth)
- `PATCH /:id/read`: Mark one as read (auth)

## Deployment

Deploy `client/` and `server/` as separate projects, and set the environment variables from each folder's `.env.example` file.
