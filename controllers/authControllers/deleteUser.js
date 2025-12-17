import User from '../../models/userModel.js';
import { cloudinary } from '../../config/cloudinary.js';

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only."
      });
    }

    // Prevent self-deletion
    if (userId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete your own account"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Delete user image from Cloudinary if exists
    if (user.image) {
      const publicId = user.image.split('/').slice(-1)[0].split('.')[0];
      await cloudinary.uploader.destroy(`user_images/${publicId}`);
    }

    // Delete user from database
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: "User deleted successfully"
    });

  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: error.message
    });
  }
};