import orderConfig from "../configs/order.config.js";

export default function (sequelize, DataTypes) {
  return sequelize.define("order", {
    traderId: {
      type: DataTypes.INTEGER,
    },
    amount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      validate: {
        min: orderConfig.loc,
        max: orderConfig.maxAmount,
        isValidAmount: (value) => {
          if (value > orderConfig.maxAmount) return false;
          if (value < orderConfig.minAmount) return false;
          if (
            Math.floor((value - orderConfig.minAmount) / orderConfig.loc) *
              orderConfig.loc !==
            value - orderConfig.minAmount
          )
            throw new Error('Invalid amount, need to be locer!')
        },
      },
    },
    currency: {
      type: DataTypes.STRING,
    },
    isAsk: {
      type: DataTypes.BOOLEAN,
      defaultValue: false, // Default is Bid (Sell)
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true, // True is MP call
      validate: {
        min: 0,
      },
    },
    matchAmount: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(orderConfig.status),
      allowNull: false,
      defaultValue: orderConfig.defaultStatus,
    },
    type: {
      type: DataTypes.ENUM(orderConfig.types),
      defaultValue: orderConfig.defaultType,
      allowNull: false,
    },
    totalExchange: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0
    }
  });
}
