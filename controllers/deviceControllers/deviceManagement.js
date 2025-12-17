import Rpi from "../../models/rpiModel.js";
import DeviceHealth from "../../models/deviceHealthModel.js";

export const registerDevice = async (req, res) => {
  try {
    const {
      rpi_id,
      rpi_name,
      device_info,
      app_version,
      location,
      capabilities,
      status = "active",
      first_seen,
      last_seen,
      mac_address,
      serial_number,
      rpi_serverUrl,
    } = req.body;

    console.log(`📱 Device registration attempt: ${rpi_id}`);

    if (!rpi_id) {
      return res.status(400).json({
        success: false,
        message: "Device ID (rpi_id) is required",
      });
    }

    // Generate a friendly device name if not provided
    const deviceName = rpi_name || `ADS-Display-${rpi_id.substring(0, 8)}`;

    // First, check if device already exists
    const existingDevice = await Rpi.findOne({ rpi_id });
    
    // Get existing WiFi if device already exists
    let existingWifi = null;
    if (existingDevice && existingDevice.wifi_ssid && existingDevice.wifi_password) {
      existingWifi = {
        ssid: existingDevice.wifi_ssid,
        password: existingDevice.wifi_password
      };
      console.log(`📡 Device ${rpi_id} already has WiFi configured: ${existingWifi.ssid}`);
    }

    const deviceData = {
      rpi_id,
      rpi_name: deviceName,
      device_info: {
        ...device_info,
        mac_address: mac_address || device_info?.mac_address,
        serial_number: serial_number || device_info?.serial_number,
        username: device_info?.username || "pi",
      },
      app_version: app_version || "1.0.0",
      location: location || "unknown",
      capabilities: capabilities || [
        "video_playback",
        "auto_updates",
        "health_monitoring",
        "mqtt",
        "wifi_management",
      ],
      rpi_status: status,
      registered_at: first_seen ? new Date(first_seen) : new Date(),
      last_seen: last_seen ? new Date(last_seen) : new Date(),
      ...(rpi_serverUrl && { rpi_serverUrl }),
      config: {
        sync_interval: 600, // 10 minutes
        health_report_interval: 300, // 5 minutes
        autoplay: true,
        shuffle: true,
        default_volume: 80,
        wifi_controlled_by_server: true, // Flag to indicate server controls WiFi
        wifi_check_interval: 60, // Check every minute
      },
    };

    // Update or create device
    const device = await Rpi.findOneAndUpdate(
      { rpi_id },
      deviceData,
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    console.log(`✅ Device registered/updated: ${rpi_id} - ${deviceName}`);
    console.log(
      `📡 WiFi Status: ${
        device.wifi_ssid && device.wifi_password
          ? `Configured: ${device.wifi_ssid} (Managed by Server)`
          : "Not configured - device will use installation WiFi"
      }`
    );

    // Prepare response - include WiFi status but NOT credentials
    const responseData = {
      success: true,
      message: "Device registered successfully",
      device: {
        id: device._id,
        rpi_id: device.rpi_id,
        rpi_name: device.rpi_name,
        status: device.rpi_status,
        wifi_configured: !!(device.wifi_ssid && device.wifi_password),
        wifi_ssid: device.wifi_ssid ? device.wifi_ssid : null,
        config: device.config,
        registered_at: device.registered_at,
        note: "WiFi is managed by central server only. Do not send WiFi credentials during registration."
      },
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error("❌ Device registration error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to register device",
      error: error.message,
    });
  }
};

// WiFi configuration endpoints
export const getDeviceWifiConfig = async (req, res) => {
  try {
    const { deviceId } = req.params;

    const device = await Rpi.findOne({ rpi_id: deviceId })
      .select("rpi_id rpi_name wifi_ssid wifi_password updatedAt");

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found",
      });
    }

    // Return WiFi configuration
    res.json({
      success: true,
      device_id: deviceId,
      device_name: device.rpi_name,
      wifi_ssid: device.wifi_ssid,
      wifi_password: device.wifi_password,
      has_wifi_config: !!(device.wifi_ssid && device.wifi_password),
      last_updated: device.updatedAt,
      note: "WiFi credentials managed by server only",
    });
  } catch (error) {
    console.error("WiFi config error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch WiFi configuration",
      error: error.message,
    });
  }
};

export const updateDeviceWifiConfig = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { wifi_ssid, wifi_password } = req.body;

    if (!wifi_ssid || !wifi_password) {
      return res.status(400).json({
        success: false,
        message: "WiFi SSID and password are required",
      });
    }

    // Update device WiFi configuration
    const device = await Rpi.findOneAndUpdate(
      { rpi_id: deviceId },
      {
        $set: {
          wifi_ssid,
          wifi_password,
        },
        $addToSet: {
          tags: "wifi_configured",
        },
      },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found",
      });
    }

    console.log(
      `✅ WiFi configuration updated for device: ${deviceId} - ${wifi_ssid}`
    );

    res.json({
      success: true,
      message: "WiFi configuration updated successfully",
      device_id: deviceId,
      device_name: device.rpi_name,
      wifi_ssid: wifi_ssid,
      has_wifi_config: true,
      updated_at: device.updatedAt,
      note: "Device will connect to this WiFi on next check",
    });
  } catch (error) {
    console.error("WiFi config update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update WiFi configuration",
      error: error.message,
    });
  }
};

export const deleteDeviceWifiConfig = async (req, res) => {
  try {
    const { deviceId } = req.params;

    // Remove WiFi configuration from device
    const device = await Rpi.findOneAndUpdate(
      { rpi_id: deviceId },
      {
        $unset: {
          wifi_ssid: "",
          wifi_password: "",
        },
        $pull: {
          tags: "wifi_configured",
        },
      },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found",
      });
    }

    console.log(`🗑️ WiFi configuration removed for device: ${deviceId}`);

    res.json({
      success: true,
      message: "WiFi configuration removed successfully",
      device_id: deviceId,
      device_name: device.rpi_name,
      has_wifi_config: false,
      note: "Device will continue using current WiFi or installation WiFi",
    });
  } catch (error) {
    console.error("WiFi config delete error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete WiFi configuration",
      error: error.message,
    });
  }
};

// Update device health metrics (CREATE OR UPDATE)
export const updateDeviceHealth = async (req, res) => {
  try {
    const {
      device_id,
      deviceId, // Support both device_id and deviceId
      metrics,
      timestamp = new Date().toISOString(),
      wifi_status,
      internet_status,
    } = req.body;

    const actualDeviceId = device_id || deviceId;

    if (!actualDeviceId || !metrics) {
      return res.status(400).json({
        success: false,
        message: "Device ID and metrics are required",
      });
    }

    console.log(`📊 Health update received from: ${actualDeviceId}`);
    console.log(`📊 Metrics: CPU=${metrics.cpu_usage}%, Memory=${metrics.memory_usage}%, Internet=${internet_status}`);

    // Create or update health record
    const updateData = {
      device_id: actualDeviceId,
      metrics: {
        cpu_usage: metrics.cpu_usage || 0,
        memory_usage: metrics.memory_usage || 0,
        disk_usage: metrics.disk_usage || 0,
        temperature: metrics.temperature || null,
        network_status: metrics.network_status || "unknown",
        video_count: metrics.video_count || 0,
        uptime: metrics.uptime || 0,
        mqtt_connected: metrics.mqtt_connected || false,
        last_sync: metrics.last_sync || null,
        wifi_status: metrics.wifi_status || "unknown",
        wifi_signal: metrics.wifi_signal || 0,
        internet_status: internet_status || false
      },
      timestamp: new Date(timestamp),
      $push: {
        history: {
          cpu_usage: metrics.cpu_usage || 0,
          memory_usage: metrics.memory_usage || 0,
          temperature: metrics.temperature || null,
          timestamp: new Date(timestamp)
        }
      }
    };

    // Limit history to last 100 entries
    if (updateData.$push.history) {
      updateData.$slice = -100;
    }

    // Find and update or create new
    const healthRecord = await DeviceHealth.findOneAndUpdate(
      { device_id: actualDeviceId },
      updateData,
      { 
        upsert: true, // Create if doesn't exist
        new: true,
        setDefaultsOnInsert: true
      }
    );

    console.log(`✅ Health data ${healthRecord.isNew ? 'created' : 'updated'} for device: ${actualDeviceId}`);

    // Update device last_seen timestamp and status based on metrics
    const deviceUpdateData = {
      last_seen: new Date(),
      rpi_status: "active", // Always set to active when receiving health updates
      status: "active" // Also update the status field for consistency
    };

    // Update WiFi status if provided (for monitoring only, not for configuration)
    if (wifi_status && wifi_status.ssid) {
      deviceUpdateData.wifi_ssid = wifi_status.ssid;
      deviceUpdateData.wifi_status = wifi_status.connected ? "connected" : "disconnected";
    }

    // Update based on health metrics
    if (metrics.cpu_usage > 90 || metrics.memory_usage > 90) {
      deviceUpdateData.rpi_status = "warning";
      deviceUpdateData.status = "warning";
    }

    await Rpi.findOneAndUpdate(
      { rpi_id: actualDeviceId },
      deviceUpdateData,
      { upsert: false, new: true }
    );

    console.log(`✅ Device ${actualDeviceId} status updated to: ${deviceUpdateData.rpi_status}`);

    res.status(200).json({
      success: true,
      message: "Health data received and saved",
      device_id: actualDeviceId,
      timestamp: new Date().toISOString(),
      is_new: healthRecord.isNew
    });

  } catch (error) {
    console.error("❌ Health update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update health data",
      error: error.message,
    });
  }
};

// Get device health (single record per device)
export const getDeviceHealth = async (req, res) => {
  try {
    const { deviceId } = req.params;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: "Device ID is required",
      });
    }

    const healthRecord = await DeviceHealth.findOne({ device_id: deviceId });

    if (!healthRecord) {
      return res.status(404).json({
        success: false,
        message: "Health data not found for this device",
      });
    }

    res.status(200).json({
      success: true,
      health: healthRecord,
    });

  } catch (error) {
    console.error("❌ Error fetching device health:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch device health",
      error: error.message,
    });
  }
};

// Get all devices health (latest record for each device)
export const getAllDevicesHealth = async (req, res) => {
  try {
    const healthRecords = await DeviceHealth.find().sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      count: healthRecords.length,
      health: healthRecords,
    });

  } catch (error) {
    console.error("❌ Error fetching all devices health:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch devices health",
      error: error.message,
    });
  }
};

// Get specific device by ID (keep existing)
export const getDeviceById = async (req, res) => {
  try {
    const { deviceId } = req.params;

    const device = await Rpi.findOne({ rpi_id: deviceId });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found",
      });
    }

    // Get health history
    const healthHistory = await DeviceHealth.find({
      device_id: deviceId,
    })
      .sort({ timestamp: -1 })
      .limit(50);

    // Get WiFi configuration status
    const hasWifiConfig = !!(device.wifi_ssid && device.wifi_password);

    res.status(200).json({
      success: true,
      device: {
        ...device.toObject(),
        health_history: healthHistory,
        has_wifi_configuration: hasWifiConfig,
        is_offline:
          Date.now() - new Date(device.last_seen).getTime() > 15 * 60 * 1000,
        wifi_configuration: hasWifiConfig
          ? {
              ssid: device.wifi_ssid,
              // Don't return password for security
              configured_at: device.updatedAt,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("❌ Get device error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch device",
      error: error.message,
    });
  }
};

// Delete device (keep existing)
export const deleteDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;

    const device = await Rpi.findOneAndDelete({ rpi_id: deviceId });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found",
      });
    }

    // Also delete health records
    await DeviceHealth.deleteMany({ device_id: deviceId });

    console.log(`🗑️ Device deleted: ${deviceId}`);

    res.status(200).json({
      success: true,
      message: "Device deleted successfully",
    });
  } catch (error) {
    console.error("❌ Delete device error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete device",
      error: error.message,
    });
  }
};

// Send command to multiple devices (keep existing)
export const sendBulkCommand = async (req, res) => {
  try {
    const { device_ids, command, payload } = req.body;

    if (!device_ids || !command) {
      return res.status(400).json({
        success: false,
        message: "Device IDs and command are required",
      });
    }

    const commandResults = await Promise.all(
      device_ids.map(async (device_id) => {
        try {
          // Update device with command
          await Rpi.findOneAndUpdate(
            { rpi_id: device_id },
            {
              last_command: {
                command,
                payload,
                sent_at: new Date(),
                status: "pending",
              },
            }
          );

          return {
            device_id,
            status: "sent",
            message: "Command queued for device",
          };
        } catch (error) {
          return {
            device_id,
            status: "error",
            message: error.message,
          };
        }
      })
    );

    console.log(`📨 Sent ${command} command to ${device_ids.length} devices`);

    res.status(200).json({
      success: true,
      message: `Command sent to ${device_ids.length} devices`,
      results: commandResults,
    });
  } catch (error) {
    console.error("❌ Bulk command error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send bulk command",
      error: error.message,
    });
  }
};

// Update device configuration (keep existing)
export const updateDeviceConfig = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { config, wifi_ssid, wifi_password } = req.body;

    const updateData = {};

    if (config) {
      updateData.config = {
        ...config,
        updated_at: new Date(),
      };
    }

    // Only update WiFi if explicitly provided (server-side control)
    if (wifi_ssid !== undefined) updateData.wifi_ssid = wifi_ssid;
    if (wifi_password !== undefined) updateData.wifi_password = wifi_password;

    const device = await Rpi.findOneAndUpdate(
      { rpi_id: deviceId },
      { $set: updateData },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found",
      });
    }

    console.log(`⚙️ Configuration updated for device: ${deviceId}`);

    res.status(200).json({
      success: true,
      message: "Device configuration updated",
      device: {
        rpi_id: device.rpi_id,
        rpi_name: device.rpi_name,
        config: device.config,
        wifi_configured: !!(device.wifi_ssid && device.wifi_password),
      },
    });
  } catch (error) {
    console.error("❌ Update config error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update device configuration",
      error: error.message,
    });
  }
};

// Helper function to format relative time
function formatRelativeTime(date) {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

// Get detailed device information by ID (NEW FUNCTION)
export const getDeviceDetailsById = async (req, res) => {
  console.log("hitteeeeeeed")
  try {
    const { deviceId } = req.params;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: "Device ID is required",
      });
    }

    console.log(`🔍 Fetching detailed device info for: ${deviceId}`);

    // Get device information
    const device = await Rpi.findOne({ rpi_id: deviceId }).lean();

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found",
      });
    }

    // Get latest health data
    const latestHealth = await DeviceHealth.findOne({ 
      device_id: deviceId 
    }).sort({ timestamp: -1 }).lean();

    // Get health history (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const healthHistory = await DeviceHealth.find({
      device_id: deviceId,
      timestamp: { $gte: twentyFourHoursAgo }
    })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    // Calculate device status
    const lastSeen = new Date(device.last_seen);
    const minutesSinceLastSeen = Math.floor((Date.now() - lastSeen.getTime()) / (1000 * 60));
    const isOnline = minutesSinceLastSeen < 5; // Online if last seen < 5 minutes ago
    const status = isOnline ? "online" : "offline";

    // Calculate uptime percentage (if device is reporting uptime)
    const uptimePercentage = latestHealth?.metrics?.uptime 
      ? Math.min(100, (latestHealth.metrics.uptime / (24 * 60 * 60)) * 100) // Convert to percentage of 24h
      : null;

    // Format health metrics
    const healthMetrics = latestHealth ? {
      cpu_usage: latestHealth.metrics.cpu_usage || 0,
      memory_usage: latestHealth.metrics.memory_usage || 0,
      disk_usage: latestHealth.metrics.disk_usage || 0,
      temperature: latestHealth.metrics.temperature || null,
      video_count: latestHealth.metrics.video_count || 0,
      uptime: latestHealth.metrics.uptime || 0,
      uptime_percentage: uptimePercentage,
      network_status: latestHealth.metrics.network_status || "unknown",
      wifi_signal: latestHealth.metrics.wifi_signal || 0,
      wifi_status: latestHealth.metrics.wifi_status || "unknown",
      internet_status: latestHealth.metrics.internet_status || false,
      mqtt_connected: latestHealth.metrics.mqtt_connected || false,
      last_sync: latestHealth.metrics.last_sync || null,
      timestamp: latestHealth.timestamp
    } : null;

    // WiFi configuration details (don't expose password)
    const wifiConfiguration = device.wifi_ssid ? {
      ssid: device.wifi_ssid,
      is_configured: true,
      managed_by_server: true,
      configured_at: device.updatedAt,
      last_updated: formatRelativeTime(device.updatedAt)
    } : {
      is_configured: false,
      managed_by_server: true
    };

    // Device capabilities summary
    const capabilitiesSummary = device.capabilities?.map(cap => ({
      name: cap,
      enabled: true
    })) || [];

    // Performance analysis
    const performanceAnalysis = latestHealth ? {
      status: latestHealth.metrics.cpu_usage > 90 || latestHealth.metrics.memory_usage > 90 ? "warning" : "good",
      cpu_status: latestHealth.metrics.cpu_usage > 90 ? "high" : latestHealth.metrics.cpu_usage > 70 ? "medium" : "low",
      memory_status: latestHealth.metrics.memory_usage > 90 ? "high" : latestHealth.metrics.memory_usage > 70 ? "medium" : "low",
      temperature_status: latestHealth.metrics.temperature > 80 ? "high" : latestHealth.metrics.temperature > 60 ? "medium" : "low",
      recommendations: []
    } : null;

    // Add recommendations based on health metrics
    if (performanceAnalysis) {
      if (latestHealth.metrics.cpu_usage > 90) {
        performanceAnalysis.recommendations.push("High CPU usage detected. Consider reducing video complexity or checking for background processes.");
      }
      if (latestHealth.metrics.memory_usage > 90) {
        performanceAnalysis.recommendations.push("High memory usage detected. Consider optimizing video files or increasing available memory.");
      }
      if (latestHealth.metrics.temperature > 80) {
        performanceAnalysis.recommendations.push("High temperature detected. Ensure proper ventilation and cooling.");
      }
      if (latestHealth.metrics.disk_usage > 90) {
        performanceAnalysis.recommendations.push("Disk space is running low. Consider removing unused videos or files.");
      }
    }

    // Network details
    const networkDetails = {
      hostname: device.device_info?.hostname || "unknown",
      mac_address: device.device_info?.mac_address || "unknown",
      ip_address: device.device_info?.ip_address || "unknown",
      network_interfaces: device.device_info?.network_interfaces || [],
      last_known_wifi: device.wifi_ssid || "unknown",
      connection_type: device.wifi_ssid ? "WiFi" : "Ethernet"
    };

    // Sync status
    const syncStatus = {
      last_sync: latestHealth?.metrics?.last_sync || null,
      sync_interval: device.config?.sync_interval || 600,
      auto_sync_enabled: true,
      next_sync_in: latestHealth?.metrics?.last_sync 
        ? `~${device.config?.sync_interval / 60} minutes` 
        : "unknown"
    };

    // Response data
    const responseData = {
      success: true,
      device: {
        // Basic Information
        id: device._id,
        rpi_id: device.rpi_id,
        rpi_name: device.rpi_name,
        status: status,
        is_online: isOnline,
        last_seen: device.last_seen,
        last_seen_relative: formatRelativeTime(device.last_seen),
        minutes_since_last_seen: minutesSinceLastSeen,
        registered_at: device.registered_at,
        location: device.location || "unknown",
        
        // Owner Information (if available)
        owner_name: device.owner_name || "Not specified",
        owner_phone: device.owner_phone || "Not specified",
        vehicle_no: device.vehicle_no || "Not specified",
        
        // System Information
        system_info: {
          model: device.device_info?.model || "unknown",
          os: device.device_info?.os || "unknown",
          architecture: device.device_info?.architecture || "unknown",
          cores: device.device_info?.cores || 0,
          total_memory: device.device_info?.total_memory || "unknown",
          username: device.device_info?.username || "pi",
          serial_number: device.device_info?.serial_number || "unknown",
          is_raspberry_pi: device.device_info?.is_raspberry_pi || false
        },
        
        // Health & Performance
        health: {
          current: healthMetrics,
          has_health_data: !!latestHealth,
          last_health_update: latestHealth?.timestamp || null,
          health_update_interval: "5 minutes"
        },
        
        // Performance Analysis
        performance: performanceAnalysis,
        
        // Configuration
        configuration: {
          app_version: device.app_version || "1.0.0",
          capabilities: capabilitiesSummary,
          config: device.config || {},
          wifi: wifiConfiguration
        },
        
        // Network
        network: networkDetails,
        
        // Sync Status
        sync: syncStatus,
        
        // Health History
        health_history: {
          available: healthHistory.length > 0,
          records_count: healthHistory.length,
          period: "24 hours",
          data: healthHistory.map(record => ({
            timestamp: record.timestamp,
            cpu_usage: record.metrics.cpu_usage,
            memory_usage: record.metrics.memory_usage,
            temperature: record.metrics.temperature
          }))
        },
        
        // Alerts & Warnings
        alerts: {
          has_warnings: performanceAnalysis?.status === "warning",
          warning_count: performanceAnalysis?.recommendations.length || 0,
          recommendations: performanceAnalysis?.recommendations || []
        },
        
        // Statistics
        statistics: {
          uptime_percentage: uptimePercentage,
          avg_cpu_usage: healthHistory.length > 0 
            ? Math.round(healthHistory.reduce((sum, record) => sum + (record.metrics.cpu_usage || 0), 0) / healthHistory.length)
            : null,
          avg_memory_usage: healthHistory.length > 0 
            ? Math.round(healthHistory.reduce((sum, record) => sum + (record.metrics.memory_usage || 0), 0) / healthHistory.length)
            : null,
          max_temperature: healthHistory.length > 0 
            ? Math.max(...healthHistory.map(record => record.metrics.temperature || 0))
            : null
        }
      }
    };

    console.log(`✅ Detailed device info retrieved for: ${deviceId}`);
    
    res.status(200).json(responseData);

  } catch (error) {
    console.error("❌ Error fetching detailed device information:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch device details",
      error: error.message,
    });
  }
};