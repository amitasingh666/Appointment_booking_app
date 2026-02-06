const bookingsService = require("./bookings.service");

// Public/Protected: Get slots
const getSlots = async (req, res) => {
    try {
        const { providerId, date, serviceId } = req.query;
        if (!providerId || !date || !serviceId) {
            return res.status(400).json({ message: "Missing required params: providerId, date, serviceId" });
        }

        const slots = await bookingsService.getAvailableSlots(providerId, date, serviceId);
        res.json(slots);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Protected: Create Booking
// Protected: Create Booking
const createBooking = async (req, res) => {
    try {
        const { providerId, serviceId, date, startTime, startDateTime, endDateTime } = req.body;

        // Validation Logic
        if (startDateTime && endDateTime) {
            // Car Rental Mode (Range)
            if (!providerId || !serviceId) {
                return res.status(400).json({ message: "Missing required params" });
            }
        } else {
            // Standard Mode (Slot)
            if (!providerId || !serviceId || !date || !startTime) {
                return res.status(400).json({ message: "Missing required params" });
            }
        }

        const booking = await bookingsService.createBooking(
            req.user.id,
            providerId,
            serviceId,
            { date, startTime, startDateTime, endDateTime } // Pass as object
        );
        res.status(201).json(booking);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Protected: Get My Bookings
const getMyBookings = async (req, res) => {
    try {
        const bookings = await bookingsService.getBookings(req.user.id, req.user.role);
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Protected: Update Status
const updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const result = await bookingsService.updateBookingStatus(
            req.params.id,
            req.user.id,
            req.user.role,
            status
        );
        res.json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    getSlots,
    createBooking,
    getMyBookings,
    updateStatus
};
