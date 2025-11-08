import Video from "../../models/adsModel.js";

// Fetch videos
export const getVideos = async (req, res) => {
  try {
    const videos = await Video.find();
    res.json({ message: "Retrieved videos", success: true, videos: videos });
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json({ message: "Failed to retrieve videos", success: false });
  }
};

// Fetch video By filename
export const getVideosByFilename = async (req, res) => {
  try {
    const { filename } = req.params;
    const videos = await Video.find({ filename: new RegExp(filename, "i") });

    if (videos.length === 0) {
      return res
        .status(404)
        .json({ message: "No videos found with that filename", success: false });
    }

    res.json({ message: "Videos founded with that filename", success: true, videos: videos });
  } catch (error) {
    console.error("Error fetching videos by filename:", error);
    res.status(500).json({ message: "Failed to retrieve videos", error: error, success: false });
  }
};

// Fetch only active videos
export const getActiveVideos = async (req, res) => {
  try {
    const currentDate = new Date();
    const videos = await Video.find({
      $or: [{ expiryDate: { $gte: currentDate } }, { expiryDate: null }],
    });

    if (videos.length === 0) {
      return res.status(404).json({
        message: "No active videos found",
        success: false,
      });
    }

    res.json({
      message: "Retrieved active videos",
      success: true,
      videos: videos,
    });
  } catch (error) {
    console.error("Error fetching active videos:", error);
    res.status(500).json({
      message: "Failed to retrieve active videos",
      error: error,
      success: false,
    });
  }
};

// Fetch videos by brand
export const getVideosByBrand = async (req, res) => {
  try {
    const { brandId } = req.params;
    const videos = await Video.find({ brand: brandId });

    if (videos.length === 0) {
      return res.status(404).json({
        message: "No videos found for the specified brand",
        success: false,
      });
    }

    res.json({
      message: "Retrieved videos for the specified brand",
      success: true,
      videos: videos,
    });
  } catch (error) {
    console.error("Error fetching videos by brand:", error);
    res.status(500).json({
      message: "Failed to retrieve videos by brand",
      error: error,
      success: false,
    });
  }
};