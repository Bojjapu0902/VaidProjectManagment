// One-off script to create (or promote) an admin account directly in
// MongoDB — useful for the very first login, before any admin exists to
// create other users through the app itself. Goes through the same
// connectDB() as the server, so it lands in the correct Atlas database
// (see config/db.js), and through the User model, so the password gets
// bcrypt-hashed by the model's pre-save hook exactly like every other
// account.
//
// Safe to re-run: if the email already exists, it promotes that account to
// admin and resets its password instead of erroring.
//
// Usage (from the Server/ folder):
//   npm run create-admin
//   npm run create-admin -- "Full Name" "email@example.com" "password"
//
// All three arguments are optional — sensible defaults are used for any
// that are omitted.

require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

const [, , argName, argEmail, argPassword] = process.argv;

const name = argName || "Admin";
const email = (argEmail || "admin@vaid.com").toLowerCase().trim();
const password = argPassword || "VaidAdmin@2026";

async function run() {
  await connectDB();

  let user = await User.findOne({ email }).select("+password");
  let action;

  if (user) {
    user.name = name;
    user.role = "admin";
    user.isActive = true;
    user.password = password; // re-hashed by the pre-save hook on save()
    await user.save();
    action = "Updated existing user — promoted to admin and password reset";
  } else {
    const initials = name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    user = await User.create({ name, email, password, role: "admin", avatarInitials: initials });
    action = "Created new admin user";
  }

  console.log(action + ".");
  console.log("----------------------------------------");
  console.log(`Name:     ${user.name}`);
  console.log(`Email:    ${user.email}`);
  console.log(`Password: ${password}`);
  console.log("----------------------------------------");
  console.log("Sign in at the app's login page with these credentials.");

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Failed to create admin user:", err.message);
  process.exit(1);
});
