/**
 * Seed script — creates default super admin and sample data
 * Run: node utils/seed.js
 */
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { db_config } from "../config/config.js";
import User from "../models/user.model.js";
import Shop from "../models/shop.model.js";
import Settings from "../models/settings.model.js";
import { hashPassword } from "./bcrypt.utils.js";

const seed = async () => {
  try {
    await mongoose.connect(db_config.uri);
    console.log("✅ Connected to MongoDB");

    // Create Super Admin
    const existingAdmin = await User.findOne({ email: "admin@jalpamarket.com" });
    if (!existingAdmin) {
      const hashedPw = await hashPassword("admin123");
      await User.create({
        name: "Super Admin",
        email: "admin@jalpamarket.com",
        password: hashedPw,
        role: "super_admin",
      });
      console.log("✅ Super Admin created: admin@jalpamarket.com / admin123");
    } else {
      console.log("ℹ️  Super Admin already exists");
    }

    // Create default settings
    const existingSettings = await Settings.findOne();
    if (!existingSettings) {
      await Settings.create({
        ratePerUnit: 10,
        marketName: "Jalpa Market",
        marketAddress: "Jalpa Market, Main Road",
        marketPhone: "9876543210",
      });
      console.log("✅ Default settings created (Rate: ₹10/kWh)");
    }

    // Create sample shops
    const shopCount = await Shop.countDocuments();
    if (shopCount === 0) {
      const sampleShops = [
        { shopName: "Sharma Electronics", shopNumber: "A-101", ownerName: "Ramesh Sharma", phone: "9876543201", email: "ramesh@example.com" },
        { shopName: "Gupta Cloth Store", shopNumber: "A-102", ownerName: "Suresh Gupta", phone: "9876543202", email: "suresh@example.com" },
        { shopName: "Patel Grocery", shopNumber: "B-101", ownerName: "Mahesh Patel", phone: "9876543203", email: "mahesh@example.com" },
        { shopName: "Kumar Hardware", shopNumber: "B-102", ownerName: "Rajesh Kumar", phone: "9876543204", email: "rajesh@example.com" },
        { shopName: "Singh Medical", shopNumber: "C-101", ownerName: "Harpreet Singh", phone: "9876543205", email: "harpreet@example.com" },
      ];

      const shops = await Shop.insertMany(sampleShops);
      console.log(`✅ ${shops.length} sample shops created`);

      // Create a shop owner login for first shop
      const hashedPw = await hashPassword("shop123");
      const shopOwner = await User.create({
        name: sampleShops[0].ownerName,
        email: "shop@jalpamarket.com",
        password: hashedPw,
        role: "shop_owner",
        shopId: shops[0]._id,
        phone: sampleShops[0].phone,
      });
      await Shop.findByIdAndUpdate(shops[0]._id, { userId: shopOwner._id });
      console.log("✅ Sample shop owner created: shop@jalpamarket.com / shop123");
    } else {
      console.log(`ℹ️  ${shopCount} shops already exist`);
    }

    console.log("\n🎉 Seed completed successfully!");
    console.log("─────────────────────────────────");
    console.log("Admin Login:     admin@jalpamarket.com / admin123");
    console.log("Shop Owner Login: shop@jalpamarket.com / shop123");
    console.log("─────────────────────────────────");
  } catch (error) {
    console.error("❌ Seed error:", error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();
