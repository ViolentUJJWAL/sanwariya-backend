const express = require('express');
const router = express.Router();

require('./userRoutes/auth.routes')(router);

module.exports = router;