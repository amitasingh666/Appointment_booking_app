const servicesService = require("./services.service");

// Get logged-in provider's services
const getMyServices = async (req, res) => {
    try {
        const services = await servicesService.getServicesByProvider(req.user.id);
        res.json(services);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new service
// Create a new service
const createService = async (req, res) => {
    try {
        const { name, description, duration, price, fuelType, seats, durationUnit, vehicleType } = req.body;

        let imageUrl = null;
        if (req.file) {
            imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        }

        if (!name || !duration || !price) {
            return res.status(400).json({ message: "Name, duration, and price are required" });
        }

        // Strict Validation for Doctors
        if (req.user.category === 'DOCTOR') {
            if (name.length < 3) {
                return res.status(400).json({ message: "Service name must be at least 3 characters long." });
            }
            if (description && description.length < 10) {
                return res.status(400).json({ message: "Description must be at least 10 characters long to be informative." });
            }
            if (parseFloat(price) <= 0) {
                return res.status(400).json({ message: "Price must be a positive value." });
            }
            // Optional: Regex for meaningful name (simple check)
            if (/^[^a-zA-Z0-9]+$/.test(name)) {
                return res.status(400).json({ message: "Service name cannot be only special characters." });
            }
        }

        const newService = await servicesService.createService(req.user.id, {
            name,
            description: description || null,
            duration,
            price,
            imageUrl,
            fuelType,
            seats,
            durationUnit,
            vehicleType
        });
        res.status(201).json(newService);
    } catch (error) {
        console.error("Create Service Error:", error);
        res.status(400).json({ message: error.message });
    }
};

// Update service
const updateService = async (req, res) => {
    try {
        const updatedService = await servicesService.updateService(req.params.id, req.user.id, req.body);
        res.json(updatedService);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete service
const deleteService = async (req, res) => {
    try {
        await servicesService.deleteService(req.params.id, req.user.id);
        res.json({ message: "Service removed" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all services (Public)
const getAllServices = async (req, res) => {
    try {
        const pool = require("../../config/db");
        // Join with users to get provider name
        const [rows] = await pool.execute(`
            SELECT s.*, u.full_name as provider_name, u.category as provider_category, u.specialization as provider_specialization
            FROM services s 
            JOIN users u ON s.provider_id = u.id
            WHERE 
                u.category != 'DOCTOR' 
                OR 
                EXISTS (SELECT 1 FROM provider_schedules ps WHERE ps.provider_id = u.id)
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getMyServices,
    getAllServices,
    createService,
    updateService,
    deleteService
};
