const { Op } = require('Sequelize');

const { Good, Auction, User, sequelize } = require('./models');
const schedule = require('node-schedule');

module.exports = async () => {
  console.log('checkAuction');
  try {
    const targets = await Good.findAll({
      where: {SoldId: null},
    });
    targets.forEach(async (target) => {
      const end = new Date(target.creatAt);
      end.setHours(end.getHours() + target.end);
      console.log('end hour:', (end.getHours() + target.end));
      if (new Date() > end) {
        const success = await Auction.findOne({
          where: {GoodId: target.id},
          order: [['bid', 'DESC']],
        });
        console.log('success:', success);
        if (success) {
          await Good.update({SoldId: success.UserId}, {where: {id: target.id}});
          await User.update({
            money: sequelize.literal(`money - ${success.bid}`),
          }, {
            where: {id: success.UserId},
          });
        }
        else {
          await Good.update({soldId: target.ownerId}, {where: {id: target.id}});
        }
      }
    //   else {
    //     schedule.scheduledJobs(end, async () => {
    //       const success = await Auction.findOne({
    //         where: {GoodId: target.id},
    //         order: [['bid', 'DESC']],
    //       });
    //       console.log('success:', success);
    //       if (success) {
    //         await Good.update({SoldId: success.UserId}, {where: {id: target.id}});
    //         await User.update({
    //           money: sequelize.literal(`money - ${success.bid}`),
    //         }, {
    //           where: {id: success.UserId},
    //         });
    //       } else {
    //         await Good.update({soldId: target.ownerId}, {where: {id: target.id}});
    //       }
    //     });
    //   }
    });
  } catch (error) {
    console.error(error);
  }
};
