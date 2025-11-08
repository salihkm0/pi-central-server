import mongoose from "mongoose";

const rpiModelSchema = new mongoose.Schema(
  {
    rpi_id: { 
      type: String, 
      required: true, 
      unique: true,
      index: true 
    },
    rpi_name: { 
      type: String, 
      required: true 
    },
    rpi_serverUrl: String,
    wifi_ssid: String,
    wifi_password: String,
    vehicle_no: String,
    owner_name: String,
    owner_phone: String,
    location: { 
      type: String, 
      index: true 
    },
    display: [Object],
    rpi_status: { 
      type: String, 
      enum: ["active", "in_active", "warning", "maintenance"], 
      default: "in_active" 
    },
    
    // Enhanced fields for device management
    device_info: {
      serial_number: String,
      model: String,
      os: String,
      architecture: String,
      cores: Number,
      total_memory: String,
      hostname: String,
      network_interfaces: [String],
      mac_address: String
    },
    
    app_version: String,
    capabilities: [String], // This expects array of strings like ["video_playback", "auto_updates"]
    
    // Configuration
    config: {
      sync_interval: { type: Number, default: 600 },
      health_report_interval: { type: Number, default: 300 },
      autoplay: { type: Boolean, default: true },
      shuffle: { type: Boolean, default: true },
      default_volume: { type: Number, default: 80 }
    },
    
    // Command tracking
    last_command: {
      command: String,
      payload: Object,
      sent_at: Date,
      executed_at: Date,
      status: String
    },
    
    // Monitoring
    last_seen: { 
      type: Date, 
      default: Date.now,
      index: true 
    },
    registered_at: { 
      type: Date, 
      default: Date.now 
    },
    
    // Metadata
    tags: [String],
    notes: String
  },
  {
    timestamps: true
  }
);

// Compound indexes for better query performance
rpiModelSchema.index({ location: 1, rpi_status: 1 });
rpiModelSchema.index({ last_seen: -1 });
rpiModelSchema.index({ "device_info.model": 1 });

export default mongoose.model("rpi", rpiModelSchema);