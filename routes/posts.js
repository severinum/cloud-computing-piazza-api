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
const {postValidation} = require('../validators/validation');
const Post = require('../models/Post')

/* 
*   GET All posts
*/
router.get('/', authUser, async (req, res) => {
    LOGGER.log("Get all posts", req)
    try {
        const posts = await Post.find()
        return res.status(200).send(posts)
    } catch (err) {
        return res.status(409).send({message:err})
    }
})

/* 
*   POST. Add post
*   Example JSON payload:
    {
        "title": "Kittens are cool",
        "category": ["sport", "tech"], # category by name (must exists in categories collection)
        "body" : "Lorem ipsum ...",
        "expiration_time": 5  # in minutes
    }
*/
router.post('/', authUser, authRole("admin"),  async (req, res) => {
    // Validate post data
    const {error} = postValidation(req.body)
    if(error) {
        return res.status(500).send({message: error['details'][0]['message']})
    }

    const jwtToken = Token(req)
    const loggedInUserId = TokenDecoded(req).user_id

    // calculate and set expire time
    var now = new Date();
    var expireTime = new Date();
    expireTime.setTime(now.getTime() + (req.body.expiration_time * 60 * 1000));

    const newPost = new Post({
        title: req.body.title,
        category: req.body.category,
        body: req.body.body,
        date_expire: expireTime,
        owner_id: loggedInUserId
    })

    const savedPost = await newPost.save()
    res.status(201).send(savedPost)
})

module.exports = router