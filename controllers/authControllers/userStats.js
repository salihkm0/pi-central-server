import User from '../../models/userModel.js';

export const getUserStats = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only."
      });
    }

    // Get total count of users
    const totalUsers = await User.countDocuments();

    // Get count by role
    const adminCount = await User.countDocuments({ role: 'admin' });
    const staffCount = await User.countDocuments({ role: 'staff' });

    // Get count by status
    const activeUsers = await User.countDocuments({ status: 'active' });
    const inactiveUsers = await User.countDocuments({ status: 'inactive' });

    // Get users created in last 7 days
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const newUsers = await User.countDocuments({
      createdAt: { $gte: last7Days }
    });

    // Get users by month for chart
    const monthlyStats = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $limit: 6 // Last 6 months
      }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        total: totalUsers,
        byRole: {
          admin: adminCount,
          staff: staffCount
        },
        byStatus: {
          active: activeUsers,
          inactive: inactiveUsers
        },
        recent: {
          last7Days: newUsers
        },
        monthlyStats
      }
    });

  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user statistics",
      error: error.message
    });
  }
};