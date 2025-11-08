/**
 * @swagger
 * tags:
 *   - name: Video
 *     description: Video-related endpoints
 */

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload a video
 *     description: Upload a video ad to the server and notify Raspberry Pi servers.
 *     security:
 *       - BearerAuth: []
 *     tags:
 *       - Video
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The video file to be uploaded
 *               filename:
 *                 type: string
 *                 description: The name of the video file
 *                 example: "ad_video.mp4"
 *               description:
 *                 type: string
 *                 description: Description of the video
 *                 example: "This is an ad for our latest product."
 *               brand:
 *                 type: string
 *                 description: The ID of the associated brand
 *                 example: "64f6ec53e0f5f3b0c8a5c123"
 *               expiryDate:
 *                 type: string
 *                 format: date
 *                 description: The expiry date for the video
 *                 example: "2024-12-31"
 *     responses:
 *       200:
 *         description: Video uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Video uploaded successfully"
 *                 video:
 *                   type: object
 *                   properties:
 *                     filename:
 *                       type: string
 *                       example: "ad_video.mp4"
 *                     description:
 *                       type: string
 *                       example: "This is an ad for our latest product."
 *                     brand:
 *                       type: string
 *                       example: "64f6ec53e0f5f3b0c8a5c123"
 *                     expiryDate:
 *                       type: string
 *                       example: "2024-12-31"
 *                     fileUrl:
 *                       type: string
 *                       example: "https://res.cloudinary.com/demo/video/upload/ad_video.mp4"
 *                     fileSize:
 *                       type: integer
 *                       example: 102400
 *       206:
 *         description: Video uploaded successfully, but some notifications failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Video uploaded with partial server notifications"
 *                 video:
 *                   type: object
 *                 notificationErrors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       serverUrl:
 *                         type: string
 *                         example: "http://192.168.0.101:3000"
 *                       message:
 *                         type: string
 *                         example: "Network error"
 *       400:
 *         description: Invalid input or file size exceeds the limit
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "No file uploaded or file size exceeds 350MB limit"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to upload video"
 */

/**
 * @swagger
 * /videos:
 *   get:
 *     summary: Fetch all videos
 *     description: Retrieve a list of all videos from the database.
 *     tags:
 *       - Video
 *     responses:
 *       200:
 *         description: Successfully retrieved videos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Retrieved videos"
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 videos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Video'
 *       500:
 *         description: Failed to retrieve videos
 */

/**
 * @swagger
 * /videos/filename/{filename}:
 *   get:
 *     summary: Fetch videos by filename
 *     description: Retrieve videos that match a given filename.
 *     tags:
 *       - Video
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: The filename to search for
 *     responses:
 *       200:
 *         description: Successfully retrieved videos matching the filename
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Videos found with that filename"
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 videos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Video'
 *       404:
 *         description: No videos found with the given filename
 *       500:
 *         description: Failed to retrieve videos
 */

/**
 * @swagger
 * /videos/active:
 *   get:
 *     summary: Fetch only active videos
 *     description: Retrieve videos that are still active (not expired).
 *     tags:
 *       - Video
 *     responses:
 *       200:
 *         description: Successfully retrieved active videos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Retrieved active videos"
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 videos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Video'
 *       404:
 *         description: No active videos found
 *       500:
 *         description: Failed to retrieve active videos
 */

/**
 * @swagger
 * /videos/brand/{brandId}:
 *   get:
 *     summary: Fetch videos by brand
 *     description: Retrieve videos associated with a specific brand.
 *     tags:
 *       - Video
 *     parameters:
 *       - in: path
 *         name: brandId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: The ID of the brand to search for
 *     responses:
 *       200:
 *         description: Successfully retrieved videos for the specified brand
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Retrieved videos for the specified brand"
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 videos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Video'
 *       404:
 *         description: No videos found for the specified brand
 *       500:
 *         description: Failed to retrieve videos by brand
 */

/**
 * @swagger
 * /videos/{videoId}:
 *   patch:
 *     summary: Edit video details
 *     description: Update the details of an existing video. This may include updating metadata or replacing the video file itself.
 *     security:
 *       - BearerAuth: []
 *     tags:
 *       - Video
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: The ID of the video to be updated.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               filename:
 *                 type: string
 *                 example: "updated_video.mp4"
 *               description:
 *                 type: string
 *                 example: "Updated video description"
 *               brand:
 *                 type: string
 *                 format: objectId
 *                 example: "64f6ec53e0f5f3b0c8a5c123"
 *               expiryDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-12-31"
 *               videoFile:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Video updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Video updated successfully"
 *                 video:
 *                   $ref: '#/components/schemas/Video'
 *       206:
 *         description: Video updated, but some notifications to Raspberry Pi servers failed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Video updated with partial server notifications"
 *                 video:
 *                   $ref: '#/components/schemas/Video'
 *                 notificationErrors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       serverUrl:
 *                         type: string
 *                         example: "http://rpi-server.example.com"
 *                       message:
 *                         type: string
 *                         example: "Failed to notify server"
 *       404:
 *         description: Video not found.
 *       400:
 *         description: Video file size exceeds the allowed limit of 350MB.
 *       500:
 *         description: Failed to update video.
 */

/**
 * @swagger
 * /videos/{id}:
 *   delete:
 *     summary: Delete a video
 *     description: Delete a video from the database and Cloudinary. Notifies Raspberry Pi servers about the deletion.
 *     security:
 *       - BearerAuth: []
 *     tags:
 *       - Video
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: The ID of the video to delete.
 *     responses:
 *       200:
 *         description: Video deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Video deleted successfully"
 *       404:
 *         description: Video not found.
 *       500:
 *         description: Failed to delete video.
 */