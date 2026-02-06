const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../../middleware/auth.middleware");
const servicesController = require("./services.controller");
const upload = require("../../middleware/upload.middleware");

// Public route
router.get("/public", servicesController.getAllServices);

// Protected routes
router.use(protect);

// Only Providers can manage services
router.get("/", authorize("PROVIDER"), servicesController.getMyServices);
router.post("/", authorize("PROVIDER"), upload.single('image'), servicesController.createService);
router.put("/:id", authorize("PROVIDER"), servicesController.updateService);
router.delete("/:id", authorize("PROVIDER"), servicesController.deleteService);

module.exports = router;
