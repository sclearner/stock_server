export function InstrumentModel(sequelize, DataTypes) {
    const Instrument = sequelize.define("instrument",
        {symbol: {
            type: DataTypes.STRING,
            primaryKey: true
        },
        currency: {
            type: DataTypes.STRING,
            allowNull: true
        },
        dayPrice: {
            type: DataTypes.DECIMAL(20, 2),
            allowNull: true
        },
        currentPrice: {
            type: DataTypes.DECIMAL(20, 2),
            allowNull: true
        }}
    )

    return Instrument
}