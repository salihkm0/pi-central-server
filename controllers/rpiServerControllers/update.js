import Rpi from "../../models/rpiModel.js";

// Update Raspberry Pi by rpi_id
export const updateRpi = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedRpi = await Rpi.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedRpi) {
      return res.status(404).json({ message: "Raspberry Pi not found" });
    }

    res
      .status(200)
      .json({
        success: true,
        message: "Raspberry Pi updated successfully " + updatedRpi,
      });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to update Raspberry Pi", error: error });
  }
};

// Update Raspberry Pi status by rpi_id
export const updateRpiStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { rpi_status } = req.body;

    if (!["active", "in_active"].includes(rpi_status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const updatedRpi = await Rpi.findByIdAndUpdate(
      { id },
      { rpi_status },
      { new: true }
    );

    if (!updatedRpi) {
      return res.status(404).json({ message: "Raspberry Pi not found" });
    }

    res
      .status(200)
      .json({
        success: true,
        message: "Raspberry Pi status updated successfully " + updatedRpi,
      });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to update Raspberry Pi status", error: error });
  }
};
