import config from '../configs/db.config.js'

import {Sequelize, DataTypes} from 'sequelize';
import TraderModel from './trader.model.js';

const sequelize = new Sequelize(
    config.DB,
    config.USER,
    config.PASSWORD,
    {
        host: config.HOST,
        dialect: config.dialect
    }
)

const Trader = TraderModel(sequelize, DataTypes);
const db = {
    sequelize, 
    Sequelize, 
    Trader,
}

export {db, Sequelize, Trader};