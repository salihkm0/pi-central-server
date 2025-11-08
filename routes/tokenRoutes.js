import { verifyTokenFrontend } from "../middleware/verifyToken.js";

import express  from "express";

const jwtRoutes = express.Router();

// A route to check if the token is valid
jwtRoutes.get("/check-token",verifyTokenFrontend , (req, res) => {
  res.status(200).json({ message: "Token is valid", user: req.user ,success: true });
});

export default jwtRoutes;
