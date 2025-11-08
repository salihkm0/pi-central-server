import cloudinary from 'cloudinary';
import Brand from '../../models/brandModel.js'; // Adjust the path as necessary

export const createBrand = async (req, res) => {
  try {
    console.log("Request Body: ", req.body);

    const { name, phone, email, address, description } = req.body;

    if(!name || !phone || !email || !address){
      return res.json({message: 'Name , Phone , Email, address are required',success: false});
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Logo file is required' ,success: false});
    }

    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        { folder: 'brands' },
        (error, result) => {
          if (error) {
            reject(new Error(error.message)); 
          } else {
            resolve(result);
          }
        }
      );

      uploadStream.end(req.file.buffer);
    });

    const result = await uploadPromise;

    console.log('Upload Result:', result);

    const newBrand = new Brand({
      name,
      phone,
      email,
      address,
      description,
      logo: result.secure_url, 
    });

    await newBrand.save();

    res.status(201).json({
      success: true,
      message: 'Brand created successfully',
      brand: newBrand,
    });
  } catch (error) {
    console.error('Error creating brand:', error)
      res.status(500).json({message: 'Filed to create Brand', error: error.message ,success: true,});
  }
};
