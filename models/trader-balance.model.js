export function TraderBalanceModel(sequelize, DataTypes) {
    const TraderBalance = sequelize.define("trader_balance",
        {
            amount: {
                type: DataTypes.DECIMAL(20,2),
                allowNull: false,
                defaultValue: 0
            }
        },
        {
            timestamps: false,
            freezeTableName: true,
        }
    )

    return TraderBalance;
}