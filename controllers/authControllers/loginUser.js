import bcrypt from "bcrypt";
import User from "../../models/userModel.js";
import { generateToken } from "../../utils/jwt.js";

// Login User
export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    console.log("body : ", req.body);
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
  
    try {
      const user = await User.findOne({ email });
      if (user) {
        // Compare entered password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, user.password);
  
        if (isMatch) {
          return res.status(200).json({
            // _id: user._id,
            // username: user.username,
            // email: user.email,
            success: true,
            user: user,
            token: generateToken(user._id),
          });
        }
      }
      return res.status(401).json({ message: "Invalid credentials" ,success: false});
    } catch (error) {
      return res.status(500).json({ message: "Server error", error: error.message , success: false});
    }
  };
  