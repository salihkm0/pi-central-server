import multer from "multer";

// Use memoryStorage to store the file in memory instead of a local folder
const storage = multer.memoryStorage();

// Create and export the multer instance directly
const upload = multer({ storage: storage });
export default upload;
