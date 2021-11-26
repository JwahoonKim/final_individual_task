const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
// 폴더만 설정해주면 알아서 index.js 가져옴
const { User, Coin, Asset, Key } = require('./models'); 
const { encryptPassword, setAuth } = require('./utils');
const { getCoinPrice } = require('./api');

const app = express();
const port = 3000;

// 에이다, 폴카닷 코인 추가
const COINS = {
    bitcoin: 'btc',
    ripple: 'xrp',
    dogecoin: 'doge',
    ethereum: 'eth',
    cardano: 'ada',
    polkadot: 'dot',
 };

app.use(express.urlencoded({extended: true}));
app.use(express.json());

// test용
app.get('/', async (req, res) => {
    const user = await User.findOne({ name: "kim123" }).populate('assets', 'name ');
    res.send(user); 
})

app.post('/register',
    body('name').isLength({ min: 4, max: 12 }).isAlphanumeric(),
    body('email').isEmail().isLength({ max: 100 }),
    body('password').isLength({ min: 8, max: 16 }),
    async (req, res) => {
        // validtaion check
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
            return res.send({error: 'Name or Email is duplicated'}).status(400);
        }

        const coins = await Coin.find({ isActive: true });
        
        // 달러주기
        const usdAsset = new Asset({ name: 'USD', balance: 10000, user });
        await usdAsset.save();

        for (const coin of coins) {
            const asset = new Asset({ name: coin.name, balance: 0, user });
            await asset.save();
        }

        res.send({});
})

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const encryptedPassword = encryptPassword(password)
    const user = await User.findOne({ email, password: encryptedPassword });

    if (user === null) return res.send({error: 'Invalid email or password'}).status(404);

    const key = new Key({ keyValue: encryptPassword(crypto.randomBytes(20)), user });
    await key.save(); 

    res.send({ key: key.keyValue });
})

app.get('/coins', async (req, res) => {
    const coins = await Coin.find({ isActive: true });
    const coinList = coins.map(coin => coin.name.toLowerCase()); 
    res.send(coinList);
})

// 2번 인자 콜백함수 실행하고나서 3번째 인자 콜백 실행
app.get('/assets', setAuth, async (req, res) => {
    const user = req.user;
    const assets = await Asset.find({ user });
    const userAssets = {};
    assets.forEach(asset => {
        if (asset.balance !== 0)
            userAssets[asset.name.toLowerCase()] = asset.balance;
    })
    res.send(userAssets);
})

app.get('/coins/:coinName', async (req, res) => {
    const { coinName } = req.params;
    const coinSymbol = COINS[coinName.toLowerCase()];
    const price = await getCoinPrice(coinSymbol);
    if ( price ) res.send({ price });
    else res.send({error: 'Invalid Coin name, Please request by using FULLNAME of coin not SYMBOL!'}, 404);
})

app.post('/coins/:coinName/buy', setAuth, async (req, res) => {
    let { quantity, all } = req.body;
    const { coinName } = req.params;
    const coinSymbol = COINS[coinName];
    if (!coinSymbol) return res.send({error: 'Invalid Coin name, Please request by using FULLNAME of coin not SYMBOL!'}, 400);
    
    if (isNaN(quantity) && !all) return res.send({error: 'quantity must be a numberic value'}, 400);
    
    const user = req.user;
    const usdAsset = await Asset.findOne({ user, name: 'USD' });
    let usdBalance = usdAsset.balance;
    const targetCoinAsset = await Asset.findOne({ user, name: coinSymbol.toUpperCase()});

    const coinPrice = await getCoinPrice(coinSymbol);
    let totalPrice = null;
    let totalQuantity = null;

    if (all) { // 전량 구매시
        totalQuantity = parseInt(usdBalance / coinPrice);
        totalPrice = coinPrice * totalQuantity;
    } else { // quantity 구매시
        totalQuantity = parseFloat(parseFloat(quantity).toFixed(4));
        totalPrice = coinPrice * totalQuantity;
        // 잔고 부족
        if (usdBalance < totalPrice) return res.send({error: 'Not enough usdBalance'}, 400);
    }



    usdAsset.balance -= totalPrice;
    targetCoinAsset.balance += totalQuantity;
    await usdAsset.save();
    await targetCoinAsset.save();

    res.send({ price: coinPrice, quantity: totalQuantity });
});

app.post('/coins/:coinName/sell', setAuth, async (req, res) => {
    // quantity가 숫자인지 check
    let { quantity, all } = req.body;
    const { coinName } = req.params;
    const coinSymbol = COINS[coinName];
    if (!coinSymbol) return res.send({error: 'Invalid Coin name, Please request by using FULLNAME of coin not SYMBOL!'}, 400);

    if (isNaN(quantity) && !all) return res.send({error: 'quantity must be a numberic value'}, 400);

    const user = req.user;
    const usdAsset = await Asset.findOne({ user, name: 'USD' });
    const targetCoinAsset = await Asset.findOne({ user, name: coinSymbol.toUpperCase()});
    let targetCoinBalance = targetCoinAsset.balance;


    quantity = parseFloat(parseFloat(quantity).toFixed(4));
    const coinPrice = await getCoinPrice(coinSymbol);
    let totalPrice = null;
    let totalQuantity = null;

    if (all) { // 전량 판매시
        totalQuantity = targetCoinBalance;
        totalPrice = coinPrice * totalQuantity;
    } else { // quantity 판매시
        totalQuantity = parseFloat(parseFloat(quantity).toFixed(4));
        totalPrice = coinPrice * totalQuantity;
        if (targetCoinBalance < totalQuantity) return res.send({ error: 'Not enough coinBalance'}, 400);
    }

    usdAsset.balance += totalPrice;
    targetCoinAsset.balance -= totalQuantity;
    await usdAsset.save();
    await targetCoinAsset.save();

    res.send({ price: coinPrice, quantity: totalQuantity });
});



app.listen(port, () => {
    console.log('listening...');
});