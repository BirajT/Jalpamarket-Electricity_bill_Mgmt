import jwt from "jsonwebtoken";
import { jwt_config } from "../config/config.js";
import CustomError from "../middlewares/error_handler.middleware.js";

export const generateJWTToken = (payload, expiresIn = jwt_config.expires_in) => {
  return jwt.sign(payload, jwt_config.secret, {
    expiresIn,
  });
};


// ? verify jwt token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, jwt_config.secret);
  } catch (error) {
    throw new CustomError("jwt error", 500);
  }
};
