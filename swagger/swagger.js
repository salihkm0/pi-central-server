import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

// Environment variables
const { PORT } = process.env;

// Swagger Definition
const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Ads Display API Documentation",
    version: "1.0.0",
    description: "API documentation for the Ads Display application",
  },
  servers: [
    {
      url: `https://iot-ads-display.onrender.com/api`,
      description: "Production Server",
    },
    {
      url: `http://localhost:${PORT || 3000}/api`,
      description: "Development Server",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter JWT token",
      },
    },
  },
  security: [
    {
      BearerAuth: [],
    },
  ],
};

// Swagger Options
const options = {
  swaggerDefinition,
  apis: ["./swagger/paths/*.js"], // Path to the files with API documentation (JSDoc comments)
};

// Swagger UI Options
const swaggerUiOptions = {
  swaggerOptions: {
    docExpansion: "none", // Collapse all sections by default
    filter: true, // Enable filtering
    tagsSorter: "alpha", // Sort tags alphabetically
    operationsSorter: "alpha", // Sort operations within tags alphabetically
  },
};

// Generate Swagger Specification
const swaggerSpec = swaggerJSDoc(options);

export { swaggerUi, swaggerSpec, swaggerUiOptions };
