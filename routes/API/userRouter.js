const express = require('express');
const userRouter = express.Router();
const UserController = require('../../controllers/WEB/userController');

userRouter.get('/login', UserController.getLoginRegisterPage);
userRouter.get('/register', UserController.getLoginRegisterPage);

userRouter.get('/', UserController.getHomePage);
userRouter.get('/user/:href', UserController.getHomePage);
userRouter.get('/:href/', UserController.getHomePage);


module.exports = userRouter;