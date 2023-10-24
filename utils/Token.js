/**
 *  Author: Seweryn Michota
 *  Date: October 2023
 */
const jsonwebtoken = require('jsonwebtoken')
const dotenv = require('dotenv')
const jwt_decode = require('jwt-decode')

function Token(req) {
    const tokenString = req.header('Authorization');
    if (!tokenString) {
        return false
    }
    // Split tokenString (Remove 'Bearer' part)
    const authorizationArray = tokenString.split(' ');
    const jwtToken = authorizationArray[1];
    return jwtToken
}

// Decodes jwt token to extract user details (id, roles)
function TokenDecoded(req) {
    const jwt = Token(req)
    const jwtDecoded = jwt_decode(jwt)
    return jwtDecoded
}

module.exports.Token = Token
module.exports.TokenDecoded = TokenDecoded