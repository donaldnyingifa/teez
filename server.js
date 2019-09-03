const path = require('path');
const Login = require('./models/login');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt =  require('bcrypt');

const errorController = require('./controllers/error');
const sequelize = require('./util/database');
const flash = require('connect-flash');

const cookieParser = require('cookie-parser')
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const csrf = require('csurf');

const Product = require('./models/product');
const User = require('./models/user');
const Cart = require('./models/cart');
const CartItem = require('./models/cart-item');
const Order = require('./models/order');
const OrderItem = require('./models/order-item');

const csrfProtection = csrf();
const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');


app.use(cookieParser())
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    resave: false, // we support the touch method so per the express-session docs this should be set to false
    proxy: true, // if you do SSL outside of node.
    store: new SequelizeStore({
        db: sequelize
      }),
    secret: 'my secret', 
    resave: false, 
    saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
}));
app.use(csrfProtection);
app.use(flash());

// app.use((req, res, next) => {
//     console.log('check for user id in req.session',req.session)
//     User.findAll({where: {id: 1}})
//     .then(([user]) => {
//         //console.log('hello', user);
//         req.user = user;
//         next();
//     })
//     .catch(err => console.log(err));
// });

app.use((req, res, next) => {
    if (!req.session.user) {
      return next();
    }
   
   let uid ;
   if (req.session.user[0] !== undefined) uid = req.session.user[0].id;
   else uid = 1;
   console.log('check for user id in req.session.user[0].id',uid)
   User.findAll({where: {id: uid}})
      .then(([user]) => {
        req.user = user;
        next();
      })
      .catch(err => console.log(err));
  });

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);
Product.belongsTo(User, { constraints: true, onDelete: 'CASCADE'});
User.hasMany(Product);
User.hasOne(Cart);
Cart.belongsTo(User);
Cart.belongsToMany(Product, { through: CartItem});
Product.belongsToMany(Cart, { through: CartItem});
Order.belongsTo(User);
User.hasMany(Order);
Order.belongsToMany(Product, { through: OrderItem});

sequelize
//.sync({ force: true})
.sync()
.then(result => {
   // console.log('sssss',session.user)
   // const uid = session.user.dataValue.id;
    const uid = 1;
    return User.findAll({where: {id: uid}});
})
.then(([user]) => {
    const Sequelize = require('sequelize');
    if (!user) {
         const user = User.create({
            email: 'max@gmail.com', 
            password: 'Max',
            });
            //const login = sequelize.define('login', { email: Sequelize.STRING, hash: Sequelize.STRING })
            const hash = bcrypt.hashSync('Max', 10);
            Login.create({ email: 'max@gmail.com', hash: hash })
            return user
    }
    return user;
})
.then(user => {
    return user.createCart();
    
})
.then(() => {
    app.listen(3000);
})
.catch(err => {
    console.log(err);
})


