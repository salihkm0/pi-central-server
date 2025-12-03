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

const deviceRoutes = express.Router();

// Device registration and health monitoring (NO authentication for device registration)
deviceRoutes.post("/register", registerDevice);
deviceRoutes.post("/health", updateDeviceHealth);
deviceRoutes.get("/health/:deviceId", getDeviceHealth);
deviceRoutes.get("/health", getAllDevicesHealth);

// WiFi configuration endpoints (protected - only server admins can manage)
deviceRoutes.get("/wifi-config/:deviceId", protect, getDeviceWifiConfig);
deviceRoutes.post("/wifi-config/:deviceId", protect, updateDeviceWifiConfig);
deviceRoutes.delete("/wifi-config/:deviceId", protect, deleteDeviceWifiConfig);

// Public WiFi config endpoint for devices to fetch their config
deviceRoutes.get("/wifi-config-fetch/:deviceId", async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    // Check if request is from the device itself
    const userAgent = req.get('User-Agent') || '';
    const isDeviceRequest = userAgent.includes('ADS-Display');
    
    if (!isDeviceRequest) {
      return res.status(403).json({
        success: false,
        message: "Access denied. This endpoint is for devices only."
      });
    }
    
    // Forward to protected handler
    return await getDeviceWifiConfig(req, res);
  } catch (error) {
    console.error("WiFi config fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch WiFi configuration"
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