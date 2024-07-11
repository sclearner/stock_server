import { db } from "../models/index.js";
import { Op } from "sequelize";

export async function createOrder(req, res) {
  req.order
    .save({ transaction: req.transaction })
    .then((order) => {
      req.transaction.commit();
      res.status(201).json({ message: "Order created", orderId: order.id});
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

export async function getAllOrder(req, res) {
  const { limit = 1000, offset = 0 } = req.query;
  db.Order.findAll({
    raw: true,
    where: {
      traderId: req.traderId
    },
    limit,
    offset,
  })
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((error) => res.status(500).json({ error: error.message }));
}

export async function cancelOrders(req, res) {
  const list = req.body.ids;
  console.log(list);
  const result = await db.Order.update({
    status: 'CANCEL'
  }, {
    where: {
      status: 'ACTIVE',
      traderId: req.traderId,
      id: {
        [Op.in]: list
      }
    },
    individualHooks: true
  });
  res.status(200).json(result);
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
