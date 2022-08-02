const { Op } = require('Sequelize');

const { Good, Auction, User, sequelize } = require('./models');
const schedule = require('node-schedule');

module.exports = async () => {
  console.log('checkAuction');
  try {
    const targets = await Good.findAll({where: {SoldId: null}});
    for (const target of targets) {
      const end = new Date(target.createdAt);
      end.setHours(end.getHours() + target.end);
      // end.setMinutes(end.getMinutes()+1);
      if (new Date() > end) {
        const success = await Auction.findOne({
          where: {GoodId: target.id},
          order: [['bid', 'DESC']],
        });
        if (success) {
          await Good.update({SoldId: success.UserId}, {where: {id: target.id}});
          await User.update({
            money: sequelize.literal(`money - ${success.bid}`),
          }, {
            where: {id: success.UserId},
          });
          await User.update({
            money: sequelize.literal(`money + ${success.bid}`),
          }, {
            where: {id: target.OwnerId},
          });
        }
        else {
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
