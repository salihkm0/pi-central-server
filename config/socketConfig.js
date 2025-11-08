import { Server } from "socket.io";

let io;

export const setupSocketIO = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ["http://localhost:5173"],
      methods: ["GET", "POST"]
    }
  });

  const connectedDevices = new Map();

  io.on('connection', (socket) => {
    console.log(`Device connected: ${socket.id}`);

    // Device authentication and registration
    socket.on('device_register', (data) => {
      const { device_id, device_info } = data;
      
      if (device_id) {
        connectedDevices.set(device_id, socket.id);
        socket.device_id = device_id;
        
        console.log(`Device ${device_id} registered with socket ${socket.id}`);
        
        // Join device-specific room
        socket.join(`device_${device_id}`);
        
        // Join location-based room if available
        if (device_info?.location) {
          socket.join(`location_${device_info.location}`);
        }
      }
    });

    // Handle device commands
    socket.on('device_command', (data) => {
      const { command, payload } = data;
      console.log(`Command received from ${socket.device_id}:`, command);
      
      // Broadcast to admin dashboard
      socket.broadcast.emit('command_executed', {
        device_id: socket.device_id,
        command,
        payload,
        timestamp: new Date()
      });
    });

    // Health updates from devices
    socket.on('health_update', (data) => {
      io.emit('device_health', {
        device_id: socket.device_id,
        ...data,
        timestamp: new Date()
      });
    });

    socket.on('disconnect', () => {
      if (socket.device_id) {
        connectedDevices.delete(socket.device_id);
        console.log(`Device ${socket.device_id} disconnected`);
        
        // Notify admin dashboard
        socket.broadcast.emit('device_disconnected', {
          device_id: socket.device_id,
          timestamp: new Date()
        });
      }
    });
  });

  return io;
};

// Function to send command to specific device
export const sendCommandToDevice = (device_id, command, payload) => {
  if (io && connectedDevices.has(device_id)) {
    const socketId = connectedDevices.get(device_id);
    io.to(socketId).emit('device_command', { command, payload });
    return true;
  }
  return false;
};

// Function to broadcast to all devices in location
export const broadcastToLocation = (location, event, data) => {
  if (io) {
    io.to(`location_${location}`).emit(event, data);
  }
};

export const getConnectedDevices = () => {
  return Array.from(connectedDevices.keys());
};