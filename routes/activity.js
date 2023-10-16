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

const Post = require('../models/Post')
const Activity = require('../models/Activity')

/* 
*   POST. Add activity
*   Example JSON payload:
    {
        "post_id": "652bfe8167c5a7b784a908dc",
        "type": "like" # can be also 'comment' 
        "body" : 1, # 1=like, 0=dislike , comment need string body
    }
*/
router.post('/', authUser, async (req, res) => {
    // Validate post data
    const postId = req.body.post_id
    LOGGER.log('Attempt to add activity for post, id: ' + postId,req)
    const {error} = activityValidation(req.body)
    if(error) {
        return res.status(500).send({message: error['details'][0]['message']})
    }

    // Get post
    let post = null
    try {
        post = await Post.findById(postId)
        // Add status Live/Expired to output json
        post.status = 'Live'
        if(Date.now() > post.date_expire) {
            post.status = 'Expired'
        }
        //LOGGER.log('Attempt to start adding activity for post')
        console.log(post)
    } catch (err) {
        LOGGER.log("ERROR. Post not found. Id: " + postId + ", ERROR: " + err , req)
        return res.status(409).send({message: "Post not found."})
    }

    // Check if post is Live
    if(post.status != 'Live') {
        LOGGER.log("ERROR. Post expired" , req)
        return res.status(409).send({message: "Post is expired"})
    }

    // Prevent post owner adding own activities

    const jwtToken = Token(req)
    const loggedInUserId = TokenDecoded(req).user_id

    post.user_id = loggedInUserId

    res.status(201).send('tmp message')
})

module.exports = router