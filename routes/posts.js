/**
 *  Author: Seweryn Michota
 *  Date: October 2023
 */
const express = require('express')
const router = express.Router()

const Logger = require('../utils/Logger');
const LOGGER = new Logger();

module.exports = router