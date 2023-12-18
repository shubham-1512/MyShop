const express = require('express');
const {check, body} = require('express-validator')
const User = require('../models/user')
const AuthController = require('../controllers/auth');

const router = express.Router();

router.get('/login',AuthController.getLogin);
router.post('/login',[
    check('email').isEmail().normalizeEmail()
],AuthController.postLogin);
router.post('/logout',AuthController.postLogout);
router.get('/signup',AuthController.getSignup);
router.post('/signup',[
    check('email').isEmail().custom((value,{req})=>{
        return User.findOne({email:value}).then(userDoc =>{
            if(userDoc){
                return Promise.reject("Email Id Exist")
            }
        })
    }).normalizeEmail(),
    body('password','Enter a Valid Password').isLength({min:5}).isAlphanumeric().trim(),
    body('confirmPassword').custom((value, {req})=>{
        if(value !== req.body.password){
            throw new Error('Password have to match');
        }
        return true;
    }).trim()
],AuthController.postSignup);
router.get('/reset',AuthController.getResetPwd);
router.post('/reset',AuthController.postResetPwd);
router.get('/reset/:token',AuthController.getChangePassword);
router.post('/changePwd',AuthController.postChangePassword);


module.exports = router;