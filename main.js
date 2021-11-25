const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
// 폴더만 설정해주면 알아서 index.js 가져옴
const { User, Coin, Asset } = require('./models'); 
const { encryptPassword, setAuth } = require('./utils');
const { getCoinPrice } = require('./api');

const app = express();
const port = 3000;

app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.get('/coins', async (req, res) => {
    const coins = await Coin.find({ isActive: true });
    res.send(coins);
})

app.post('/register',
    body('email').isEmail(),
    body('name').isLength({ min: 5 }),
    body('password').isLength({ min: 8 }),
    async (req, res) => {
        // validtaion
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
           return res.status(400).send({ errors: errors.array()}); 
        }

        const { name, email, password } = req.body;
        // password 암호화
        const encryptedPassword = encryptPassword(password);
        let user;
        try{
            user = User({ name, email, password: encryptedPassword });
            await user.save();
        } catch (err) {
            return res.send({error: 'Email is duplicated'}).status(400);
        }

        const coins = await Coin.find({ isActive: true });
        
        // 달러주기
        const usdAsset = new Asset({ name: 'USD', balance: 10000, user });
        await usdAsset.save();

        for (const coin of coins) {
            const asset = new Asset({ name: coin, balance: 0, user });
            await asset.save();
        }

        res.send({ _id: user._id });
})

app.post('/login', async (res, req) => {
    const { email, password } = req.body;
    const encryptedPassword = encryptPassword(password)
    const user = await User.findOne({ email, password: encryptedPassword });

    if (user === null) return res.sendStatus(404);

    user.key = encryptPassword(crypto.randomBytes(20));
    await user.save();

    res.send({ key: user.key });
})

// 2번 인자 콜백함수 실행하고나서 3번째 인자 콜백 실행
app.get('/balance', setAuth, async (req, res) => {
    // setAuth에서 담아줬음 (req.user를)
    const user = req.user;
    const assets = Asset.find({ user });
    res.send(assets);
})

app.get('/coins/:coin_name', async (req, res) => {
    const { coin_name } = req.params;
    const price = await getCoinPrice(coin_name);
    if ( price ) res.send({ price });
    else res.send({error: 'Invalid Coin name'}, 400);
})

app.post('/coin/:coinName/buy', setAuth, async (req, res) => {
    const user = req.user;
    // logic 작성
    const coinId = 'bitcoin';
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;
    const apiRes = await axios.get(url);
    const price = apiRes.data[coinId].usd;
    const { quantity } = req.body;
});

app.listen(port, () => {
    console.log('listening...');
});