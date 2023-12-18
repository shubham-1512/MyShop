const { body } = require('express-validator');
const express = require('express');
const path = require('path');

//const Rootdir = require('../path/path');
const productsController = require('../controllers/admin');

const router = express.Router();


router.get('/add-product',productsController.getAddProduct);
router.post('/add-product',[
    body('title')
      .isString()
      .isLength({ min: 3 })
      .trim(),
    body('price').isFloat(),
    body('description')
      .isLength({ min: 5, max: 400 })
      .trim()
  ],productsController.postAddProduct);
router.get('/products', productsController.getProducts);
router.get('/edit-product/:productId', productsController.getEditProduct);
router.post('/edit-product',[
    body('title')
      .isString()
      .isLength({ min: 3 })
      .trim(),
    body('price').isFloat(),
    body('description')
      .isLength({ min: 5, max: 400 })
      .trim()
  ],productsController.postEditProduct);
router.delete('/product/:productId',productsController.deleteProduct);

module.exports= router;