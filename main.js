const express = require('express')
const app = express()
const port = 3000
const session = require('express-session')
const bcrypt = require('bcryptjs');
const SALT = bcrypt.genSaltSync(parseInt(process.env.SALT_ROUND_NUMBER) || 10);
const DEFAULT_PASSWORD = '123123123';
const bodyParser = require('body-parser');
const { authMiddleware } = require('./middlewares/auth.middleware');
const chunk = require('lodash/chunk')

// MOCK USERS
const usersDB = [
    {id: 1, username: 'user1', password: bcrypt.hashSync(DEFAULT_PASSWORD, SALT), email: 'user1@gmail.com'},
    {id: 2, username: 'user2', password: bcrypt.hashSync(DEFAULT_PASSWORD, SALT), email: 'user2@gmail.com'},
    {id: 3, username: 'user3', password: bcrypt.hashSync(DEFAULT_PASSWORD, SALT), email: 'user3@gmail.com'},
]

// INIT SESSION
const sess = {
    secret: process.env.SESSION_SECRET_KEY || 'secret_key',
    cookie: {},
    resave: false,
    saveUninitialized: false,
}

if (app.get('env') === 'production') {
    app.set('trust proxy', 1) // trust first proxy
    sess.cookie.secure = true // serve secure cookies
}

app.use(session(sess))
// END INIT SESSION

// set the view engine to ejs
app.set('view engine', 'ejs');

// parse application/x-www-form-urlencoded for HTMl form
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json for API
app.use(bodyParser.json())

app.get('/', (req, res) => {
    console.log(req.session)
    console.log(req.session.id)

    res.send('Hello World!')
})

const findOne = function(email, password) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const user = usersDB.find(user => user.email === email);

            resolve(user);
        }, 1000)
    });
}

app.use(authMiddleware)

app.get('/auth/login', async (req, res) => {
    if(req.session.userId) {
        return res.redirect('/admin/dashboard');
    }

    return res.render('pages/auth/login', {
        r: req.query.r || ''
    })
})

// for auth
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;

    // fake check user fromDB
    const user = await findOne(email, password);

    // check password
    const isValid = bcrypt.compareSync(password, user.password);

    if(isValid) {
        // save userId to session
        req.session.userId = user.id;

        // check if have r in queryString
        const r = req.query.r;
        console.log(req.query)

        if(r) return res.redirect(r);

        // redirect to protedted endpoint
        return res.redirect('/admin/dashboard');
    }

    return res.redirect('/auth/login');
})

app.get('/auth/logout', (req, res) => {
    delete req.session.userId;

    return res.redirect('/auth/login');
})

// protected page
app.get('/admin/dashboard', (req, res) => {
    return res.render('pages/dashboard');
})

// another protected page
app.get('/admin/user-management', (req, res) => {
    // render a view
    const {perPage = 1, page = 1} = req.query;

    const chunks = chunk(usersDB, perPage);

    return res.render('pages/user-management', {
        users: chunks[page - 1],
        perPage,
        total: chunks.length,
        page
    });
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})