import { Op } from "sequelize";
import { db } from "../index.js";

const updateOption = (t) => ({
  fields: ["matchAmount", "status"],
  validate: false,
  transaction: t,
});

async function updateMatchAmountBid(askOrder, matchOrders, t) {
  if (matchOrders.length === 0) return;
  let lastPrice;
  let amountLeft = askOrder.amount - askOrder.matchAmount;
  for (const matchOrder of matchOrders) {
    if (amountLeft <= 0) break;
    if (askOrder.price !== null && askOrder.price < matchOrder.price) {
      break;
    }
    const orderLeftAmount = matchOrder.amount - matchOrder.matchAmount;
    let amountAdd;
    if (orderLeftAmount > amountLeft) {
      amountAdd = amountLeft * 1;
      amountLeft = 0;
    } else {
      amountAdd = orderLeftAmount * 1;
      matchOrder.status = "DONE";
      amountLeft -= orderLeftAmount;
    }
    matchOrder.matchAmount = matchOrder.matchAmount * 1 + amountAdd;
    await matchOrder.save(updateOption(t));
    await db.Trade.create({
      'askId': askOrder.id,
      'bidId': matchOrder.id,
      'amount': amountAdd,
      'price': matchOrder.price      
    }, {
      transaction: t
    });
    lastPrice = matchOrder.price;
  }
  askOrder.matchAmount = askOrder.amount - amountLeft;
  console.log("----------------------------------------");
  if (amountLeft === 0) askOrder.status = "DONE";
  
  await db.Instrument.update({
    currentPrice: lastPrice
  }, {
    where: {
      symbol: askOrder.currency,
    },
    transaction: t
  });
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
    const orderLeftAmount = matchOrder.amount - matchOrder.matchAmount;
    let amountAdd;
    if (orderLeftAmount > amountLeft) {
      amountAdd = amountLeft * 1;
      amountLeft = 0;
    } else {
      amountAdd = orderLeftAmount * 1;
      matchOrder.status = "DONE";
      amountLeft -= orderLeftAmount;
    }
    matchOrder.matchAmount = matchOrder.matchAmount * 1 + amountAdd;
    await matchOrder.save(updateOption(t));
    await db.Trade.create({
      'askId': matchOrder.id,
      'askTraderId': matchOrder.traderId,
      'askOrderType': matchOrder.type,
      'bidId': bidOrder.id,
      'bidTraderId': bidOrder.traderId,
      'bidOrderType': bidOrder.type,
      'amount': amountAdd,
      'price': matchOrder.price    
    }, {
      transaction: t
    });
    lastPrice = matchOrder.price;
  }
  bidOrder.matchAmount = bidOrder.amount - amountLeft;
  console.log("----------------------------------------");
  if (amountLeft === 0) bidOrder.status = "DONE";
  //Update instrument
  await db.Instrument.update({
    currentPrice: lastPrice
  }, {
    where: {
      symbol: bidOrder.currency,
    },
    transaction: t
  });
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
  console.log(findOptions);
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

export function tradeHooks() {
  db.Order.afterCreate(matchLimitOrder);
  
}
