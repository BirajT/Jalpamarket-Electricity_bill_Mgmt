import { Router } from "express";
import {
  getSettings,
  updateRate,
  updateSettings,
} from "../controllers/settings.controller.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";

const router = Router();

router.get("/", authenticate(["super_admin", "shop_owner"]), getSettings);
router.put("/rate", authenticate(["super_admin"]), updateRate);
router.put("/", authenticate(["super_admin"]), updateSettings);

export default router;
