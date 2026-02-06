const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/auth.middleware");
const bookingsController = require("./bookings.controller");

// Public (or semi-public) - Check availability
// Ideally this should be public so users can browse before login, but let's protect it if needed.
// The brief says "Create account... See available services... Pick date". Implies logged in.
router.use(protect);

router.get("/slots", bookingsController.getSlots);
router.post("/", bookingsController.createBooking);
router.get("/", bookingsController.getMyBookings);
router.patch("/:id/status", bookingsController.updateStatus);

module.exports = router;
