const axios = require('axios');

const URL = 'http://api.coingecko.com/api/v3/coins';

const getCoinPrice = async (coinSymbol) => {
    const res = await axios.get(`${URL}/markets/?vs_currency=usd`);
    const data = res.data;
    let price;
    data.forEach(e => {
        if (coinSymbol === e.symbol) price = e.current_price;
    })
    return price;
}

module.exports = {
    getCoinPrice,
}