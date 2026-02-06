const pool = require("../../config/db");

// Get services for a specific provider
const getServicesByProvider = async (providerId) => {
    const [rows] = await pool.execute(
        "SELECT * FROM services WHERE provider_id = ?",
        [providerId]
    );
    return rows;
};

// Create a new service
// Create a new service
const createService = async (providerId, serviceData) => {
    const { name, description, duration, price, imageUrl, fuelType, seats, durationUnit, vehicleType } = serviceData;

    const [result] = await pool.execute(
        `INSERT INTO services 
        (provider_id, name, description, duration, price, image_url, fuel_type, seats, duration_unit, vehicle_type) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            providerId,
            name,
            description,
            duration,
            price,
            imageUrl || null,
            fuelType || null,
            seats || null,
            durationUnit || 'mins',
            vehicleType || null
        ]
    );
    return { id: result.insertId, providerId, ...serviceData };
};

// Update a service
const updateService = async (serviceId, providerId, updates) => {
    // build query dynamically? for simplicity specific fields first
    const { name, description, duration, price } = updates;

    // First check ownership
    const [check] = await pool.execute("SELECT provider_id FROM services WHERE id = ?", [serviceId]);
    if (check.length === 0) throw new Error("Service not found");
    if (check[0].provider_id !== providerId) throw new Error("Not authorized to update this service");

    await pool.execute(
        "UPDATE services SET name = ?, description = ?, duration = ?, price = ? WHERE id = ?",
        [name, description, duration, price, serviceId]
    );
    return { id: serviceId, ...updates };
};

// Delete service
const deleteService = async (serviceId, providerId) => {
    // Check ownership
    const [check] = await pool.execute("SELECT provider_id FROM services WHERE id = ?", [serviceId]);
    if (check.length === 0) throw new Error("Service not found");
    if (check[0].provider_id !== providerId) throw new Error("Not authorized to delete this service");

    await pool.execute("DELETE FROM services WHERE id = ?", [serviceId]);
    return { message: "Service deleted" };
};

module.exports = {
    getServicesByProvider,
    createService,
    updateService,
    deleteService
};
