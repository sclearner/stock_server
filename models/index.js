import config from "../configs/db.config.js";

import { Sequelize, DataTypes } from "sequelize";
import TraderModel from "./trader.model.js";
import { RefreshTokenModel } from "./refreshToken.model.js";
import { InstrumentModel } from "./instrument.model.js";
import { TraderBalanceModel } from "./trader-balance.model.js";
import OrderModel from "./order.model.js";
import { TradeModel } from "./trade.model.js";
import { orderHooks } from "./hooks/order.hook.js";
import { traderHooks } from "./hooks/trader.hook.js";
import { tradeHooks } from "./hooks/trade.hook.js";
import { OrdersLogModel } from "./order-log.model.js";

const sequelize = new Sequelize(config.DB, config.USER, config.PASSWORD, {
  host: config.HOST,
  dialect: config.dialect,
  logging: false,
});

const Trader = TraderModel(sequelize, DataTypes);
const RefreshToken = RefreshTokenModel(sequelize, DataTypes);
const Instrument = InstrumentModel(sequelize, DataTypes);
const TraderBalance = TraderBalanceModel(sequelize, DataTypes);
const Order = OrderModel(sequelize, DataTypes);
const OrdersLog = OrdersLogModel(sequelize, DataTypes);
const Trade = TradeModel(sequelize, DataTypes);
class db {
  static sequelize = sequelize;
  static Sequelize = Sequelize;
  static Trader = Trader;
  static RefreshToken = RefreshToken;
  static Instrument = Instrument;
  static TraderBalance = TraderBalance;
  static Order = Order;
  static Trade = Trade;
  static OrdersLog = OrdersLog;
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

// db.Trade.belongsTo(db.Order, {
//   foreignKey: "askId",
//   targetKey: "id"
// });

// db.Trade.belongsTo(db.Order, {
//   foreignKey: "bidId",
//   targetKey: "id"
// });

//Hook
traderHooks();
orderHooks();
tradeHooks();

export { db };
