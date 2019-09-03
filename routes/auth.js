const express = require('express');
const { check } = require('express-validator/check');
const User = require('../models/user');
const authController = require('../controllers/auth');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login', authController.postLogin);

router.post(
    '/signup',
     [
         check('email')
        .isEmail()
        .withMessage('Please enter a valid email.')
        .custom((value, { req }) => {
            // if (value === 'test@test.com') {
            //     throw new Error('This email is forbidden');
            // }
            // return true;
            return User.findAll({where: {email: value}})
            .then (user => {
                if (user.length) {
                    return Promise.reject('This email is already taken');
                }
            })
        })
        .withMessage('Email already taken.')
        ,
        check(
            'password',
            'Please enter a password with only numbers and text and at least 5 characters.'
        )
        .isLength({ min: 5 })
        .isAlphanumeric(),
        check('confirmPassword').custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords have to match!');
            }
            return true;
        })
     ],
     authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/signup', authController.getSignup);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;