import currencyConfig from "../configs/currency.config.js";
import { db } from "../models/index.js";
import { Op } from "sequelize";

const {Trader, Instrument, TraderBalance, sequelize} = db

export async function getTraderBalance(req, res) {
    const findConfig = {
        raw: true,
        where: {
            id: req.params.id || req.traderId,
        },
        include: [{
            model: Instrument,
            through: {
                model: TraderBalance,
                attributes: []
            },
            attributes: []
        }],
        attributes: [
            'instruments.trader_balance.currency',
            'instruments.trader_balance.amount'
        ],
    }

    try {
        const trader = await Trader.findAll(findConfig).then(
            result => result.filter(e => e.currency !== null)
        )
        if (trader) res.status(200).json(trader)
        else res.status(404).json({error: 'Trader not found'})
    }
    catch (err) {
        console.log(err);
        res.status(500).json({error: err.message})
    }
}

export async function recharge(req, res) {
    const amount = req.body.amount
    const currency = currencyConfig.defaultCurrency

    if (amount == null || !amount instanceof Number || amount <= 0) {
        return res.status(400).json({error: "Please submit a positive number!"})
    } 
    try {
        const [traderBalance] = await TraderBalance.findOrCreate({
            where: {
                id: req.traderId,
                currency
            },
            limit: 1
        });
        await traderBalance.increment('amount', {by: amount});
        res.status(200).json(traderBalance)
    }
    catch (err) {
        res.status(500).json({error: err.message})
    }
}