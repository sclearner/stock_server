export function TimeModel(sequelize, DataTypes) {
    const Time = sequelize.define("time",
        {
            time: {
                type: DataTypes.DATE,
            }
        }, {
            createdAt: false,
            updatedAt: false,
        }
    );
    return Time
}