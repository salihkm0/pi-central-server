import Rpi from "../../models/rpiModel.js";

// Create a new Raspberry Pi entry
export const createRpi = async (req, res) => {
  try {
    const {
      rpi_id,
      rpi_name,
      wifi_ssid,
      wifi_password,
      vehicle_no,
      owner_name,
      owner_phone,
      location,
    } = req.body;

    console.log("req.body: " + JSON.stringify(req.body))

    if (
      !rpi_id ||
      !rpi_name ||
      !vehicle_no ||
      !owner_name ||
      !owner_phone ||
      !location
    ) {
      return res.status(400).json({
        message:
          "Please fill required fields. rpi_name, vehicle_no , owner_name , owner_phone , location.",
        success: false,
      });
    }

    const newRpi = new Rpi({
      rpi_id,
      rpi_name,
      wifi_ssid,
      wifi_password,
      vehicle_no,
      owner_name,
      owner_phone,
      location,
      rpi_status:"in_active",
    });

    const savedRpi = await newRpi.save();
    console.log({
      message: "Raspberry Pi saved successfully " ,  rpis : savedRpi,
    });
    res.status(201).json({
      success: true,
      message: "Raspberry Pi saved successfully ", rpis : savedRpi,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to create Raspberry Pi",
      error: error,
      success: false,
    });
  }
};
