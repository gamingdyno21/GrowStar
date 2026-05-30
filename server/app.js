const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

// Route imports
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const financeRoutes = require("./routes/financeRoutes");
const messageRoutes = require("./routes/messageRoutes");

// Middleware imports
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

app.set("trust proxy", 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOptions = {
  origin: [
    "https://www.grow-star.site",
    "https://grow-star.site",
    "https://grow-star-orcin.vercel.app"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(helmet({ crossOriginResourcePolicy: false }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use(limiter);

// Serve static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/messages", messageRoutes);

app.get("/", (req, res) => {
  res.send("Secure Finance Portal API Running");
});

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
