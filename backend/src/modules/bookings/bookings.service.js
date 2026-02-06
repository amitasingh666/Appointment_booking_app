const pool = require("../../config/db");

// Helper to convert "HH:MM:SS" to minutes
const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};

// Helper to convert minutes to "HH:MM"
const minutesToTime = (minutes) => {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
};

// 1. Get Available Slots
const getAvailableSlots = async (providerId, date, serviceId) => {
    // A. Get Service Duration
    const [services] = await pool.execute("SELECT duration, duration_unit FROM services WHERE id = ?", [serviceId]);
    if (services.length === 0) throw new Error("Service not found");
    let duration = parseInt(services[0].duration);
    const durationUnit = services[0].duration_unit; // 'mins' or 'days'

    // B. Get Day of Week
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

    // C. Get Schedule
    const [schedules] = await pool.execute(
        "SELECT start_time, end_time FROM provider_schedules WHERE provider_id = ? AND day_of_week = ? AND is_active = TRUE",
        [providerId, dayOfWeek]
    );

    if (schedules.length === 0) return [];

    const workStart = timeToMinutes(schedules[0].start_time);
    const workEnd = timeToMinutes(schedules[0].end_time);

    // If Daily Rental, we override duration to cover the full work day for blocking purposes
    // And we only allow booking if NO other bookings exist for this car (service) on this day.
    if (durationUnit === 'days') {
        const [existing] = await pool.execute(
            "SELECT id FROM bookings WHERE service_id = ? AND booking_date = ? AND status NOT IN ('CANCELLED', 'COMPLETED')",
            [serviceId, date]
        );
        if (existing.length > 0) return []; // Already booked for the day
        return [minutesToTime(workStart)]; // Only one slot: Start of Day
    }

    // Standard Hourly Logic
    const [bookings] = await pool.execute(
        "SELECT start_time, end_time FROM bookings WHERE provider_id = ? AND booking_date = ? AND status NOT IN ('CANCELLED', 'COMPLETED')",
        [providerId, date]
    );

    const busyRanges = bookings.map(b => ({
        start: timeToMinutes(b.start_time),
        end: timeToMinutes(b.end_time)
    }));

    const slots = [];
    const step = 30;

    for (let time = workStart; time + duration <= workEnd; time += step) {
        const slotStart = time;
        const slotEnd = time + duration;

        const isBusy = busyRanges.some(range => {
            return (slotStart < range.end && slotEnd > range.start);
        });

        if (!isBusy) {
            slots.push(minutesToTime(slotStart));
        }
    }

    return slots;
};

// 2. Create Booking (Transaction Safe)
const createBooking = async (clientId, providerId, serviceId, bookingData) => {
    const { date, startTime, startDateTime, endDateTime } = bookingData;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        let finalStartDateTime, finalEndDateTime, finalDate, finalStartTime, finalEndTime;

        if (startDateTime && endDateTime) {
            // Logic for Custom Range (Car Rental)
            finalStartDateTime = new Date(startDateTime);
            finalEndDateTime = new Date(endDateTime);

            // For backward compatibility / standard columns
            finalDate = finalStartDateTime.toISOString().split('T')[0];
            finalStartTime = finalStartDateTime.toTimeString().split(' ')[0];
            finalEndTime = finalEndDateTime.toTimeString().split(' ')[0];

            // Overlap Check using DATETIME
            const [conflicts] = await connection.execute(
                `SELECT id FROM bookings 
                 WHERE service_id = ? 
                 AND status NOT IN ('CANCELLED', 'COMPLETED') 
                 AND (
                    (start_datetime < ? AND end_datetime > ?)
                 )
                 FOR UPDATE`,
                [serviceId, endDateTime, startDateTime] // (RequestedStart < ExistingEnd) AND (RequestedEnd > ExistingStart)
            );

            if (conflicts.length > 0) {
                throw new Error("Car is already rented for this period!");
            }

        } else {
            // Standard Logic (Doctor / Salon)
            const [services] = await connection.execute("SELECT duration, duration_unit FROM services WHERE id = ?", [serviceId]);
            if (services.length === 0) throw new Error("Service not found");

            let duration = parseInt(services[0].duration);
            const durationUnit = services[0].duration_unit;

            // Calculate legacy Start/End
            const startMinutes = timeToMinutes(startTime);
            let endMinutes;

            // Check if blocking full day
            if (durationUnit === 'days') {
                // If existing daily logic is 'block full day', we treat it as 00:00 to 23:59 effectively
                // But for compatibility with new DateTime columns, let's construct them.
                const dayStart = new Date(`${date}T00:00:00`);
                const dayEnd = new Date(`${date}T23:59:59`);

                finalStartDateTime = new Date(`${date}T${startTime}`); // 09:00
                finalEndDateTime = dayEnd; // Block till end of day

                // Set legacy times
                finalStartTime = startTime;
                finalEndTime = "23:59:00";
            } else {
                endMinutes = startMinutes + duration;
                finalStartTime = startTime;
                finalEndTime = minutesToTime(endMinutes);

                finalStartDateTime = new Date(`${date}T${finalStartTime}`);
                finalEndDateTime = new Date(`${date}T${finalEndTime}`);
            }

            finalDate = date;

            // Legacy Overlap Check (using TIME on same DATE) 
            // OR use the new DATETIME check if columns are populated. 
            // Let's use DATETIME check for everything now as we populate it.
            const [conflicts] = await connection.execute(
                `SELECT id FROM bookings 
                 WHERE service_id = ? 
                 AND status NOT IN ('CANCELLED', 'COMPLETED') 
                 AND (
                    (start_datetime < ? AND end_datetime > ?)
                 )
                 FOR UPDATE`,
                [serviceId, finalEndDateTime, finalStartDateTime]
            );

            if (conflicts.length > 0) {
                throw new Error("Slot no longer available");
            }
        }

        // C. Insert Booking
        const [result] = await connection.execute(
            `INSERT INTO bookings (client_id, provider_id, service_id, booking_date, start_time, end_time, start_datetime, end_datetime, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
            [clientId, providerId, serviceId, finalDate, finalStartTime, finalEndTime, finalStartDateTime, finalEndDateTime]
        );

        await connection.commit();
        return { id: result.insertId, status: 'PENDING' };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// 3. Get Bookings
const getBookings = async (userId, role) => {
    let query = `
        SELECT b.*, s.name as service_name, 
               CASE WHEN ? = 'PROVIDER' THEN u_client.full_name ELSE u_provider.full_name END as counterpart_name
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        LEFT JOIN users u_client ON b.client_id = u_client.id
        LEFT JOIN users u_provider ON b.provider_id = u_provider.id
    `;

    if (role === 'PROVIDER') {
        query += " WHERE b.provider_id = ?";
    } else {
        query += " WHERE b.client_id = ?";
    }

    query += " ORDER BY b.booking_date DESC, b.start_time ASC";

    const [rows] = await pool.execute(query, [role, userId]);
    return rows;
};

// 4. Update Status
const updateBookingStatus = async (bookingId, userId, role, status) => {
    // Providers can confirm/reject. Clients can cancel.

    // First get the booking
    const [rows] = await pool.execute("SELECT * FROM bookings WHERE id = ?", [bookingId]);
    if (rows.length === 0) throw new Error("Booking not found");
    const booking = rows[0];

    // Authorization logic
    if (role === 'PROVIDER' && booking.provider_id !== userId) {
        throw new Error("Not authorized");
    }
    if (role === 'CLIENT' && booking.client_id !== userId) {
        throw new Error("Not authorized");
    }

    if (role === 'CLIENT' && status !== 'CANCELLED') {
        throw new Error("Clients can only cancel bookings");
    }

    await pool.execute("UPDATE bookings SET status = ? WHERE id = ?", [status, bookingId]);
    return { id: bookingId, status };
};

module.exports = {
    getAvailableSlots,
    createBooking,
    getBookings,
    updateBookingStatus
};
