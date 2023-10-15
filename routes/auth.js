/**
 *  Author: Seweryn Michota
 *  Date: October 2023
 */
const express = require('express');
const bcryptjs = require('bcryptjs')
const jsonwebtoken = require('jsonwebtoken')
const dotenv = require('dotenv')

const User = require('../models/User');
const {authUser, authRole} = require('../verifyToken') // Verify JWT Tokens

const router = express.Router();


module.exports = router;