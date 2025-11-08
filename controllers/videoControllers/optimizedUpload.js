import { Upload } from "@aws-sdk/lib-storage";
import { s3Client } from "../../config/s3Config.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import Video from "../../models/adsModel.js";
import { queueVideoSync } from "../../services/queueService.js";
import config from "../../config/config.js";

export const optimizedUploadVideo = async (req, res) => {
  const { filename, description, brand, expiryDate } = req.body;

  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "No file uploaded" 
      });
    }

    // Enhanced validation
    const fileSizeMB = req.file.size / (1024 * 1024);
    if (fileSizeMB > config.video.maxFileSize) {
      return res.status(400).json({ 
        success: false, 
        message: `Video size exceeds ${config.video.maxFileSize / (1024 * 1024)}MB limit.` 
      });
    }

    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    if (!config.video.allowedFormats.includes(fileExtension)) {
      return res.status(400).json({
        success: false,
        message: `Invalid file format. Allowed formats: ${config.video.allowedFormats.join(', ')}`
      });
    }

    // Generate unique key
    const key = `ads_videos/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;

    // Upload with progress tracking (for large files)
    const parallelUpload = new Upload({
      client: s3Client,
      params: {
        Bucket: config.aws.bucketName,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        Metadata: {
          'uploaded-by': req.user?.id || 'system',
          'original-filename': req.file.originalname
        }
      },
      queueSize: 4, // Optional concurrency configuration
      partSize: 10 * 1024 * 1024, // 10MB parts
    });

    const uploadResult = await parallelUpload.done();

    // Generate presigned URL
    const fileUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: config.aws.bucketName,
        Key: key,
      }),
      { expiresIn: config.video.presignedUrlExpiry }
    );

    // Create video record
    const newVideo = await Video.create({
      filename: filename || req.file.originalname,
      description,
      brand,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      fileUrl,
      s3Key: key,
      fileSize: req.file.size,
      status: "active",
      uploadedBy: req.user?.id
    });

    // Queue video sync (non-blocking)
    queueVideoSync(newVideo, 'create')
      .then(job => {
        console.log(`Video sync queued with job ID: ${job.id}`);
      })
      .catch(error => {
        console.error('Failed to queue video sync:', error);
      });

    res.json({
      success: true,
      message: "Video uploaded successfully",
      video: newVideo,
      syncStatus: "queued"
    });

  } catch (error) {
    console.error("Error uploading video:", error);
    
    // Clean up uploaded file if database operation fails
    if (req.file && key) {
      try {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: config.aws.bucketName,
          Key: key
        }));
      } catch (cleanupError) {
        console.error("Failed to clean up uploaded file:", cleanupError);
      }
    }

    res.status(500).json({ 
      success: false, 
      message: "Failed to upload video", 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};