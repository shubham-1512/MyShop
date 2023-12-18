const Product = require("../models/product");
const Order = require("../models/order");
const fs = require('fs');
const path = require('path');
const order = require("../models/order");
const PDFDocument = require('pdfkit');
const product = require("../models/product");
const PER_PAGE_ITEM =2;
const stripe = require('stripe')('sk_test_51OMAIcSGPbNBbmrPsehXsg6eYsqAVULCqZSDlIrPZj0rSy4aXG19sGzjd2jA1IA40ebRds5QzqOmS5tRCa6laMdi00alf8jiM3');

module.exports.getProducts = (req,res,next) =>{
    Product.find().then(products => {
            res.render('shop/product-list',{prods: products,title: 'Product', path: '/products', isAuthenticated: req.session.isLoggedIn })
    }).catch(err =>{
        const error = new Error(err);
        error.httpStatusCode = 502;
        next(error);
    });
}

module.exports.getProduct = (req,res,next) => {
    const prodId = req.params.productId;
    // METHOD-1
    // Product.findAll({where: {id: prodId}}).then(product => {
    //         res.render('shop/product-detail',{prods: product[0],title: product[0].title ,path: '/products'
    //     })
    // }).catch(err =>{
    //     const error = new Error(err);
    //     error.httpStatusCode = 502;
    //     next(error);
    // });
    // METHOD-2
    Product.findById(prodId).then(product => {
            res.render('shop/product-detail',{prods: product,title: product.title ,path: '/products', isAuthenticated: req.session.isLoggedIn });
    }).catch(err =>{
        const error = new Error(err);
        error.httpStatusCode = 502;
        next(error);
    });
};

exports.getCart = async (req, res, next) => {
    await req.user.populate('cart.items.productId').then(user =>{
        const cartItems = user.cart.items;
        res.render('shop/cart',{path:'/cart',title: 'Your Cart',products : cartItems, isAuthenticated: req.session.isLoggedIn });
      })
      .catch(err =>{
        const error = new Error(err);
        error.httpStatusCode = 502;
        next(error);
      });
  };
  
module.exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findById(prodId).then(product=>{
        return req.user.addToCart(product)
    }).then(result =>{
            console.log("Added to cart");
            res.redirect('/cart')
        }).catch(err =>  {
            const error = new Error(err);
            error.httpStatusCode = 502;
            return next(error);
        })
    
};

module.exports.getHome = (req,res,next) => {
        var page = +req.query.page||1;
        let totalItems;

        Product.find().countDocuments().then(numProducts =>{
            totalItems = numProducts;
            return Product.find().skip((page - 1)*PER_PAGE_ITEM).limit(PER_PAGE_ITEM)
            .then(products => {
                res.render('shop/index',{
                    prods: products, 
                    title: 'Product',
                    path: '/',
                    currentPage: page,
                    hasNextPage: PER_PAGE_ITEM*page < totalItems,
                    hasPreviousPage: page >1,
                    nextPage: page + 1,
                    previousPage: page - 1,
                    lastPage: Math.ceil(totalItems/PER_PAGE_ITEM)
            });
        })
    }).catch(err =>{
        const error = new Error(err);
        error.httpStatusCode = 502;
        next(error);
    });
};

module.exports.postCartDeleteProduct= (req,res,next) => {
    const prodId = req.body.productId;
    req.user.removeFromCart(prodId).then(result =>{
            res.redirect('/cart');
        }).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 502;
            return next(error);
        })   
};

module.exports.getOrders = (req,res,next) => {
    Order.find({'user.userId': req.session.user._id}).then(orders =>{
        console.log(orders);
        res.render('shop/orders', {title: 'Your Orders',path: '/orders',orders: orders,isAuthenticated: req.session.isLoggedIn });
    }).catch(err =>{
        const error = new Error(err);
        error.httpStatusCode = 502;
        return next(error);
    })
    
};

// module.exports.getCheckout = async (req,res,next) =>{
//     let products;
//     let total = 0;
//     await req.user.populate('cart.items.productId').then(user =>{
//             products = user.cart.items;
//             products.forEach(p =>{
//             total += p.quantity * p.productId.price;
//             });
//             return stripe.checkout.sessions.create({
//                 payment_method_types: ['card'],
//                 line_items: products.map(p => {
//                   return {
//                     name: p.productId.title,
//                     description: p.productId.description,
//                     amount: p.productId.price * 100,
//                     currency: 'usd',
//                     quantity: p.quantity
//                   };
//                 }),
//                 mode: 'payment',
//                 success_url: req.protocol + '://' + req.get('host') + '/checkout/success', // => http://localhost:3000
//                 cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel'
//               });
//             })
//             .then(session => {
//               res.render('shop/checkout', {
//                 path: '/checkout',
//                 pageTitle: 'Checkout',
//                 products: products,
//                 totalSum: total,
//                 sessionId: session.id
//               });
//             })
//             .catch(err => {
//                 console.log(err);
//               const error = new Error(err);
//               error.httpStatusCode = 500;
//               return next(error);
//             });
// }

// module.exports.getCheckoutSuccess = async (req,res,next) => {
//     await req.user.populate('cart.items.productId').then(user =>{
//         const products = user.cart.items.map(i =>{
//             return {quantity: i.quantity, product: { ...i.productId._doc }};
//         });
//         const order = new Order ({
//             user: {
//                 email: req.user.email,
//                 userId: req.session.user
//             },
//             products: products
//         });
//         return order.save();
//     }).then(result =>{
//         return req.user.clearCart()
//     }).then(() =>{
//             res.redirect('/orders');
//         }).catch(err =>{
//             const error = new Error(err);
//             error.httpStatusCode = 502;
//             next(error);
//         });
// }

module.exports.getInvoice = (req,res,next) =>{
    const orderId = req.params.orderId;
    Order.findById(orderId).then(order =>{
        if(!order) {
            return next(new Error("No order Found."));
        }
        if(order.user.userId.toString() !== req.user._id.toString()) {
            return next(new Error('Unauthorized'));
        }
    const invoiceName = 'invoice-'+ orderId+'.pdf';
    const invoicePath = path.join('data','invoice',invoiceName);
    const pdfDoc = new PDFDocument();
    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition','inline ; filename = "'+invoiceName+'"');
    pdfDoc.pipe(fs.createWriteStream(invoicePath));
    pdfDoc.pipe(res);
    pdfDoc.fontSize(26).text('Invoice', {
        underline: true
        });
        pdfDoc.text('-----------------------');
        let totalPrice = 0;
        order.products.forEach(prod => {
            totalPrice += prod.quantity * prod.product.price;
        pdfDoc
            .fontSize(14)
            .text(
            prod.product.title +
                ' - ' +
                prod.quantity +
                ' x ' +
                '$' +
                prod.product.price
            );
        })
        pdfDoc.text('---');
        pdfDoc.fontSize(20).text('Total Price: $' + totalPrice);    
        pdfDoc.end();
    }).catch(err => next(err))
    
        
        
    // fs.readFile(invoicePath,(err,data) =>{
    //     if(err) {
    //         return next(err);
    //     }
    //     res.setHeader('Content-Type','application/pdf');
    //     res.setHeader('Content-Disposition','inline ; filename = "'+invoiceName+'"');
    //     res.send(data);
    // });
    // const file = fs.createReadStream(invoicePath);
    // res.setHeader('Content-Type','application/pdf');
    // res.setHeader('Content-Disposition','inline ; filename = "'+invoiceName+'"');
    // file.pipe(res);
};