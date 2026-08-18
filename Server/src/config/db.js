const mongoose = require("mongoose");
const dns = require("dns");

const connectDB = async () => {
  // The Atlas connection string in .env has no database name segment
  // (mongodb+srv://user:pass@cluster/?appName=...), so without an explicit
  // dbName the driver would silently write everything to the default "test"
  // database. db_name (or DB_NAME) in .env carries the intended name.
  const dbName = process.env.DB_NAME || process.env.db_name;
  const opts = dbName ? { dbName } : undefined;
  const uri = process.env.MONGODB_URI;

  try {
    const conn = await mongoose.connect(uri, opts);
    console.log(`MongoDB connected: ${conn.connection.host} (db: ${conn.connection.name})`);
  } catch (err) {
    // Some local/router DNS resolvers accept plain A-record lookups but
    // refuse the SRV query mongodb+srv:// needs (surfaces as "querySrv
    // ECONNREFUSED"). Retry once against public DNS before giving up.
    if (uri?.startsWith("mongodb+srv") && err.message?.includes("querySrv")) {
      console.warn("SRV lookup failed via system DNS, retrying via public DNS (8.8.8.8/1.1.1.1)...");
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
      const conn = await mongoose.connect(uri, opts);
      console.log(`MongoDB connected: ${conn.connection.host} (db: ${conn.connection.name})`);
    } else {
      throw err;
    }
  }
};

module.exports = connectDB;
