const express = require('express');
const router = express.Router();

require('./adminRoutes/auth.routes')(router);

module.exports = router;