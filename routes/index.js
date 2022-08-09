const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const schedule = require('node-schedule');

const { Good, Auction, User, sequelize } = require('../models');
const { isLoggedIn, isNotLoggedIn, find_user, buyer_member, seller_member, membership_upgrade } = require('./middlewares');
const {number} = require("nunjucks/src/tests");

const router = express.Router();

router.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

router.get('/', async (req, res, next) => {
  try {
    const goods = await Good.findAll({ where: { SoldId: null } });
    res.render('main', {
      title: 'NodeAuction',
      goods,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get('/join', isNotLoggedIn, (req, res) => {
  res.render('join', {
    title: '회원가입 - NodeAuction',
  });
});

router.get('/good', isLoggedIn, (req, res) => {
  res.render('good', { title: '상품 등록 - NodeAuction' });
});
router.post('/good/:id/goodelete', isLoggedIn, async (req, res, next) => {
  try {
    const [good] = await Good.findAll({where: { id: req.params.id }});
    if (new Date(good.createdAt).valueOf() + (good.start*60*60*1000) < new Date()) {
      return res.status(403).send('<script>alert(\'경매가 시작되기 전에만 삭제가 가능합니다.\');</script>');
    }
    else {
      img_delete(good.img);
      const goodId = req.params.id;
      await Good.destroy({where: {id: goodId}});
      res.send("success");
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
});

try {
  fs.readdirSync('uploads');
} catch (error) {
  console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
  fs.mkdirSync('uploads');
}
const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, 'uploads/');
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + new Date().valueOf() + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});
router.post('/good', isLoggedIn, upload.single('img'), async (req, res, next) => {
  try {
    const { name, price } = req.body;
    let user = await User.findOne({where: {id: req.user.id}, order: [['id', 'DESC']],});
    if (req.body.start >= req.body.end) {
      img_delete(req.file.filename);
      return res.status(403).send("<script>alert('시작 시간이 종료 시간보다 짧아야 합니다.'); location.href='/good';</script>");
    }
    else if (user.money < price) {
      img_delete(req.file.filename);
      return res.status(403).send("<script>alert('예치금이 등록 수수료(물건의 10%)보다 적습니다.'); location.href='/good';</script>");
    }
    else {
      const good = await Good.create({
        OwnerId: req.user.id,
        name,
        start: req.body.start,
        end: req.body.end,
        img: req.file.filename,
        price,
      });
      await User.update({money: sequelize.literal(`money - (${good.price} * 0.1)`)}, {where: {id: good.OwnerId}});
      const end = new Date();
      // end.setHours(end.getHours() + good.end);
      end.setMinutes(end.getMinutes()+1);
      schedule.scheduleJob(end, async () => {
        const success = await Auction.findOne({
          where: {GoodId: good.id},
          order: [['bid', 'DESC']],
        });
        if (success) {
          await User.update({money: sequelize.literal(`money + (${good.price} * 0.1)`)}, {where: {id: good.OwnerId}});
          let user1 = await find_user(success.UserId);
          const buyer = buyer_member(user1);
          const buyer_commission = buyer[0];
          const point = buyer[1];

          let user2 = await find_user(good.OwnerId);
          const seller_commission = seller_member(user2);

          await Good.update({SoldId: success.UserId}, {where: {id: good.id}});
          await User.update({
            money: sequelize.literal(`money - (${success.bid} + (${success.bid} * ${buyer_commission}))`),
            spend_money: sequelize.literal(`spend_money + ${success.bid}`),
            point: sequelize.literal(`point + (${success.bid} * (0.01 * ${point}))`),
          }, {where: {id: success.UserId},});
          await User.update({
            money: sequelize.literal(`money + (${success.bid} * (1 - ${seller_commission}))`),
            sell_money: sequelize.literal(`sell_money + ${success.bid}`),
          }, {where: {id: good.OwnerId},});

          user1 = await find_user(success.UserId);
          user2 = await find_user(good.OwnerId);

          const membership = membership_upgrade(user1, user2);
          await User.update({buyer_membership:  membership[0]}, {where: {id: success.UserId}});
          await User.update({seller_membership: membership[1]}, {where: {id: good.OwnerId}});
        }
        else {
          await User.update({money: sequelize.literal(`money + (${good.price} * 0.1)`)}, {where: {id: good.OwnerId}});
          await Good.update({soldId: good.OwnerId}, {where: {id: good.id}});
        }
      });
      res.redirect('/');
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get('/good/:id', isLoggedIn, async (req, res, next) => {
  try {
    const [good, auction] = await Promise.all([
      Good.findOne({
        where: { id: req.params.id },
        include: {
          model: User,
          as: 'Owner',
        },
      }),
      Auction.findAll({
        where: { goodId: req.params.id },
        include: { model: User },
        order: [['bid', 'ASC']],
      }),
    ]);
    res.render('auction', {
      title: `${good.name} - NodeAuction`,
      good,
      auction,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.post('/good/:id/bid', isLoggedIn, async (req, res, next) => {
  try {
    const {bid, msg} = req.body;
    const good = await Good.findOne({
      where: {id: req.params.id},
      include: {model: Auction},
      order: [[{model: Auction}, 'bid', 'DESC']],
    });
    const user = await find_user(req.user.id);
    const buyer = buyer_member(user);
    if (user.money < (number(bid) + (bid * buyer[0]))) {
      return res.status(403).send('입찰 예청 금액이 예치금보다 높습니다.');
    }
    if (good.price >= bid) {
      return res.status(403).send('시작 가격보다 높게 입찰해야 합니다.');
    }
    // if (new Date(good.createdAt).valueOf() + (good.start * 60 * 60 * 1000) > new Date()) {
    //   return res.status(403).send('경매가 시작된 후 입찰을 진행해 주시길 바랍니다.');
    // }
    else if (new Date(good.createdAt).valueOf() + (good.end * 60 * 60 * 1000) < new Date()) {
      return res.status(403).send('경매가 이미 종료되었습니다');
    }
    if (good.Auctions[0] && good.Auctions[0].bid >= bid) {
      return res.status(403).send('이전 입찰가보다 높아야 합니다');
    }
    if (good.OwnerId === req.user.id) {
      return res.status(403).send('경매 등록자는 입찰할 수 없습니다.');
    }
    const result = await Auction.create({
      bid,
      msg,
      UserId: req.user.id,
      GoodId: req.params.id,
    });
    // 실시간으로 입찰 내역 전송
    req.app.get('io').to(req.params.id).emit('bid', {
      bid: result.bid,
      msg: result.msg,
      nick: req.user.nick,
    });
    return res.send('ok');
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

router.get('/list', isLoggedIn, async (req, res, next) => {
  try {
    const goods = await Good.findAll({
      where: { SoldId: req.user.id },
      include: { model: Auction },
      order: [[{ model: Auction }, 'bid', 'DESC']],
    });
    res.render('list', { title: '낙찰 목록 - NodeAuction', goods });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

function img_delete(filename) {
  if (fs.existsSync("uploads/"+filename)) {
    try {
      fs.unlinkSync("uploads/"+filename);
      console.log('image delete');
    } catch (e) {
      console.error(e);
      next(e);
    }
  }
  else {
    console.log('image not delete:', filename);
  }
}

module.exports = router;
