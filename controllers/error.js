module.exports.getNotFound = (req,res,next) =>{
    res.status(404).render('404',{title:'404 Error - Page Not Found',path:" ",isAuthenticated: req.session.isLoggedIn});
    //res.status(404).sendFile(path.join(Rootdir,'views','404.html'));
};

