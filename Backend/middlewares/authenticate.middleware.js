import User from "../models/user.model.js";
import { verifyToken } from "../utils/jwt.utils.js";
import CustomError from "./error_handler.middleware.js";

export const authenticate = (roles) => {
  return async (req, res, next) => {
    try {
      // get cookies
      const cookies = req.cookies ?? {};
      const token = cookies["access_token"];

      if (!token) {
        throw new CustomError("Unauthorized.Access denied", 401);
      }
      console.log(token);
      // validity
      const payload = verifyToken(token);
      console.log(payload);
      if (!payload) {
        throw new CustomError("Unauthorized.Access denied", 401);
        
      }
      // payload?.exp

      // expiry
      if (payload?.exp && payload?.exp * 1000 < Date.now()) {
        res.clearCookie("access_token", {
          httpOnly: true,
          sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
          secure: process.env.NODE_ENV === "development" ? false : true,
        });
        throw new CustomError("Token Expired. Access denied", 401);
      }

      const user = await User.findOne({
        _id: payload._id,
        email: payload.email,
      });

      console.log(user);
      if (!user) {
        throw new CustomError("Unauthorized.Access denied", 401);
      }

      // roles

      if (!roles.includes(user.role)) {
        throw new CustomError("Forbidden.Access denied", 403);
      }

      req.user = {
        _id:user._id,
        first_name:user.first_name,
        last_name:user.last_name,
        email: user.email,
        role:user.role
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
