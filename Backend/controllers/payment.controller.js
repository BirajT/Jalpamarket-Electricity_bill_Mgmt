import Payment from "../models/payment.model.js";
import Bill from "../models/bill.model.js";
import { asyncHandler } from "../utils/asynchandler.utils.js";
import CustomError from "../middlewares/error_handler.middleware.js";
import { getPagination } from "../utils/pagination.utils.js";

// GET /api/payments
export const getPayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, shopId, billId, startDate, endDate } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = {};

  if (req.user.role === "shop_owner") {
    filter.shopId = req.user.shopId;
  } else if (shopId) {
    filter.shopId = shopId;
  }

  if (billId) filter.billId = billId;

  if (startDate || endDate) {
    filter.paymentDate = {};
    if (startDate) filter.paymentDate.$gte = new Date(startDate);
    if (endDate) filter.paymentDate.$lte = new Date(endDate);
  }

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate("billId", "billMonth finalAmount paymentStatus")
      .populate("shopId", "shopName shopNumber ownerName")
      .populate("receivedBy", "name")
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Payment.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: "Payments fetched successfully",
    data: payments,
    pagination: getPagination(total, Number(page), Number(limit)),
  });
});

// POST /api/payments  (standalone payment creation — also updates bill)
export const createPayment = asyncHandler(async (req, res) => {
  const { billId, amount, paymentMethod, notes, paymentDate } = req.body;

  if (!billId || !amount) {
    throw new CustomError("Bill ID and amount are required", 400);
  }

  const bill = await Bill.findById(billId);
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

  const payment = await Payment.create({
    billId,
    shopId: bill.shopId,
    amount,
    paymentMethod: paymentMethod || "cash",
    receivedBy: req.user._id,
    notes: notes || null,
    paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
  });

  // Update bill
  const newPaidAmount = bill.paidAmount + amount;
  const newRemainingDue = bill.finalAmount - newPaidAmount;
  const newStatus = newRemainingDue <= 0 ? "paid" : "partial";

  await Bill.findByIdAndUpdate(billId, {
    paidAmount: newPaidAmount,
    remainingDue: newRemainingDue,
    paymentStatus: newStatus,
    paidAt: newStatus === "paid" ? new Date() : null,
  });

  await payment.populate([
    { path: "billId", select: "billMonth finalAmount" },
    { path: "shopId", select: "shopName shopNumber" },
    { path: "receivedBy", select: "name" },
  ]);

  res.status(201).json({
    success: true,
    message: "Payment recorded successfully",
    data: payment,
  });
});

// GET /api/payments/:id
export const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate("billId", "billMonth finalAmount paymentStatus consumedUnit ratePerUnit")
    .populate("shopId", "shopName shopNumber ownerName phone")
    .populate("receivedBy", "name email");

  if (!payment) {
    throw new CustomError("Payment not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Payment fetched successfully",
    data: payment,
  });
});
