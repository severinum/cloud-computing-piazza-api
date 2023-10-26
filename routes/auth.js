/**
 *  Author: Seweryn Michota
 *  Date: October 2023
 */
const express = require('express');
const User = require('../models/User');
const {authUser, authRole} = require('../verifyToken') // Verify JWT Tokens
const router = express.Router();

const AuthController  = require("../controllers/AuthController")

router.post('/register',  AuthController.register)
router.post('/login',  AuthController.login)
router.post('/find', authUser, AuthController.find)
router.patch('/', authUser, AuthController.update)
router.get('/', authUser,  AuthController.getAll)
router.get('/:userId', authUser,  AuthController.getOne)
router.delete('/all', authRole('admin'),  AuthController.deleteAll)
router.delete('/:userId', authRole('admin'),  AuthController.delete)

module.exports = router;