import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { initNotificationSocket } from './services/notificationSocket.js';
import { setIO } from './services/socket.service.js';

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: env.CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Store io instance for use in controllers
setIO(io);
initNotificationSocket(io);

(async () => {
  try {
    await connectDB();
    
    server.listen(env.PORT, () => {
      console.log(`Server listening on http://localhost:${env.PORT}`);
      console.log(`WebSocket server ready on ws://localhost:${env.PORT}`);
    });

    // Handle server errors
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${env.PORT} is already in use.`);
        console.error(`Solution: Kill the process using port ${env.PORT} or change PORT in .env`);
        console.error(`   Command: kill -9 $(lsof -ti:${env.PORT})`);
        process.exit(1);
      } else {
        console.error('Server error:', err);
        process.exit(1);
      }
    });

    // Handle process termination
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('\nSIGINT received, shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    if (err.message.includes('MongoDB') || err.message.includes('MONGO')) {
      console.error('Make sure MongoDB is running and MONGO_URI is correct in .env');
    }
    process.exit(1);
  }
})();