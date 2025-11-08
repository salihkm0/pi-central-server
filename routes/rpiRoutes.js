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
  const { rpi_serverUrl, rpi_status, rpi_id, device_info, rpi_name, app_version, wifi_ssid } = req.body;

  if (!rpi_id) {
    return res.status(400).json({
      error: "Missing required fields: rpi_id",
      success: false,
    });
  }

  console.log(`📱 Received update from device: ${rpi_id}`);
  
  try {
    const updateData = { 
      rpi_status: rpi_status || "active",
      last_seen: new Date()
    };
    
    if (rpi_serverUrl) updateData.rpi_serverUrl = rpi_serverUrl;
    if (device_info) updateData.device_info = device_info;
    if (rpi_name) updateData.rpi_name = rpi_name;
    if (app_version) updateData.app_version = app_version;
    if (wifi_ssid) updateData.wifi_ssid = wifi_ssid;

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
    
    return res.status(200).json({ 
      message: "Device updated successfully.", 
      data: {
        id: rpi._id,
        rpi_id: rpi.rpi_id,
        rpi_name: rpi.rpi_name,
        status: rpi.rpi_status,
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
      wifi_ssid: wifi_ssid
    });
  } catch (error) {
    console.error("❌ Error updating WiFi configuration:", error.message);
    return res.status(500).json({
      message: "An error occurred while updating WiFi configuration",
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