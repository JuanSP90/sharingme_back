const express = require("express");
const usersRouter = express.Router();
const userController = require("../controllers/UserController")
const auth = require('../middlewares/auth')

usersRouter.get('/', userController.getUsers);
usersRouter.get('/usersMap', userController.getUserMapAndCount);
usersRouter.get("/me", auth.checkIfAuth, userController.getUserProfile);
usersRouter.post("/login", userController.loginUser);
usersRouter.get('/:userName', userController.getUser);
usersRouter.post("/", userController.addUser);
usersRouter.patch("/updateUser", auth.checkIfAuth, userController.updateUserConfig);
usersRouter.post("/forgotPassword", userController.forgotPassword);

module.exports = usersRouter