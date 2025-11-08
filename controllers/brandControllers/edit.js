import Brand from "../../models/brandModel.js";
import { cloudinary } from "../../config/cloudinary.js";

export const updateBrand = async (req, res) => {
  const { id } = req.params;
  const { name, description, phone, email, address } = req.body;

  try {
    // Find the existing brand
    const existingBrand = await Brand.findById(id);
    if (!existingBrand) {
      return res.status(404).json({ message: "Brand not found" ,success: false});
    }

    let imageUrl = existingBrand.logo; // Assuming 'logo' is the field where the image URL is stored

    // Handle image upload if a new file is provided
    if (req.file) {
      // Delete the old image from Cloudinary if it exists
      if (existingBrand.logo) {
        const publicId = existingBrand.logo.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`brands/${publicId}`); // Delete the old image
      }

      // Upload the new image to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.buffer, {
        folder: "brands",
        resource_type: "image",
      });
      imageUrl = result.secure_url;
    }

    // Update the brand with the new data
    const updatedBrand = await Brand.findByIdAndUpdate(
      id,
      {
        name,
        description,
        logo: imageUrl,  // Save the Cloudinary image URL
        phone,
        email,
        address,
      },
      { new: true }
    );

    res.status(200).json({
      message: "Brand updated successfully",
      brand: updatedBrand,
      success: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating brand",success: false });
  }
};
