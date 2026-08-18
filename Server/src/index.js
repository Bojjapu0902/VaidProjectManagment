require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const connectDB = require("./config/db");
const { initSocket } = require("./config/socket");
const { apiLimiter } = require("./middleware/rateLimiter");
const { startDeadlineReminderJob } = require("./services/deadlineReminder.service");

const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const notificationRoutes = require("./routes/notifications");
const approvalRoutes = require("./routes/approvals");
const userRoutes = require("./routes/users");
const reportRoutes = require("./routes/reports");
const conversationRoutes = require("./routes/conversations");

const app = express();

const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(",").map((o) => o.trim())
  : ["http://localhost:5173"];

app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => {
      // allow requests with no origin (curl, Postman, same-origin)
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use("/api", apiLimiter);

const uploadsDir = process.env.NODE_ENV === "production"
  ? "/opt/render/project/src/uploads"
  : path.join(__dirname, "../../uploads");
app.use("/uploads", express.static(uploadsDir));

app.get("/api/v1/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/approvals", approvalRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/conversations", conversationRoutes);

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({ message: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
initSocket(server);

connectDB()
  .then(() => {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    startDeadlineReminderJob();
  })
  .catch((err) => { console.error("DB connection failed:", err); process.exit(1); });
