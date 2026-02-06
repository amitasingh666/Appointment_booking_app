const pool = require("../../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const registerUser = async (fullName, email, password, phone, role, category, specialization) => {
    // 1. Check if user exists
    const [existingUsers] = await pool.execute(
        "SELECT id FROM users WHERE email = ?",
        [email]
    );

    if (existingUsers.length > 0) {
        throw new Error("User already exists");
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Insert user
    const [result] = await pool.execute(
        "INSERT INTO users (full_name, email, password_hash, phone, role, category, specialization) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [fullName, email, hashedPassword, phone, role || 'CLIENT', category || null, specialization || null]
    );

    const newItem = { id: result.insertId, fullName, email, role: role || 'CLIENT', category, specialization };

    // 4. Generate Token (Auto Login)
    const token = jwt.sign(
        { id: newItem.id, role: newItem.role, email: newItem.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    return { token, user: newItem };
};

const loginUser = async (email, password) => {
    // 1. Find user
    const [users] = await pool.execute(
        "SELECT * FROM users WHERE email = ?",
        [email]
    );

    if (users.length === 0) {
        throw new Error("Invalid credentials");
    }

    const user = users[0];

    // 2. Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        throw new Error("Invalid credentials");
    }

    // 3. Generate Token
    const token = jwt.sign(
        { id: user.id, role: user.role, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    return {
        token,
        user: {
            id: user.id,
            fullName: user.full_name,
            email: user.email,
            role: user.role,
            category: user.category,
            specialization: user.specialization
        }
    };
};

module.exports = {
    registerUser,
    loginUser
};
