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
    owner_id: {
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
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post"
    }
})

module.exports = mongoose.model('Activity', activitySchema)