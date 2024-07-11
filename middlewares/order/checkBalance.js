import currencyConfig from "../../configs/currency.config.js";
import { db } from "../../models/index.js";

async function checkBalanceAsk(req, res, next) {
  const currency = currencyConfig.defaultCurrency;
  try {
    const { amount: balance } = await db.TraderBalance.findOne({
      raw: true,
      where: {
        id: req.traderId,
        currency,
      },
    });
    const { amount, price } = req.body;
    let finalPrice = price;
    if (price === undefined || price === null) {
      finalPrice = await db.Instrument.findByPk(req.body.currency).lastPrice;
    }
    if (finalPrice * amount > balance) {
      req.transaction.rollback();
      res.status(402).json({ error: "Not enough money!" });
    } else {
      next();
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function checkBalanceBid(req, res, next) {
  try {
    let { amount } = (await db.TraderBalance.findOne({
      raw: true,
      where: {
        id: req.traderId,
        currency: req.body.currency,
      },
    })) ?? { amount: 0 };
    if (req.body.amount > amount) {
      req.transaction.rollback();
      res.status(402).json({ err: "Not enough stock!" });
    } else {
      next();
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function checkBalance(req, res, next) {
  if (req.body.isAsk) {
    await checkBalanceAsk(req, res, next);
  } else {
    await checkBalanceBid(req, res, next);
  }
  if (res.statusCode > 399) {
    req.order.status = "CANCEL";
    await db.OrdersLog.create(req.order.get({ raw: true }));
  }
}
