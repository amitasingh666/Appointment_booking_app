require("dotenv").config();
require("./config/db");

const express = require("express");
const cors = require("cors");

const authRoutes = require("./modules/auth/auth.routes");
const servicesRoutes = require("./modules/services/services.routes");
const schedulesRoutes = require("./modules/schedules/schedules.routes");
const bookingsRoutes = require("./modules/bookings/bookings.routes");

const app = express();

app.use(
    cors({
        origin: [
            "http://localhost:3000",
        ],
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true
    })
);

app.options("*", cors());

app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/schedule", schedulesRoutes);
app.use("/api/bookings", bookingsRoutes);

// Health check
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Appointment Booking API is running",
        version: "1.0.0",
    });
});

const PORT = process.env.PORT || 7000;
app.listen(PORT, () =>
    console.log(`Server running on port ${PORT}`)
);
