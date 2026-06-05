const jwt = require('jsonwebtoken');
const Message = require('../models/Message');

module.exports = (io) => {
  // Auth middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { userId, name, familyId } = socket.user;
    const room = `family_${familyId}`;

    // Join family room
    socket.join(room);
    console.log(`👤 ${name} joined room: ${room}`);

    // Notify room of new member
    socket.to(room).emit('user_joined', { name, userId });

    // Handle new message
    socket.on('send_message', async (data) => {
      try {
        const message = await Message.create({
          sender: userId,
          senderName: name,
          content: data.content.trim(),
          familyId,
        });

        const payload = {
          _id: message._id,
          sender: userId,
          senderName: name,
          content: message.content,
          timestamp: message.timestamp,
          familyId,
        };

        // Broadcast to entire family room (including sender)
        io.to(room).emit('receive_message', payload);
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing', () => {
      socket.to(room).emit('user_typing', { name });
    });
    socket.on('stop_typing', () => {
      socket.to(room).emit('user_stop_typing', { name });
    });

    socket.on('disconnect', () => {
      socket.to(room).emit('user_left', { name, userId });
      console.log(`👋 ${name} disconnected`);
    });
  });
};
