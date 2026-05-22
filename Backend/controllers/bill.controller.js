import Bill from "../models/bill.model.js";
import Shop from "../models/shop.model.js";
import Settings from "../models/settings.model.js";
import Payment from "../models/payment.model.js";
import { asyncHandler } from "../utils/asynchandler.utils.js";
import CustomError from "../middlewares/error_handler.middleware.js";
import { getPagination } from "../utils/pagination.utils.js";

// POST /api/bills/generate
export const generateBill = asyncHandler(async (req, res) => {
  const {
    shopId,
    billMonth,
    previousReading,
    currentReading,
    previousDue,
    ratePerUnit: customRate,
    notes,
  } = req.body;

  if (!shopId || !billMonth || currentReading === undefined || previousReading === undefined) {
    throw new CustomError("shopId, billMonth, previousReading and currentReading are required", 400);
  }

  if (currentReading < previousReading) {
    throw new CustomError("Current reading cannot be less than previous reading", 400);
  }

  const shop = await Shop.findById(shopId);
  if (!shop) {
    throw new CustomError("Shop not found", 404);
  }

  // Check duplicate bill
  const existingBill = await Bill.findOne({ shopId, billMonth });
  if (existingBill) {
    throw new CustomError(`Bill for ${billMonth} already exists for this shop`, 409);
  }

  // Get rate from settings if not provided
  let ratePerUnit = customRate;
  if (!ratePerUnit) {
    const settings = await Settings.findOne().sort({ createdAt: -1 });
    ratePerUnit = settings ? settings.ratePerUnit : 10;
  }

  // Bill calculation
  const consumedUnit = currentReading - previousReading;
  const billAmount = consumedUnit * ratePerUnit;
  const due = previousDue || 0;
  const finalAmount = billAmount + due;

  const bill = await Bill.create({
    shopId,
    billMonth,
    previousReading,
    currentReading,
    consumedUnit,
    ratePerUnit,
    billAmount,
    previousDue: due,
    finalAmount,
    remainingDue: finalAmount,
    paymentStatus: "unpaid",
    paidAmount: 0,
    generatedBy: req.user._id,
    notes: notes || null,
  });

  await bill.populate("shopId", "shopName shopNumber ownerName phone");

  res.status(201).json({
    success: true,
    message: "Bill generated successfully",
    data: bill,
  });
});

// GET /api/bills
export const getBills = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    shopId,
    billMonth,
    paymentStatus,
    search,
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const filter = {};

  // Shop owner can only see their own bills
  if (req.user.role === "shop_owner") {
    filter.shopId = req.user.shopId;
  } else if (shopId) {
    filter.shopId = shopId;
  }

  if (billMonth) filter.billMonth = billMonth;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  let query = Bill.find(filter)
    .populate("shopId", "shopName shopNumber ownerName phone")
    .populate("generatedBy", "name")
    .sort({ billMonth: -1, createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const [bills, total] = await Promise.all([query, Bill.countDocuments(filter)]);

  res.status(200).json({
    success: true,
    message: "Bills fetched successfully",
    data: bills,
    pagination: getPagination(total, Number(page), Number(limit)),
  });
});

// GET /api/bills/:id
export const getBillById = asyncHandler(async (req, res) => {
  const bill = await Bill.findById(req.params.id)
    .populate("shopId", "shopName shopNumber ownerName phone email address")
    .populate("generatedBy", "name email");

  if (!bill) {
    throw new CustomError("Bill not found", 404);
  }

  // Shop owner isolation
  if (
    req.user.role === "shop_owner" &&
    bill.shopId._id.toString() !== req.user.shopId?.toString()
  ) {
    throw new CustomError("Access denied", 403);
  }

  // Get payments for this bill
  const payments = await Payment.find({ billId: bill._id })
    .populate("receivedBy", "name")
    .sort({ paymentDate: -1 });

  res.status(200).json({
    success: true,
    message: "Bill fetched successfully",
    data: { ...bill.toObject(), payments },
  });
});

// PATCH /api/bills/:id/pay
export const payBill = asyncHandler(async (req, res) => {
  const { amount, paymentMethod, notes } = req.body;

  if (!amount || amount <= 0) {
    throw new CustomError("Valid payment amount is required", 400);
  }

  const bill = await Bill.findById(req.params.id);
  if (!bill) {
    throw new CustomError("Bill not found", 404);
  }

  if (bill.paymentStatus === "paid") {
    throw new CustomError("Bill is already fully paid", 400);
  }

  const remaining = bill.finalAmount - bill.paidAmount;
  if (amount > remaining) {
    throw new CustomError(`Amount exceeds remaining due of ₹${remaining}`, 400);
  }

  // Create payment record
  await Payment.create({
    billId: bill._id,
    shopId: bill.shopId,
    amount,
    paymentMethod: paymentMethod || "cash",
    receivedBy: req.user._id,
    notes: notes || null,
  });

  // Update bill
  const newPaidAmount = bill.paidAmount + amount;
  const newRemainingDue = bill.finalAmount - newPaidAmount;
  let newStatus = "partial";
  if (newRemainingDue <= 0) {
    newStatus = "paid";
  }

  const updatedBill = await Bill.findByIdAndUpdate(
    req.params.id,
    {
      paidAmount: newPaidAmount,
      remainingDue: newRemainingDue,
      paymentStatus: newStatus,
      paidAt: newStatus === "paid" ? new Date() : null,
    },
    { new: true }
  ).populate("shopId", "shopName shopNumber ownerName");

  res.status(200).json({
    success: true,
    message: "Payment recorded successfully",
    data: updatedBill,
  });
});

// DELETE /api/bills/:id
export const deleteBill = asyncHandler(async (req, res) => {
  const bill = await Bill.findById(req.params.id);
  if (!bill) {
    throw new CustomError("Bill not found", 404);
  }

  if (bill.paymentStatus === "paid") {
    throw new CustomError("Cannot delete a paid bill", 400);
  }

  // Delete associated payments
  await Payment.deleteMany({ billId: bill._id });
  await Bill.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "Bill deleted successfully",
    data: null,
  });
});

// GET /api/bills/shop/:shopId  — all bills for a shop
export const getBillsByShop = asyncHandler(async (req, res) => {
  const { shopId } = req.params;

  // Shop owner isolation
  if (
    req.user.role === "shop_owner" &&
    shopId !== req.user.shopId?.toString()
  ) {
    throw new CustomError("Access denied", 403);
  }

  const bills = await Bill.find({ shopId })
    .populate("shopId", "shopName shopNumber ownerName")
    .sort({ billMonth: -1 });

  res.status(200).json({
    success: true,
    message: "Bills fetched successfully",
    data: bills,
  });
});
