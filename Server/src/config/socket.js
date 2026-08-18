// Minimal Socket.io wrapper. initSocket(server) attaches the io instance to
// an existing HTTP server; every authenticated client joins a room named
// after their own userId so we can push events straight to them with
// io.to(userId).emit(...). getIO() lets controllers/services reach the
// singleton without passing it through every function signature.
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io = null;

function initSocket(httpServer) {
  const allowedOrigins = process.env.CLIENT_ORIGIN
    ? process.env.CLIENT_ORIGIN.split(",").map((o) => o.trim())
    : ["http://localhost:5173"];

  io = new Server(httpServer, {
    cors: { origin: allowedOrigins, credentials: true },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(); // allow anonymous connect; just won't join a room
      const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
      const decoded = jwt.verify(token, secret);
      socket.userId = decoded.id;
      next();
    } catch {
      next(); // bad token — connect anonymously rather than hard-failing the socket
    }
  });

  io.on("connection", (socket) => {
    if (socket.userId) socket.join(String(socket.userId));
  });

  return io;
}

function getIO() {
  return io; // may be null if sockets aren't initialized (e.g. in tests) — callers must check
}

module.exports = { initSocket, getIO };
