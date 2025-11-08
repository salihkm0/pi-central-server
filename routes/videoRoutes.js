import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import { uploadVideo } from "../controllers/videoControllers/upload.js";
import { getActiveVideos, getVideos, getVideosByBrand, getVideosByFilename } from "../controllers/videoControllers/fetch.js";
import { deleteVideo } from "../controllers/videoControllers/delete.js";
import { protect } from "../middleware/authMiddleware.js";
import { editVideo } from "../controllers/videoControllers/edit.js";

// Initialize router
const videoRoutes = express.Router();

// Route to upload a single video
videoRoutes.post("/upload",protect, upload.single("file"), uploadVideo);

// Route to fetch all videos
videoRoutes.get("/videos", getVideos);

// Route to fetch video by name
videoRoutes.get("/video/:filename", getVideosByFilename);

videoRoutes.put("/edit/:videoId",protect, upload.single("file"), editVideo);
// Route to delete videos
videoRoutes.delete("/delete-video/:id",protect, deleteVideo);

videoRoutes.get("/videos/active", getActiveVideos);
videoRoutes.get("/videos/brand/:brandId", getVideosByBrand);

// Export the routes
export default videoRoutes;


