const pool = require('./db');

const migrateDatabase = async () => {
    try {
        console.log("Checking Database Schema...");

        const queries = [
            // Users Table Updates
            "ALTER TABLE users ADD COLUMN category VARCHAR(50)",
            "ALTER TABLE users ADD COLUMN specialization VARCHAR(255)",

            // Services Table Updates
            "ALTER TABLE services ADD COLUMN image_url VARCHAR(255)",
            "ALTER TABLE services ADD COLUMN fuel_type VARCHAR(50)",
            "ALTER TABLE services ADD COLUMN seats INT",
            "ALTER TABLE services ADD COLUMN duration_unit VARCHAR(20) DEFAULT 'mins'",
            "ALTER TABLE services ADD COLUMN vehicle_type VARCHAR(50)",

            // Bookings Table Updates
            "ALTER TABLE bookings ADD COLUMN start_datetime DATETIME",
            "ALTER TABLE bookings ADD COLUMN end_datetime DATETIME"
        ];

        for (const query of queries) {
            try {
                await pool.execute(query);
                console.log(`Executed: ${query}`);
            } catch (error) {
                // Ignore "Duplicate column name" error (Code 1060)
                if (error.errno === 1060) {
                    // console.log(`Skipped (Already exists): ${query}`);
                } else {
                    console.error(`Migration Error for ${query}:`, error.message);
                }
            }
        }
        console.log("Database Schema Check Complete.");
    } catch (error) {
        console.error("Migration Fatal Error:", error);
    }
};

module.exports = migrateDatabase;
