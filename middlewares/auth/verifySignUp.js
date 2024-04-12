import { db } from "../../models/index.js";
import bcrypt from "bcryptjs";

const {Trader} = db;
/**
 * Middleware for checking the existence of given
 * emails in req.body.email of POST '/api/signup'
 * @param {Request} req
 * @param {Response} res
 * @param {(req: Request, res: Response) => {}} next
 */
export function checkDuplicate(req, res, next) {
  Trader.findOne({
    attributes: ['id'],
    where: {
      email: req.body.email,
    },
  }).then((user) => {
    if (user) {
      res.status(400).json({
        error: "Email is already in use!",
      });
      return;
    }
    next();
  });
}

export async function validateTrader(req, res, next) {
  try {
    if (req.body.password.length < 8) throw new Error("Password must be at least 8 characters");
    const trader = new Trader({
      name: req.body.name,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
    });
    await trader.validate();
    req.trader = trader;
    next();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
