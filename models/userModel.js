import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  image: { type: String },
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true 
  },
  firstName: { 
    type: String,
    required: true,
    trim: true 
  },
  lastName: { 
    type: String,
    trim: true 
  },
  mobile: { 
    type: Number, 
    required: true 
  },
  email: { 
    type: String, 
    unique: true,
    lowercase: true,
    trim: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ["admin", "staff"], 
    default: "staff" 
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active"
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  deactivatedAt: Date,
  lastLogin: Date,
  loginCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

export default mongoose.model("User", userSchema);