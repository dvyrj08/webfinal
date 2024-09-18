const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    userName: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    loginHistory: [{ dateTime: Date, userAgent: String }]
});

let User; // This will be a model once we initialize

exports.initialize = function (mongoDBConnectionString) {
    return new Promise((resolve, reject) => {
        let db = mongoose.createConnection(mongoDBConnectionString, { useNewUrlParser: true, useUnifiedTopology: true });
        db.on('error', err => reject(err));
        db.once('open', () => {
            User = db.model("users", userSchema);
            resolve();
        });
    });
};

exports.registerUser = function (userData) {
    return new Promise((resolve, reject) => {
        if (userData.password !== userData.password2) {
            return reject("Passwords do not match");
        } else {
            bcrypt.hash(userData.password, 10).then(hash => {
                let newUser = new User({
                    userName: userData.userName,
                    password: hash,
                    email: userData.email
                });
                newUser.save(err => {
                    if (err) {
                        if (err.code === 11000) {
                            reject("Username or email already taken");
                        } else {
                            reject("There was an error creating the user: " + err);
                        }
                    } else {
                        resolve();
                    }
                });
            }).catch(err => reject("Hashing error: " + err));
        }
    });
};

exports.checkUser = function (userData) {
    return new Promise((resolve, reject) => {
        User.findOne({ userName: userData.userName }).then(user => {
            if (user) {
                bcrypt.compare(userData.password, user.password).then(isMatch => {
                    if (isMatch) {
                        user.loginHistory.push({ dateTime: new Date().toString(), userAgent: userData.userAgent });
                        user.save(err => {
                            if (err) {
                                reject("There was an error updating the user's login history");
                            } else {
                                resolve(user);
                            }
                        });
                    } else {
                        reject("Incorrect Password");
                    }
                });
            } else {
                reject("User not found");
            }
        }).catch(err => reject("Error finding user: " + err));
    });
};
