import express from 'express';
import { getDeliveryFeeSettings } from '../controller/deliveryFee/get.controller.js';

const router = express.Router();

// Public route - Get delivery fee settings
router.get('/', getDeliveryFeeSettings);

export default router;


