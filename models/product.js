const mongoose = require('mongoose');

const Schema  = mongoose.Schema;

const productSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

module.exports = mongoose.model('Product', productSchema);

// const mongoDb = require('mongodb');
// const  getDb = require('../path/database').getDb;

// class Product {
//     constructor(title,price,description,imageUrl,id,userId) {
//         this.title = title;
//         this.price = price;
//         this.description = description;
//         this.imageUrl = imageUrl;
//         this._id = id;
//         this.userId = userId;
//     }

//     save() {
//         const db = getDb();
//         let dbOp;
//         if(this._id) {
//             dbOp = db.collection('products').updateOne({_id: new mongoDb.ObjectId(this._id)},{$set: this});
//         }
//         else {
//             dbOp = db.collection('products').insertOne(this);
//         }
//         return dbOp;
//     }

//     static fetchAll() {
//         const db = getDb();
//         return db.collection('products').find().toArray();
//     }
//     static findByPk(prodId) {
//         const db = getDb();
//         return db.collection('products').find({_id: new mongoDb.ObjectId(prodId)}).next();
//     }

//     static deleteById(prodId){
//         const db = getDb();
//         return db.collection('products').deleteOne({_id: new mongoDb.ObjectId(prodId)});
//     }

// }


// module.exports = Product;
