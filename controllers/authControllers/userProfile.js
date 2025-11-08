import User from "../../models/userModel.js";

// Get User Profile
export const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (user) {
    return res.status(200).json({user : user , success: true});
  } else {
    return res.status(404).json({ message: "User not found" ,success: false});
  }
};
