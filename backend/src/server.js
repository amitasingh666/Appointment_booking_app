require("dotenv").config();
require("./config/db");

const express = require("express");
const cors = require("cors");

const PORT = process.env.PORT || 7000;


// Routes
const authRoutes = require("./modules/auth/auth.routes");
const servicesRoutes = require("./modules/services/services.routes");
const schedulesRoutes = require("./modules/schedules/schedules.routes");
const bookingsRoutes = require("./modules/bookings/bookings.routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/schedule", schedulesRoutes);
app.use("/api/bookings", bookingsRoutes);

// Health check endpoint
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Contact Management API is running",
        version: "1.0.0",
    });
});

app.listen(process.env.PORT, () =>
    console.log(`Server running on port ${process.env.PORT}`)
);
