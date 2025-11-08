const express = require('express');
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require('cookie-parser');
require("dotenv").config();
const PORT = process.env.PORT || 3000;
// ✅ ADDED: Two new route imports
// const cryptoKeysRoutes = require('./routes/cryptoKeys');
// const encryptedReportsRoutes = require('./routes/encryptedReports');

// Import routes
const userRoutes = require("./routes/user");
const authRoutes = require("./routes/auth");
const doctorRoutes = require('./routes/doctor');
const patientRoutes = require('./routes/patient');
const cryptoKeysRoutes = require('./routes/cryptoKeys'); // NEW
const encryptedReportsRoutes = require('./routes/encryptedReports'); // NEW

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch(err => console.error("MongoDB connection error:", err));

mongoose.connection.on("error", err => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

// ✅ ADDED: Increased payload limit for encrypted data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ✅ ADDED: Two new route handlers
app.use('/api/keys', cryptoKeysRoutes);
app.use('/api/reports', encryptedReportsRoutes);

// CORS configuration
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://digi-care-hack-mol6-0.vercel.app",
    "https://Medicrypt-hackmol6-0-1.onrender.com",
    "https://digi-care.vercel.app"
  ],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  optionsSuccessStatus: 204,
  allowedHeaders: "Content-Type",
  credentials: true,
}));

app.use(express.json({ limit: '50mb' })); // Increase limit for encrypted data
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Routes
app.use('/users', userRoutes);
app.use('/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/keys', cryptoKeysRoutes); // NEW
app.use('/api/reports', encryptedReportsRoutes); // NEW

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));