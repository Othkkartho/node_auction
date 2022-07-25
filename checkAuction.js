const { Op } = require('Sequelize');

const { Good, Auction, User, sequelize } = require('./models');

module.exports = async () => {
  console.log('checkAuction');
  try {
    // const yesterday = new Date();
    // yesterday.setDate(yesterday.getDate() - 1);
    const targets = await Good.findAll({
      where: {
        SoldId: null,
        // createdAt: { [Op.lte]: yesterday },
      },
    });
    for (const target of targets) {
      const end = new Date(target.creatAt);
      end.setHours(end.getHours() + target.end);
      if (new Date() > end) {
        const success = await Auction.findOne({
          where: {GoodId: target.id},
          order: [['bid', 'DESC']],
        });
        await Good.update({SoldId: success.UserId}, {where: {id: target.id}});
        await User.update({
          money: sequelize.literal(`money - ${success.bid}`),
        }, {
          where: {id: success.UserId},
        });
      }
    }
  } catch (error) {
    console.error(error);
  }
};
