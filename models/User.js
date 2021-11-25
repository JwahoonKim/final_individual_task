const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    name: { type: String, unique: true, },
    email: { type: String, unique: true, },
    password: String,
    keys: [{ type: Schema.Types.ObjectId, ref: 'Key'}], // one to many 관계로 바꿔주기
    assets: [{ type: Schema.Types.ObjectId, ref: 'Asset' }],
});

const User = mongoose.model('User', userSchema);

module.exports = User;
