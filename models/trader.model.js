import roleConfig from "../configs/role.config.js";

export default function (sequelize, DataTypes) {
  return sequelize.define("trader", {
    name: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
    },
    role: {
      type: DataTypes.ENUM(...roleConfig.roles),
      defaultValue: roleConfig.defaultValue,
    },
  });
}
