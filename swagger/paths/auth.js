/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: Authentication Related API
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account with username, email, password, and additional details including profile image.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Username of the user
 *               email:
 *                 type: string
 *                 description: Email address of the user
 *               password:
 *                 type: string
 *                 description: Password for the user account
 *               firstName:
 *                 type: string
 *                 description: First name of the user
 *               lastName:
 *                 type: string
 *                 description: Last name of the user
 *               mobile:
 *                 type: string
 *                 description: Mobile number of the user
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Profile image file
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: User ID
 *                 username:
 *                   type: string
 *                   description: Username of the user
 *                 email:
 *                   type: string
 *                   description: Email of the user
 *                 token:
 *                   type: string
 *                   description: Authentication token
 *       400:
 *         description: Bad request (e.g., missing fields or user already exists)
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /auth/edit/{userId}:
 *   put:
 *     summary: Edit user details
 *     description: Update user information including optional profile image upload. Password updates are not allowed.
 *     security:
 *       - BearerAuth: []
 *     tags:
 *       - Authentication
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to be updated
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Updated username of the user
 *               email:
 *                 type: string
 *                 description: Updated email address of the user
 *               firstName:
 *                 type: string
 *                 description: Updated first name of the user
 *               lastName:
 *                 type: string
 *                 description: Updated last name of the user
 *               mobile:
 *                 type: string
 *                 description: Updated mobile number of the user
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: New profile image file (optional)
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: User ID
 *                     username:
 *                       type: string
 *                       description: Updated username of the user
 *                     email:
 *                       type: string
 *                       description: Updated email of the user
 *                     firstName:
 *                       type: string
 *                       description: Updated first name of the user
 *                     lastName:
 *                       type: string
 *                       description: Updated last name of the user
 *                     mobile:
 *                       type: string
 *                       description: Updated mobile number of the user
 *                     image:
 *                       type: string
 *                       description: URL of the updated profile image
 *       400:
 *         description: Bad request (e.g., password updates not allowed)
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */


/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     description: Authenticate a user with email and password.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                 token:
 *                   type: string
 *       400:
 *         description: Missing fields in the request
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve the profile of the currently authenticated user.
 *     security:
 *       - BearerAuth: []
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       500:
 *         description: Internal server error
 */