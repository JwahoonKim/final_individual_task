const mongoose = require('mongoose');
const { Schema } = mongoose;

const keySchema = new Schema({
    keyValue: String,
    user: { type: Schema.Types.ObjectId, ref: 'User' },
});

const Key = mongoose.model('Key', keySchema);

module.exports = Key;
