import express from "express";
import { addHeaders } from "../middlewares/auth/addHeaders.js";
import { getTraderBalance, recharge } from "../controllers/balance.controller.js";
import { verifyToken } from "../middlewares/auth/authJwt.js";
import { getAllOrder } from "../controllers/order.controller.js";

const router = express.Router();

router.use(addHeaders);

router.route("/").get(verifyToken, getTraderBalance);
router.route("/recharge").put(verifyToken, recharge);
router.route('/orders').get(verifyToken, getAllOrder);

export { router as TraderRouter };
