import mongoose from "mongoose";

const brandModelSchema = new mongoose.Schema(
  {
    name: { type : 'string' ,required: true,unique: true},
    description: { type: 'string' },
    logo: { type: 'string' },
    phone: { type: 'string' ,required: true},
    email: { type: 'string' },
    address: { type: 'string' },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("brand", brandModelSchema);
