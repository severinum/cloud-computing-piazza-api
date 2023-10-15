/**
 *  Author: Seweryn Michota
 *  Date: October 2023
 */
const express = require('express')
const router = express.Router()

const Logger = require('../utils/Logger');
const LOGGER = new Logger();

/* 
*   Route Healthcheck Endpoint
*/
router.get('/healthcheck', (req, res) => {
    LOGGER.log("Healthcheck Route Posts", req)
    res.status(200).send({message: 'OK'})
})

module.exports = router