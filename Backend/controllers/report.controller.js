import Bill from "../models/bill.model.js";
import Payment from "../models/payment.model.js";
import Shop from "../models/shop.model.js";
import { asyncHandler } from "../utils/asynchandler.utils.js";

// GET /api/reports/monthly?month=2025-01
export const getMonthlyReport = asyncHandler(async (req, res) => {
  const { month } = req.query;

  const filter = {};
  if (month) filter.billMonth = month;

  const bills = await Bill.find(filter)
    .populate("shopId", "shopName shopNumber ownerName phone")
    .sort({ "shopId.shopNumber": 1 });

  const totalBills = bills.length;
  const totalAmount = bills.reduce((sum, b) => sum + b.finalAmount, 0);
  const totalCollected = bills.reduce((sum, b) => sum + b.paidAmount, 0);
  const totalDue = bills.reduce((sum, b) => sum + b.remainingDue, 0);
  const totalUnits = bills.reduce((sum, b) => sum + b.consumedUnit, 0);
  const paidCount = bills.filter((b) => b.paymentStatus === "paid").length;
  const unpaidCount = bills.filter((b) => b.paymentStatus === "unpaid").length;
  const partialCount = bills.filter((b) => b.paymentStatus === "partial").length;

  res.status(200).json({
    success: true,
    message: "Monthly report fetched",
    data: {
      month: month || "all",
      summary: {
        totalBills,
        totalAmount,
        totalCollected,
        totalDue,
        totalUnits,
        paidCount,
        unpaidCount,
        partialCount,
      },
      bills,
    },
  });
});

// GET /api/reports/due
export const getDueReport = asyncHandler(async (req, res) => {
  const bills = await Bill.find({
    paymentStatus: { $in: ["unpaid", "partial"] },
  })
    .populate("shopId", "shopName shopNumber ownerName phone email")
    .sort({ remainingDue: -1 });

  const totalDue = bills.reduce((sum, b) => sum + b.remainingDue, 0);

  res.status(200).json({
    success: true,
    message: "Due report fetched",
    data: {
      totalDue,
      totalShopsWithDue: bills.length,
      bills,
    },
  });
});

// GET /api/reports/shop/:shopId
export const getShopReport = asyncHandler(async (req, res) => {
  const { shopId } = req.params;

  // Shop owner isolation
  if (
    req.user.role === "shop_owner" &&
    shopId !== req.user.shopId?.toString()
  ) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const shop = await Shop.findById(shopId);
  if (!shop) {
    return res.status(404).json({ success: false, message: "Shop not found" });
  }

  const bills = await Bill.find({ shopId }).sort({ billMonth: -1 });
  const payments = await Payment.find({ shopId }).sort({ paymentDate: -1 });

  const totalBilled = bills.reduce((sum, b) => sum + b.finalAmount, 0);
  const totalPaid = bills.reduce((sum, b) => sum + b.paidAmount, 0);
  const totalDue = bills.reduce((sum, b) => sum + b.remainingDue, 0);
  const totalUnits = bills.reduce((sum, b) => sum + b.consumedUnit, 0);

  res.status(200).json({
    success: true,
    message: "Shop report fetched",
    data: {
      shop,
      summary: { totalBilled, totalPaid, totalDue, totalUnits, totalBills: bills.length },
      bills,
      payments,
    },
  });
});

// GET /api/reports/dashboard  — admin dashboard stats
export const getDashboardStats = asyncHandler(async (req, res) => {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  const [
    totalShops,
    totalBills,
    currentMonthBills,
    allBills,
  ] = await Promise.all([
    Shop.countDocuments({ isActive: true }),
    Bill.countDocuments(),
    Bill.find({ billMonth: currentMonth }),
    Bill.find().select("finalAmount paidAmount remainingDue paymentStatus billMonth consumedUnit"),
  ]);

  const totalCollection = allBills.reduce((sum, b) => sum + b.paidAmount, 0);
  const totalDue = allBills.reduce((sum, b) => sum + b.remainingDue, 0);
  const paidBills = allBills.filter((b) => b.paymentStatus === "paid").length;
  const unpaidBills = allBills.filter((b) => b.paymentStatus === "unpaid").length;
  const totalUnits = allBills.reduce((sum, b) => sum + b.consumedUnit, 0);

  const currentMonthCollection = currentMonthBills.reduce((sum, b) => sum + b.paidAmount, 0);
  const currentMonthDue = currentMonthBills.reduce((sum, b) => sum + b.remainingDue, 0);

  // Monthly chart data — last 6 months
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthKey = d.toISOString().slice(0, 7);
    const monthBills = allBills.filter((b) => b.billMonth === monthKey);
    monthlyData.push({
      month: monthKey,
      billed: monthBills.reduce((sum, b) => sum + b.finalAmount, 0),
      collected: monthBills.reduce((sum, b) => sum + b.paidAmount, 0),
      due: monthBills.reduce((sum, b) => sum + b.remainingDue, 0),
    });
  }

  res.status(200).json({
    success: true,
    message: "Dashboard stats fetched",
    data: {
      totalShops,
      totalBills,
      totalCollection,
      totalDue,
      paidBills,
      unpaidBills,
      totalUnits,
      currentMonth: {
        month: currentMonth,
        bills: currentMonthBills.length,
        collection: currentMonthCollection,
        due: currentMonthDue,
      },
      monthlyChart: monthlyData,
    },
  });
});

// GET /api/reports/collection-summary
export const getCollectionSummary = asyncHandler(async (req, res) => {
  const { year } = req.query;
  const currentYear = year || new Date().getFullYear().toString();

  const bills = await Bill.find({
    billMonth: { $regex: `^${currentYear}` },
  }).select("billMonth finalAmount paidAmount remainingDue paymentStatus shopId");

  // Group by month
  const monthMap = {};
  bills.forEach((b) => {
    if (!monthMap[b.billMonth]) {
      monthMap[b.billMonth] = { billed: 0, collected: 0, due: 0, count: 0 };
    }
    monthMap[b.billMonth].billed += b.finalAmount;
    monthMap[b.billMonth].collected += b.paidAmount;
    monthMap[b.billMonth].due += b.remainingDue;
    monthMap[b.billMonth].count += 1;
  });

  const summary = Object.entries(monthMap)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month));

  res.status(200).json({
    success: true,
    message: "Collection summary fetched",
    data: { year: currentYear, summary },
  });
});
