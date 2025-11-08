import mongoose from "mongoose";

const adsModelSchema = new mongoose.Schema(
  {
    s3Key: String,
    filename: { type: String, required: true },
    fileUrl: { type: String, required: true },
    description: String,
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "brand",
      required: true,
    },
    fileSize: Number,
    expiryDate: Date,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("ads", adsModelSchema);
