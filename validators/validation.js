/**
 *  Author: Seweryn Michota
 *  Date: October 2023
 */
const joi = require('joi')

const registerValidation = (data) => {
    const schemaValidation = joi.object({
        username: joi.string().required().min(3).max(256).trim(true),
        email: joi.string().required().min(6).max(256).email().trim(true),
        password: joi.string().required().min(6).max(1024).trim(true),
        roles: joi.array().items(joi.string().alphanum().trim(true))
    });
    return schemaValidation.validate(data);
}

const topicValidation = (data) => {
    const itemValidation = joi.object({
            name: joi.string().required().min(3).max(265).trim(true)
    })

    return itemValidation.validate(data)
}

const loginValidation = (data) => {
    const schemaValidation = joi.object({
        email: joi.string().required().min(6).max(256).email(),
        password: joi.string().required().min(6).max(1024)
    });
    return schemaValidation.validate(data);
}

module.exports.topicValidation = topicValidation
module.exports.registerValidation = registerValidation
module.exports.loginValidation = loginValidation