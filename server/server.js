require("dotenv").config();
const fs = require("fs");
const path = require("path");

if (!process.env.MONGO_URI) {
  console.error("FATAL CONFIG ERROR: MONGO_URI environment variable is not defined!");
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error("FATAL CONFIG ERROR: JWT_SECRET environment variable is not defined!");
  process.exit(1);
}

const app = require("./app");
const connectDB = require("./config/db");
const Admin = require("./models/Admin");

const PORT = process.env.PORT || 5000;

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Connect to Database and start listener
const startServer = async () => {
  await connectDB();

  // Seed default admin account if configured in environment
  try {
    // Permanently remove the old deprecated admin credentials if they exist
    await Admin.deleteOne({ email: "admin@securefinance.com" });

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      console.warn("WARNING: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are not defined. Skipping default admin seeding.");
    } else {
      const adminExists = await Admin.findOne({ email });
      if (!adminExists) {
        await Admin.create({
          fullName: "GrowStar Administrator",
          email: email,
          password: password,
        });
        console.log("---------------------------------------------------------");
        console.log("Seeded default admin account from environment configuration.");
        console.log("---------------------------------------------------------");
      }
    }
  } catch (error) {
    console.error(`Failed to seed admin user: ${error.message}`);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
