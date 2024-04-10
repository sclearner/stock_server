import { db } from "../models/index.js";

const {Trader, Instrument, TraderBalance, sequelize} = db

export async function getTraderBalance(req, res) {
    const findConfig = {
        raw: true,
        where: {
            id: req.params.id || req.traderId
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
        const trader = await Trader.findOne(findConfig)
        if (trader) res.status(200).json(trader)
        else res.status(404).json({error: 'Trader not found'})
    }
    catch (err) {
        res.status(404).json({error: err.message})
    }
}