import orderConfig from "../configs/order.config.js";

export function TradeModel(sequelize, DataTypes) {
  const Trade = sequelize.define(
    "trade",
    {
      askId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
      bidId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
      amount: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
        defaultValue: 0,
      },
      price: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      updatedAt: false,
    }
  );

  return Trade;
}
