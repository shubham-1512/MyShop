const { validationResult } = require('express-validator');
const Product = require("../models/product");
const mongodb = require('mongodb');
const { Error } = require('mongoose');
const fileHelper = require('../path/file');
const product = require('../models/product');

module.exports.getAddProduct = (req,res,next)=>{
    //res.render('add-product',{pageTitle: 'Add Product', path: '/admin/add-product',productCSS: true,formsCSS: true,activeAddProduct: true});
    res.render('admin/edit-product',{title: 'Add Product', path: '/admin/add-product',
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: []});//for   ejs 
    //res.sendFile(path.join(Rootdir,'views','add-product.html'));
};
module.exports.getEditProduct = (req,res,next)=>{
    const editMode = req.query.edit;
    if(!editMode) {
       return res.redirect('/');
    }
    const prodId = req.params.productId;
    Product.findById(prodId).then(product => {
        if(!product) {
          return  res.redirect('/');
        }
        res.render('admin/edit-product',{title: 'Edit Product', path: '/admin/edit-product',
        editing: editMode,
        product: product,
        hasError: false,
        errorMessage: null,
        validationErrors: [] });
    }).catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 502;
      next(error);
    });

};

module.exports.postEditProduct = (req,res,next) => {
    const id = req.body.id;
    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
          pageTitle: 'Edit Product',
          path: '/admin/edit-product',
          editing: true,
          hasError: true,
          product: {
            title: updatedTitle,
            price: updatedPrice,
            description: updatedDesc,
            _id: prodId
          },
          errorMessage: errors.array()[0].msg,
          validationErrors: errors.array()
        });
      }
    
    Product.findById(id).then(product => {
        if(product.userId.toString() !== req.user._id.toString()) {
            return res.redirect('/');
        }
        product.title = title;
        if(image) {
          fileHelper.deleteFile(product.imageUrl);
          product.imageUrl = image.path;
        }
        product.price = price;
        product.description = description;
        return product.save().then(result => {
            console.log('Product Updated');
            res.redirect('/admin/products');
        })
    }).catch(err =>
        res.redirect('/500'));
    
};

module.exports.postAddProduct = (req,res,next)=>{
    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;
    const errors = validationResult(req);
    if (!image) {
      return res.status(422).render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false,
        hasError: true,
        product: {
          title: title,
          price: price,
          description: description
        },
        errorMessage: "Please Upload a valid Image",
        validationErrors: []
      });
    }

    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('admin/edit-product', {
          pageTitle: 'Add Product',
          path: '/admin/add-product',
          editing: false,
          hasError: true,
          product: {
            title: title,
            imageUrl: imageUrl,
            price: price,
            description: description
          },
          errorMessage: errors.array()[0].msg,
          validationErrors: errors.array()
        });
      }
    const imageUrl = image.path;
    const product = new Product({title: title,imageUrl: imageUrl, price: price, description: description,userId: req.user});
    product.save().then(result =>{
        res.redirect('/');
    }).catch(err =>{
        const error = new Error(err);
        error.httpStatusCode = 502;
        return next(error);  
    });
};

module.exports.getProducts = (req,res,next) =>{
    //res.render('shop',{prods: products, pageTitle: 'shop',path: '/',hasProducts: products.length > 0,activeShop: true,productCSS: true});
    Product.find({userId : req.user._id})
    // .select('title price -_id')
    // .populate('userId', 'name')
    .then(products => {
            res.render('admin/products',{prods: products, title: 'Admin',path: '/admin/products'})
    }).catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 502;
      next(error);
    });
};

module.exports.deleteProduct = (req,res,next) => {
    const prodId = req.params.productId;
    Product.findById(prodId).then(product =>{
      if(!product) {
        return next(new Error("Products Not Found!!!!"));
      }
      fileHelper.deleteFile(product.imageUrl);
      return Product.deleteOne({_id: prodId, userId : req.user._id})
    })
    .then(() => {
        console.log("Product Destroyed");
        res.status(200).json({message: 'Success'});
    }).catch(err => {
      // console.log(err);
      // const error = new Error(err);
      // error.httpStatusCode = 500;
      res.status(500).json({message: 'Deleting Product Failed'});
      next(error);
    });
    
};


