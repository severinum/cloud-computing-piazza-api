/**
 *  Author: Seweryn Michota
 *  Date: October 2023
 */
const express = require('express')
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
require('dotenv/config')

const Logger = require('./utils/Logger');
const LOGGER = new Logger();

const app = express()
app.use(bodyParser.json())

// ** App Routes ** //
// Route: Posts
const postsRoute = require('./routes/posts')
app.use('/api/v1/posts', postsRoute)

// Route: Auth
const authRoute = require('./routes/auth')
app.use('/api/users', authRoute)

// Route: Topics
const topicsRoute = require('./routes/topics')
app.use('/api/v1/topics', topicsRoute)

// ** MongoDB ** //
MURL = process.env.MURL
mongoose.set('strictQuery', false)
mongoose.connect(MURL, () => {
    console.log('MongoDB connection: Successful')
})

/* 
*   API Healthcheck Endpoint
*/
app.get('/api/v1/healthcheck', (req, res) => {
    LOGGER.log("Healthcheck Route", req)
    res.status(200).send({message: 'OK'})
})

app.listen(process.env.PORT, () => {
    console.log("Piazza API status: ON")
})