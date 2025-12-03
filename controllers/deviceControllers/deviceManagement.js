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
      // IMPORTANT: DO NOT accept wifi_ssid or wifi_password from device
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
      // CRITICAL: WiFi details are NEVER saved from device, only managed from server
      // We do NOT set wifi_ssid or wifi_password here
      registered_at: first_seen ? new Date(first_seen) : new Date(),
      last_seen: last_seen ? new Date(last_seen) : new Date(),
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

    // Update or create device - ensure WiFi fields are NOT overwritten by device data
    const device = await Rpi.findOneAndUpdate(
      { rpi_id },
      {
        $set: deviceData,
        // Preserve existing server-managed WiFi if it exists
        $setOnInsert: {
          // Only set WiFi fields on insert if they don't exist (empty)
          wifi_ssid: null,
          wifi_password: null,
        },
      },
      {
        upsert: true,
        new: true,
        // This ensures WiFi fields are not modified by device registration
        runValidators: true,
      }
    );

    console.log(`✅ Device registered/updated: ${rpi_id} - ${deviceName}`);
    console.log(
      `🎮 Server WiFi control: ${
        device.wifi_ssid && device.wifi_password
          ? "Configured (Managed by Server)"
          : "Not configured - device uses installation WiFi"
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
        // Only return SSID if configured (for information only)
        wifi_ssid: device.wifi_ssid ? device.wifi_ssid : null,
        config: device.config,
        registered_at: device.registered_at,
        note: "WiFi is managed by central server only",
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

// Update device health metrics (keep existing)
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

    // Store health data
    const healthRecord = new DeviceHealth({
      device_id: actualDeviceId,
      metrics: {
        ...metrics,
        wifi_status,
        internet_status,
      },
      timestamp: new Date(timestamp),
    });

    await healthRecord.save();

    // Update device last_seen timestamp and status based on metrics
    const updateData = {
      last_seen: new Date(),
    };

    // Update status based on health metrics
    if (metrics.cpu_usage > 90 || metrics.memory_usage > 90) {
      updateData.rpi_status = "warning";
    } else if (
      (metrics.cpu_usage < 50 && metrics.memory_usage < 80) ||
      internet_status === true
    ) {
      updateData.rpi_status = "active";
    }

    // Update WiFi status if provided (for monitoring only, not for configuration)
    if (wifi_status) {
      updateData.wifi_status = wifi_status;
    }

    await Rpi.findOneAndUpdate({ rpi_id: actualDeviceId }, updateData);

    console.log(`📊 Health update received from: ${actualDeviceId}`);

    res.status(200).json({
      success: true,
      message: "Health data received",
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

// Get device health history (keep existing)
export const getDeviceHealth = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { hours = 24, limit = 100 } = req.query;

    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    const healthData = await DeviceHealth.find({
      device_id: deviceId,
      timestamp: { $gte: startTime },
    })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    // Calculate health statistics
    const stats = {
      total_records: healthData.length,
      avg_cpu:
        healthData.reduce(
          (sum, record) => sum + (record.metrics.cpu_usage || 0),
          0
        ) / healthData.length,
      avg_memory:
        healthData.reduce(
          (sum, record) => sum + (record.metrics.memory_usage || 0),
          0
        ) / healthData.length,
      online_percentage:
        (healthData.filter((record) => record.metrics.internet_status === true)
          .length /
          healthData.length) *
        100,
    };

    res.status(200).json({
      success: true,
      device_id: deviceId,
      period: `${hours}h`,
      statistics: stats,
      count: healthData.length,
      data: healthData,
    });
  } catch (error) {
    console.error("❌ Get health error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch health data",
      error: error.message,
    });
  }
};

// Get health overview for all devices (keep existing)
export const getAllDevicesHealth = async (req, res) => {
  try {
    const { status, location, limit = 50, has_wifi = false } = req.query;

    const filter = {};
    if (status) filter.rpi_status = status;
    if (location) filter.location = new RegExp(location, "i");
    if (has_wifi === "true") {
      filter.wifi_ssid = { $exists: true, $ne: null };
      filter.wifi_password = { $exists: true, $ne: null };
    }

    const devices = await Rpi.find(filter)
      .select(
        "rpi_id rpi_name rpi_status location last_seen device_info app_version config wifi_ssid wifi_password"
      )
      .sort({ last_seen: -1 })
      .limit(parseInt(limit));

    // Get latest health for each device
    const deviceHealth = await Promise.all(
      devices.map(async (device) => {
        const latestHealth = await DeviceHealth.findOne({
          device_id: device.rpi_id,
        }).sort({ timestamp: -1 });

        // Calculate if device is offline (no update in 15 minutes)
        const isOffline =
          Date.now() - new Date(device.last_seen).getTime() > 15 * 60 * 1000;

        return {
          ...device.toObject(),
          latest_health: latestHealth?.metrics || null,
          is_offline: isOffline,
          has_wifi_configuration: !!(device.wifi_ssid && device.wifi_password),
          last_seen_relative: formatRelativeTime(device.last_seen),
        };
      })
    );

    // Calculate statistics
    const total = devices.length;
    const active = devices.filter((d) => d.rpi_status === "active").length;
    const inactive = devices.filter((d) => d.rpi_status === "in_active").length;
    const warning = devices.filter((d) => d.rpi_status === "warning").length;
    const offline = deviceHealth.filter((d) => d.is_offline).length;
    const withWifi = deviceHealth.filter(
      (d) => d.has_wifi_configuration
    ).length;

    const stats = {
      total,
      active,
      inactive,
      warning,
      offline,
      online: total - offline,
      with_wifi_config: withWifi,
      without_wifi_config: total - withWifi,
    };

    res.status(200).json({
      success: true,
      stats,
      devices: deviceHealth,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Get all health error:", error);
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