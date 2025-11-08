import Video from "../../models/adsModel.js";
import Rpi from "../../models/rpiModel.js";
import { Upload } from "@aws-sdk/lib-storage";
import { s3Client } from "../../config/s3Config.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import axios from "axios";
import dotenv from "dotenv";
import streamifier from "streamifier";

dotenv.config();

// UPLOAD video
export const uploadVideo = async (req, res) => {
  const { filename, description, brand, expiryDate } = req.body;

  console.log("req.body : ", req.body)
  console.log("req.file : ", req.file)

  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    // Check file size (500MB limit)
    const fileSizeMB = req.file.size / (1024 * 1024);
    if (fileSizeMB > 500) {
      return res
        .status(400)
        .json({ success: false, message: "Video size exceeds 500MB limit." });
    }

    // Generate unique key for S3
    const fileExtension = req.file.originalname.split('.').pop();
    const key = `ads_videos/${Date.now()}-${Math.round(Math.random() * 1e9)}.${fileExtension}`;

    // Upload to S3
    const parallelUploads3 = new Upload({
      client: s3Client,
      params: {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      },
    });

    const uploadResult = await parallelUploads3.done();

    // Generate a presigned URL for the uploaded file
    const getObjectParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
    };
    
    const fileUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand(getObjectParams),
      { expiresIn: 60 * 60 * 24 * 7 } // 7 days expiration
    );

    const newVideo = await Video.create({
      filename: filename || req.file.originalname,
      description,
      brand,
      expiryDate,
      fileUrl: fileUrl,
      s3Key: key,
      fileSize: req.file.size,
      status: "active",
    });

    // Notify Raspberry Pi servers
    const rpServers = await Rpi.find();
    const errors = [];
    await Promise.all(
      rpServers.map(async (server) => {
        try {
          await axios.post(`${server.rpi_serverUrl}/download-video`, {
            filename: newVideo.filename,
            fileUrl: newVideo.fileUrl,
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
        message: "Video uploaded with partial server notifications",
        video: newVideo,
        // notificationErrors: errors,
      });
    }

    res.json({
      success: true,
      message: "Video uploaded successfully",
      video: newVideo,
    });
  } catch (error) {
    console.error("Error uploading video:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to upload video", error });
  }
};