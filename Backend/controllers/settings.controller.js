import Settings from "../models/settings.model.js";
import { asyncHandler } from "../utils/asynchandler.utils.js";
import CustomError from "../middlewares/error_handler.middleware.js";
import { comparePassword } from "../utils/bcrypt.utils.js";
import User from "../models/user.model.js";

// GET /api/settings
export const getSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne().sort({ createdAt: -1 }).populate("updatedBy", "name email");

  if (!settings) {
    // Create default settings
    settings = await Settings.create({
      ratePerUnit: 10,
      marketName: "Jalpa Market",
    });
  }

  res.status(200).json({
    success: true,
    message: "Settings fetched successfully",
    data: settings,
  });
});

// PUT /api/settings/rate  — requires admin password confirmation
export const updateRate = asyncHandler(async (req, res) => {
  const { ratePerUnit, adminEmail, adminPassword } = req.body;

  if (!ratePerUnit || ratePerUnit <= 0) {
    throw new CustomError("Valid rate per unit is required", 400);
  }

  if (!adminEmail || !adminPassword) {
    throw new CustomError("Admin email and password confirmation required", 400);
  }

  // Verify admin credentials
  const admin = await User.findOne({ email: adminEmail.toLowerCase(), role: "super_admin" });
  if (!admin) {
    throw new CustomError("Invalid admin credentials", 400);
  }

  const isMatch = await comparePassword(adminPassword, admin.password);
  if (!isMatch) {
    throw new CustomError("Invalid admin credentials", 400);
  }

  const settings = await Settings.findOneAndUpdate(
    {},
    {
      ratePerUnit,
      updatedBy: req.user._id,
    },
    {
      sort: { createdAt: -1 },
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  ).populate("updatedBy", "name email");

  if (!settings) {
    throw new CustomError("Failed to update rate", 500);
  }

  res.status(200).json({
    success: true,
    message: "Rate per unit updated successfully",
    data: settings,
  });
});

// PUT /api/settings  — update general settings (requires admin confirmation)
export const updateSettings = asyncHandler(async (req, res) => {
  const { marketName, marketAddress, marketPhone, minimumCharge, adminEmail, adminPassword } = req.body;

  if (!adminEmail || !adminPassword) {
    throw new CustomError("Admin email and password confirmation required", 400);
  }

  const admin = await User.findOne({ email: adminEmail.toLowerCase(), role: "super_admin" });
  if (!admin) {
    throw new CustomError("Invalid admin credentials", 400);
  }

  const isMatch = await comparePassword(adminPassword, admin.password);
  if (!isMatch) {
    throw new CustomError("Invalid admin credentials", 400);
  }

  let settings = await Settings.findOne().sort({ createdAt: -1 });

  if (!settings) {
    settings = await Settings.create({
      marketName,
      marketAddress,
      marketPhone,
      minimumCharge,
      updatedBy: req.user._id,
    });
  } else {
    if (marketName !== undefined) settings.marketName = marketName;
    if (marketAddress !== undefined) settings.marketAddress = marketAddress;
    if (marketPhone !== undefined) settings.marketPhone = marketPhone;
    if (minimumCharge !== undefined) settings.minimumCharge = minimumCharge;
    settings.updatedBy = req.user._id;
    await settings.save();
  }

  await settings.populate("updatedBy", "name email");

  res.status(200).json({
    success: true,
    message: "Settings updated successfully",
    data: settings,
  });
});
