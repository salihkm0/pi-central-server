/**
 * @swagger
 * tags:
 *   - name: Users (Rpi)
 *     description: Users (Raspberry Pi) Related API
 */


/**
 * @swagger
 * /rpi:
 *   post:
 *     summary: Create a new Raspberry Pi
 *     tags: [Users (Rpi)]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the Raspberry Pi
 *               model:
 *                 type: string
 *                 description: Model of the Raspberry Pi
 *               status:
 *                 type: string
 *                 description: Status of the Raspberry Pi
 *             example:
 *               name: "Raspberry Pi 4"
 *               model: "Model B"
 *               status: "active"
 *     responses:
 *       201:
 *         description: Raspberry Pi created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /rpi/{id}:
 *   put:
 *     summary: Update an existing Raspberry Pi
 *     tags: [Users (Rpi)]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the Raspberry Pi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated name of the Raspberry Pi
 *               model:
 *                 type: string
 *                 description: Updated model of the Raspberry Pi
 *               status:
 *                 type: string
 *                 description: Updated status of the Raspberry Pi
 *             example:
 *               name: "Raspberry Pi 3"
 *               model: "Model A"
 *               status: "in_active"
 *     responses:
 *       200:
 *         description: Raspberry Pi updated successfully
 *       404:
 *         description: Raspberry Pi not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /rpi/{id}/status:
 *   patch:
 *     summary: Update the status of a Raspberry Pi
 *     tags: [Users (Rpi)]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the Raspberry Pi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rpi_status:
 *                 type: string
 *                 enum: [active, in_active]
 *                 description: New status for the Raspberry Pi
 *             example:
 *               rpi_status: "active"
 *     responses:
 *       200:
 *         description: Raspberry Pi status updated successfully
 *       400:
 *         description: Invalid status value
 *       404:
 *         description: Raspberry Pi not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /rpi:
 *   get:
 *     summary: Get all Raspberry Pis
 *     tags: [Users (Rpi)]
 *     responses:
 *       200:
 *         description: List of all Raspberry Pis
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Unique ID of the Raspberry Pi
 *                   name:
 *                     type: string
 *                     description: Name of the Raspberry Pi
 *                   model:
 *                     type: string
 *                     description: Model of the Raspberry Pi
 *                   status:
 *                     type: string
 *                     description: Status of the Raspberry Pi
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /rpi/{id}:
 *   get:
 *     summary: Get a Raspberry Pi by ID
 *     tags: [Users (Rpi)]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the Raspberry Pi
 *     responses:
 *       200:
 *         description: Raspberry Pi details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Unique ID of the Raspberry Pi
 *                 name:
 *                   type: string
 *                   description: Name of the Raspberry Pi
 *                 model:
 *                   type: string
 *                   description: Model of the Raspberry Pi
 *                 status:
 *                   type: string
 *                   description: Status of the Raspberry Pi
 *       404:
 *         description: Raspberry Pi not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /rpi/{id}:
 *   delete:
 *     summary: Delete a Raspberry Pi by ID
 *     tags: [Users (Rpi)]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the Raspberry Pi
 *     responses:
 *       200:
 *         description: Raspberry Pi deleted successfully
 *       404:
 *         description: Raspberry Pi not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /rpi/get-wifi/{rpi_id}:
 *   get:
 *     summary: Get WiFi details for a specific Raspberry Pi
 *     tags: [Users (Rpi)]
 *     parameters:
 *       - in: path
 *         name: rpi_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the Raspberry Pi
 *     responses:
 *       200:
 *         description: WiFi details fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Response message
 *                 success:
 *                   type: boolean
 *                   description: Success status
 *                 wifi_ssid:
 *                   type: string
 *                   description: The WiFi SSID
 *                 wifi_password:
 *                   type: string
 *                   description: The WiFi password
 *       404:
 *         description: Raspberry Pi not found
 *       500:
 *         description: Internal server error
 */
