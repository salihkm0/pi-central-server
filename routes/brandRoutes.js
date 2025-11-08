// import express from "express";
// import { createBrand } from "../controllers/brandControllers/add.js";
// import {
//   getAllBrands,
//   getBrandById,
// } from "../controllers/brandControllers/fetch.js";
// import { updateBrand } from "../controllers/brandControllers/edit.js";
// import { deleteBrand } from "../controllers/brandControllers/delete.js";
// import upload from "../middleware/uploadMiddleware.js";

// const brandRouter = express.Router();

// brandRouter.route("/").post(createBrand ,upload.single("image")).get(getAllBrands);
// brandRouter
//   .route("/:id")
//   .get(getBrandById)
//   .put(updateBrand,upload.single("image"))
//   .delete(deleteBrand);

// export default brandRouter;


import express from "express";
import { createBrand } from "../controllers/brandControllers/add.js";
import {
  getAllBrands,
  getBrandById,
} from "../controllers/brandControllers/fetch.js";
import { updateBrand } from "../controllers/brandControllers/edit.js";
import { deleteBrand } from "../controllers/brandControllers/delete.js";
import upload from "../middleware/uploadMiddleware.js";

const brandRouter = express.Router();

// Route to create a brand (with image upload) and fetch all brands
brandRouter.post("/", upload.single("logo"), createBrand);
brandRouter.get("/", getAllBrands);

// Route to get, update (with image upload), and delete a brand by ID
brandRouter.get("/:id", getBrandById);
brandRouter.put("/:id", upload.single("logo"), updateBrand);
brandRouter.delete("/:id", deleteBrand);

export default brandRouter;
