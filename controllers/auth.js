const { validationResult } = require('express-validator/check');

const User = require('../models/user');
const Login = require('../models/login');

const crypto = require('crypto'); // A node.js built-in library
const bcrypt =  require('bcrypt');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

const saltRounds = 10;
const transporter = nodemailer.createTransport(sendgridTransport({
  auth: {
    api_key: ''
  }
}));

exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message
  });
};

exports.postLogin = (req, res, next) => {

 const {email, password} = req.body;

 const errors = validationResult(req);

 if(!errors.isEmpty()) {
  return res.status(422).render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: errors.array()[0].msg
  });
 }

  User.findAll({where: {email: email}})
    .then(data => {
      if (!data.length) {
        return res.status(400).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          errorMessage: 'Check credentials and try again !'
      
        });
      }
      const isValid = bcrypt.compareSync(password, data[0].password);
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
      } else {
        //req.flash('error','Invalid email or password !!!');
        //return res.status(400).redirect('/login');
        return res.status(400).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          errorMessage: 'Wrong credentials and try again !'
      
        });
      }
    })
    .catch(err => console.log(err));
};

exports.postSignup = (req, res, next) => {
  const {email, password } = req.body;
  const  errors = validationResult(req);
  const hash = bcrypt.hashSync(password, saltRounds);

  if (!errors.isEmpty()) {
    console.log(errors.array())
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email, 
        password: password, 
        confirmPassword: req.body.confirmPassword 
      },
      validationErrors: errors.array()
    });
  }

  try {
    User.findAll({where: {email: email}})
  .then(user => {
    if (!user.length) {
      return User.create({
        email: email, 
        password: hash,
        })
        .then(user => {
         // Login.create({ email: email, hash: hash })
          user.createCart();
          return user;
        })
        .then(user => {
          req.session.isLoggedIn = true;
          req.session.user = user;
          req.session.save(err => {
            console.log(err);
            res.redirect('/');
            return transporter.sendMail({
              to:email,
              from: 'do-not-reply@teez.ng',
              subject: 'Signup succeeded !',
              html: '<em>You successfully signed up for Teez&Feelz ! </em>'
            })
          });
        })
        .catch(err => {
          console.log(err);
        })
    } else {
      req.flash('error', 'Email Already Exists, Please choose a different email');
      return res.redirect('/signup')
      //res.status(400).json("Email Already Exists")
    }
  }) 
  } catch(ex) {
    console.log(ex);
  }
  
    
   
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
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: message,
    oldInput: {
      email: '',
      password: '',
      confirmPassword: ''
    },
    validationErrors: []
  });
};

exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message
  });
};

exports.postReset =(req, res, next)=> {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    return User.findAll({where: {email: req.body.email}})
    .then(([user]) => {
      if (!user) {
        req.flash('error', 'No account with that email found.');
        console.log('I can see No USER', user );
        return res.redirect('/reset');
      } else {
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        user.email = req.body.email;
        user.password = user.dataValues.password;

       // console.log('I can see USER11----',user.email, user)
        return user.save().then(result => {
          console.log('result after saving', result)
          res.redirect('/');
          transporter.sendMail({
            to: req.body.email,
            from: 'do-not-reply@teez.ng',
            subject: 'Password reset',
            html: `
              <p>You requested a password reset</p>
              <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
            `
          })
          .catch(err => {
            console.log('transporter--',err);
          });
        })
      }
    })
    .catch(err => {
      console.log(err);
    });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findAll({where: {resetToken: token}})
 // User.findAll({where: {id: req.body}})
    .then(([user]) => {
      // console.log('hello 2', user)
      // console.log('hello ', user.id)
      let message = req.flash('error');
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'New Password',
        errorMessage: message,
        userId: user.id,
        passwordToken: token
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  // User.findOne({
  //   resetToken: passwordToken,
  //   resetTokenExpiration: { $gt: Date.now() },
  //   _id: userId
  // })
  //, resetTokenExpiration: { $gt: Date.now() }
  User.findAll({where: {id: userId, resetToken: passwordToken}})
    .then(([user]) => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then(hashedPassword => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then(result => {
      res.redirect('/login');
    })
    .catch(err => {
      console.log(err);
    });
};

