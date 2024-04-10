import config from '../configs/db.config.js'

import {Sequelize, DataTypes} from 'sequelize';
import TraderModel from './trader.model.js';
import { RefreshTokenModel } from './refreshToken.model.js';
import { InstrumentModel } from './instrument.model.js';

const sequelize = new Sequelize(
    config.DB,
    config.USER,
    config.PASSWORD,
    {
        host: config.HOST,
        dialect: config.dialect,
        // logging: false
    }
)

const Trader = TraderModel(sequelize, DataTypes);
const RefreshToken = RefreshTokenModel(sequelize, DataTypes);
const Instrument = InstrumentModel(sequelize, DataTypes);
class db {
    static sequelize = sequelize
    static Sequelize = Sequelize
    static Trader = Trader
    static RefreshToken = RefreshToken
    static Instrument = Instrument
}

db.RefreshToken.belongsTo(db.Trader, {
    foreignKey: 'traderId', targetKey: 'id'
});

db.Trader.hasOne(db.RefreshToken, {
    foreignKey: 'traderId', targetKey: 'id'
})

db.Instrument.belongsToMany(db.Trader, {
    through: 'trader_balance'
})

// db.Trader.afterInsert(

// )

export {db, Sequelize, Trader, RefreshToken, Instrument}