const mongoose = require('mongoose');
const { Schema } = mongoose;

const keySchema = new Schema({
    // key 스키마 구현하기
});

const Key = mongoose.model('Key', keySchema);

module.exports = Key;
