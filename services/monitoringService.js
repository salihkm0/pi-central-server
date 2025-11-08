import Rpi from '../models/rpiModel.js';
import DeviceHealth from '../models/deviceHealthModel.js';

export const checkSystemHealth = async () => {
  const healthReport = {
    timestamp: new Date(),
    devices: {},
    alerts: []
  };

  try {
    // Check device statuses
    const totalDevices = await Rpi.countDocuments();
    const offlineDevices = await Rpi.countDocuments({
      last_seen: { $lt: new Date(Date.now() - 15 * 60 * 1000) }
    });
    
    const highCpuDevices = await DeviceHealth.aggregate([
      {
        $match: {
          timestamp: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
          'metrics.cpu_usage': { $gt: 90 }
        }
      },
      {
        $group: {
          _id: '$device_id',
          avgCpu: { $avg: '$metrics.cpu_usage' }
        }
      }
    ]);

    healthReport.devices = {
      total: totalDevices,
      offline: offlineDevices,
      highCpu: highCpuDevices.length,
      offlinePercentage: (offlineDevices / totalDevices) * 100
    };

    // Generate alerts
    if (offlineDevices > totalDevices * 0.1) { // More than 10% offline
      healthReport.alerts.push({
        type: 'CRITICAL',
        message: `High number of offline devices: ${offlineDevices}/${totalDevices}`
      });
    }

    if (highCpuDevices.length > 0) {
      healthReport.alerts.push({
        type: 'WARNING',
        message: `${highCpuDevices.length} devices experiencing high CPU usage`
      });
    }

    return healthReport;

  } catch (error) {
    console.error('Health check error:', error);
    throw error;
  }
};

export const sendAlert = async (alert) => {
  // Implementation for sending alerts (email, Slack, etc.)
  console.log('ALERT:', alert);
  
  // Example: Send to Slack webhook
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      await axios.post(process.env.SLACK_WEBHOOK_URL, {
        text: `🚨 ${alert.type}: ${alert.message}`
      });
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }
};