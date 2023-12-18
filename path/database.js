const { urlencoded } = require('body-parser');
const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const password = encodeURIComponent("shub@dataman");

let _db;

const MongoConnect = callback => {
    MongoClient.connect(`mongodb+srv://shubh-1:${password}@cluster0.ukjhlxx.mongodb.net/shop?retryWrites=true`)
    .then(client => {
        console.log("User Connected");
        _db= client.db()
        callback();
    }).catch(err => {
        console.log(err);
    })
}

const getDb = () => {
    if(_db) {
        return _db;
    }
    else {
        throw 'UNDEFINED!!!!'
    }
}

module.exports.MongoConnect = MongoConnect;
module.exports.getDb= getDb;
