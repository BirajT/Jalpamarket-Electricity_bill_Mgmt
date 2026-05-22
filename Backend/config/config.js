import dotenv from "dotenv";
dotenv.config();

export const db_config = {
  uri: process.env.MONGO_URI || "mongodb://localhost:27017/jalpa_electricity",
};

export const jwt_config = {
  secret: process.env.JWT_SECRET || "jalpa_secret_key_change_in_production",
  expires_in: process.env.JWT_EXPIRES_IN || "7d",
};

export const server_config = {
  port: process.env.PORT || 5000,
  node_env: process.env.NODE_ENV || "development",
  frontend_url: process.env.FRONT_END_URL || "http://localhost:3000",
};

export const cookie_config = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
  secure: process.env.NODE_ENV === "development" ? false : true,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
