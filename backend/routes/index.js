const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/employees', require('./employee.routes'));
router.use('/attendances', require('./attendance.routes'));
router.use('/leaves', require('./leave.routes'));
router.use('/payrolls', require('./payroll.routes'));
router.use('/dashboard', require('./dashboard.routes'));

module.exports = router;
