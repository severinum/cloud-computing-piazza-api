/**
 *  Author: Seweryn Michota
 *  Date: October 2023
 */
const jsonwebtoken = require('jsonwebtoken')
const dotenv = require('dotenv')
const jwt_decode = require('jwt-decode')
const {Token, TokenDecoded} = require('./utils/Token')

const Logger = require('./utils/Logger');
const LOGGER = new Logger();

function authUser (req, res, next) {
    const tokenString = req.header('Authorization');
    if(!tokenString) {
        return res.status(401).send({message: "Access denied"});
    }

    const jwtToken = Token(req)
    
    try {
        const verified = jsonwebtoken.verify(jwtToken, process.env.TOKEN_SECRET)
        req.user = verified
        next()
    } catch(err) {
        return res.status(401).send({message: "Invalid token"});
    }
}

function authRole(role) {
    return (req, res, next) => {

        const tokenDecoded = TokenDecoded(req);
        const userRoles = tokenDecoded.user_roles;

        if(!userRoles.includes(role)) {
            return res.status(401).send({message: "No permission to resource. Need role: " + role})
        }
        next()
    }
}

function authOwner(entityOwnerId, req) {
        // Check if user is and admin
        const tokenDecoded = TokenDecoded(req);
        const userRoles = tokenDecoded.user_roles;

        LOGGER.log("Authorizing owner: (" + tokenDecoded.user_id + ") access for entity id: " + entityOwnerId , req)

        if(userRoles.includes("admin") || entityOwnerId === tokenDecoded.user_id) {
            return true
        }
        return false
}

module.exports =  { authUser,  authRole ,authOwner }