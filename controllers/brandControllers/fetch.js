import Brand from "../../models/brandModel.js"; 


// Get all Brands
export const getAllBrands = async (req, res) => {
    try {
      const brands = await Brand.find(); // Fetch all brands from the database
      res.status(200).json({ brands : brands ,success: true , message: "Brands successfully fetched",});
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching brands",success: false });
    }
  };
  
  // Get a Brand by ID
  export const getBrandById = async (req, res) => {
    const { id } = req.params;
    try {
      const brand = await Brand.findById(id); // Find brand by ID
      if (!brand) {
        return res.status(404).json({ message: "Brand not found",success: false });
      }
      res.status(200).json({ brand : brand ,success: true , message: "Brand successfully fetched",});
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching brand by ID",success: false });
    }
  };