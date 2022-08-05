const Sequelize = require('sequelize');
const {DataTypes} = require("sequelize");
const {flatten} = require("express/lib/utils");

module.exports = class Good extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      name: {
        type: Sequelize.STRING(40),
        allowNull: false,
        comment: "굿즈 이름",
      },
      img: {
        type: Sequelize.STRING(200),
        allowNull: true,
        comment: "굿즈 이미지 파일 이름",
      },
      start: {
        type: DataTypes.SMALLINT.UNSIGNED,
        allowNull: false,
        defaultValue: 1,
        comment: "경매 준비 시간",
      },
      end: {
        type: DataTypes.SMALLINT.UNSIGNED,
        allowNull: false,
        defaultValue: 24,
        comment: "경매 종료 시간",
      },
      price: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: "경매 최초 가격",
      },
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
