import { db } from "../index.js";

async function initBalance(trader, options) {
    const { transaction } = options;
    const currencies = (
      await db.Instrument.findAll({
        raw: true,
        where: {
          currency: null,
        },
        attributes: ["symbol"],
      })
    ).map((e) => e.symbol);
  
    for (const c of currencies) {
      await db.TraderBalance.create(
        {
          id: trader.id,
          currency: c,
        },
        { transaction }
      );
    }
  }

export function traderHooks() {
    db.Trader.afterCreate(initBalance);

}