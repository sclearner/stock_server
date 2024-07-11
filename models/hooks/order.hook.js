import { where } from "sequelize";
import currencyConfig from "../../configs/currency.config.js";
import orderConfig from "../../configs/order.config.js";
import { db } from "../index.js";

//Trigger of Orders
async function isValidPrice(order) {
  if (order.status === 'CANCEL') return;
  const { price, createdAt } = await db.Instrument.findByPk(order.currency, {
    raw: true,
    attributes: [["dayPrice", "price"], "createdAt"],
  }).catch((_err) => ({ price: null, createdAt: null }));
  if (order.price == null) {
    return;
  }
  if (price === null) throw new Error("Invalid price");
  const newCorpStockDate = createdAt;
  newCorpStockDate.setDate(
    createdAt.getDate() + orderConfig.newStockDurationDays
  );
  const rangePrice =
    newCorpStockDate > new Date()
      ? orderConfig.newStockRange
      : orderConfig.range;
  if (
    (1 - rangePrice) * price > order.price ||
    order.price > (1 + rangePrice) * price
  ) {
    throw new Error("Price out of range!");
  }
  const forTick = Math.abs(order.price - price);
  if (Math.floor(forTick / orderConfig.tick) * orderConfig.tick !== forTick) {
    throw new Error("Invalid price, need to be tickle!");
  }
}

async function payForTrading(order, options) {
  // Pay for buying stock (VND)
  if (order.isAsk && order.price !== null) await db.TraderBalance.decrement("amount", {
    by: order.price * order.amount,
    transaction: options.transaction,
    where: { id: order.traderId , currency: currencyConfig.defaultCurrency},
  });
  // Pay for selling stock (stock)
  if (!order.isAsk && order.price !== null) await db.TraderBalance.decrement("amount", {
    by: order.amount,
    transaction: options.transaction,
    where: { id: order.traderId , currency: order.currency},
  });
}

async function exchangeAfterInactive(order, options) {
  if (order.status !== 'ACTIVE') {
    const [stockBalance] = await db.TraderBalance.findOrCreate({
      where: {
        id: order.traderId,
        currency: order.currency
      },
      transaction: options.transaction,
    });
    const moneyBalance = await db.TraderBalance.findOne({
      where: {
        id: order.traderId,
        currency: currencyConfig.defaultCurrency
      },
      transaction: options.transaction
    });
    //Add stock
    if (order.isAsk) {
      await stockBalance.increment('amount', {
        by: order.matchAmount,
        transaction: options.transaction,
      });
    }
    else {
      await stockBalance.increment('amount', {
        by: order.amount - order.matchAmount,
        transaction: options.transaction,
      });
    }
    //Exchange money
    if (order.price !== null) {
      if (order.isAsk) await moneyBalance.increment('amount', {
        by: order.price * order.amount - order.totalExchange,
        transaction: options.transaction
      });
      else {
        await moneyBalance.increment('amount', {
          by: order.totalExchange,
          transaction: options.transaction
        });
      }
    }
    else {
      if (order.isAsk) {
        await moneyBalance.decrement('amount', {
          by: order.totalExchange,
          transaction: options.transaction
        });
      }
      else {
        await moneyBalance.increment('amount', {
          by: order.totalExchange,
          transaction: options.transaction
        });
      }
    }
  }
}

export function orderHooks() {
    db.Order.afterValidate(isValidPrice);
    db.Order.afterCreate(payForTrading);
    db.Order.afterUpdate(exchangeAfterInactive);
}