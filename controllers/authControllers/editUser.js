// import User from "../../models/userModel.js";

// // Edit User Function
// export const editUser = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const updateData = req.body;

//     if (updateData.password) {
//       return res
//         .status(400)
//         .send({
//           message:
//             "Password updates not allowed here. Use the change password endpoint.",
//             success: false 
//         });
//     }

//     const updatedUser = await User.findByIdAndUpdate(
//       userId,
//       updateData,
//       { new: true }
//     );

//     if (!updatedUser) {
//       return res.status(404).send({ message: "User not found" ,success: false});
//     }

//     res.status(200).send({
//       message: "User updated successfully",
//       user: updatedUser,
//       success: true
//     });
//   } catch (error) {
//     console.error(error);
//     res
//       .status(500)
//       .send({ message: "Failed to update user", error: error.message,success: false });
//   }
// };


// import User from "../../models/userModel.js";
// import { cloudinary } from "../../config/cloudinary.js";

// export const editUser = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const updateData = req.body;

//     if (updateData.password) {
//       return res.status(400).send({
//         message: "Password updates not allowed here. Use the change password endpoint.",
//         success: false,
//       });
//     }

//     // Retrieve the user before updating
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).send({ message: "User not found", success: false });
//     }

//     // Check if a new file (image) is uploaded
//     if (req.file) {
//       // If the user has an existing image, delete it from Cloudinary
//       if (user.image) {
//         const publicId = user.image.split('/').slice(-1)[0].split('.')[0]; // Extract public_id from URL
//         await cloudinary.uploader.destroy(`user_images/${publicId}`);
//       }

//       // Upload new image to Cloudinary
//       const uploadedImage = await new Promise((resolve, reject) => {
//         const uploadStream = cloudinary.uploader.upload_stream(
//           { folder: "user_images" },
//           (error, result) => {
//             if (error) reject(error);
//             else resolve(result);
//           }
//         );
//         req.file.buffer.pipe(uploadStream); // Stream the buffer
//       });

//       // Add the new image URL to the updateData
//       updateData.image = uploadedImage.secure_url;
//     }
//     else{
//       console.log("image not found");
//     }

//     // Update the user with the new data
//     const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

//     console.log("user updated:", updatedUser);

//     res.status(200).send({
//       message: "User updated successfully",
//       user: updatedUser,
//       success: true,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({
//       message: "Failed to update user",
//       error: error.message,
//       success: false,
//     });
//   }
// };


// import User from "../../models/userModel.js";
// import { cloudinary } from "../../config/cloudinary.js";

// export const editUser = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const updateData = req.body;

//     if (updateData.password) {
//       return res.status(400).send({
//         message: "Password updates not allowed here. Use the change password endpoint.",
//         success: false,
//       });
//     }

//     // Retrieve the user before updating
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).send({ message: "User not found", success: false });
//     }

//     // Check if a new file (image) is uploaded
//     if (req.file && req.file.buffer) {
//       // If the user has an existing image, delete it from Cloudinary
//       if (user.image) {
//         const publicId = user.image.split('/').slice(-1)[0].split('.')[0]; // Extract public_id from URL
//         await cloudinary.uploader.destroy(`user_images/${publicId}`);
//       }

//       // Upload new image to Cloudinary
//       const uploadedImage = await new Promise((resolve, reject) => {
//         const uploadStream = cloudinary.uploader.upload_stream(
//           { folder: "user_images" },
//           (error, result) => {
//             if (error) reject(error);
//             else resolve(result);
//           }
//         );

//         uploadStream.end(req.file.buffer); // Pass the file buffer to the upload stream
//       });

//       // Add the new image URL to the updateData
//       updateData.image = uploadedImage.secure_url;
//     } else {
//       console.log("No file uploaded");
//     }

//     // Update the user with the new data
//     const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

//     console.log("User updated:", updatedUser);

//     res.status(200).send({
//       message: "User updated successfully",
//       user: updatedUser,
//       success: true,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({
//       message: "Failed to update user",
//       error: error.message,
//       success: false,
//     });
//   }
// };


import User from "../../models/userModel.js";
import { cloudinary } from "../../config/cloudinary.js";

export const editUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    if (updateData.password) {
      return res.status(400).send({
        message: "Password updates not allowed here. Use the change password endpoint.",
        success: false,
      });
    }

    // Retrieve the user before updating
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ message: "User not found", success: false });
    }

    // Check if a new file (image) is uploaded
    if (req.file && req.file.buffer) {
      // Delete the old image if it exists
      if (user.image) {
        const publicId = user.image.split('/').slice(-1)[0].split('.')[0]; // Extract public_id from URL
        await cloudinary.uploader.destroy(`user_images/${publicId}`);
      }

      // Upload the new image
      const uploadedImage = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "user_images" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      updateData.image = uploadedImage.secure_url; // Add new image URL to updateData
    }

    // Update user details
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

    res.status(200).send({
      message: "User updated successfully",
      user: updatedUser,
      success: true,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).send({
      message: "Failed to update user",
      error: error.message,
      success: false,
    });
  }
};
