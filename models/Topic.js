/**
 *  Author: Seweryn Michota
 *  Date: October 2023
 */
const mongoose = require('mongoose')

const topicsSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        min: 3,
        max: 256
    },
    owner_id: {
        type: String,
        required: true,
        min: 3,
        max: 256
    },
    active: {
        type: Boolean,
        default: true
    }
})

module.exports = mongoose.model('topics', topicsSchema)