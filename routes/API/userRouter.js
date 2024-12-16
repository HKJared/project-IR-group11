const express = require('express');
const examController = require('../../controllers/API/examController');
const ElementController = require('../../controllers/API/elementController');
const userRouter = express.Router();

userRouter.get('/search', examController.search);
userRouter.get('/exam', examController.getExamById);
userRouter.get('/index-names', examController.getIndexNames);

userRouter.get('/element/:partial', ElementController.getUserMainElement);


module.exports = userRouter;