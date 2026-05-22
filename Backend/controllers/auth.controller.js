import User from "../models/user.model.js";
import Shop from "../models/shop.model.js";
import { hashPassword, comparePassword } from "../utils/bcrypt.utils.js";
import { generateJWTToken } from "../utils/jwt.utils.js";
import { asyncHandler } from "../utils/asynchandler.utils.js";
import CustomError from "../middlewares/error_handler.middleware.js";
import { cookie_config } from "../config/config.js";

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new CustomError("Email and password are required", 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() }).populate("shopId");

  if (!user) {
    throw new CustomError("Invalid email or password", 401);
  }

  if (!user.isActive) {
    throw new CustomError("Account is deactivated. Contact admin.", 403);
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw new CustomError("Invalid email or password", 401);
  }

  const token = generateJWTToken({
    _id: user._id,
    email: user.email,
    role: user.role,
  });

  res.cookie("access_token", token, cookie_config);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        shopId: user.shopId,
        phone: user.phone,
      },
      token,
    },
  });
});

// POST /api/auth/register  (super_admin only)
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, shopId, phone } = req.body;

  if (!name || !email || !password) {
    throw new CustomError("Name, email and password are required", 400);
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new CustomError("User with this email already exists", 409);
  }

  if (role === "shop_owner" && shopId) {
    const shop = await Shop.findById(shopId);
    if (!shop) {
      throw new CustomError("Shop not found", 404);
    }
  }

  const hashedPassword = await hashPassword(password);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: role || "shop_owner",
    shopId: shopId || null,
    phone: phone || null,
  });

  // If shop owner, link user to shop
  if (role === "shop_owner" && shopId) {
    await Shop.findByIdAndUpdate(shopId, { userId: user._id });
  }

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      shopId: user.shopId,
    },
  });
});

// POST /api/auth/logout
export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("access_token", {
    httpOnly: true,
    sameSite: cookie_config.sameSite,
    secure: cookie_config.secure,
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
    data: null,
  });
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("shopId").select("-password");

  if (!user) {
    throw new CustomError("User not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "User fetched successfully",
    data: user,
  });
});

// PUT /api/auth/profile
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, phone },
    { new: true, runValidators: true }
  ).select("-password");

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: user,
  });
});

// PUT /api/auth/change-password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new CustomError("Current and new password are required", 400);
  }

  const user = await User.findById(req.user._id);
  const isMatch = await comparePassword(currentPassword, user.password);

  if (!isMatch) {
    throw new CustomError("Current password is incorrect", 400);
  }

  user.password = await hashPassword(newPassword);
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
    data: null,
  });
});
