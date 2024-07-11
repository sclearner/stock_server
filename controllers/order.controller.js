import { db } from "../models/index.js";

export async function createOrder(req, res) {
  req.order
    .save({ transaction: req.transaction })
    .then((_order) => {
      req.transaction.commit();
      res.status(201).json({ message: "Order created" });
    })
    .catch((err) => {
      req.transaction.rollback();
      if (err.constructor.name === "Error") {
        res.status(400).json({ error: err.message });
      }
      else {
        res.status(500).json({ error: err.stack });
      }
    });
}

export async function cancelAllOrder() {
  await db.Order.update({
    status: 'CANCEL'
  }, {
    where: {
      status: 'ACTIVE',
    },
    individualHooks: true
  });
}
