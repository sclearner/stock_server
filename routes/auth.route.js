import express from 'express';
import { signin, signup } from '../controllers/auth.controller.js';
import { addHeaders } from '../middlewares/auth/addHeaders.js';
import { checkDuplicate } from '../middlewares/auth/verifySignUp.js';

const router = express.Router();

router.use(addHeaders)
router.route('/signup').post(checkDuplicate, signup);
router.route('/signin').post(signin);
// router.route('/').get((_, res) => res.json({message: "Lô đề"}));

export {router as authRouter};