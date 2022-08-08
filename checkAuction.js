const { Op } = require('Sequelize');

const { Good, Auction, User, sequelize } = require('./models');
const schedule = require('node-schedule');

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
          let user1 = await User.findOne({where: {id: success.UserId}, order: [['id', 'DESC']],});
          switch (user1.buyer_membership) {
            case 'copper': buyer_commission = 0.15; point = 0.1; break;
            case 'iron': buyer_commission = 0.13; point = 0.2; break;
            case 'gold': buyer_commission = 0.10; point = 0.4; break;
            case 'diamond': buyer_commission = 0.05; point = 0.7; break;
            default: buyer_commission = 0.20; point = 0.05; break;
          }

          let user2 = await User.findOne({where: {id: target.OwnerId}, order: [['id', 'DESC']],});
          switch (user2.seller_membership) {
            case 'copper': seller_commission = 0.15; break;
            case 'iron': seller_commission = 0.13; break;
            case 'gold': seller_commission = 0.10; break;
            case 'diamond': seller_commission = 0.05; break;
            default: seller_commission = 0.20; break;
          }

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

          user1 = await User.findOne({where: {id: success.UserId}, order: [['id', 'DESC']],});
          user2 = await User.findOne({where: {id: target.OwnerId}, order: [['id', 'DESC']],});

          if (user1.spend_money > 1000 && user1.spend_money < 100000) { await User.update({buyer_membership: 'copper'}, {where: {id: success.UserId}}); }
          else if (user1.spend_money > 100000 && user1.spend_money < 10000000) { await User.update({buyer_membership: 'iron'}, {where: {id: success.UserId}}); }
          else if (user1.spend_money > 10000000 && user1.spend_money < 1000000000) { await User.update({buyer_membership: 'gold'}, {where: {id: success.UserId}}); }
          else if (user1.spend_money > 1000000000) { await User.update({buyer_membership: 'diamond'}, {where: {id: success.UserId}}); }
          if (user2.sell_money > 1000 && user2.sell_money < 100000) { await  User.update({seller_membership: 'copper'}, {where: {id: target.OwnerId}}); }
          else if (user2.sell_money > 100000 && user2.sell_money < 10000000) { await  User.update({seller_membership: 'iron'}, {where: {id: target.OwnerId}}); }
          else if (user2.sell_money > 10000000 && user2.sell_money < 1000000000) { await  User.update({seller_membership: 'gold'}, {where: {id: target.OwnerId}}); }
          else if (user2.sell_money > 1000000000) { await  User.update({seller_membership: 'diamond'}, {where: {id: target.OwnerId}}); }
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
