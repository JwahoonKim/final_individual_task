const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { User, Key } = require("./models");

// password hash화
const encryptPassword = (password) => {
    return crypto.createHash('sha512').update(password).digest('base64');
}

const setAuth = async (req, res, next) => {
    const authorization = req.headers.authorization;
    const [bearer, token] = authorization.split(' ');
    if (bearer !== 'Bearer')
        return res.send({error: 'Wrong Authorization'}).status(401);

    if (!jwt.decode(token)) return res.send({ error: 'Invalid token' }).status(403);

    const { publicKey } = jwt.decode(token);
    const keyObj = await Key.findOne({ publicKey });
    console.log(keyObj);

    // 해당 키가 DB에 없는 경우
    if (!keyObj)
        return res.send({error: 'Cannot find user'}).status(404);

    const { secretKey } = keyObj;
    try {
        jwt.verify(token, secretKey);
    } catch (e) {
        if (e instanceof jwt.TokenExpiredError) return res.send({ error: 'JWT expired' }).status(403);
        else return res.send({ error: 'Invalid JWT' }).status(403);
    }

    const userObj = await User.findOne({ keyObj });
    
    // 해당 키에 해당하는 user정보가 DB에 없는 경우
    if (!userObj)
        return res.send({error: 'Cannot find user'}).status(404);
    
    req.user = userObj;
    next(); 
}

module.exports = {
    encryptPassword,
    setAuth,
    // setAsset,
}
