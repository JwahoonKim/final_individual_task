const crypto = require('crypto');
const { User, Key } = require("./models");

// password hash화
const encryptPassword = (password) => {
    return crypto.createHash('sha512').update(password).digest('base64');
}

const setAuth = async (req, res, next) => {
    const authorization = req.headers.authorization;
    const [bearer, key] = authorization.split(' ');
    if (bearer !== 'Bearer')
        return res.send({error: 'Wrong Authorization'}).status(400);

    const keyObj = await Key.findOne({ keyValue: key });

    // 해당 키가 DB에 없는 경우
    if (!keyObj)
        return res.send({error: 'Cannot find user'}).status(404);

    const userId = keyObj.user;
    const userObj = await User.findOne({ _id: userId });
    
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
