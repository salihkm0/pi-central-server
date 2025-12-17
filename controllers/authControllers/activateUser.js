import User from '../../models/userModel.js';

export const activateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if user is already active
    if (user.status === 'active') {
      return res.status(400).json({
        success: false,
        message: "Account is already active"
      });
    }

    // Activate user
    user.status = 'active';
    user.deactivatedAt = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Account activated successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        status: user.status
      }
    });

  } catch (error) {
    console.error("Activate user error:", error);
    res.status(500).json({
      success: false,
      message: "Error activating account",
      error: error.message
    });
  }
};