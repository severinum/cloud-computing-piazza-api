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
const User = require('../models/User')


/* 
*   GET All activities
*/
router.get('/', authUser, async (req, res) => {
    LOGGER.log("Get all activities", req)
    try {
        const activities = await Activity.find()
        return res.status(200).send(activities)
    } catch (err) {
        return res.status(409).send({message:err})
    }
})


/* 
*   GET one activity
*/
router.get('/:activityId', authUser, async (req, res) => {
    LOGGER.log("Get one activity with id: " + req.params.activityId, req)
    try {
        const activity = await Activity.findById(req.params.activityId)
        let result = await toActivityDTO(activity)
        return res.status(200).send(result)
    } catch (err) {
        LOGGER.log("ERROR. Get activity with id :" + req.params.activityId +
            ", ERROR: " + err, req)
        return res.status(409).send({ message: "activity by id not found" })
    }
})

/* 
*   DELETE activity
*/
router.delete('/:activityId', authUser, async (req, res) => {
    const activityId = req.params.activityId
    LOGGER.log("Attempt to deleteactivity id: DELETE /activity/" + activityId, req)
    let activity = null;
    try {
    activity = await Activity.findById(activityId);
    } catch (err) {
        const errMsg = "Error. Find activity , id: " + activityId + ", error: " + err
        LOGGER.log(errMsg, req)
            return res.status(409).send({ message: "Error. Activity not found" })
    }

    try {
        // Check if user own activity or is admin.
        if (!authOwner(activity.owner_id, req)) {
            LOGGER.log("Unauthorised access: DELETE activity/" + activityId, req)
            return res.status(403).send({ message: "Unauthorized access" })
        }
    } catch (err) {
        LOGGER.log("Error. Find activity , id: " + activityId + ", error: " + err, req)
        return res.status(403).send({ message: "Not found" })
    }

    try {
        activity.deleteOne({ _id: activityId }, () => {
            LOGGER.log("Activity deleted: DELETE activity/" + activityId, req)
        })

        return res.status(200).send({ message: "Activity deleted : " + activityId })
    } catch (err) {
        LOGGER.log("Error deleting activity : DELETE activity/" + activityId + ', ERROR: ' + err, req)
        return res.status(409).send({ message: "Error deleting activity " + activityId })
    }
})


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
    } catch (err) {
        LOGGER.log("ERROR. Post not found. Id: " + postId + ", ERROR: " + err , req)
        return res.status(409).send({message: "Post not found."})
    }

    // Check if post is Live
    if(post.status != 'Live') {
        LOGGER.log("ERROR. Post expired" , req)
        return res.status(409).send({message: "Post is expired"})
    }

    const jwtToken = Token(req)
    const loggedInUserId = TokenDecoded(req).user_id

    // Prevent post owner adding own activities
    if(post.owner_id == loggedInUserId) {
        LOGGER.log("ERROR. Can't add activities on own posts" , req)
        return res.status(409).send({message: "Can't add activities to won posts"})
    }

    // Validate if type is valid [like or comment]
    const isValidInput = validateActivityInputs(req.body.type, req.body.body)
    if (!isValidInput) {
        LOGGER.log("ERROR. Invalid activity inputs [type-body combination]" , req)
        return res.status(409).send({message: "ERROR. Invalid activity inputs [type-body combination]"})
    }

    const newActivity = new Activity({
        post_id: req.body.post_id,
        type: req.body.type,
        body: req.body.body,
        owner_id: loggedInUserId
    }) 

    const savedActivity = await newActivity.save()
    res.status(201).send(savedActivity)
})

const validateActivityInputs = (type, body) => {
    
    if(type !== 'like' && type !== 'comment') {
        return false
    }

    if(type == 'like') {
        if(body !== "1" && body !== "0") {
            return false
        }
    }
    return true
}

const toActivityDTO = async (activity) => {

    const user = await User.findById(activity.owner_id)

    return {
        _id: activity._id,
        post_id: activity.post_id,
        owner_id: activity.owner_id,
        owner_name: user.username,
        type: activity.type,
        body: activity.body,
        date: activity.date
    }
}


module.exports = router