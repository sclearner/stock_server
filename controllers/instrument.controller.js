import orderConfig from "../configs/order.config.js";
import { db } from "../models/index.js";
import { Op } from "sequelize";

export async function getInstruments(req, res) {
  const { limit = 1000, offset = 0 } = req.query;
  db.Instrument.findAll({
    raw: true,
    where: {
      currency: { [Op.ne]: null },
    },
    limit,
    offset,
    attributes: ["symbol", "currency", "dayPrice"],
  })
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((error) => res.status(500).json({ error: error.message }));
}

export async function updateInstruments() {
  const stocks = await db.Instrument.findAll({
    where: {
      currency: { [Op.ne]: null },
    },
  });
  for (const stock of stocks) {
      stock.set({
        dayPrice: stock.currentPrice,
      });
      stock.save();
  }
}
