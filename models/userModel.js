import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  image : {type : String}, 
  username: { type: String, required: true, unique: true },
  firstName : { type: String},
  lastName : { type: String},
  mobile : { type: Number, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role : { type: String, enum: ["admin", "staff" ] , default: "staff" },
});

export default mongoose.model("User", userSchema);
