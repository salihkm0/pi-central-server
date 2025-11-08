import { Upload } from "@aws-sdk/lib-storage";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../../config/s3Config.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import Video from "../../models/adsModel.js";
import Rpi from "../../models/rpiModel.js";
import axios from "axios";
import dotenv from "dotenv";
import streamifier from "streamifier";

dotenv.config();

export const editVideo = async (req, res) => {
  const { videoId } = req.params;
  const { filename, description, brand, expiryDate } = req.body;

  try {
    const video = await Video.findById(videoId);

    if (!video) {
      return res
        .status(404)
        .json({ success: false, message: "Video not found" });
    }

    // Update video details
    video.filename = filename || video.filename;
    video.description = description || video.description;
    video.brand = brand || video.brand;
    video.expiryDate = expiryDate || video.expiryDate;

    // If a new video file is uploaded
    if (req.file) {
      // Delete the old video from S3
      if (video.s3Key) {
        try {
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: process.env.AWS_S3_BUCKET_NAME,
              Key: video.s3Key,
            })
          );
        } catch (error) {
          console.error("Error deleting old video from S3:", error);
        }
      }

      // Check file size limit (500MB)
      const fileSizeMB = req.file.size / (1024 * 1024);
      if (fileSizeMB > 500) {
        return res
          .status(400)
          .json({ success: false, message: "Video size exceeds 500MB limit." });
      }

      // Generate new S3 key
      const fileExtension = req.file.originalname.split('.').pop();
      const newKey = `ads_videos/${Date.now()}-${Math.round(Math.random() * 1e9)}.${fileExtension}`;

      // Upload the new video to S3
      const parallelUploads3 = new Upload({
        client: s3Client,
        params: {
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: newKey,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        },
      });

      await parallelUploads3.done();

      // Generate presigned URL for the new video
      const fileUrl = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: newKey,
        }),
        { expiresIn: 60 * 60 * 24 * 7 } // 7 days
      );

      // Update video details
      video.s3Key = newKey;
      video.fileUrl = fileUrl;
      video.fileSize = req.file.size;
    }

    await video.save();

    // Notify Raspberry Pi servers
    const rpServers = await Rpi.find();
    const errors = [];
    await Promise.all(
      rpServers.map(async (server) => {
        try {
          await axios.post(`${server.rpi_serverUrl}/update-video`, {
            filename: video.filename,
            fileUrl: video.fileUrl,
            description: video.description,
            brand: video.brand,
            expiryDate: video.expiryDate,
          });
        } catch (error) {
          errors.push({
            serverUrl: server.rpi_serverUrl,
            message: error.message,
          });
        }
      })
    );

    if (errors.length > 0) {
      return res.status(206).json({
        success: true,
        message: "Video updated with partial server notifications",
        video,
        notificationErrors: errors,
      });
    }

    res.json({
      success: true,
      message: "Video updated successfully",
      video,
    });
  } catch (error) {
    console.error("Error updating video:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update video", error });
  }
};