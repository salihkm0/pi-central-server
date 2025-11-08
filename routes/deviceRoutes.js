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
  deleteDevice
} from "../controllers/deviceControllers/deviceManagement.js";

const deviceRoutes = express.Router();

// Device registration and health monitoring
deviceRoutes.post("/register", registerDevice);
deviceRoutes.post("/health", updateDeviceHealth);
deviceRoutes.get("/health/:deviceId", getDeviceHealth);
deviceRoutes.get("/health", getAllDevicesHealth);

// Device management (protected)
deviceRoutes.get("/", protect, getAllDevicesHealth); // Get all devices
deviceRoutes.get("/:deviceId", protect, getDeviceById); // Get specific device
deviceRoutes.delete("/:deviceId", protect, deleteDevice); // Delete device
deviceRoutes.post("/command", protect, sendBulkCommand);
deviceRoutes.put("/config/:deviceId", protect, updateDeviceConfig);

export default deviceRoutes;