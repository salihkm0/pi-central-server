import dotenv from "dotenv";

dotenv.config();

const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  serverUrl: process.env.SERVER_URL || 'http://localhost:3000',

  // Database
  database: {
    url: process.env.NODE_ENV === 'production' ? process.env.DB_URL_PROD : process.env.DB_URL,
    options: {
      maxPoolSize: 50,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      retryWrites: true,
      w: 'majority'
    }
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '7d'
  },

  // AWS S3
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    bucketName: process.env.AWS_S3_BUCKET_NAME,
    region: process.env.AWS_S3_REGION
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },

  // Device Management
  device: {
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 300000,
    statusCheckInterval: parseInt(process.env.DEVICE_STATUS_CHECK_INTERVAL) || 300000,
    offlineThreshold: 15 * 60 * 1000 // 15 minutes
  },

  // Video Management
  video: {
    maxFileSize: 500 * 1024 * 1024, // 500MB
    allowedFormats: ['mp4', 'avi', 'mov', 'mkv'],
    presignedUrlExpiry: 7 * 24 * 60 * 60 // 7 days
  }
};

// Validation
const requiredEnvVars = [
  'JWT_SECRET',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_S3_BUCKET_NAME'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.warn(`⚠ Warning: ${envVar} environment variable is not set`);
  }
});

export default config;