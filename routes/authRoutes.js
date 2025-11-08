import express from "express";
import { registerUser } from "../controllers/authControllers/registerUser.js";
import { loginUser } from "../controllers/authControllers/loginUser.js";
import { protect } from "../middleware/authMiddleware.js";
import { getUserProfile } from "../controllers/authControllers/userProfile.js";
import { editUser } from "../controllers/authControllers/editUser.js";
import upload from "../middleware/uploadMiddleware.js";

const authRoutes = express.Router();

authRoutes.post("/register",upload.single("image") ,registerUser);
authRoutes.post("/login", loginUser);
authRoutes.get("/profile", protect, getUserProfile);
authRoutes.put("/edit/:userId" ,protect ,upload.single("image") , editUser)

export default authRoutes;
