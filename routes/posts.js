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
const {checkIfTopicExists} = require('../routes/topics')

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
*   GET one post
*/
router.get('/:postId', authUser, async (req, res) => {
    LOGGER.log("Get one post with id: " + req.params.postId , req)
    try {
        const post = await Post.findById(req.params.postId)
        return res.status(200).send(post)
    } catch (err) {
        LOGGER.log("ERROR. Post not found. Id: " + req.params.postId , req)
        return res.status(409).send({message: "Post by id not found"})
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

    // Check if all post categories (topics) exist
    // Must exist to be assigned
    if(req.body.category.length > 0) {
        for(let i=0; i< req.body.category.length; i ++){
            let currTopic = req.body.category[i]
            if(!await checkIfTopicExists(currTopic)){
                return res.status(409).send({message: "Topic must exist to be assinged {" + currTopic + "}"})
            }
        }
    }
    
    // calculate and set expire time
    var expireTime = calculateExpirationdate(new Date(), req.body.expiration_time )

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

/* 
*   PATCH. Update Post
*   Example JSON payload: # select fields to update. expiration_time must be in minutes
    {
        "title": "Kittens are insane !",
        "expiration_time": 5  # in minutes
    }
*/
router.patch("/:postId", authUser, async (req, res) => {
    const postId = req.params.postId
    LOGGER.log("Attempt to update post id: PATCH /posts/" + postId , req)
    try {
        const post = await Post.findById(postId)
        // Reset expiry time in case of any changes in that value
        if(req.body.expiration_time) {
            var expireTime = calculateExpirationdate(post.date_register, 
                req.body.expiration_time )
            LOGGER.log('Expiration time change. POST id: ' + post._id + ' to: ' +
                expireTime, req)
            req.body.date_expire = expireTime
        }
        
        Object.assign(post, req.body)
        post.save();
        LOGGER.log('POST updated, id: ' + post._id, req)
        return res.status(200).send(post)
    } catch (err) {
        LOGGER.log("PATCH /posts/" + postId + " error : " + err, req)
        return res.status(404).send({message: 'Item not found'})
    }
})

/* 
*   DELETE one post
*/
router.delete('/:postId', authUser, async (req, res) => {
    const postId = req.params.postId
    LOGGER.log("Attempt to delete post id: DELETE /posts/" + postId , req)
    const post = await Post.findById(postId);
    // Check if auction exists.
    
    try {
        // Check if user own post or is admin.
        if(!authOwner(post.owner_id, req)) {
            LOGGER.log("Unauthorised access: DELETE posts/" + postId, req)
            return res.status(403).send({message: "Unauthorized access"})
        }
    } catch (err) {
        return res.status(403).send({message: "Not found"})
    }
    
    try {
        post.deleteOne({_id: postId}, () => {
            LOGGER.log("post deleted: DELETE posts/" + postId, req)
        })
        
        return res.status(200).send({message: "post deleted : " + postId})
    } catch(err) {
        LOGGER.log("Error deleting post : DELETE posts/" + postId + ', ERROR: ' + err, req)
        return res.status(409).send({message: "Error deleting post " + postId})
    }
})


const calculateExpirationdate = (currentDate, expirationTime) => {
    var expireTime = new Date();
    return expireTime.setTime(currentDate.getTime() + (expirationTime * 60 * 1000));
}

module.exports = router