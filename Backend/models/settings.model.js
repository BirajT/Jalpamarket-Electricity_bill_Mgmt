import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    ratePerUnit: {
      type: Number,
      required: [true, "Rate per unit is required"],
      min: [0, "Rate must be non-negative"],
      default: 10,
    },
    minimumCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    marketName: {
      type: String,
      default: "Jalpa Market",
      trim: true,
    },
    marketAddress: {
      type: String,
      default: "",
      trim: true,
    },
    marketPhone: {
      type: String,
      default: "",
      trim: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Settings = mongoose.model("Settings", settingsSchema);
export default Settings;
