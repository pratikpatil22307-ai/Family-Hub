# 🏠 Family Hub — Full-Stack Upgrade

A complete family collaboration app with authentication, real-time chat, and family-based data isolation.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Real-time | Socket.IO |
| File uploads | Multer |

---

## 📁 Project Structure

```
FamilyHub/
├── server/
│   ├── server.js              # Express + Socket.IO entry point
│   ├── package.json
│   ├── .env.example           # Copy to .env and fill in
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── socket.js          # Socket.IO real-time chat logic
│   ├── models/
│   │   ├── User.js            # User schema (hashed password)
│   │   ├── Family.js          # Family schema (invite codes)
│   │   ├── Event.js           # Event schema
│   │   ├── Message.js         # Chat message schema
│   │   └── Photo.js           # Photo schema
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── eventsController.js
│   │   ├── messagesController.js
│   │   ├── photosController.js
│   │   ├── familyController.js
│   │   └── dashboardController.js
│   ├── middleware/
│   │   ├── auth.js            # JWT protect middleware
│   │   └── upload.js          # Multer image upload
│   ├── routes/
│   │   ├── auth.js
│   │   ├── events.js
│   │   ├── messages.js
│   │   ├── photos.js
│   │   ├── family.js
│   │   └── dashboard.js
│   └── uploads/               # Uploaded images (auto-created)
└── client/
    ├── login.html
    ├── register.html
    ├── family-hub.html        # Dashboard
    ├── index.html             # Calendar
    ├── events.html
    ├── chat.html
    ├── photos.html
    ├── css/
    │   ├── auth.css
    │   └── (all existing CSS files)
    └── js/
        ├── api.js             # Shared API utility + auth helpers
        ├── nav.js             # Shared sidebar nav builder
        └── (all existing JS files)
```

---

## 🚀 Setup Instructions

### Prerequisites

- Node.js ≥ 18
- MongoDB (local or Atlas)

### 1. Install server dependencies

```bash
cd server
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/familyhub
JWT_SECRET=your_super_secret_key_here_at_least_32_chars
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5000
NODE_ENV=development
```

For MongoDB Atlas, use your connection string:
```
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/familyhub
```

### 3. Run in development

```bash
# From server/ directory
npm run dev
```

### 4. Open in browser

Navigate to: `http://localhost:5000`

You will land on the login page. Register a new account to get started.

---

## 🔐 Authentication Flow

1. User visits any protected page → redirected to `login.html`
2. User registers → creates or joins a family
3. JWT stored in `localStorage` as `fh_token`
4. All API calls attach `Authorization: Bearer <token>`
5. Server validates JWT on every protected route
6. Logout clears localStorage and redirects to login

---

## 👨‍👩‍👧‍👦 Family System

When registering, users choose:

**Option A — Create Family**
- Enter a family name
- System generates a unique invite code (e.g. `PATIL-7X9A`)
- User becomes family admin

**Option B — Join Family**
- Enter an invite code shared by an existing member
- User joins that family as a member

All data (events, messages, photos) is scoped to `familyId`.

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register + create/join family |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user info |

### Events (protected)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/events` | List family events |
| POST | `/api/events` | Create event |
| PUT | `/api/events/:id` | Update event |
| DELETE | `/api/events/:id` | Delete event |

### Messages (protected)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/messages` | Get last 50 messages |

### Photos (protected)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/photos` | List family photos |
| POST | `/api/photos` | Upload photo (multipart/form-data) |
| DELETE | `/api/photos/:id` | Delete photo |

### Family (protected)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/family/members` | List family members |
| GET | `/api/family/info` | Get family details |

### Dashboard (protected)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/stats` | Upcoming events, photos count, messages today, member count |

---

## 💬 Socket.IO Events

### Client → Server
| Event | Payload | Description |
|---|---|---|
| `send_message` | `{ content }` | Send a new chat message |
| `typing` | — | User started typing |
| `stop_typing` | — | User stopped typing |

### Server → Client
| Event | Payload | Description |
|---|---|---|
| `receive_message` | message object | New message broadcast |
| `user_joined` | `{ name }` | Member joined chat room |
| `user_left` | `{ name }` | Member disconnected |
| `user_typing` | `{ name }` | Typing indicator |
| `user_stop_typing` | `{ name }` | Typing stopped |

Each user automatically joins their family room: `family_<familyId>`

---

## 🌐 Deployment

### Option A: Railway / Render / Fly.io

1. Push repo to GitHub
2. Connect to Railway or Render
3. Set environment variables from `.env`
4. Deploy the `server/` directory

### Option B: VPS (Ubuntu/Debian)

```bash
# Install Node.js & PM2
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pm2

# Clone and install
git clone <your-repo>
cd FamilyHub/server
npm install
cp .env.example .env  # fill in values

# Start with PM2
pm2 start server.js --name family-hub
pm2 save
pm2 startup

# Nginx reverse proxy (optional)
# Point your domain to localhost:5000
```

### Option C: MongoDB Atlas (cloud DB)

1. Create free cluster at mongodb.com/atlas
2. Get connection string
3. Set `MONGO_URI` in `.env`

---

## 🔒 Security Features

- Passwords hashed with bcryptjs (12 salt rounds)
- JWT tokens expire in 7 days
- All API routes protected with `protect` middleware
- Family data isolation: every query filters by `familyId`
- File upload validates MIME type and extension (images only, 10MB max)
- Input validation via Mongoose schema validators
- XSS prevention via HTML escaping in all frontend renders

---

## 📦 Dependencies

```json
{
  "bcryptjs": "password hashing",
  "cors": "cross-origin requests",
  "dotenv": "environment variables",
  "express": "web framework",
  "jsonwebtoken": "JWT auth",
  "mongoose": "MongoDB ODM",
  "multer": "file uploads",
  "socket.io": "real-time chat"
}
```

Install all with:
```bash
npm install
```
