import mongoose from "mongoose";

const deviceHealthSchema = new mongoose.Schema({
  device_id: {
    type: String,
    required: true,
    index: true
  },
  metrics: {
    cpu_usage: Number,
    memory_usage: Number,
    disk_usage: Number,
    temperature: Number,
    network_status: String,
    video_count: Number,
    uptime: Number,
    mqtt_connected: Boolean,
    last_sync: Date
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
deviceHealthSchema.index({ device_id: 1, timestamp: -1 });

export default mongoose.model("DeviceHealth", deviceHealthSchema);