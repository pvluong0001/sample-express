const noAuthPaths = [
    "/auth/login", "/auth/logout"
];

module.exports = {
    authMiddleware: (req, res, next) => {
        const isRequestNoNeedAuth = noAuthPaths.find(path => {
            return req.originalUrl.startsWith(path);
        })

        if(isRequestNoNeedAuth) return next();

        const userId = req.session.userId;

        if(!userId) return res.redirect('/auth/login?r=' + req.originalUrl); 

        return next();
    }
}