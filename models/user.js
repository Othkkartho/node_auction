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
        type: Sequelize.MEDIUMINT.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        comment: "경매에 사용한 금액 중 0.5% 정도의 포인트를 줌",
      },
      authority: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'None',
        comment: "사용자의 권한(소비자, 판매자, 관리자 확인)",
      },
      membership: {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: 'Normal',
        comment: "소비자, 판매자 등급 확인",
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

