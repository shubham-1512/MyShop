const crypto = require('crypto');
const User = require('../models/user'); 
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const user = require('../models/user');
const {validationResult} = require('express-validator');

const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'aida.rutherford@ethereal.email',
        pass: 'Vp5Hv8Z3qYRBUaWGXA'
    }
});

module.exports.getLogin = (req,res,next) =>{
    res.render('auth/login',{
        path: '/login',
        title: 'Login',
        errorMsg: req.flash('error')[0],
        oldInput: {
            email: '',
            password: ''
        },
        validationError: []
    })
};

module.exports.postLogin = (req,res,next) =>{
    const email = req.body.email;
    const password = req.body.password;

    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(402).render('auth/login',{
            path: '/login',
            title: 'Login',
            errorMsg: errors.array()[0].msg,
            oldInput: {
                email: email,
                password: password
            },
            validationError : errors.array()
        });  
    }
    User.findOne({email:email}).then(user => {
        if(!user){
            return res.status(402).render('auth/login',{
                path: '/login',
                title: 'Login',
                errorMsg: errors.array()[0].msg,
                oldInput: {
                    email: email,
                    password: password
                },
                validationError : errors.array()
            }); 
        }
        bcrypt.compare(password, user.password).then(doMatch =>{
            if(doMatch){
                req.session.isLoggedIn = true;
                req.session.user = user;
                return req.session.save(err =>{  
                    console.log(err);
                    res.redirect('/');
                });
                }
                console.log(errors.array())
                return res.status(402).render('auth/login',{
                    path: '/login',
                    title: 'Login',
                    errorMsg: 'Invalid Email or Password',
                    oldInput: {
                        email: email,
                        password: password
                    },
                    validationError : errors.array()
                }); 
            }).catch(err =>{
                const error = new Error(err);
                error.httpStatusCode = 500;
                next(error);
            })
               
            }).catch(err =>{
                const error = new Error(err);
                error.httpStatusCode = 500;
                next(error);
            })
};

module.exports.postLogout = (req,res,next) =>{
    req.session.destroy(err =>{
        console.log(err);
        res.redirect('/');
    })
};

module.exports.getSignup = (req,res,next) =>{
    res.render('auth/signup',{
        path: '/signup',
        title: 'Signup',
        isAuthenticated: false,
        errorMsg: req.flash('error')[0],
        oldInput : {
            email:'',
            password:'',
            confirmPassword:'',
        },
        validationError: []
    });
};

module.exports.postSignup = (req,res,next) =>{
 const email = req.body.email;
 const password = req.body.password;
 const confirmPassword = req.body.confirmPassword;
 const errors = validationResult(req);
 if(!errors.isEmpty()){
    console.log(errors.array());
    return res.status(422).render('auth/signup',{
        path: '/signup',
        title: 'Signup',
        isAuthenticated: false,
        errorMsg: errors.array()[0].msg,
        oldInput : {
            email:email,
            password:password,
            confirmPassword:confirmPassword,
        },
        validationError: errors.array()
    })
 }
  bcrypt.hash(password,12).then(hashedPwd =>{
        const user = new User({
            email: email,
            password: hashedPwd,
            cart: {items: []}
        });
        return user.save();
    }).then(result =>{
        res.redirect('/login');
        transporter.sendMail({
            to: req.body.email,
            from: 'test@test.in',
            subject: 'SignUp Successfull',
            html: `<p>Signup was successfull</p>`
    })
 }).catch(err =>{
    const error = new Error(err);
    error.httpStatusCode = 500;
    next(error);
 })
};

module.exports.getResetPwd = (req,res,next) =>{
    res.render('auth/reset',{
        path: '/reset',
        title: 'Reset Password',
        errorMsg: req.flash('error')[0],
        infoMsg: req.flash('info')[0]
    });
};

module.exports.postResetPwd = (req,res,next) =>{
    crypto.randomBytes(32,(err,buffer) =>{
        if(err){
            console.log(err);
            return res.redirect('/reset');
        }
        const token =buffer.toString('hex');
        User.findOne({email: req.body.email}).then(user =>{
            if(!user){
                req.flash('error','Email Id Does not exists!!!');
                return res.redirect('/reset');
            }
            user.resetToken = token;
            user.resetTokenExp = Date.now() + 3600000;
            return user.save();
        }).then(result =>{
            req.flash('info','Mail Sent Successfully');
            res.redirect('/reset');
            transporter.sendMail({
                to: req.body.email,
                from: 'test@test.in',
                subject: 'Reset Password',
                html: `
                <p>You requested a password reset </p>
                <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password`
            })
        }).catch(err =>{
            const error = new Error(err);
            error.httpStatusCode = 500;
            next(error);
        })
    })
};

module.exports.getChangePassword = (req,res,next) =>{
    const token = req.params.token;
    User.findOne({resetToken: token, resetTokenExp: {$gt: Date.now()}}).then(user =>{
        res.render('auth/changePwd',{
            path: '/changePwd',
            title: 'Change Password',
            errorMsg: req.flash('error')[0],
            infoMsg: req.flash('info')[0],
            userId: user._id.toString(),
            token: token
        });
    }).catch(err =>{
        const error = new Error(err);
        error.httpStatusCode = 502;
        return next(error);
    })
};

module.exports.postChangePassword = (req,res,next) =>{
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.token;
    let userDoc;
    User.findOne({_id: userId, resetToken: passwordToken, resetTokenExp : {$gt : Date.now()}}).then(userInfo =>{
        userDoc = userInfo;
        return bcrypt.hash(newPassword,12);
    }).then(hashedPwd =>{
        userDoc.password = hashedPwd;
        userDoc.resetToken = undefined;
        userDoc.resetTokenExp = undefined;
        return userDoc.save();
    }).then(result =>{
        res.redirect('/login');
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 502;
        return next(error);
    })
};
