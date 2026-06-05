require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const messageRoutes = require('./routes/messages');
const photoRoutes = require('./routes/photos');
const familyRoutes = require('./routes/family');
const dashboardRoutes = require('./routes/dashboard');

// Socket handler
const socketHandler = require('./config/socket');

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || '*', methods: ['GET', 'POST'] }
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve client files
app.use(express.static(path.join(__dirname, '../client')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Socket.IO
socketHandler(io);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Fallback to client index
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/login.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`🚀 Family Hub server running on port ${PORT}`));
