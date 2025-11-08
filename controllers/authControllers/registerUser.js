// import bcrypt from "bcrypt";
// import User from "../../models/userModel.js";
// import { generateToken } from "../../utils/jwt.js";

// export const registerUser = async (req, res) => {
//     const { username, email, password , firstName,lastName,mobile} = req.body;

//     if (!username || !email || !password || !firstName || !lastName || !mobile) {
//       return res.status(400).json({ message: "All fields are required", success: false });
//     }

//     try {
//       const userExists = await User.findOne({ email });
//       if (userExists) {
//         return res.status(400).json({ message: "User already exists" ,success: false });
//       }

//       // Hash the password
//       const salt = await bcrypt.genSalt(10);
//       const hashedPassword = await bcrypt.hash(password, salt);

//       const user = await User.create({
//         username,
//         email,
//         password: hashedPassword,
//       });

//       return res.status(201).json({
//         success: true,
//         _id: user._id,
//         username: user.username,
//         email: user.email,
//         token: generateToken(user._id),
//       });
//     } catch (error) {
//       return res.status(500).json({ message: "Server error", error: error.message , success: false });
//     }
//   };

// import bcrypt from "bcrypt";
// import User from "../../models/userModel.js";
// import { generateToken } from "../../utils/jwt.js";
// import { cloudinary } from "../../config/cloudinary.js";

// export const registerUser = async (req, res) => {

//   const { username, email, password, firstName, lastName, mobile } = req.body;

//   if (!username || !email || !password || !firstName || !lastName || !mobile) {
//     return res.status(400).json({
//       message: "All fields are required",
//       success: false,
//     });
//   }

//   try {
//     const userExists = await User.findOne({ email });
//     if (userExists) {
//       return res.status(400).json({ message: "User already exists", success: false });
//     }

//     // Handle Image Upload
//     let imageUrl = null;

//     if (req.file) {
//       const uploadedImage = await cloudinary.uploader.upload_stream(
//         {
//           folder: "user_images",
//         },
//         (error, result) => {
//           if (error) {
//             console.error("Cloudinary Error:", error);
//             throw new Error("Image upload failed");
//           }
//           return result;
//         }
//       ).end(req.file.buffer);
//       imageUrl = uploadedImage.secure_url;
//     }
//     else{
//       console.log("image not found");
//     }

//     // Hash the password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     const user = await User.create({
//       username,
//       email,
//       password: hashedPassword,
//       firstName,
//       lastName,
//       mobile,
//       image: imageUrl, // Store image URL
//     });

//     console.log("user created", user);

//     return res.status(201).json({
//       success: true,
//       _id: user._id,
//       username: user.username,
//       email: user.email,
//       token: generateToken(user._id),
//     });
//   } catch (error) {
//     return res.status(500).json({
//       message: "Server error",
//       error: error.message,
//       success: false,
//     });
//   }
// };

import bcrypt from "bcrypt";
import User from "../../models/userModel.js";
import { generateToken } from "../../utils/jwt.js";
import { cloudinary } from "../../config/cloudinary.js";

export const registerUser = async (req, res) => {
  const { username, email, password, firstName, lastName, mobile } = req.body;

  if (!username || !email || !password || !firstName || !lastName || !mobile) {
    return res.status(400).json({
      message: "All fields are required",
      success: false,
    });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "User already exists", success: false });
    }

    // Handle Image Upload
    let imageUrl = null;
    if (req.file && req.file.buffer) {
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
      imageUrl = uploadedImage.secure_url;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      mobile,
      image: imageUrl, // Store image URL
    });
    console.log("User created", user);
    return res.status(201).json({
      success: true,
      _id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
      success: false,
    });
  }
};
