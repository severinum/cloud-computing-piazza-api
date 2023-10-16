/**
 *  Author: Seweryn Michota
 *  Date: October 2023
 */
const express = require('express')
const router = express.Router()

const {authUser, authRole, authOwner} = require('../verifyToken') // Verify JWT Tokens
const Logger = require('../utils/Logger');
const LOGGER = new Logger();
const {Token, TokenDecoded} = require('../utils/Token');
const dontenv = require('dotenv');
const {activityValidation} = require('../validators/validation');


/* 
*   POST. Add activity
*   Example JSON payload:
    {
        "post_id": "652bfe8167c5a7b784a908dc",
        "user_id": "652bfe8e67c5a7b784a908e2",
        "type": "like" # can be also 'comment' 
        "body" : 1, # 1=like, 0=dislike , comment need string body
    }
*/
router.post('/', authUser, async (req, res) => {
    // Validate post data
    const {error} = activityValidation(req.body)
    if(error) {
        return res.status(500).send({message: error['details'][0]['message']})
    }

    // Check if post is Live

    const jwtToken = Token(req)
    const loggedInUserId = TokenDecoded(req).user_id

    res.status(201).send('tmp message')
})


module.exports = router