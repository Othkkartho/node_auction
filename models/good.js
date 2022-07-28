const Sequelize = require('sequelize');
const {DataTypes} = require("sequelize");
const {flatten} = require("express/lib/utils");

module.exports = class Good extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      name: {
        type: Sequelize.STRING(40),
        allowNull: false,
      },
      img: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      start: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      end: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 24,
      },
      price: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      ready: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }
    }, {
      sequelize,
      timestamps: true,
      paranoid: true,
      modelName: 'Good',
      tableName: 'goods',
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(db) {
    db.Good.belongsTo(db.User, { as: 'Owner' });
    db.Good.belongsTo(db.User, { as: 'Sold' });
    db.Good.hasMany(db.Auction);
  }
};
