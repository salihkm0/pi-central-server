import Rpi from "../models/rpiModel.js";

export const protectWifiFromDeviceUpdates = async (req, res, next) => {
  try {
    const { rpi_id } = req.body || req.params;
    
    if (!rpi_id) return next();
    
    // Check if device exists and has WiFi configured
    const device = await Rpi.findOne({ rpi_id }).select('wifi_ssid wifi_password');
    
    if (device && device.wifi_ssid && device.wifi_password) {
      // Device has server-managed WiFi
      console.log(`🔒 Protecting WiFi fields for device: ${rpi_id} (SSID: ${device.wifi_ssid})`);
      
      // Remove WiFi fields from request body to prevent overwriting
      delete req.body.wifi_ssid;
      delete req.body.wifi_password;
      
      // Store existing WiFi in request for logging
      req.existingWifi = {
        ssid: device.wifi_ssid,
        hasConfig: true
      };
    } else if (req.body.wifi_ssid || req.body.wifi_password) {
      // Device is trying to send WiFi credentials but server doesn't have config yet
      console.log(`⚠️ Device ${rpi_id} sent WiFi credentials but server WiFi not configured yet. Ignoring.`);
      delete req.body.wifi_ssid;
      delete req.body.wifi_password;
    }
    
    next();
  } catch (error) {
    console.error("WiFi protection middleware error:", error);
    next();
  }
};