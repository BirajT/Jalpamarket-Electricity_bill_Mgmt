import { Router } from "express";
import {
  login,
  register,
  logout,
  getMe,
  updateProfile,
  changePassword,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";

const router = Router();

router.post("/login", login);
router.post("/logout", logout);
router.post("/register", authenticate(["super_admin"]), register);
router.get("/me", authenticate(["super_admin", "shop_owner"]), getMe);
router.put("/profile", authenticate(["super_admin", "shop_owner"]), updateProfile);
router.put("/change-password", authenticate(["super_admin", "shop_owner"]), changePassword);

export default router;
