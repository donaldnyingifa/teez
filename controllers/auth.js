const User = require('../models/user');
const Login = require('../models/login');
const sequelize = require('../util/database');
const bcrypt =  require('bcrypt');
const saltRounds = 10;

exports.getLogin = (req, res, next) => {
  //const isLoggedIn = req.get('Cookie').split(';')[3].trim().split('=')[1];
   // console.log('log check',req.get('Cookie').split(';')[3].trim().split('=')[1])
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
   // isAuthenticated: isLoggedIn
    isAuthenticated: false
  });
};

exports.postLogin = (req, res, next) => {

 const {email, password} = req.body;

  Login.findAll({where: {email: email}})
    .then(data => {
      if (!data.length) return res.status(400).json("Email or Password is invalid")
      const isValid = bcrypt.compareSync(password, data[0].hash);
      if (isValid) {
        return User.findAll({where: {email: email}})
        .then(user => {
          req.session.isLoggedIn = true;
          req.session.user = user;
          req.session.save(err => {
            console.log(err);
            res.redirect('/');
          });
        })
      } else res.status(400).json("Invalid Details")
    })
    .catch(err => console.log(err));
};

exports.postSignup = (req, res, next) => {
  const {email, password} = req.body
  const hash = bcrypt.hashSync(password, saltRounds);

  User.findAll({where: {email: email}})
  .then(user => {
    if (!user.length) {
      return User.create({
        email: email, 
        password: hash,
        })
        .then(user => {
          Login.create({ email: email, hash: hash })
          user.createCart();
          return user;
        })
        .then(user => {
          req.session.isLoggedIn = true;
          req.session.user = user;
          req.session.save(err => {
            console.log(err);
            res.redirect('/');
          });
        })
    } else {
      res.status(400).json("Email Already Exists")
    }
  }) 
    .catch(err => {
      console.log(err);
        });
   
  // return sequelize.transaction(function (t) {

  //   // chain all your queries here. make sure you return them.
  //   return User.create({
  //        email: email, 
  //       password: hash,
  //   }, {transaction: t})
  //   .then(function (user) {
  //     console.log(user, '----------------')
  //     Login.create({ email: email, hash: hash }
  //       , {transaction: t});
  //     return user
  //   }, {transaction: t})
  
  // }).then(function (user) {
  //   user.createCart();
  //   // Transaction has been committed
  //   // result is whatever the result of the promise chain returned to the transaction callback
  //   res.redirect('/');
  // }).catch(function (err) {
  //   // Transaction has been rolled back
  //   // err is whatever rejected the promise chain returned to the transaction callback
  //   console.log(err)
  // });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};

exports.getSignup = (req, res, next) => {
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    isAuthenticated: false
  });
};
