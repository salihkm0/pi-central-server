import Rpi from "../../models/rpiModel.js";

// Bulk update multiple RPi devices
export const bulkUpdateRpis = async (req, res) => {
  try {
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        message: "Updates array is required"
      });
    }

    const results = await Promise.all(
      updates.map(async (update) => {
        try {
          const { id, ...updateData } = update;
          const updatedRpi = await Rpi.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
          );

          return {
            id,
            success: true,
            data: updatedRpi
          };
        } catch (error) {
          return {
            id: update.id,
            success: false,
            error: error.message
          };
        }
      })
    );

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    res.status(200).json({
      success: true,
      message: `Bulk update completed: ${successful.length} successful, ${failed.length} failed`,
      results: {
        successful,
        failed
      }
    });

  } catch (error) {
    console.error("Bulk update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to perform bulk update",
      error: error.message
    });
  }
};

// Bulk delete multiple RPi devices
export const bulkDeleteRpis = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({
        success: false,
        message: "IDs array is required"
      });
    }

    const result = await Rpi.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} devices`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error("Bulk delete error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to perform bulk delete",
      error: error.message
    });
  }
};

// Get RPi statistics
export const getRpiStats = async (req, res) => {
  try {
    const stats = await Rpi.aggregate([
      {
        $group: {
          _id: "$rpi_status",
          count: { $sum: 1 }
        }
      }
    ]);

    const locationStats = await Rpi.aggregate([
      {
        $group: {
          _id: "$location",
          count: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ["$rpi_status", "active"] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const recentActivity = await Rpi.aggregate([
      {
        $project: {
          rpi_name: 1,
          rpi_status: 1,
          location: 1,
          last_seen: 1,
          days_since_seen: {
            $divide: [
              { $subtract: [new Date(), "$last_seen"] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      { $sort: { last_seen: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        status_distribution: stats,
        location_distribution: locationStats,
        recent_activity: recentActivity,
        total_devices: await Rpi.countDocuments(),
        online_devices: await Rpi.countDocuments({ rpi_status: "active" })
      }
    });

  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: error.message
    });
  }
};