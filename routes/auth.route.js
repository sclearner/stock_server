import express from 'express';
import { refreshToken, signin, signup } from '../controllers/auth.controller.js';
import { addHeaders } from '../middlewares/auth/addHeaders.js';
import { validate, checkDuplicate } from '../middlewares/auth/verifySignUp.js';

const router = express.Router();

router.use(addHeaders)

router.route('/signup').post([validate, checkDuplicate], signup);
router.route('/signin').post(signin);
router.route('/refresh-token').post(refreshToken)
// router.route('/').get((_, res) => res.json({message: "Lô đề"}));

export {router as authRouter};