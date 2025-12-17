import express from "express";
import { registerUser } from "../controllers/authControllers/registerUser.js";
import { loginUser } from "../controllers/authControllers/loginUser.js";
import { protect } from "../middleware/authMiddleware.js";
import { getUserProfile } from "../controllers/authControllers/userProfile.js";
import { editUser } from "../controllers/authControllers/editUser.js";
import { forgotPassword } from "../controllers/authControllers/forgotPassword.js";
import { resetPassword } from "../controllers/authControllers/resetPassword.js";
import { changePassword } from "../controllers/authControllers/changePassword.js";
import { deactivateUser } from "../controllers/authControllers/deactivateUser.js";
import { activateUser } from "../controllers/authControllers/activateUser.js";
import { getAllUsers } from "../controllers/authControllers/getAllUsers.js";
import { deleteUser } from "../controllers/authControllers/deleteUser.js";
import { getUserStats } from "../controllers/authControllers/userStats.js";
import upload from "../middleware/uploadMiddleware.js";

const authRoutes = express.Router();

// Public routes
authRoutes.post("/register", upload.single("image"), registerUser);
authRoutes.post("/login", loginUser);
authRoutes.post("/forgot-password", forgotPassword);
authRoutes.post("/reset-password/:token", resetPassword);

// Protected routes (require authentication)
authRoutes.get("/profile", protect, getUserProfile);
authRoutes.put("/edit/:userId", protect, upload.single("image"), editUser);
authRoutes.put("/change-password", protect, changePassword);
authRoutes.put("/deactivate", protect, deactivateUser);

// Admin only routes
authRoutes.get("/users", protect, getAllUsers);
authRoutes.get("/stats", protect, getUserStats);
authRoutes.put("/activate/:userId", protect, activateUser);
authRoutes.delete("/delete/:userId", protect, deleteUser);

export default authRoutes;