import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { bulkDeleteRpis, bulkUpdateRpis, getRpiStats } from "../controllers/rpiServerControllers/bulkOperations.js";
import { getAllRpis, getRpiById, getWifiDetails } from "../controllers/rpiServerControllers/fetch.js";
import { createRpi } from "../controllers/rpiServerControllers/create.js";
import { updateRpi, updateRpiStatus } from "../controllers/rpiServerControllers/update.js";
import { deleteRpi } from "../controllers/rpiServerControllers/delete.js";
import rpiModel from "../models/rpiModel.js";

const rpiRoutes = express.Router();

// Public endpoints for device communication
rpiRoutes.get("/ping", (req, res) => {
  res.status(200).json({ 
    message: "Server is online", 
    success: true,
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

rpiRoutes.post("/update", async (req, res) => {
  const { rpi_serverUrl, rpi_status, rpi_id, device_info, rpi_name, app_version, wifi_ssid, wifi_password } = req.body;

  if (!rpi_id) {
    return res.status(400).json({
      error: "Missing required fields: rpi_id",
      success: false,
    });
  }

  console.log(`📱 Received update from device: ${rpi_id}`);
  
  try {
    // First, check if device already exists
    const existingDevice = await rpiModel.findOne({ rpi_id });
    
    const updateData = { 
      rpi_status: rpi_status || "active",
      status: rpi_status || "active", // Update both fields for compatibility
      last_seen: new Date()
    };
    
    if (rpi_serverUrl) updateData.rpi_serverUrl = rpi_serverUrl;
    if (device_info) updateData.device_info = device_info;
    if (rpi_name) updateData.rpi_name = rpi_name;
    if (app_version) updateData.app_version = app_version;
    
    // CRITICAL: DO NOT update WiFi credentials if they already exist
    // Only update WiFi if explicitly provided AND device doesn't have existing WiFi config
    if (wifi_ssid && wifi_password) {
      if (!existingDevice || !existingDevice.wifi_ssid || !existingDevice.wifi_password) {
        // Only update WiFi if device doesn't have existing WiFi config
        updateData.wifi_ssid = wifi_ssid;
        updateData.wifi_password = wifi_password;
        console.log(`📡 Setting initial WiFi config for device: ${rpi_id} - ${wifi_ssid}`);
      } else {
        console.log(`📡 WiFi config already exists for device ${rpi_id}, keeping existing: ${existingDevice.wifi_ssid}`);
        // Keep existing WiFi credentials
        updateData.wifi_ssid = existingDevice.wifi_ssid;
        updateData.wifi_password = existingDevice.wifi_password;
      }
    } else if (existingDevice) {
      // If no WiFi provided in update, keep existing WiFi
      if (existingDevice.wifi_ssid && existingDevice.wifi_password) {
        updateData.wifi_ssid = existingDevice.wifi_ssid;
        updateData.wifi_password = existingDevice.wifi_password;
      }
    }

    const rpi = await rpiModel.findOneAndUpdate(
      { rpi_id },
      updateData,
      { 
        upsert: true, 
        new: true, 
        setDefaultsOnInsert: true,
        runValidators: true 
      }
    );
    
    console.log(`✅ Device updated: ${rpi_id} - Status: ${rpi.rpi_status}`);
    console.log(`📡 Current WiFi for device: ${rpi.wifi_ssid || 'Not set'}`);
    
    return res.status(200).json({ 
      message: "Device updated successfully.", 
      data: {
        id: rpi._id,
        rpi_id: rpi.rpi_id,
        rpi_name: rpi.rpi_name,
        status: rpi.rpi_status || rpi.status,
        wifi_ssid: rpi.wifi_ssid,
        wifi_configured: !!(rpi.wifi_ssid && rpi.wifi_password),
        config: rpi.config
      }, 
      success: true 
    });
  } catch (error) {
    console.error(`❌ Error updating device ${rpi_id}:`, error.message);
    return res.status(500).json({ 
      error: "Internal server error.", 
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get WiFi configuration for device
rpiRoutes.get("/wifi-config/:rpi_id", async (req, res) => {
  try {
    const { rpi_id } = req.params;
    
    const rpi = await rpiModel.findOne({ rpi_id });

    if (!rpi) {
      return res.status(404).json({
        message: "Device not found",
        success: false,
      });
    }

    // Return WiFi configuration
    return res.json({
      message: "WiFi configuration available",
      success: true,
      device_id: rpi_id,
      wifi_ssid: rpi.wifi_ssid,
      wifi_password: rpi.wifi_password,
      has_configuration: !!(rpi.wifi_ssid && rpi.wifi_password),
      has_wifi_config: !!(rpi.wifi_ssid && rpi.wifi_password), // Add this for compatibility
      last_updated: rpi.updatedAt
    });
  } catch (error) {
    console.error("❌ Error fetching WiFi configuration:", error.message);
    return res.status(500).json({
      message: "An error occurred while fetching WiFi configuration",
      success: false,
    });
  }
});

// Update WiFi configuration
rpiRoutes.post("/wifi-config/:rpi_id", async (req, res) => {
  try {
    const { rpi_id } = req.params;
    const { wifi_ssid, wifi_password } = req.body;
    
    if (!wifi_ssid || !wifi_password) {
      return res.status(400).json({
        success: false,
        message: "WiFi SSID and password are required"
      });
    }

    const rpi = await rpiModel.findOneAndUpdate(
      { rpi_id },
      { 
        wifi_ssid, 
        wifi_password,
        wifi_configured: true,
        $addToSet: {
          tags: "wifi_configured"
        }
      },
      { new: true }
    );

    if (!rpi) {
      return res.status(404).json({
        message: "Device not found",
        success: false,
      });
    }

    console.log(`✅ WiFi configuration updated for device: ${rpi_id}`);
    
    return res.json({
      message: "WiFi configuration updated successfully",
      success: true,
      device_id: rpi_id,
      wifi_ssid: wifi_ssid,
      wifi_configured: true
    });
  } catch (error) {
    console.error("❌ Error updating WiFi configuration:", error.message);
    return res.status(500).json({
      message: "An error occurred while updating WiFi configuration",
      success: false,
    });
  }
});

// Get device status (for status checker)
rpiRoutes.get("/status/:rpi_id", async (req, res) => {
  try {
    const { rpi_id } = req.params;
    
    const rpi = await rpiModel.findOne({ rpi_id }).select('rpi_id rpi_name rpi_status status last_seen rpi_serverUrl');

    if (!rpi) {
      return res.status(404).json({
        message: "Device not found",
        success: false,
        device_status: "not_found"
      });
    }

    // Determine status from either field
    const deviceStatus = rpi.rpi_status || rpi.status || "unknown";
    
    return res.json({
      success: true,
      device_id: rpi_id,
      device_name: rpi.rpi_name,
      status: deviceStatus,
      rpi_status: rpi.rpi_status,
      status_field: rpi.status,
      last_seen: rpi.last_seen,
      rpi_serverUrl: rpi.rpi_serverUrl,
      is_active: deviceStatus === "active"
    });
  } catch (error) {
    console.error("❌ Error fetching device status:", error.message);
    return res.status(500).json({
      message: "An error occurred while fetching device status",
      success: false,
    });
  }
});

// Get all devices with their status (for dashboard)
rpiRoutes.get("/all/status", async (req, res) => {
  try {
    const devices = await rpiModel.find({})
      .select('rpi_id rpi_name rpi_status status last_seen rpi_serverUrl wifi_configured wifi_ssid')
      .sort({ last_seen: -1 });

    const devicesWithStatus = devices.map(device => {
      const status = device.rpi_status || device.status || "unknown";
      return {
        rpi_id: device.rpi_id,
        rpi_name: device.rpi_name,
        status: status,
        is_active: status === "active",
        last_seen: device.last_seen,
        rpi_serverUrl: device.rpi_serverUrl,
        wifi_configured: device.wifi_configured,
        wifi_ssid: device.wifi_ssid,
        has_status_conflict: !!(device.rpi_status && device.status && device.rpi_status !== device.status)
      };
    });

    const activeDevices = devicesWithStatus.filter(d => d.is_active);
    const inactiveDevices = devicesWithStatus.filter(d => !d.is_active);

    return res.json({
      success: true,
      count: devicesWithStatus.length,
      active: activeDevices.length,
      inactive: inactiveDevices.length,
      devices: devicesWithStatus,
      summary: {
        total: devicesWithStatus.length,
        active: activeDevices.length,
        inactive: inactiveDevices.length,
        with_wifi_config: devices.filter(d => d.wifi_configured).length
      }
    });
  } catch (error) {
    console.error("❌ Error fetching all devices status:", error.message);
    return res.status(500).json({
      message: "An error occurred while fetching devices status",
      success: false,
    });
  }
});

// Fix device status fields (admin tool)
rpiRoutes.post("/fix-status/:rpi_id", async (req, res) => {
  try {
    const { rpi_id } = req.params;
    
    const rpi = await rpiModel.findOne({ rpi_id });

    if (!rpi) {
      return res.status(404).json({
        message: "Device not found",
        success: false,
      });
    }

    // Determine which status field to use
    let statusToUse;
    if (rpi.rpi_status) {
      statusToUse = rpi.rpi_status;
    } else if (rpi.status) {
      statusToUse = rpi.status;
    } else {
      statusToUse = "active";
    }

    // Update both fields to be consistent
    const updatedRpi = await rpiModel.findOneAndUpdate(
      { rpi_id },
      { 
        rpi_status: statusToUse,
        status: statusToUse
      },
      { new: true }
    );

    return res.json({
      success: true,
      message: "Device status fields synchronized",
      device_id: rpi_id,
      rpi_status: updatedRpi.rpi_status,
      status: updatedRpi.status,
      is_consistent: updatedRpi.rpi_status === updatedRpi.status
    });
  } catch (error) {
    console.error("❌ Error fixing device status:", error.message);
    return res.status(500).json({
      message: "An error occurred while fixing device status",
      success: false,
    });
  }
});

// Protected admin routes
rpiRoutes.use(protect);

rpiRoutes.route("/")
  .post(upload.none(), createRpi)
  .get(getAllRpis);

rpiRoutes.route("/bulk")
  .post(bulkUpdateRpis)
  .delete(bulkDeleteRpis);

rpiRoutes.route("/stats")
  .get(getRpiStats);

rpiRoutes.route("/:id")
  .get(getRpiById)
  .put(updateRpi)
  .delete(deleteRpi);

rpiRoutes.route("/status/:id")
  .put(updateRpiStatus);

// Keep existing endpoint for backward compatibility
rpiRoutes.get("/get-wifi/:rpi_id", getWifiDetails);

export default rpiRoutes;