import { Router } from "express";
import {
  getShops,
  getShopById,
  createShop,
  updateShop,
  deleteShop,
  createShopOwner,
  getLastReading,
} from "../controllers/shop.controller.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";

const router = Router();

router.get("/", authenticate(["super_admin"]), getShops);
router.get("/:id", authenticate(["super_admin", "shop_owner"]), getShopById);
router.post("/", authenticate(["super_admin"]), createShop);
router.put("/:id", authenticate(["super_admin"]), updateShop);
router.delete("/:id", authenticate(["super_admin"]), deleteShop);
router.post("/:id/owner", authenticate(["super_admin"]), createShopOwner);
router.get("/:id/last-reading", authenticate(["super_admin"]), getLastReading);

export default router;
