import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  registerDevice,
  updateDeviceHealth,
  getDeviceHealth,
  getAllDevicesHealth,
  sendBulkCommand,
  updateDeviceConfig,
  getDeviceById,
  deleteDevice,
  getDeviceWifiConfig,
  updateDeviceWifiConfig,
  deleteDeviceWifiConfig
} from "../controllers/deviceControllers/deviceManagement.js";
import { protectWifiFromDeviceUpdates } from "../middleware/wifiProtection.js";

const deviceRoutes = express.Router();

// Device registration and health monitoring (NO authentication for device registration)
deviceRoutes.post("/register", protectWifiFromDeviceUpdates, registerDevice);
deviceRoutes.post("/health", protectWifiFromDeviceUpdates, updateDeviceHealth);
deviceRoutes.get("/health/:deviceId", getDeviceHealth);
deviceRoutes.get("/health", getAllDevicesHealth);

// WiFi configuration endpoints (protected - only server admins can manage)
deviceRoutes.get("/wifi-config/:deviceId", protect, getDeviceWifiConfig);
deviceRoutes.post("/wifi-config/:deviceId", protect, updateDeviceWifiConfig);
deviceRoutes.delete("/wifi-config/:deviceId", protect, deleteDeviceWifiConfig);

// Public WiFi config endpoint for devices to fetch their config (NO authentication)
deviceRoutes.get("/wifi-config-fetch/:deviceId", async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    console.log(`📱 Public WiFi config request for device: ${deviceId}`);
    
    // Find device in database
    const Rpi = await import("../../models/rpiModel.js");
    const device = await Rpi.default.findOne({ rpi_id: deviceId })
      .select('rpi_id rpi_name wifi_ssid wifi_password updatedAt wifi_configured');

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found",
        has_wifi_config: false
      });
    }

    const has_wifi_config = !!(device.wifi_ssid && device.wifi_password);
    
    console.log(`📡 Device ${deviceId} - WiFi SSID: ${device.wifi_ssid}, Has config: ${has_wifi_config}`);
    
    // Return WiFi configuration - SAME structure as above
    res.json({
      success: true,
      device_id: deviceId,
      device_name: device.rpi_name,
      wifi_ssid: device.wifi_ssid,
      wifi_password: device.wifi_password,
      has_wifi_config: has_wifi_config,
      wifi_configured: device.wifi_configured || false,
      last_updated: device.updatedAt,
      note: "WiFi credentials managed by server only"
    });
    
  } catch (error) {
    console.error("WiFi config fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch WiFi configuration",
      has_wifi_config: false
    });
  }
});

// Device management (protected)
deviceRoutes.get("/", protect, getAllDevicesHealth);
deviceRoutes.get("/:deviceId", protect, getDeviceById);
deviceRoutes.delete("/:deviceId", protect, deleteDevice);
deviceRoutes.post("/command", protect, sendBulkCommand);
deviceRoutes.put("/config/:deviceId", protect, updateDeviceConfig);

export default deviceRoutes;