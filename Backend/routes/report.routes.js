import { Router } from "express";
import {
  getMonthlyReport,
  getDueReport,
  getShopReport,
  getDashboardStats,
  getCollectionSummary,
} from "../controllers/report.controller.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";

const router = Router();

router.get("/dashboard", authenticate(["super_admin"]), getDashboardStats);
router.get("/monthly", authenticate(["super_admin"]), getMonthlyReport);
router.get("/due", authenticate(["super_admin"]), getDueReport);
router.get("/collection-summary", authenticate(["super_admin"]), getCollectionSummary);
router.get("/shop/:shopId", authenticate(["super_admin", "shop_owner"]), getShopReport);

export default router;
