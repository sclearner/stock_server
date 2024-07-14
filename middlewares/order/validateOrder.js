import { db } from "../../models/index.js";

export async function validateOrder(req, res, next) {
    req.transaction = await db.sequelize.transaction();
    try {
      const orderInfo = {
        traderId: req.traderId,
        amount: req.body.amount,
        currency: req.body.currency,
        isAsk: req.body.isAsk,
        price: req.body.price,
        type: req.body.type || (req.body.price && "LO") || "MP"
    }
      const order = new db.Order(orderInfo);
      await order.validate( {
        transaction: req.transaction
      });
      req.order = order;
      next();
    } catch (err) {
      req.transaction.rollback();
      res.status(400).json({ error: err.message });
    }
  }