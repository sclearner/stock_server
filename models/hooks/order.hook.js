import currencyConfig from "../../configs/currency.config.js";
import orderConfig from "../../configs/order.config.js";
import { db } from "../index.js";

//Trigger of Orders
async function isValidPrice(order) {
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
}

export function orderHooks() {
    db.Order.afterValidate(isValidPrice);
    db.Order.afterCreate(payForTrading);
}