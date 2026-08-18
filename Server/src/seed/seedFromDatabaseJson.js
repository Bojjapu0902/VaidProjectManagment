// One-time migration: loads the real project data that used to live in
// Clients/src/data/database.json (the frontend's mock dataset) into MongoDB,
// using the same collections/models the API serves from. Unlike seed1.js
// (synthetic demo data), this preserves the actual users/projects/documents
// the team had been working from before the backend existed.
require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Project = require("../models/Project");
const Document = require("../models/Document");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Notification = require("../models/Notification");
const Approval = require("../models/Approval");

const dataPath = path.join(__dirname, "../../../Clients/src/data/database.json");
const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

async function seed() {
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

  // --- users ---
  const usersWithHashedPasswords = await Promise.all(
    data.users.map(async ({ id, ...u }) => ({ ...u, password: await bcrypt.hash(u.password, 12) }))
  );
  const insertedUsers = await User.insertMany(usersWithHashedPasswords);
  const userIdMap = new Map(data.users.map((u, i) => [u.id, insertedUsers[i]._id]));
  const userByName = new Map(insertedUsers.map((u) => [u.name, u]));
  console.log(`Seeded ${insertedUsers.length} users`);

  // --- projects ---
  const projectDocs = data.projects.map(({ id, clientId, team, timeline, ...p }) => ({
    ...p,
    clientId: userIdMap.get(clientId),
    team: team.map((t) => ({ ...t, userId: userIdMap.get(t.userId) })),
    timeline: {
      startDate: timeline.startDate ? new Date(timeline.startDate) : undefined,
      expectedEndDate: timeline.expectedEndDate ? new Date(timeline.expectedEndDate) : undefined,
    },
  }));
  const insertedProjects = await Project.insertMany(projectDocs);
  const projectIdMap = new Map(data.projects.map((p, i) => [p.id, insertedProjects[i]._id]));
  console.log(`Seeded ${insertedProjects.length} projects`);

  // --- documents ---
  const documentDocs = data.documents.map(({ id, projectId, uploadedBy, createdAt, ...d }) => ({
    ...d,
    projectId: projectIdMap.get(projectId),
    uploadedBy,
    uploadedById: userByName.get(uploadedBy)?._id,
    createdAt: new Date(createdAt),
  }));
  await Document.insertMany(documentDocs);
  console.log(`Seeded ${documentDocs.length} documents`);

  // --- one default "General" conversation per project (client + team), since
  // the old mock data had no concept of conversations, only project-scoped messages ---
  const conversationByProject = new Map();
  for (const p of insertedProjects) {
    const participantIds = new Set([p.clientId.toString(), ...p.team.map((t) => t.userId.toString())]);
    const participants = [...participantIds].map((id) => {
      const u = insertedUsers.find((u) => u._id.toString() === id);
      return { userId: u._id, name: u.name };
    });
    const convo = await Conversation.create({
      projectId: p._id,
      name: "General",
      isDefault: true,
      participants,
      createdBy: p.team[0]?.userId || p.clientId,
    });
    conversationByProject.set(p._id.toString(), convo._id);
  }
  console.log(`Seeded ${conversationByProject.size} default conversations`);

  // --- messages ---
  const messageDocs = data.messages.map(({ id, projectId, senderId, senderName, createdAt, message }) => {
    const mappedProjectId = projectIdMap.get(projectId);
    return {
      conversationId: conversationByProject.get(mappedProjectId.toString()),
      projectId: mappedProjectId,
      senderId: userIdMap.get(senderId),
      senderName,
      message,
      createdAt: new Date(createdAt),
    };
  });
  await Message.insertMany(messageDocs);
  console.log(`Seeded ${messageDocs.length} messages`);

  // --- notifications ---
  const notificationDocs = data.notifications.map(({ id, userId, projectId, createdAt, ...n }) => ({
    ...n,
    userId: userIdMap.get(userId),
    projectId: projectIdMap.get(projectId),
    createdAt: new Date(createdAt),
  }));
  await Notification.insertMany(notificationDocs);
  console.log(`Seeded ${notificationDocs.length} notifications`);

  // --- approvals ---
  const approvalDocs = data.approvals.map(({ id, projectId, requestedAt, ...a }) => ({
    ...a,
    projectId: projectIdMap.get(projectId),
    createdAt: new Date(requestedAt),
  }));
  await Approval.insertMany(approvalDocs);
  console.log(`Seeded ${approvalDocs.length} approvals`);

  console.log("\nMigration complete. Login credentials (all use the original password):");
  data.users.forEach((u) => console.log(`  ${u.role.padEnd(18)} ${u.email}  /  ${u.password}`));

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
