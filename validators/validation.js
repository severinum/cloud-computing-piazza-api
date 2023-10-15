/**
 *  Author: Seweryn Michota
 *  Date: October 2023
 */
const joi = require('joi')

const topicValidation = (data) => {
    const itemValidation = joi.object({
            name: joi.string().required().min(3).max(265).trim(true)
    })

    return itemValidation.validate(data)
}

module.exports.topicValidation = topicValidation