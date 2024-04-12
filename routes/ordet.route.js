import express from 'express';
import { addHeaders } from '../middlewares/auth/addHeaders.js';
import { verifyToken } from '../middlewares/auth/authJwt.js';
import { validateOrder } from '../middlewares/order/validateOrder.js';
import { createOrder } from '../controllers/order.controller.js';

const router = express.Router();

router.use(addHeaders)

router.route('/').post(verifyToken, validateOrder, createOrder)
// router.route('/').get((_, res) => res.json({message: "Lô đề"}));

export {router as orderRouter};