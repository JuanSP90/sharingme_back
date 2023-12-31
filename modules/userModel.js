const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const usersSchema = new mongoose.Schema({
    userName: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: {
        type: Number
    },
    links: [
        {
            url: { type: String },
            // icon: { type: String }
        },
    ],
    description: { type: String },
    backgroundColor: { type: String },
    location: { type: String },
    tag1: { type: String },
    tag2: { type: String },
    tag3: { type: String }
});
usersSchema.pre('save', async function (next) {
    const user = this;

    if (!user.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        user.password = hashedPassword;
        next();
    } catch (error) {
        return next(error);
    }
});

const Users = mongoose.model('Users', usersSchema);

module.exports = Users;
