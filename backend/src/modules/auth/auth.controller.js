const authService = require("./auth.service");

const register = async (req, res) => {
    try {
        const { fullName, email, password, phone, role, category, specialization } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        // Validate Provider fields
        if (role === 'PROVIDER' && !category) {
            return res.status(400).json({ message: "Providers must select a service category (Doctor, Salon, or Car Rental)" });
        }

        const data = await authService.registerUser(fullName, email, password, phone, role, category, specialization);
        res.status(201).json({ message: "User registered successfully", ...data });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(400).json({ message: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Please provide email and password" });
        }

        const data = await authService.loginUser(email, password);
        res.status(200).json({ message: "Login successful", ...data });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(401).json({ message: error.message });
    }
};

module.exports = {
    register,
    login
};
