import Shop from "../models/shop.model.js";
import User from "../models/user.model.js";
import Bill from "../models/bill.model.js";
import { asyncHandler } from "../utils/asynchandler.utils.js";
import CustomError from "../middlewares/error_handler.middleware.js";
import { hashPassword } from "../utils/bcrypt.utils.js";
import { getPagination } from "../utils/pagination.utils.js";

// GET /api/shops
export const getShops = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search = "", isActive } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = {};
  if (search) {
    filter.$or = [
      { shopName: { $regex: search, $options: "i" } },
      { shopNumber: { $regex: search, $options: "i" } },
      { ownerName: { $regex: search, $options: "i" } },
    ];
  }
  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }

  const [shops, total] = await Promise.all([
    Shop.find(filter)
      .populate("userId", "name email role")
      .collation({ locale: "en", numericOrdering: true })
      .sort({ shopNumber: 1 })
      .skip(skip)
      .limit(Number(limit)),
    Shop.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: "Shops fetched successfully",
    data: shops,
    pagination: getPagination(total, Number(page), Number(limit)),
  });
});

// GET /api/shops/:id
export const getShopById = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.id).populate("userId", "name email role phone");

  if (!shop) {
    throw new CustomError("Shop not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Shop fetched successfully",
    data: shop,
  });
});

// POST /api/shops
export const createShop = asyncHandler(async (req, res) => {
  const {
    shopName,
    shopNumber,
    ownerName,
    phone,
    email,
    address,
    password,
  } = req.body;

  if (!shopName || !shopNumber || !ownerName) {
    throw new CustomError("Shop name, number and owner name are required", 400);
  }

  const normalizedShopNumber = String(shopNumber).trim();
  if (!normalizedShopNumber) {
    throw new CustomError("Shop number is required", 400);
  }

  const existingShop = await Shop.findOne({ shopNumber: normalizedShopNumber });
  if (existingShop) {
    throw new CustomError("Shop with this number already exists", 409);
  }

  if (password && !email) {
    throw new CustomError("Shop owner email is required when password is provided", 400);
  }

  if (password) {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new CustomError("User with this email already exists", 409);
    }
  }

  const shop = await Shop.create({
    shopName,
    shopNumber: normalizedShopNumber,
    ownerName,
    phone: phone || null,
    email: email || null,
    address: address || null,
  });

  let shopOwner = null;
  if (password) {
    const hashedPassword = await hashPassword(password);

    shopOwner = await User.create({
      name: ownerName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "shop_owner",
      shopId: shop._id,
      phone: phone || null,
    });

    await Shop.findByIdAndUpdate(shop._id, { userId: shopOwner._id });
  }

  res.status(201).json({
    success: true,
    message: "Shop created successfully",
    data: {
      shop,
      shopOwner: shopOwner
        ? {
            _id: shopOwner._id,
            name: shopOwner.name,
            email: shopOwner.email,
            role: shopOwner.role,
            shopId: shopOwner.shopId,
          }
        : null,
    },
  });
});

// PUT /api/shops/:id
export const updateShop = asyncHandler(async (req, res) => {
  const { shopName, shopNumber, ownerName, phone, email, address, isActive } = req.body;

  const shop = await Shop.findById(req.params.id);
  if (!shop) {
    throw new CustomError("Shop not found", 404);
  }

  // Check duplicate shopNumber if changed
  if (shopNumber) {
    const normalizedShopNumber = String(shopNumber).trim();
    if (normalizedShopNumber !== shop.shopNumber) {
      const existing = await Shop.findOne({ shopNumber: normalizedShopNumber, _id: { $ne: shop._id } });
      if (existing) {
        throw new CustomError("Shop with this number already exists", 409);
      }
    }
  }

  const updated = await Shop.findByIdAndUpdate(
    req.params.id,
    { shopName, shopNumber: shopNumber ? String(shopNumber).trim() : shop.shopNumber, ownerName, phone, email, address, isActive },
    { new: true, runValidators: true }
  ).populate("userId", "name email role");

  res.status(200).json({
    success: true,
    message: "Shop updated successfully",
    data: updated,
  });
});

// DELETE /api/shops/:id
export const deleteShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.id);
  if (!shop) {
    throw new CustomError("Shop not found", 404);
  }

  // Check if shop has bills
  const billCount = await Bill.countDocuments({ shopId: req.params.id });
  if (billCount > 0) {
    throw new CustomError(
      `Cannot delete shop. It has ${billCount} bill(s). Deactivate instead.`,
      400
    );
  }

  // Remove linked user's shopId
  if (shop.userId) {
    await User.findByIdAndUpdate(shop.userId, { shopId: null });
  }

  await Shop.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "Shop deleted successfully",
    data: null,
  });
});

// POST /api/shops/:id/owner  — create/assign shop owner login
export const createShopOwner = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  const shopId = req.params.id;

  if (!name || !email || !password) {
    throw new CustomError("Name, email and password are required", 400);
  }

  const shop = await Shop.findById(shopId);
  if (!shop) {
    throw new CustomError("Shop not found", 404);
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new CustomError("User with this email already exists", 409);
  }

  const hashedPassword = await hashPassword(password);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: "shop_owner",
    shopId,
    phone: phone || null,
  });

  await Shop.findByIdAndUpdate(shopId, { userId: user._id });

  res.status(201).json({
    success: true,
    message: "Shop owner account created successfully",
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      shopId: user.shopId,
    },
  });
});

// GET /api/shops/:id/last-reading  — get last bill's current reading for auto-fill
export const getLastReading = asyncHandler(async (req, res) => {
  const lastBill = await Bill.findOne({ shopId: req.params.id })
    .sort({ billMonth: -1 })
    .select("currentReading billMonth previousDue remainingDue paymentStatus finalAmount paidAmount");

  res.status(200).json({
    success: true,
    message: "Last reading fetched",
    data: lastBill
      ? {
          previousReading: lastBill.currentReading,
          lastBillMonth: lastBill.billMonth,
          // Always carry forward remaining due if bill is not fully paid
          previousDue:
            lastBill.paymentStatus === "paid"
              ? 0
              : Math.max(lastBill.remainingDue, lastBill.finalAmount - lastBill.paidAmount),
        }
      : { previousReading: 0, lastBillMonth: null, previousDue: 0 },
  });
});
