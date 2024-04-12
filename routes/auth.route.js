import express from 'express';
import { refreshToken, signin, signUpClient, signUpCorp } from '../controllers/auth.controller.js';
import { addHeaders } from '../middlewares/auth/addHeaders.js';
import { validateTrader, checkDuplicate } from '../middlewares/auth/verifySignUp.js';

const router = express.Router();

router.use(addHeaders)

router.route('/signup').post([validateTrader, checkDuplicate], signUpClient);
router.route('/signup/corp').post([validateTrader, checkDuplicate], signUpCorp);
router.route('/signin').post(signin);
router.route('/refresh-token').post(refreshToken)
// router.route('/').get((_, res) => res.json({message: "Lô đề"}));

export {router as authRouter};