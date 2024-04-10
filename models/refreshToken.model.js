import authConfig from "../configs/auth.config.js";
import { v4 as uuidv4 } from "uuid";

export function RefreshTokenModel(sequelize, DataTypes) {
  const RefreshToken = sequelize.define("refresh_token", {
    token: {
      type: DataTypes.STRING,
    },
    expiryDate: {
      type: DataTypes.DATE,
    }
  }, {
    timestamps: false
  });

  RefreshToken.createToken = async (trader) => {
    let expiredAt = new Date();

    expiredAt.setSeconds(
      expiredAt.getSeconds() + authConfig.jwtRefreshExpiration
    );

    let _token = uuidv4();

    let refreshToken = await RefreshToken.create({
      token: _token,
      traderId: trader.id,
      expiryDate: expiredAt.getTime(),
    });

    return refreshToken.token;
  };

  RefreshToken.verifyExpiration = (token) =>
    token.expiryDate.getTime() < Date.now();

  return RefreshToken;
}
