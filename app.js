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

// ** App Routes ** //
// Route: Posts
const postsRoute = require('./routes/posts')
app.use('/api/v1/posts', postsRoute)

// ** MongoDB ** //
MURL = process.env.MURL
mongoose.connect(MURL, () => {
    console.log('MongoDB connection: Successful')
})

app.listen(process.env.PORT, () => {
    console.log("Piazza API status: ON")
})


