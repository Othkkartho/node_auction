const Sequelize = require('sequelize');

module.exports = class User extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      email: {
        type: Sequelize.STRING(40),
        allowNull: false,
        unique: true,
        comment: "이메일",
      },
      nick: {
        type: Sequelize.STRING(15),
        allowNull: false,
        comment: "닉네임",
      },
      password: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: "비밀번호"
      },
      money: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: "가지고 있는 돈",
      },
      spend_money: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: "경매에 사용한 돈",
      },
      sell_money: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: "판매한 물품의 금액",
      },
      point: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: "경매에 사용한 금액 중 0.5% 정도의 포인트를 줌",
      },
      seller_membership: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'user',
        comment: "회원의 판매 맴버쉽 등급 저장(user, copper, iron, gold, diamond)",
      },
      buyer_membership: {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: 'user',
        comment: "회원의 소비 맴버쉽 등급 저장(user, copper, iron, gold, diamond)",
      },
    }, {
      sequelize,
      timestamps: true,
      paranoid: true,
      modelName: 'User',
      tableName: 'users',
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(db) {
    db.User.hasMany(db.Auction);
  }
};

