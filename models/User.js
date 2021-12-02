const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    name: { type: String, unique: true, },
    email: { type: String, unique: true, },
    password: String,
    keys: [{ type: Schema.Types.ObjectId, ref: 'Key'}],
    assets: [{ type: Schema.Types.ObjectId, ref: 'Asset' }],
});

const User = mongoose.model('User', userSchema);

module.exports = User;
