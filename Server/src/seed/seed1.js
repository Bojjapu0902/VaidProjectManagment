require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Project = require("../models/Project");
const Document = require("../models/Document");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Notification = require("../models/Notification");
const Approval = require("../models/Approval");

const USERS = [
  { name: "Priya Kapoor",              email: "priya@archpro.com",    role: "project_manager", avatarInitials: "PK", phone: "+91 98765 43210", company: "ArchPro Studio",             password: "password123" },
  { name: "Arjun Mehta",              email: "arjun@archpro.com",    role: "architect",       avatarInitials: "AM", phone: "+91 98765 11111", company: "ArchPro Studio",             password: "password123" },
  { name: "Sara Iyer",               email: "sara@archpro.com",     role: "engineer",        avatarInitials: "SI", phone: "+91 98765 22222", company: "ArchPro Studio",             password: "password123" },
  { name: "Devika Rao",              email: "devika@archpro.com",   role: "designer",        avatarInitials: "DR", phone: "+91 98765 33333", company: "ArchPro Studio",             password: "password123" },
  { name: "Admin User",              email: "admin@archpro.com",    role: "admin",           avatarInitials: "AU", phone: "+91 98765 00000", company: "ArchPro Studio",             password: "password123" },
  { name: "Meera Nair",              email: "meera@client.com",     role: "client",          avatarInitials: "MN", phone: "+91 90000 11111", company: "Individual Client",          password: "password123" },
  { name: "Vantage Developers Pvt Ltd", email: "contact@vantage.com", role: "client",        avatarInitials: "VD", phone: "+91 90000 22222", company: "Vantage Developers Pvt Ltd", password: "password123" },
];

async function seed() {
  // Same dbName fix as config/db.js — without it this connects to the
  // driver's default "test" database instead of the intended one.
  const dbName = process.env.DB_NAME || process.env.db_name;
  await mongoose.connect(process.env.MONGODB_URI, dbName ? { dbName } : undefined);
  console.log(`Connected to MongoDB (db: ${mongoose.connection.name})`);

  await Promise.all([
    User.deleteMany({}),
    Project.deleteMany({}),
    Document.deleteMany({}),
    Conversation.deleteMany({}),
    Message.deleteMany({}),
    Notification.deleteMany({}),
    Approval.deleteMany({}),
  ]);
  console.log("Cleared existing data");

  const usersWithHashedPasswords = await Promise.all(
    USERS.map(async (u) => ({ ...u, password: await bcrypt.hash(u.password, 12) }))
  );
  const users = await User.insertMany(usersWithHashedPasswords);
  console.log(`Seeded ${users.length} users`);

  const byEmail = (email) => users.find((u) => u.email === email);
  const priya   = byEmail("priya@archpro.com");
  const arjun   = byEmail("arjun@archpro.com");
  const sara    = byEmail("sara@archpro.com");
  const devika  = byEmail("devika@archpro.com");
  const meera   = byEmail("meera@client.com");
  const vantage = byEmail("contact@vantage.com");

  const projects = await Project.insertMany([
    {
      projectCode: "ARC-2026-001",
      title: "Lakeview Residence — Renovation",
      type: "Residential",
      location: "Whitefield, Bengaluru",
      clientId: meera._id,
      clientName: meera.name,
      currentStage: 7,
      progressPercent: 78,
      budget: { min: 4500000, max: 5200000, currency: "INR" },
      timeline: { startDate: new Date("2025-11-03"), expectedEndDate: new Date("2026-08-14") },
      team: [
        { userId: arjun._id, name: arjun.name, role: "Lead Architect" },
        { userId: sara._id,  name: sara.name,  role: "Site Engineer" },
        { userId: priya._id, name: priya.name, role: "Project Manager" },
      ],
      description: "Full interior and structural renovation of a single-family lake-facing residence, including foundation reinforcement and an additional floor.",
    },
    {
      projectCode: "ARC-2026-002",
      title: "Horizon Tower — Commercial Complex",
      type: "Commercial",
      location: "Hitech City, Hyderabad",
      clientId: vantage._id,
      clientName: vantage.name,
      currentStage: 3,
      progressPercent: 32,
      budget: { min: 180000000, max: 210000000, currency: "INR" },
      timeline: { startDate: new Date("2026-02-10"), expectedEndDate: new Date("2028-01-30") },
      team: [
        { userId: arjun._id,  name: arjun.name,  role: "Lead Architect" },
        { userId: devika._id, name: devika.name,  role: "Designer" },
        { userId: priya._id,  name: priya.name,   role: "Project Manager" },
      ],
      description: "18-storey mixed-use commercial tower with retail podium, office floors, and rooftop amenity deck.",
    },
    {
      projectCode: "ARC-2025-014",
      title: "Sunridge Public Library",
      type: "Civic",
      location: "Sector 21, Chandigarh",
      clientId: vantage._id,
      clientName: "City Municipal Council",
      currentStage: 6,
      progressPercent: 62,
      budget: { min: 32000000, max: 36000000, currency: "INR" },
      timeline: { startDate: new Date("2025-06-18"), expectedEndDate: new Date("2027-03-01") },
      team: [
        { userId: sara._id,  name: sara.name,  role: "Site Engineer" },
        { userId: priya._id, name: priya.name, role: "Project Manager" },
      ],
      description: "New public library building with a 300-seat reading hall, digital media wing, and community auditorium.",
    },
    {
      projectCode: "ARC-2026-003",
      title: "Greenfield Villas — Phase II",
      type: "Residential",
      location: "Devanahalli, Bengaluru",
      clientId: meera._id,
      clientName: "Arjun & Kavya Rao",
      currentStage: 2,
      progressPercent: 18,
      budget: { min: 9500000, max: 11000000, currency: "INR" },
      timeline: { startDate: new Date("2026-04-22"), expectedEndDate: new Date("2027-06-30") },
      team: [
        { userId: devika._id, name: devika.name, role: "Designer" },
        { userId: priya._id,  name: priya.name,  role: "Project Manager" },
      ],
      description: "12-unit gated villa community, phase II of an existing master plan.",
    },
    {
      projectCode: "ARC-2025-009",
      title: "Westbrook Office Park — Block C",
      type: "Commercial",
      location: "Powai, Mumbai",
      clientId: vantage._id,
      clientName: "NovaSpace Realty",
      currentStage: 5,
      progressPercent: 51,
      budget: { min: 64000000, max: 72000000, currency: "INR" },
      timeline: { startDate: new Date("2025-09-01"), expectedEndDate: new Date("2027-02-15") },
      team: [
        { userId: arjun._id, name: arjun.name, role: "Lead Architect" },
        { userId: sara._id,  name: sara.name,  role: "Site Engineer" },
      ],
      description: "Grade-A office block with structured parking and a central courtyard atrium.",
    },
  ]);
  console.log(`Seeded ${projects.length} projects`);

  const p = (title) => projects.find((pr) => pr.title.startsWith(title));
  const lakeview   = p("Lakeview");
  const horizon    = p("Horizon");
  const sunridge   = p("Sunridge");
  const greenfield = p("Greenfield");
  const westbrook  = p("Westbrook");

  await Document.insertMany([
    { projectId: lakeview._id,   stageNumber: 7, name: "Quality check report — Foundation",   category: "report",  fileType: "pdf", fileSize: "2.4 MB", version: 1, isClientVisible: true,  uploadedBy: sara.name,  uploadedById: sara._id,  createdAt: new Date("2026-06-16") },
    { projectId: lakeview._id,   stageNumber: 7, name: "Site photos — June batch (24)",        category: "photo",   fileType: "zip", fileSize: "48 MB",  version: 1, isClientVisible: true,  uploadedBy: sara.name,  uploadedById: sara._id,  createdAt: new Date("2026-06-14") },
    { projectId: lakeview._id,   stageNumber: 6, name: "Approved structural drawings v2",      category: "drawing", fileType: "pdf", fileSize: "6.1 MB", version: 2, isClientVisible: true,  uploadedBy: arjun.name, uploadedById: arjun._id, createdAt: new Date("2026-06-02") },
    { projectId: lakeview._id,   stageNumber: 7, name: "Site progress report — Week 18",       category: "report",  fileType: "pdf", fileSize: "1.1 MB", version: 1, isClientVisible: true,  uploadedBy: arjun.name, uploadedById: arjun._id, createdAt: new Date("2026-06-17") },
    { projectId: lakeview._id,   stageNumber: 7, name: "Interior finish samples",              category: "photo",   fileType: "pdf", fileSize: "3.8 MB", version: 1, isClientVisible: true,  uploadedBy: sara.name,  uploadedById: sara._id,  createdAt: new Date("2026-06-15") },
    { projectId: horizon._id,    stageNumber: 3, name: "Concept sketches — Option A/B/C",      category: "drawing", fileType: "pdf", fileSize: "9.2 MB", version: 1, isClientVisible: true,  uploadedBy: arjun.name, uploadedById: arjun._id, createdAt: new Date("2026-06-10") },
    { projectId: sunridge._id,   stageNumber: 6, name: "Structural drawings v3",               category: "drawing", fileType: "pdf", fileSize: "5.4 MB", version: 3, isClientVisible: false, uploadedBy: sara.name,  uploadedById: sara._id,  createdAt: new Date("2026-06-11") },
    { projectId: westbrook._id,  stageNumber: 5, name: "MEP working drawings",                 category: "drawing", fileType: "dwg", fileSize: "12 MB",  version: 1, isClientVisible: false, uploadedBy: arjun.name, uploadedById: arjun._id, createdAt: new Date("2026-06-09") },
  ]);
  console.log("Seeded documents");

  // Every project gets an auto-seeded "General" group (client + full team)
  // plus one internal-only group chat, demonstrating the group-chat feature.
  const lakeviewGeneral = await Conversation.create({
    projectId: lakeview._id,
    name: "General",
    isDefault: true,
    participants: [
      { userId: meera._id, name: meera.name },
      { userId: arjun._id, name: arjun.name },
      { userId: sara._id,  name: sara.name },
      { userId: priya._id, name: priya.name },
    ],
    createdBy: priya._id,
  });

  const lakeviewInternal = await Conversation.create({
    projectId: lakeview._id,
    name: "Site Team (internal)",
    isDefault: false,
    participants: [
      { userId: arjun._id, name: arjun.name },
      { userId: sara._id,  name: sara.name },
      { userId: priya._id, name: priya.name },
    ],
    createdBy: priya._id,
  });

  await Message.insertMany([
    { conversationId: lakeviewGeneral._id, projectId: lakeview._id, senderId: meera._id, senderName: meera.name, message: "The finish samples look great. Can we go with option B for the living room?", createdAt: new Date("2026-06-15T10:20:00") },
    { conversationId: lakeviewGeneral._id, projectId: lakeview._id, senderId: arjun._id, senderName: arjun.name, message: "Yes, option B works well with the lighting plan. We'll proceed with that.",   createdAt: new Date("2026-06-15T11:05:00") },
    { conversationId: lakeviewGeneral._id, projectId: lakeview._id, senderId: meera._id, senderName: meera.name, message: "Perfect, thank you! Also checking on the foundation report timeline.",         createdAt: new Date("2026-06-16T09:15:00") },
    { conversationId: lakeviewGeneral._id, projectId: lakeview._id, senderId: sara._id,  senderName: sara.name,  message: "Foundation quality report is uploaded — all checks passed.",                   createdAt: new Date("2026-06-16T16:40:00") },
    { conversationId: lakeviewInternal._id, projectId: lakeview._id, senderId: priya._id, senderName: priya.name, message: "Let's hold the client-facing timeline steady — internal buffer stays at 3 days.", createdAt: new Date("2026-06-16T17:00:00") },
    { conversationId: lakeviewInternal._id, projectId: lakeview._id, senderId: arjun._id, senderName: arjun.name, message: "Agreed, I'll flag it if the finish supplier slips.",                              createdAt: new Date("2026-06-16T17:12:00") },
  ]);
  console.log("Seeded conversations + messages");

  await Notification.insertMany([
    { userId: priya._id, type: "approval_requested", title: "Approval requested",   message: "Structural drawings v3 sent for client review",        projectId: sunridge._id,  isRead: false, createdAt: new Date("2026-06-18T09:10:00") },
    { userId: priya._id, type: "document_uploaded",  title: "Document uploaded",    message: "Sara Iyer uploaded a quality check report",            projectId: lakeview._id,  isRead: false, createdAt: new Date("2026-06-17T14:32:00") },
    { userId: priya._id, type: "deadline_reminder",  title: "Deadline reminder",    message: "BOQ submission due in 3 days",                         projectId: westbrook._id, isRead: true,  createdAt: new Date("2026-06-16T08:00:00") },
    { userId: meera._id, type: "document_uploaded",  title: "New report available", message: "Site progress report — Week 18 is ready to review",    projectId: lakeview._id,  isRead: false, createdAt: new Date("2026-06-17T15:00:00") },
    { userId: meera._id, type: "stage_completed",    title: "Stage completed",      message: "Approval & Permissions marked complete",               projectId: lakeview._id,  isRead: false, createdAt: new Date("2026-06-09T11:20:00") },
    { userId: meera._id, type: "feedback_received",  title: "Team replied",         message: "Arjun Mehta replied to your message",                  projectId: lakeview._id,  isRead: true,  createdAt: new Date("2026-06-05T17:45:00") },
  ]);
  console.log("Seeded notifications");

  await Approval.insertMany([
    { projectId: sunridge._id,   projectName: "Sunridge Public Library",      documentName: "Structural drawings v3",          stageNumber: 6, status: "pending",         urgency: "warning",       dueIn: "2 days left",          requestedBy: priya._id, createdAt: new Date("2026-06-11") },
    { projectId: horizon._id,    projectName: "Horizon Tower",                documentName: "3 concept options",               stageNumber: 3, status: "overdue",          urgency: "danger",         dueIn: "Overdue",              requestedBy: priya._id, createdAt: new Date("2026-06-08") },
    { projectId: westbrook._id,  projectName: "Westbrook Office Park",        documentName: "MEP working drawings",            stageNumber: 5, status: "internal_review",  urgency: "neutral",        dueIn: "5 days left",          requestedBy: priya._id, createdAt: new Date("2026-06-13") },
    { projectId: greenfield._id, projectName: "Greenfield Villas",            documentName: "Site survey photo set",           stageNumber: 2, status: "internal_review",  urgency: "neutral",        dueIn: "6 days left",          requestedBy: priya._id, createdAt: new Date("2026-06-14") },
    { projectId: lakeview._id,   projectName: "Lakeview Residence",           documentName: "Site progress report — Week 18", stageNumber: 7, status: "pending",         urgency: "client-action",  dueIn: "Awaiting your review", requestedBy: priya._id, createdAt: new Date("2026-06-17") },
    { projectId: lakeview._id,   projectName: "Lakeview Residence",           documentName: "Interior finish samples",         stageNumber: 7, status: "pending",         urgency: "client-action",  dueIn: "Awaiting your review", requestedBy: priya._id, createdAt: new Date("2026-06-15") },
  ]);
  console.log("Seeded approvals");

  console.log("\nSeed complete. Login credentials:");
  USERS.forEach((u) => console.log(`  ${u.role.padEnd(16)} ${u.email}  /  password123`));

  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
