import express from "express";
import { getInstruments } from "../controllers/instrument.controller.js";
import { addHeaders } from "../middlewares/auth/addHeaders.js";

const router = express.Router();

router.use(addHeaders);

router.route("/").get(getInstruments);

export { router as instrumentRouter };
