const schedulesService = require("./schedules.service");

const getMySchedule = async (req, res) => {
    try {
        const schedule = await schedulesService.getSchedule(req.user.id);
        res.json(schedule);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateSchedule = async (req, res) => {
    try {
        const { dayOfWeek, startTime, endTime } = req.body;

        if (!dayOfWeek || !startTime || !endTime) {
            return res.status(400).json({ message: "Day, Start Time, and End Time required" });
        }

        const validDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
        if (!validDays.includes(dayOfWeek)) {
            return res.status(400).json({ message: "Invalid day of week" });
        }

        const result = await schedulesService.setSchedule(req.user.id, dayOfWeek, startTime, endTime);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getMySchedule,
    updateSchedule
};
