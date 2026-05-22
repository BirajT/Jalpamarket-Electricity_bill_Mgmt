import { Router } from "express";
import {
  getPayments,
  createPayment,
  getPaymentById,
} from "../controllers/payment.controller.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";

const router = Router();

router.get("/", authenticate(["super_admin", "shop_owner"]), getPayments);
router.post("/", authenticate(["super_admin"]), createPayment);
router.get("/:id", authenticate(["super_admin", "shop_owner"]), getPaymentById);

export default router;
