import config from "../configs/db.config.js";

import { Sequelize, DataTypes } from "sequelize";
import TraderModel from "./trader.model.js";
import { RefreshTokenModel } from "./refreshToken.model.js";
import { InstrumentModel } from "./instrument.model.js";
import { TraderBalanceModel } from "./trader-balance.model.js";
import OrderModel from "./order.model.js";
import orderConfig from "../configs/order.config.js";
import currencyConfig from "../configs/currency.config.js";
const sequelize = new Sequelize(config.DB, config.USER, config.PASSWORD, {
  host: config.HOST,
  dialect: config.dialect,
  // logging: false
});

const Trader = TraderModel(sequelize, DataTypes);
const RefreshToken = RefreshTokenModel(sequelize, DataTypes);
const Instrument = InstrumentModel(sequelize, DataTypes);
const TraderBalance = TraderBalanceModel(sequelize, DataTypes);
const Order = OrderModel(sequelize, DataTypes);
class db {
  static sequelize = sequelize;
  static Sequelize = Sequelize;
  static Trader = Trader;
  static RefreshToken = RefreshToken;
  static Instrument = Instrument;
  static TraderBalance = TraderBalance;
  static Order = Order;
}

//Relations
db.RefreshToken.belongsTo(db.Trader, {
  foreignKey: "traderId",
  targetKey: "id",
});

db.Trader.hasOne(db.RefreshToken, {
  foreignKey: "traderId",
  targetKey: "id",
});

db.Instrument.belongsToMany(db.Trader, {
  through: db.TraderBalance,
  foreignKey: "currency",
  otherKey: "id",
  timestamps: false,
});

db.Trader.belongsToMany(db.Instrument, {
  through: db.TraderBalance,
  foreignKey: "id",
  otherKey: "currency",
  timestamps: false,
});

db.Order.belongsTo(db.Trader, {
  foreignKey: "traderId",
  targetKey: "id",
});

db.Trader.hasMany(db.Order, {
  foreignKey: "traderId",
  targetKey: "id",
});

db.Order.belongsTo(db.Instrument, {
  foreignKey: "currency",
  targetKey: "symbol",
});

db.Instrument.hasMany(db.Order, {
  foreignKey: "currency",
  targetKey: "symbol",
});
// Hooks
db.Trader.afterCreate(async (trader, options) => {
  const { transaction } = options;
  const currencies = (
    await db.Instrument.findAll({
      raw: true,
      where: {
        currency: null,
      },
      attributes: ["symbol"],
    })
  ).map((e) => e.symbol);

  for (const c of currencies) {
    await db.TraderBalance.create(
      {
        id: trader.id,
        currency: c,
      },
      { transaction }
    );
  }
});

//Trigger of Orders
async function isValidPrice(order) {
  const { price, createdAt } = await db.Instrument.findByPk(order.currency, {
    raw: true,
    attributes: [["last_price", "price"], "createdAt"],
  }).catch((_err) => ({ price: null, createdAt: null }));
  if (order.price === null) {
    order.price = price;
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

db.Order.beforeCreate(isValidPrice);

async function payForOrder(order, options) {
  const transaction = options.transaction;
  try {
    let currency, decrement;
    if (order.isAsk) {
        currency = currencyConfig.defaultCurrency;
        decrement = order.price * order.amount;
    }
    else {
        currency = order.currency;
        decrement = order.amount;
    }
    await db.TraderBalance.decrement(["amount"], {
        by: decrement,
        where: {
          id: order.traderId,
          currency
        },
        transaction,
     });
    transaction.commit();
  } catch (err) {
    transaction.rollback();
    throw err;
  }
}
db.Order.afterCreate(payForOrder);

export { db };
