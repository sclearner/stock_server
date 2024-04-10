import config from '../configs/db.config.js'

import {Sequelize, DataTypes} from 'sequelize';
import TraderModel from './trader.model.js';
import { RefreshTokenModel } from './refreshToken.model.js';
import { InstrumentModel } from './instrument.model.js';
import { TraderBalanceModel } from './trader-balance.model.js';

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
const TraderBalance = TraderBalanceModel(sequelize, DataTypes);
class db {
    static sequelize = sequelize
    static Sequelize = Sequelize
    static Trader = Trader
    static RefreshToken = RefreshToken
    static Instrument = Instrument
    static TraderBalance = TraderBalance
}

//Relations
db.RefreshToken.belongsTo(db.Trader, {
    foreignKey: 'traderId', targetKey: 'id'
});

db.Trader.hasOne(db.RefreshToken, {
    foreignKey: 'traderId', targetKey: 'id'
})

db.Instrument.belongsToMany(db.Trader, {
    through: db.TraderBalance,
    foreignKey: 'id',
    otherKey: 'currency',
    timestamps: false
})

db.Trader.belongsToMany(db.Instrument, {
    through: db.TraderBalance,
    foreignKey: 'id',
    otherKey: 'currency',
    timestamps: false
})

// Hooks
db.Trader.afterCreate(
    async (trader, _options) => {
        const currencies = await db.Instrument.findAll({
            raw: true,
            where: {
                currency: null
            },
            attributes: ['symbol']
        })
        
        for (const currency of currencies) {
            TraderBalance.create({
                id: trader.id,
                currency: currency.symbol,
            })
        }
    }
)

export {db}