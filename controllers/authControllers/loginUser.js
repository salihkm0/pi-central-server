import bcrypt from "bcrypt";
import User from "../../models/userModel.js";
import { generateToken } from "../../utils/jwt.js";

// Login User
export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        message: "All fields are required",
        success: false 
      });
    }
  
    try {
      const user = await User.findOne({ email });
      if (user) {
        // Check if account is active
        if (user.status === 'inactive') {
          return res.status(403).json({
            success: false,
            message: "Account is deactivated. Please contact administrator."
          });
        }

        // Compare entered password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, user.password);
  
        if (isMatch) {
          // Update login stats
          user.lastLogin = new Date();
          user.loginCount = (user.loginCount || 0) + 1;
          await user.save();

          // Remove sensitive data from response
          const userResponse = user.toObject();
          delete userResponse.password;
          delete userResponse.resetPasswordToken;
          delete userResponse.resetPasswordExpires;

          return res.status(200).json({
            success: true,
            user: userResponse,
            token: generateToken(user._id),
          });
        }
      }
      return res.status(401).json({ 
        message: "Invalid credentials",
        success: false 
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ 
        message: "Server error", 
        error: error.message, 
        success: false 
      });
    }
  };