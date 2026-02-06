# Appointment & Car Rental Booking System

A robust and scalable web application built with the MERN stack (MySQL, Express, React, Node.js) designed to facilitate booking services for various industries including Medical Practices, Salons, and Car Rentals.

## 🚀 Features

### Core Functionality
- **Role-Based Authentication**: Secure Registration and Login for Clients and Providers (Doctors, Salon Owners, Car Rental Agencies).
- **Service Management**: Providers can create, update, and remove services with specific details (Duration, Price, Images).
- **Booking System**: Clients can book appointments or rentals. The system handles availability checking to prevent double-booking.
- **Provider Dashboard**: A comprehensive dashboard to manage incoming bookings (Accept/Reject/Complete), view schedule, and manage services.
- **Client Dashboard**: View booking history and current appointment status.

### Industry-Specific Features
- **🚗 Car Rental**:
  - Custom Date-Range Booking (Pick-up/Drop-off).
  - Hourly Rate Calculation.
  - Vehicle Details (Fuel Type, Seats, Vehicle Type).
  - Image Uploads for Fleet.
  - Automated availability checking for selected time slots.
- **🩺 Medical / Doctor**:
  - Mandatory Schedule Setup (Providers must be online).
  - Strict Data Validation (Name/Description length, Price).
  - Slot-based booking system compatible with doctor's working hours.

### Technical Highlights
- **Dynamic Frontend**: React-based UI with tabbed dashboards, toast notifications for feedback, and responsive layout.
- **Backend Architecture**: Modular Node.js/Express structure with formatted controllers and services.
- **Data Integrity**: MySQL transactional support for ensuring booking consistency.
- **Security**: JWT Authentication and BCrypt password hashing.
- **Image Handling**: Multer middleware for handling file uploads (stored locally).

---

## 🛠️ Technology Stack

- **Frontend**: React.js, React Router, React Toastify, Axios.
- **Backend**: Node.js, Express.js.
- **Database**: MySQL.
- **Authentication**: JWT (JSON Web Tokens).

---

## 📂 Project Structure

```
AppointmentBooking/
├── backend/            # Express Server & API Logic
│   ├── src/
│   │   ├── config/     # Database Connection & Schema
│   │   ├── middleware/ # Auth & Upload Middleware
│   │   ├── modules/    # Feature-based Modules (Auth, Bookings, Services)
│   │   └── server.js   # Entry Point
│   └── uploads/        # Stored user uploaded images
│
└── frontend/           # React Application
    ├── src/
    │   ├── api/        # Axios Configuration
    │   ├── components/ # Reusable UI Components (Dashboards)
    │   ├── context/    # Authentication Context
    │   └── pages/      # Application Pages (Login, BookAppointment)
```

---

## ⚡ Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MySQL Server

### 1. Database Setup
1. Create a MySQL database (e.g., `appointment_db`).
2. Run the schema script located at `backend/src/config/schema.sql` to generate tables.

### 2. Backend Setup
```bash
cd backend
npm install

# Create a .env file with the following:
# PORT=5000
# DB_HOST=localhost
# DB_USER=root
# DB_PASS=yourpassword
# DB_NAME=appointment_db
# JWT_SECRET=your_jwt_secret

npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```
The application will launch at `http://localhost:3000`.

---

## 📝 Usage Guide

1. **Register**: Sign up as a *Client* to book, or a *Provider* to offer services.
2. **Provider Setup**:
   - If you are a **Doctor**, go to the 'Schedule' tab to set your working hours.
   - Go to 'Services' to add your listings (Consultations, Cars, etc.).
3. **Booking**:
   - Clients browse categories.
   - For Doctors: Select a Date and Time Slot.
   - For Cars: Select a Start and End Date/Time.
4. **Management**: Providers accept requests in their dashboard.