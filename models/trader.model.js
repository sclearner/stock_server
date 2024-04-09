export default function (sequelize, DataTypes) {
  return sequelize.define("trader", {
    name: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
    },
    password: {
      type: DataTypes.STRING,
    },
  });
}
