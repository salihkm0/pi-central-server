import mongoose from "mongoose";
import Rpi from "../models/rpiModel.js";
import DeviceHealth from "../models/deviceHealthModel.js";
import Video from "../models/adsModel.js";

export const createIndexes = async () => {
  try {
    // RPI indexes
    await Rpi.collection.createIndex({ rpi_id: 1 }, { unique: true });
    await Rpi.collection.createIndex({ location: 1, rpi_status: 1 });
    await Rpi.collection.createIndex({ last_seen: -1 });
    await Rpi.collection.createIndex({ "device_info.model": 1 });

    // Device Health indexes
    await DeviceHealth.collection.createIndex({ device_id: 1, timestamp: -1 });
    await DeviceHealth.collection.createIndex({ timestamp: 1 }, { 
      expireAfterSeconds: 30 * 24 * 60 * 60 
    });

    // Video indexes
    await Video.collection.createIndex({ brand: 1 });
    await Video.collection.createIndex({ expiryDate: 1 });
    await Video.collection.createIndex({ createdAt: -1 });

    console.log("✓ Database indexes created successfully");
  } catch (error) {
    console.error("✘ Error creating indexes:", error);
  }
};