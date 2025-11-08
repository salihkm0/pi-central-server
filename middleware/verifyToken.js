import jwt from "jsonwebtoken";
// Middleware to check if the JWT is valid
export const verifyTokenFrontend = (req, res, next) => {
  // Get token from the Authorization header
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(403).json({ message: "No token provided",success: false  });
  }

  // Verify token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token",success: false  });
    }
    req.user = decoded;
    next();
  });
};
