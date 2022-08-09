const {User} = require("../models");
exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  }
  else {
    res.redirect('/?loginError=로그인이 필요합니다.');
  }
};

exports.isNotLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    next();
  }
  else {
    res.redirect('/');
  }
};

exports.find_user = async (user_id) => {
  return await User.findOne({where: {id: user_id}, order: [['id', 'DESC']],});
}

exports.membership_upgrade = (user1, user2) => {
  let buyer_membership;
  let seller_membership;
  if (user1.spend_money > 1000 && user1.spend_money < 100000) {
    buyer_membership = 'copper';
  }
  else if (user1.spend_money > 100000 && user1.spend_money < 10000000) {
    buyer_membership = 'iron';
  }
  else if (user1.spend_money > 10000000 && user1.spend_money < 1000000000) {
    buyer_membership = 'gold';
  }
  else if (user1.spend_money > 1000000000) {
    buyer_membership = 'diamond';
  }
  if (user2.sell_money > 1000 && user2.sell_money < 100000) {
    seller_membership = 'copper';
  }
  else if (user2.sell_money > 100000 && user2.sell_money < 10000000) {
    seller_membership = 'iron';
  }
  else if (user2.sell_money > 10000000 && user2.sell_money < 1000000000) {
    seller_membership = 'gold';
  }
  else if (user2.sell_money > 1000000000) {
    seller_membership = 'diamond';
  }

  return [buyer_membership, seller_membership];
}

exports.buyer_member = (user) => {
  let buyer_commission;
  let point;
  switch (user.buyer_membership) {
    case 'copper': buyer_commission = 0.15; point = 0.1; break;
    case 'iron': buyer_commission = 0.13; point = 0.2; break;
    case 'gold': buyer_commission = 0.10; point = 0.4; break;
    case 'diamond': buyer_commission = 0.05; point = 0.7; break;
    default: buyer_commission = 0.20; point = 0.05; break;
  }
  return [buyer_commission, point];
}
exports.seller_member = (user) => {
  let seller_commission;
  switch (user.seller_membership) {
    case 'copper': seller_commission = 0.15; break;
    case 'iron': seller_commission = 0.13; break;
    case 'gold': seller_commission = 0.10; break;
    case 'diamond': seller_commission = 0.05; break;
    default: seller_commission = 0.20; break;
  }
  return seller_commission;
}