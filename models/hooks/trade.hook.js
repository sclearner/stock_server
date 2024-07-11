import { Op, where } from "sequelize";
import { db } from "../index.js";
import currencyConfig from "../../configs/currency.config.js";

const updateOption = (t) => ({
  fields: ["matchAmount", "status"],
  validate: false,
  transaction: t,
});

async function payForTrading(
  isAskMode = false,
  askOrder,
  bidOrder,
  previousAmountLeft,
  t
) {
  const askTraderBalance =
    askOrder.type === "MP"
      ? (
          await db.TraderBalance.findOne({
            where: {
              id: askOrder.traderId,
              currency: currencyConfig.defaultCurrency,
            },
            transaction: t,
          })
        ).amount
      : null;

  let amountLeft = previousAmountLeft;
  const matchOrder = isAskMode ? bidOrder : askOrder;
  const orderLeftAmount = matchOrder.amount - matchOrder.matchAmount;
  const amountAdd = Math.min(
      amountLeft * 1,
      orderLeftAmount * 1,
      Math.floor(
        (askTraderBalance - matchOrder.totalExchange) / matchOrder.price
      )
    );
  amountLeft -= amountAdd;
  const payTransaction = t;

  try {
    // Save ask total exchange (VND)
    await askOrder.increment("totalExchange", {
      by: matchOrder.price * amountAdd,
      transaction: payTransaction,
    });
    // Save bid total exchange (VND)
    await bidOrder.increment("totalExchange", {
      by: matchOrder.price * amountAdd,
      transaction: payTransaction,
    });
    //await payTransaction.commit();
    await db.Trade.create(
      {
        askId: askOrder.id,
        bidId: bidOrder.id,
        amount: amountAdd,
        price: matchOrder.price,
      },
      {
        transaction: payTransaction,
      }
    );
    const finalMatchAmount = matchOrder.matchAmount * 1 + amountAdd;
    matchOrder.set({
      status: matchOrder.amount == finalMatchAmount ? "DONE" : "ACTIVE",
      matchAmount: finalMatchAmount,
    });
  } catch (err) {
    matchOrder.status = "CANCEL";
    amountLeft = previousAmountLeft;
  } finally {
    await matchOrder.save(updateOption(t));
  }
  return amountLeft;
}

async function updateMatchAmountBid(askOrder, matchOrders, t) {
  if (matchOrders.length === 0) return;
  let lastPrice;
  let totalPrice = 0;
  let amountLeft = askOrder.amount - askOrder.matchAmount;
  for (const matchOrder of matchOrders) {
    if (amountLeft <= 0) break;
    if (askOrder.price !== null && askOrder.price < matchOrder.price) {
      break;
    }
    amountLeft = await payForTrading(true, askOrder, matchOrder, amountLeft, t);
    lastPrice = matchOrder.price;
  }
  askOrder.matchAmount = askOrder.amount - amountLeft;
  if (amountLeft === 0) askOrder.status = "DONE";
  await db.Instrument.update(
    {
      currentPrice: lastPrice,
    },
    {
      where: {
        symbol: askOrder.currency,
      },
      silent: true,
      transaction: t,
    }
  );
}

async function updateMatchAmountAsk(bidOrder, matchOrders, t) {
  if (matchOrders.length === 0) return;
  let lastPrice;
  let amountLeft = bidOrder.amount - bidOrder.matchAmount;
  for (const matchOrder of matchOrders) {
    if (amountLeft <= 0) break;
    if (bidOrder.price !== null && bidOrder.price > matchOrder.price) {
      break;
    }
    amountLeft = await payForTrading(
      false,
      matchOrder,
      bidOrder,
      amountLeft,
      t
    );
    lastPrice = matchOrder.price;
  }
  bidOrder.matchAmount = bidOrder.amount - amountLeft;
  if (amountLeft === 0) bidOrder.status = "DONE";
  //Update instrument
  await db.Instrument.update(
    {
      currentPrice: lastPrice,
    },
    {
      where: {
        symbol: bidOrder.currency,
      },
      transaction: t,
    }
  );
}

async function matchLimitOrderAsk(order, options) {
  const findOptions = {
    currency: order.currency,
    status: "ACTIVE",
    isAsk: true,
    ...(order.type !== "MP" && {
      price: {
        [Op.gte]: order.price,
      },
    }),
  };
  const orders = await db.Order.findAll({
    where: findOptions,
    order: [["price", "DESC"]],
  });
  return orders;
}

async function matchLimitOrderBid(order, options) {
  const findOptions = {
    currency: order.currency,
    status: "ACTIVE",
    isAsk: false,
    ...(order.type !== "MP" && {
      price: {
        [Op.lte]: order.price,
      },
    }),
  };
  const orders = await db.Order.findAll({
    where: findOptions,
    order: [["price", "ASC"]],
  });
  return orders;
}

async function matchLimitOrder(order, options) {
  let matchOrders;
  const t = options.transaction ?? (await db.sequelize.transaction());
  try {
    if (order.isAsk) {
      matchOrders = await matchLimitOrderBid(order, options);
      await updateMatchAmountBid(order, matchOrders, t);
    } else {
      matchOrders = await matchLimitOrderAsk(order, options);
      await updateMatchAmountAsk(order, matchOrders, t);
    }
    if (order.type === "MP" && order.matchAmount < order.amount) {
      order.status = "CANCEL";
    }
    await order.save(updateOption(t));
    if (t !== options.transaction) await t.commit();
  } catch (err) {
    if (t != options.transaction) await t.rollback();
    throw err;
  }
}

async function moveToLog(order, options) {
  if (order.status === "CANCEL" || order.status === "DONE") {
    await db.OrdersLog.upsert(
      {
        ...order.dataValues,
      },
      {
        transaction: options.transaction,
      }
    );
    if (order.totalExchange < order.amount * order.price && order.isAsk) {
      await db.TraderBalance.increment("amount", {
        by: order.amount * order.price - order.totalExchange,
        transaction: options.transaction,
        where: {
          id: order.traderId,
          currency: currencyConfig.defaultCurrency,
        },
      });
    }
  }
}

export function tradeHooks() {
  db.Order.afterCreate(matchLimitOrder);
  db.Order.afterUpdate(moveToLog);
}
