import Queue from 'bull';
import Rpi from '../models/rpiModel.js';
import axios from 'axios';

// Create queues
export const videoSyncQueue = new Queue('video sync', {
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    timeout: 30000
  }
});

export const deviceNotificationQueue = new Queue('device notifications', {
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379
  }
});

// Process video sync jobs
videoSyncQueue.process('sync-video', async (job) => {
  const { video, operation } = job.data;
  
  try {
    const activeDevices = await Rpi.find({ rpi_status: 'active' });
    
    const results = await Promise.allSettled(
      activeDevices.map(async (device) => {
        try {
          const response = await axios.post(
            `${device.rpi_serverUrl}/${operation === 'delete' ? 'delete-video' : 'download-video'}`,
            operation === 'delete' ? { filename: video.filename } : video,
            { timeout: 10000 }
          );
          return { deviceId: device.rpi_id, status: 'success', response: response.data };
        } catch (error) {
          return { deviceId: device.rpi_id, status: 'error', error: error.message };
        }
      })
    );

    return { videoId: video._id, results };
  } catch (error) {
    throw new Error(`Video sync failed: ${error.message}`);
  }
});

// Process device notifications
deviceNotificationQueue.process('send-notification', async (job) => {
  const { deviceIds, command, payload } = job.data;
  
  // Implementation for sending commands to devices
  // This could use Socket.IO, MQTT, or HTTP requests
});

// Utility functions
export const queueVideoSync = (video, operation = 'update') => {
  return videoSyncQueue.add('sync-video', { video, operation }, {
    priority: operation === 'delete' ? 1 : 2,
    delay: operation === 'update' ? 5000 : 0 // Delay updates to batch them
  });
};

export const queueDeviceCommand = (deviceIds, command, payload) => {
  return deviceNotificationQueue.add('send-notification', { 
    deviceIds, command, payload 
  }, {
    attempts: 2,
    timeout: 15000
  });
};