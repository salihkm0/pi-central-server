/**
 * @swagger
 * tags:
 *   - name: Brands
 *     description: Brands Related API
 */

/**
 * @swagger
 * /brands:
 *   post:
 *     summary: Create a new brand
 *     description: Add a new brand with name, phone, email, address, description, and logo.
 *     security:
 *       - BearerAuth: []
 *     tags:
 *       - Brands
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               address:
 *                 type: string
 *               description:
 *                 type: string
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Brand created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 brand:
 *                   type: object
 *       400:
 *         description: Bad request (e.g., missing fields or logo file not provided)
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /brands/{id}:
 *   put:
 *     summary: Update a brand by ID
 *     description: Update a brand's details (including optional logo upload) by its ID.
 *     security:
 *       - BearerAuth: []
 *     tags:
 *       - Brands
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the brand to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               address:
 *                 type: string
 *               description:
 *                 type: string
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Brand updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 brand:
 *                   type: object
 *       404:
 *         description: Brand not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /brands:
 *   get:
 *     summary: Get all brands
 *     description: Retrieve a list of all brands in the database.
 *     tags:
 *       - Brands
 *     responses:
 *       200:
 *         description: List of all brands
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /brands/{id}:
 *   get:
 *     summary: Get a brand by ID
 *     description: Retrieve details of a specific brand by its ID.
 *     tags:
 *       - Brands
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the brand to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Brand details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Brand not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /brands/{id}:
 *   delete:
 *     summary: Delete a brand by ID
 *     description: Remove a brand from the database using its ID.
 *     security:
 *       - BearerAuth: []
 *     tags:
 *       - Brands
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the brand to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Brand deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Brand not found
 *       500:
 *         description: Internal server error
 */
