import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dbConnection from "./config/dbConnection.js";
import rpiRoutes from "./routes/rpiRoutes.js";
import { checkPiServerStatus } from "./utils/checkPiServerStatus.js";
import authRoutes from "./routes/authRoutes.js";
import jwtRoutes from "./routes/tokenRoutes.js";
import brandRouter from "./routes/brandRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";
import { swaggerSpec, swaggerUi, swaggerUiOptions } from "./swagger/swagger.js";
import { setupSocketIO } from "./config/socketConfig.js";

import { createIndexes } from "./config/dbIndexes.js";
import { apiLimiter, authLimiter, deviceLimiter } from "./middleware/rateLimiter.js";
import { checkSystemHealth } from "./services/monitoringService.js";
import deviceRoutes from "./routes/deviceRoutes.js";

const app = express();
dotenv.config();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Enhanced CORS configuration
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174", 
    "http://localhost:3000",
    "http://localhost:3004",
    "http://localhost:3006",
    "https://iot-ads-frontend.vercel.app",
    "https://iot-ads-display.onrender.com",
    "https://spotus-admin.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Device-ID", "X-API-Key", "User-Agent"],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(apiLimiter);
app.use("/api/auth", authLimiter);
app.use("/api/devices/register", deviceLimiter);

// Security middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Enhanced device request logging
  const userAgent = req.get('User-Agent') || '';
  const deviceId = req.get('X-Device-ID') || req.body.rpi_id || 'unknown';
  
  if (userAgent.includes('ADS-Display')) {
    console.log(`📱 Device request: ${req.method} ${req.path} - Device: ${deviceId} - ${userAgent}`);
  }
  
  next();
});

const port = process.env.PORT || 3000;

// API Routes
app.use("/api", videoRoutes);
app.use("/api/rpi", rpiRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", jwtRoutes);
app.use("/api/brands", brandRouter);
app.use("/api/devices", deviceRoutes);

// Add health monitoring
setInterval(async () => {
  try {
    const health = await checkSystemHealth();
    if (health.alerts.length > 0) {
      health.alerts.forEach(sendAlert);
    }
  } catch (error) {
    console.error('Health monitoring error:', error);
  }
}, 5 * 60 * 1000); // Every 5 minutes

// Enhanced health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      devices: "/api/devices",
      videos: "/api/videos",
      rpi: "/api/rpi",
      health: "/api/health"
    }
  });
});

// WiFi configuration endpoint for devices
app.get("/api/wifi-config/:deviceId", async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    console.log(`📱 WiFi config request for device: ${deviceId}`);
    
    // Find device in database
    const Rpi = await import("./models/rpiModel.js");
    const device = await Rpi.default.findOne({ rpi_id: deviceId })
      .select('rpi_id rpi_name wifi_ssid wifi_password wifi_configured updatedAt');
    
    if (!device) {
      return res.json({
        success: true,
        device_id: deviceId,
        wifi_ssid: null,
        wifi_password: null,
        has_wifi_config: false,
        wifi_configured: false,
        last_updated: null,
        message: "Device not found"
      });
    }
    
    // Check if WiFi is configured
    const has_wifi_config = !!(device.wifi_ssid && device.wifi_password);
    
    console.log(`📡 Device ${deviceId}: SSID=${device.wifi_ssid}, HasConfig=${has_wifi_config}`);
    
    // Return WiFi configuration
    res.json({
      success: true,
      device_id: deviceId,
      device_name: device.rpi_name,
      wifi_ssid: device.wifi_ssid || null,
      wifi_password: device.wifi_password || null,
      has_wifi_config: has_wifi_config,
      wifi_configured: device.wifi_configured || false,
      last_updated: device.updatedAt,
      note: "WiFi credentials managed by server only"
    });
    
  } catch (error) {
    console.error("WiFi config error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch WiFi configuration",
      has_wifi_config: false
    });
  }
});

// Update WiFi configuration endpoint
app.post("/api/wifi-config/:deviceId", async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { wifi_ssid, wifi_password } = req.body;
    
    if (!wifi_ssid || !wifi_password) {
      return res.status(400).json({
        success: false,
        message: "WiFi SSID and password are required"
      });
    }
    
    // Update device WiFi configuration
    const Rpi = await import("./models/rpiModel.js");
    const device = await Rpi.default.findOneAndUpdate(
      { rpi_id: deviceId },
      { 
        wifi_ssid, 
        wifi_password,
        $push: {
          tags: "wifi_configured"
        }
      },
      { new: true }
    );
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found"
      });
    }
    
    console.log(`✅ WiFi configuration updated for device: ${deviceId}`);
    
    res.json({
      success: true,
      message: "WiFi configuration updated successfully",
      device_id: deviceId,
      wifi_ssid: wifi_ssid
    });
    
  } catch (error) {
    console.error("WiFi config update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update WiFi configuration"
    });
  }
});

// Root endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ADS Display Central Server API",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      devices: "/api/devices",
      videos: "/api/videos/active",
      documentation: "/api-docs",
      wifi_config: "/api/wifi-config/:deviceId"
    },
    timestamp: new Date().toISOString()
  });
});

// Swagger setup
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, swaggerUiOptions)
);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    available_endpoints: {
      health: "GET /api/health",
      device_registration: "POST /api/devices/register", 
      videos: "GET /api/videos/active",
      rpi_update: "POST /api/rpi/update",
      wifi_config: "GET /api/wifi-config/:deviceId"
    }
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Global error handler:", error);
  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal Server Error",
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Initialize server with database connection
const startServer = async () => {
  try {
    await dbConnection();
    await createIndexes();
    
    const server = app.listen(port, () => {
      console.log(`✓ App is running on port: ${port}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✓ CORS enabled for: ${corsOptions.origin.join(', ')}`);
      
      // Initialize Socket.IO
      setupSocketIO(server);
      
      // Start background tasks
      setInterval(checkPiServerStatus, 300000); // 5 minutes
      checkPiServerStatus();
      
      console.log(`✓ Background tasks initialized`);
      console.log(`✓ WiFi configuration endpoints available`);
    });

    // Graceful shutdown
    const gracefulShutdown = () => {
      console.log('Received shutdown signal, closing server gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });

      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (err) {
    console.error("✘ Failed to start server:", err);
    process.exit(1);
  }
};

// Helper function for alerts (placeholder)
function sendAlert(alert) {
  console.log(`ALERT: ${alert.message}`);
  // TODO: Integrate with notification service (email, SMS, etc.)
}

startServer();