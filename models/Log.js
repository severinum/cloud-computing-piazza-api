/**
 *  Author: Seweryn Michota
 *  Date: October 2023
 */
const mongoose = require('mongoose')

const logSchema = mongoose.Schema({
    date: {
        type: Date,
        default: Date.now
    },
    message: {
        type: String
    }
})

module.exports = mongoose.model('logs', logSchema)