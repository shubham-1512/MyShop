const express = require('express');
const path = require('path');
//const { products } = require('./admin');

const shopsController = require('../controllers/shop');
const validator = require('../middleware/is-auth');
const router = express.Router();

router.get('/', shopsController.getHome);
router.get('/cart', validator,shopsController.getCart);
router.post('/cart', validator,shopsController.postCart);
router.get('/products', shopsController.getProducts);
router.get('/products/:productId', shopsController.getProduct);
router.get('/orders', validator,shopsController.getOrders);
router.post('/cart-delete-item',validator,shopsController.postCartDeleteProduct);
router.get('/invoice/:orderId',validator,shopsController.getInvoice);
// router.get('/checkout',validator,shopsController.getCheckout);
// router.get('/checkout/success',validator,shopsController.getCheckoutSuccess);
// router.get('/checkout/cancel',validator,shopsController.getCheckout);

module.exports = router;

                           