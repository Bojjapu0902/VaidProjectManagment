// One-off script to populate the team roster with additional members across
// every non-client role, so the redesigned categorized Team Management page
// has enough real data per category to actually look categorized.
//
// Safe to re-run: skips any email that already exists instead of erroring.
//
// Usage (from the Server/ folder):
//   node src/scripts/addTeamMembers.js

require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

const NEW_MEMBERS = [
  { name: "Rohan Verma", email: "rohan@vaid.com", role: "project_manager", phone: "+91 98765 44001" },
  { name: "Neha Kapoor", email: "neha@vaid.com", role: "project_manager", phone: "+91 98765 44002" },
  { name: "Ananya Iyer", email: "ananya@vaid.com", role: "architect", phone: "+91 98765 44003" },
  { name: "Vikram Singh", email: "vikram@vaid.com", role: "architect", phone: "+91 98765 44004" },
  { name: "Sanjay Reddy", email: "sanjay@vaid.com", role: "principal_designer", phone: "+91 98765 44005" },
  { name: "Priya Desai", email: "priya@vaid.com", role: "principal_designer", phone: "+91 98765 44006" },
  { name: "Aditya Kulkarni", email: "aditya@vaid.com", role: "designer", phone: "+91 98765 44007" },
  { name: "Farhan Sheikh", email: "farhan@vaid.com", role: "designer", phone: "+91 98765 44008" },
  { name: "Kabir Malhotra", email: "kabir@vaid.com", role: "engineer", phone: "+91 98765 44009" },
  { name: "Meera Nair", email: "meera@vaid.com", role: "engineer", phone: "+91 98765 44010" },
];

const PASSWORD = "password123";

const initialsOf = (name) =>
  name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

async function run() {
  await connectDB();

  const created = [];
  const skipped = [];

  for (const member of NEW_MEMBERS) {
    const email = member.email.toLowerCase().trim();
    const existing = await User.findOne({ email });
    if (existing) {
      skipped.push(email);
      continue;
    }

    await User.create({
      name: member.name,
      email,
      password: PASSWORD,
      role: member.role,
      phone: member.phone,
      company: "Vaid Studio",
      avatarInitials: initialsOf(member.name),
    });
    created.push(member);
  }

  console.log(`Created ${created.length} new team members:`);
  created.forEach((m) => console.log(`  ${m.role.padEnd(18)} ${m.name.padEnd(16)} ${m.email}`));
  if (skipped.length) {
    console.log(`\nSkipped ${skipped.length} (already existed): ${skipped.join(", ")}`);
  }
  console.log(`\nAll new accounts use the password: ${PASSWORD}`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Failed to add team members:", err.message);
  process.exit(1);
});
