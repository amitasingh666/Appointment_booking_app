-- Appointment Booking System Schema

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS unavailable_dates;
DROP TABLE IF EXISTS provider_schedules;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Users Table (Stores clients and providers)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('CLIENT', 'PROVIDER') NOT NULL DEFAULT 'CLIENT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Services Table (What providers offer)
CREATE TABLE services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    duration VARCHAR(50) NOT NULL, -- e.g. "30 mins", "1 hour"
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Provider Schedule (General working hours)
CREATE TABLE provider_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT NOT NULL,
    day_of_week VARCHAR(10) NOT NULL, -- MON, TUE, WED, etc.
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_schedule (provider_id, day_of_week)
);

-- -- 4. Unavailable Dates (Holidays or day-offs)
-- CREATE TABLE unavailable_dates (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     provider_id INT NOT NULL,
--     date DATE NOT NULL,
--     reason VARCHAR(255),
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE
-- );

-- 5. Bookings (The appointments)
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    provider_id INT NOT NULL,
    service_id INT NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status ENUM('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    -- Index for faster availability checking
    INDEX idx_provider_date (provider_id, booking_date)
);
