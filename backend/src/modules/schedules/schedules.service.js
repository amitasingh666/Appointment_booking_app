const pool = require("../../config/db");

// Upsert (Insert or Update) schedule for a day
const setSchedule = async (providerId, dayOfWeek, startTime, endTime) => {
    // Check if entry exists
    const [existing] = await pool.execute(
        "SELECT id FROM provider_schedules WHERE provider_id = ? AND day_of_week = ?",
        [providerId, dayOfWeek]
    );

    if (existing.length > 0) {
        // Update
        await pool.execute(
            "UPDATE provider_schedules SET start_time = ?, end_time = ?, is_active = TRUE WHERE provider_id = ? AND day_of_week = ?",
            [startTime, endTime, providerId, dayOfWeek]
        );
    } else {
        // Insert
        await pool.execute(
            "INSERT INTO provider_schedules (provider_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)",
            [providerId, dayOfWeek, startTime, endTime]
        );
    }
    return { providerId, dayOfWeek, startTime, endTime };
};

// Toggle active status for a day
const toggleDay = async (providerId, dayOfWeek, isActive) => {
    await pool.execute(
        "UPDATE provider_schedules SET is_active = ? WHERE provider_id = ? AND day_of_week = ?",
        [isActive, providerId, dayOfWeek]
    );
    return { providerId, dayOfWeek, isActive };
};

// Get full schedule
const getSchedule = async (providerId) => {
    const [rows] = await pool.execute(
        "SELECT * FROM provider_schedules WHERE provider_id = ? ORDER BY FIELD(day_of_week, 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN')",
        [providerId]
    );
    return rows;
};

module.exports = {
    setSchedule,
    toggleDay,
    getSchedule
};
