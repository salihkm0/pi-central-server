import User from '../../models/userModel.js';

export const deactivateUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if user is already deactivated
    if (user.status === 'inactive') {
      return res.status(400).json({
        success: false,
        message: "Account is already deactivated"
      });
    }

    // Deactivate user
    user.status = 'inactive';
    user.deactivatedAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: "Account deactivated successfully"
    });

  } catch (error) {
    console.error("Deactivate user error:", error);
    res.status(500).json({
      success: false,
      message: "Error deactivating account",
      error: error.message
    });
  }
};