import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: [true, "Shop ID is required"],
    },
    billMonth: {
      type: String, // Format: "YYYY-MM" e.g. "2025-01"
      required: [true, "Bill month is required"],
    },
    previousReading: {
      type: Number,
      required: [true, "Previous reading is required"],
      min: 0,
    },
    currentReading: {
      type: Number,
      required: [true, "Current reading is required"],
      min: 0,
    },
    consumedUnit: {
      type: Number,
      required: true,
      min: 0,
    },
    ratePerUnit: {
      type: Number,
      required: [true, "Rate per unit is required"],
      min: 0,
    },
    billAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    previousDue: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "partial", "paid"],
      default: "unpaid",
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingDue: {
      type: Number,
      default: 0,
      min: 0,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    paidAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate bills for same shop+month
billSchema.index({ shopId: 1, billMonth: 1 }, { unique: true });

const Bill = mongoose.model("Bill", billSchema);
export default Bill;
