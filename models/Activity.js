/**
 *  Author: Seweryn Michota
 *  Date: October 2023
 */
const mongoose = require('mongoose')

const activitySchema = mongoose.Schema({
    post_id: {
        type: String,
        required: true,
        max: 256
    },
    user_id: {
        type: String,
        required: true,
        max: 256
    },
    type: {
        type: String,
        required: true,
        min: 3,
        max: 50
    },
    body: {
        type: String,
        required: true,
        min: 1,
        max: 512
    },
    date: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('activities', activitySchema)