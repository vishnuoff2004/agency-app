const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');
const { authenticateSocket } = require('./authenticateSocket');

function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  if (process.env.REDIS_URL && process.env.USE_REDIS === 'true') {
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();
    
    pubClient.on('error', (err) => console.log('Socket.IO Redis Pub Client Error:', err.message));
    subClient.on('error', (err) => console.log('Socket.IO Redis Sub Client Error:', err.message));
    
    pubClient.connect()
      .then(() => subClient.connect())
      .then(() => {
        io.adapter(createAdapter(pubClient, subClient));
        console.log('Socket.IO Redis adapter connected successfully');
      })
      .catch((err) => {
        console.log('Socket.IO Redis connection failed, continuing without adapter:', err.message);
      });
  }

  const bookingsNamespace = io.of('/bookings');
  const driversNamespace = io.of('/drivers');
  const dashboardNamespace = io.of('/dashboard');
  const adminNamespace = io.of('/admin');

  bookingsNamespace.use(authenticateSocket(['traveler', 'driver', 'agency_admin', 'admin']));
  driversNamespace.use(authenticateSocket(['driver', 'agency_admin', 'admin']));
  dashboardNamespace.use(authenticateSocket(['traveler', 'driver', 'agency_admin', 'admin']));
  adminNamespace.use(authenticateSocket(['admin']));

  bookingsNamespace.on('connection', (socket) => {
    socket.join(`user:${socket.user.id}`);
    socket.on('disconnect', () => {
      socket.leave(`user:${socket.user.id}`);
    });
  });

  driversNamespace.on('connection', (socket) => {
    if (socket.user.role === 'driver') {
      socket.join(`driver:${socket.user.id}`);
    } else if (['agency_admin', 'admin'].includes(socket.user.role)) {
      socket.join('agency:management');
    }
    socket.on('disconnect', () => {
      socket.leave(`driver:${socket.user.id}`);
      socket.leave('agency:management');
    });
  });

  dashboardNamespace.on('connection', (socket) => {
    socket.join(`dashboard:${socket.user.role}`);
    socket.on('disconnect', () => {
      socket.leave(`dashboard:${socket.user.role}`);
    });
  });

  adminNamespace.on('connection', (socket) => {
    socket.join('admin:room');
    socket.on('disconnect', () => {
      socket.leave('admin:room');
    });
  });

  return io;
}

module.exports = { createSocketServer };
