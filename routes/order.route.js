import express from 'express';
import { addHeaders } from '../middlewares/auth/addHeaders.js';
import { verifyToken } from '../middlewares/auth/authJwt.js';
import { validateOrder } from '../middlewares/order/validateOrder.js';
import { cancelOrders, createOrder } from '../controllers/order.controller.js';
import { checkBalance } from '../middlewares/order/checkBalance.js';

const router = express.Router();

router.use(addHeaders)

router.route('/').post(verifyToken, validateOrder, checkBalance, createOrder)
router.route('/cancel').put(verifyToken, cancelOrders)
// router.route('/').get((_, res) => res.json({message: "Lô đề"}));

export {router as orderRouter};