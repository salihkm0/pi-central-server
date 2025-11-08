import Rpi from "../models/rpiModel.js";
import axios from "axios";

// Enhanced function to check the status of each Pi server
export const checkPiServerStatus = async () => {
  try {
    console.log("Starting Pi server status check...");
    
    // Get all Pi servers from the database
    const piServers = await Rpi.find();
    
    console.log(`Checking status for ${piServers.length} devices...`);

    // Use Promise.allSettled to handle individual failures
    const results = await Promise.allSettled(
      piServers.map(async (server) => {
        try {
          // Skip if no server URL
          if (!server.rpi_serverUrl) {
            await Rpi.findByIdAndUpdate(server._id, { 
              rpi_status: "in_active",
              last_seen: new Date()
            });
            return { server: server.rpi_name, status: "inactive", reason: "No URL" };
          }

          // Attempt to send a request to the server with timeout
          const response = await axios.get(`${server.rpi_serverUrl}/status`, { 
            timeout: 10000, // 10 second timeout
            validateStatus: () => true // Don't throw on HTTP errors
          });

          // If the server responds with 200, set status to "active"
          if (response.status === 200) {
            await Rpi.findByIdAndUpdate(server._id, { 
              rpi_status: "active",
              last_seen: new Date()
            });
            return { server: server.rpi_name, status: "active" };
          } else {
            await Rpi.findByIdAndUpdate(server._id, { 
              rpi_status: "in_active",
              last_seen: new Date()
            });
            return { server: server.rpi_name, status: "inactive", reason: `HTTP ${response.status}` };
          }
        } catch (error) {
          // If the server doesn't respond, set status to "in_active"
          await Rpi.findByIdAndUpdate(server._id, { 
            rpi_status: "in_active",
            last_seen: new Date()
          });
          
          let reason = "Unknown error";
          if (error.code === 'ECONNREFUSED') reason = "Connection refused";
          else if (error.code === 'ETIMEDOUT') reason = "Timeout";
          else if (error.code === 'ENOTFOUND') reason = "Host not found";
          else reason = error.message;
          
          return { server: server.rpi_name, status: "inactive", reason };
        }
      })
    );

    // Log summary
    const summary = {
      total: piServers.length,
      active: results.filter(r => r.status === 'fulfilled' && r.value.status === 'active').length,
      inactive: results.filter(r => r.status === 'fulfilled' && r.value.status === 'inactive').length,
      errors: results.filter(r => r.status === 'rejected').length
    };

    console.log(`Status check completed:`, summary);

  } catch (error) {
    console.error("Error in Pi server status check:", error);
  }
};

// Function to check specific device status
export const checkDeviceStatus = async (deviceId) => {
  try {
    const device = await Rpi.findOne({ rpi_id: deviceId });
    
    if (!device || !device.rpi_serverUrl) {
      return { status: "inactive", reason: "Device not found or no URL" };
    }

    const response = await axios.get(`${device.rpi_serverUrl}/status`, { 
      timeout: 5000 
    });

    return { 
      status: response.status === 200 ? "active" : "inactive",
      response_time: response.duration,
      http_status: response.status
    };

  } catch (error) {
    return { 
      status: "inactive", 
      reason: error.code || error.message 
    };
  }
};