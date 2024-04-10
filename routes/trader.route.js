import express from "express";
import { addHeaders } from "../middlewares/auth/addHeaders.js";
import { getTraderBalance } from "../controllers/balance.controller.js";
import { verifyToken } from "../middlewares/auth/authJwt.js";

const router = express.Router();

router.use(addHeaders);

router.route("/").get(verifyToken, getTraderBalance);

export { router as TraderRouter };
