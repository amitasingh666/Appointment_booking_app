const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../../middleware/auth.middleware");
const schedulesController = require("./schedules.controller");

router.use(protect);

router.get("/", authorize("PROVIDER"), schedulesController.getMySchedule);
router.post("/", authorize("PROVIDER"), schedulesController.updateSchedule);

module.exports = router;
