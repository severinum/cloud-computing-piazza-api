/**
 *  Author: Seweryn Michota
 *  Date: October 2023
 */
const mongoose = require('mongoose')

const postsSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
        min: 3,
        max: 256
    },
    category: {
        type:Array,
        default: ["unknown"]
    },
    body: {
        type: String,
        required: true,
        min: 6,
        max: 6000
    },
    date_register: {
        type: Date,
        default: Date.now
    },
    date_expire: {
        type: Date,
        default: null
    },
    owner_id: {
        type: String,
        required: true,
        max:256
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    activities: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Activity"
    }]
})

module.exports = mongoose.model('Post', postsSchema)