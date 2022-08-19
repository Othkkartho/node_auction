const { Op } = require('Sequelize');

const { Good, Auction, User, sequelize } = require('./models');
const schedule = require('node-schedule');
const {find_user, membership_upgrade, buyer_member, seller_member} = require("./routes/middlewares");

module.exports = async () => {
  console.log('checkAuction');
  try {
    const targets = await Good.findAll({where: {SoldId: null}});
    for (const target of targets) {
      const end = new Date(target.createdAt);
      const success = await Auction.findOne({
        where: {GoodId: target.id},
        order: [['bid', 'DESC']],
      });
      end.setHours(end.getHours() + target.end);
      // end.setMinutes(end.getMinutes()+1);
      if (new Date() > end) {
        const success = await Auction.findOne({
          where: {GoodId: target.id},
          order: [['bid', 'DESC']],
        });
        if (success) {
          await User.update({money: sequelize.literal(`money + (${target.price} * 0.1)`)}, {where: {id: target.OwnerId}});
          let user1 = await find_user(success.UserId);
          const buyer = buyer_member(user1);
          const buyer_commission = buyer[0];
          const point = buyer[1];

          let user2 = await find_user(target.OwnerId);
          const seller_commission = seller_member(user2);

          await Good.update({SoldId: success.UserId}, {where: {id: target.id}});
          await User.update({
            money: sequelize.literal(`money - (${success.bid} + (${success.bid} * ${buyer_commission}))`),
            spend_money: sequelize.literal(`spend_money + ${success.bid}`),
            point: sequelize.literal(`point + (${success.bid} * (0.01 * ${point}))`),
          }, {where: {id: success.UserId},});
          await User.update({
            money: sequelize.literal(`money + (${success.bid} * (1 - ${seller_commission}))`),
            sell_money: sequelize.literal(`sell_money + ${success.bid}`),
          }, {where: {id: target.OwnerId},});

          user1 = await find_user(success.UserId);
          user2 = await find_user(target.OwnerId);

          const membership = membership_upgrade(user1, user2);
          await User.update({buyer_membership:  membership[0]}, {where: {id: success.UserId}});
          await User.update({seller_membership: membership[1]}, {where: {id: target.OwnerId}});
        }
        else {
          await User.update({money: sequelize.literal(`money + (${target.price} * 0.1)`)}, {where: {id: target.OwnerId}});
          await Good.update({SoldId: target.OwnerId}, {where: {id: target.id}});
        }
      }
      // else {
      //   schedule.scheduleJob(end, async () => {
      //     const success = await Auction.findOne({
      //       where: {GoodId: target.id},
      //       order: [['bid', 'DESC']],
      //     });
      //     if (success) {
      //       await Good.update({SoldId: success.UserId}, {where: {id: target.id}});
      //       await User.update({
      //         money: sequelize.literal(`money - ${success.bid}`),
      //       }, {
      //         where: {id: success.UserId},
      //       });
      //       await User.update({
      //         money: sequelize.literal(`money + ${success.bid}`),
      //       }, {
      //         where: {id: target.OwnerId},
      //       });
      //     } else {
      //       console.log('2. OwnerId', target.OwnerId, 'id:', target.id);
      //       await Good.update({soldId: target.OwnerId}, {where: {id: target.id}});
      //     }
      //   });
      // }
    }
  } catch (error) {
    console.error(error);
  }
};
