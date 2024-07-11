import express from "express";
import { getInstrumentNames, getInstruments, getInstrument } from "../controllers/instrument.controller.js";
import { addHeaders } from "../middlewares/auth/addHeaders.js";

const router = express.Router();

router.use(addHeaders);

router.route("/").get(getInstruments);
router.route("/name").get(getInstrumentNames);
router.route("/:id").get(getInstrument);

export { router as instrumentRouter };
