import { Router } from "express";
import {
  generateBill,
  getBills,
  getBillById,
  payBill,
  deleteBill,
  getBillsByShop,
} from "../controllers/bill.controller.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";

const router = Router();

router.post("/generate", authenticate(["super_admin"]), generateBill);
router.get("/", authenticate(["super_admin", "shop_owner"]), getBills);
router.get("/shop/:shopId", authenticate(["super_admin", "shop_owner"]), getBillsByShop);
router.get("/:id", authenticate(["super_admin", "shop_owner"]), getBillById);
router.patch("/:id/pay", authenticate(["super_admin"]), payBill);
router.delete("/:id", authenticate(["super_admin"]), deleteBill);

export default router;
