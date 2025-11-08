import Brand from "../../models/brandModel.js"; 

export const deleteBrand = async (req, res) => {
    const { id } = req.params;
    try {
      const deletedBrand = await Brand.findByIdAndDelete(id);
      if (!deletedBrand) {
        return res.status(404).json({ message: "Brand not found" ,success: false});
      }
  
      res.status(200).json({ message: "Brand deleted successfully",success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error deleting brand" ,success: false});
    }
  };