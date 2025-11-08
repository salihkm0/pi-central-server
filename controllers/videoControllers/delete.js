import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../../config/s3Config.js";
import Video from "../../models/adsModel.js";
import Rpi from "../../models/rpiModel.js";
import axios from "axios";

export const deleteVideo = async (req, res) => {
  try {
    const videoId = req.params.id;
    const video = await Video.findById(videoId);

    if (!video) {
      return res
        .status(404)
        .json({ success: false, message: "Video not found" });
    }

    // Delete from S3
    const deleteParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: video.s3Key,
    };

    try {
      const deleteCommand = new DeleteObjectCommand(deleteParams);
      const deleteResponse = await s3Client.send(deleteCommand);
      
      console.log("S3 Delete Response:", deleteResponse);
      
      // Check if deletion was successful
      if (deleteResponse.$metadata.httpStatusCode !== 204) {
        console.error("Unexpected S3 deletion response:", deleteResponse);
        return res.status(500).json({
          success: false,
          message: "Unexpected response when deleting from S3",
        });
      }
    } catch (error) {
      console.error("Detailed S3 deletion error:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
        code: error.Code,
        region: process.env.AWS_S3_REGION,
        bucket: process.env.AWS_S3_BUCKET_NAME,
        key: video.s3Key
      });
      
      // Handle specific AWS errors
      if (error.name === 'NoSuchKey') {
        console.warn("File already deleted from S3, proceeding with database cleanup");
      } else {
        return res.status(500).json({
          success: false,
          message: "Failed to delete video from S3",
          error: {
            code: error.name,
            message: error.message,
            // Don't expose sensitive info in production
            ...(process.env.NODE_ENV === 'development' && { details: error.stack })
          }
        });
      }
    }

    // Delete from database
    await Video.findByIdAndDelete(videoId);

    // Notify Raspberry Pi servers
    const rpServers = await Rpi.find().select("rpi_serverUrl");
    await Promise.all(
      rpServers.map(async (server) => {
        try {
          await axios.post(`${server.rpi_serverUrl}/delete-video`, {
            filename: video.filename,
          });
        } catch (error) {
          console.error(
            `Failed to notify server ${server.rpi_serverUrl}:`,
            error.message
          );
        }
      })
    );

    res.json({ success: true, message: "Video deleted successfully" });
  } catch (error) {
    console.error("Error deleting video:", {
      error: error.stack,
      params: req.params,
      videoId: req.params.id
    });
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete video",
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};