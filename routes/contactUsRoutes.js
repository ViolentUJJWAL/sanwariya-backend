import express from 'express';
import getAllContactUs from "../controllers/contactUsController"
import responseContactUs from "../controllers/contactUsController"
const router = express.Router();

// GET all contact queries
router.get('/', getAllContactUs);

// PUT - respond to a contact query
router.put('/respond/:id', responseContactUs);

export default router;
