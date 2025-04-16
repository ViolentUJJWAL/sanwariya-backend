const express = require('express');
const { sendContactUs, getAllContactUs, getContactUsByID, respondToContactUs } = require('../controllers/contactUsController');
const { isAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/:id', isAdmin, getContactUsByID);
router.post('/:id/respond', isAdmin, respondToContactUs);
router.post('/', sendContactUs);
router.get('/', isAdmin, getAllContactUs);

module.exports = router;