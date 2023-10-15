/**
 *  Author: Seweryn Michota
 *  Date: October 2023
 */
const express = require('express')
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
require('dotenv/config')

const app = express()
app.use(bodyParser.json())


app.listen(process.env.PORT, () => {
    console.log("Piazza API status: ON")
})
