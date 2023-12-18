const express = require('express');
const fs = require('fs');
const https = require('https');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const mongoDbStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const MONGO_URL = `mongodb+srv://${process.env.MONGO_USER}:${encodeURIComponent(process.env.MONGO_PASSWORD)}@cluster0.ukjhlxx.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true`;
const app = express();
const store = mongoDbStore({
    uri: MONGO_URL,
    collections: 'sessions'
});
const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
    destination: (req,file,cb) =>{
        cb(null,'images');
    },
    filename: (req,file,cb) =>{
        cb(null,Date.now()+'_'+file.originalname);
    }
})

const fileFilter = (req,file,cb) =>{
    if(file.mimetype === 'image/png' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
        cb(null,true)
    }else {
        cb(new Error("Enter a Valid File Type"),false)
    }
}

//app.engine('hbs', expressHbs.engine({extname: 'hbs', defaultLayout: "main-layout", layoutsDir:"views/layouts/"}));
app.set('view engine', 'ejs');
app.set('views', 'views');

const validator = require('./middleware/is-auth');
const errorController = require('./controllers/error');
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const User = require('./models/user')

const accessLogStream = fs.createWriteStream(path.join(__dirname,'access.log'),{flags:'a'});

app.use(helmet());
app.use(compression());
app.use(morgan('combined',{stream:accessLogStream}));
app.use(express.static(path.join(__dirname,'public')));
app.use('/images',express.static(path.join(__dirname,'images')));
app.use(bodyParser.urlencoded({extended: false})); // for Reading Data in x-www-form-urlencoded
app.use(multer({storage : fileStorage,fileFilter: fileFilter}).single('image'));
app.use(session({
    secret: 'My Secret', resave: false, saveUninitialized: false, store : store})
    );
app.use(csrfProtection); 
app.use(flash());

app.use((req,res,next)=>{
    if(!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id).then(user =>{
        req.user =user;
        next();
    }).catch(err => console.log(err));
});
//WITHOUT MONGOOSE
// app.use((req,res,next)=>{
//     User.findById('656f5ab82baf66f4ddb5fdce').then(user => {
//         req.user = user;
//         next();
//     }).catch(err => console.log(err));
// });

app.use((req,res,next) =>{
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});
app.use('/admin',validator,adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.use(errorController.getNotFound);
app.use((error,req,res,next) =>{
    res.status(500).render('500',{title:'505 Error Occured',path:" ",error: error})
})

//WIHTOUT MONGOOSE
// mongoConnect.MongoConnect(() => {
//     app.listen(3000);
// });

//WITH MONGOOSE
mongoose.connect(MONGO_URL).then(result =>{
    console.log('User connected');
    // console.log(result);
    app.listen(process.env.PORT||3000); //for http
    // https.createServer({key: privateKey, cert: certificate},app).listen(process.env.PORT || 3000); // for manually implementing SSL certificate
}).catch(err => console.log(err));


