const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { User, Key } = require("./models");

// password hash화
const encryptPassword = (password) => {
    return crypto.createHash('sha512').update(password).digest('base64');
}

// 소수점 4자리수로 바꾸는 함수
const decimalCut = (n) => {
    n *= 10000;
    n = parseInt(n, 10);
    n /= 10000;
    return n
}

const quantityChecker = (req, res, next) => {
    const { quantity, all } = req.body;
    if (quantity && !all) {
        if (isNaN(quantity)) 
            return res.send({ error: 'quantity must be a numberic value' }, 400);
        const decimal = quantity.split('.')[1] || 0;
        if (quantity < 0) return res.send({ error: 'quantity must be positive' }, 400);
        if (decimal.length > 4) 
            return res.send({ error: 'Decimal point must be less than 4 digits'}, 400);
    } 
    next();
}

const setAuth = async (req, res, next) => {
    const authorization = req.headers.authorization;
    const [bearer, token] = authorization.split(' ');
    if (bearer !== 'Bearer')
        return res.send({error: 'Wrong Authorization'}, 401);

    if (!jwt.decode(token)) return res.send({ error: 'Invalid token' }, 403);

    const { publicKey } = jwt.decode(token);
    const keyObj = await Key.findOne({ publicKey });

    // 해당 키가 DB에 없는 경우
    if (!keyObj)
        return res.send({error: 'Invalid token'}, 404);

    const { secretKey } = keyObj;
    try {
        jwt.verify(token, secretKey);
    } catch (e) {
        if (e instanceof jwt.TokenExpiredError) return res.send({ error: 'JWT expired' }, 403);
        else return res.send({ error: 'Invalid JWT' }, 403);
    }

    const userObj = await User.findOne({ _id: keyObj.user });
    
    // 해당 키에 해당하는 user정보가 DB에 없는 경우
    if (!userObj)
        return res.send({error: 'Cannot find user'}, 404);
    
    req.user = userObj;
    next(); 
}

module.exports = {
    encryptPassword,
    setAuth,
    decimalCut,
    quantityChecker,
}
