/**
 *  Author: Seweryn Michota
 *  Date: October 2023
 */

const Logger = require('../utils/Logger');
const LOGGER = new Logger();
const { Token, TokenDecoded } = require('../utils/Token');
const { authOwner } = require('../verifyToken') // Verify JWT Tokens
const { activityValidation } = require('../validators/validation');

const Activity = require('../models/Activity')
const Post = require('../models/Post')
const User = require('../models/User')

module.exports = {
  create: async (req, res) => {
    // Validate post data
    const postId = req.body.post_id
    LOGGER.log('Attempt to add activity for post, id: ' + postId, req)
    const { error } = activityValidation(req.body)
    if (error) {
      return res.status(500).send({ message: error['details'][0]['message'] })
    }

    // Get post
    let post = null
    try {
      post = await Post.findById(postId)
      // Add status Live/Expired to output json
      post.status = 'Live'
      if (Date.now() > post.date_expire) {
        post.status = 'Expired'
      }
    } catch (err) {
      LOGGER.log("ERROR. Post not found. Id: " + postId + ", ERROR: " + err, req)
      return res.status(409).send({ message: "Post not found." })
    }

    // Check if post is Live
    if (post.status != 'Live') {
      LOGGER.log("ERROR. Post expired", req)
      return res.status(409).send({ message: "Post is expired" })
    }

    const jwtToken = Token(req)
    const loggedInUserId = TokenDecoded(req).user_id

    // Prevent post owner adding own activities
    if (post.owner_id == loggedInUserId) {
      LOGGER.log("ERROR. Can't add activities on own posts", req)
      return res.status(409).send({ message: "Can't add activities to own posts" })
    }

    // Validate if type is valid [like or comment]
    const isValidInput = validateActivityInputs(req.body.type, req.body.body)
    if (!isValidInput) {
      LOGGER.log("ERROR. Invalid activity inputs [type-body combination]", req)
      return res.status(409).send({ message: "ERROR. Invalid activity inputs [type-body combination]" })
    }

    const newActivity = new Activity({
      post_id: req.body.post_id,
      type: req.body.type,
      body: req.body.body,
      owner_id: loggedInUserId,
      post: req.body.post_id,
      owner: loggedInUserId
    })
    const savedActivity = await newActivity.save()

    // Assing activity to a user
    const foundUser = await User.findById(loggedInUserId)
    foundUser.activities.push(savedActivity)
    await foundUser.save()

    post.activities.push(savedActivity)
    post.save()


    res.status(201).send(savedActivity)
  },
  delete: async (req, res) => {
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
  },
  deleteAll: async (req, res) => {
    LOGGER.log("Deleting all activities", req)
    try {
      Activity.deleteMany({}, () => {
        LOGGER.log("All activities deleted", req)
      })
    } catch (err) {
      LOGGER.log("ERROR. Can't delete all activities. ERROR: " + err, req)
      return res.status(404).send({ message: "Can't delete all activities." })
    }
    res.status(200).send({ message: "All posts deleted" })
  },
  all: async (req, res) => {
    LOGGER.log("Get all activities", req)
    try {
      const activities = await Activity.find().populate("owner", 'username email').populate("post")
      return res.status(200).send(activities)
    } catch (err) {
      return res.status(409).send({ message: err })
    }
  },
  one: async (req, res) => {
    LOGGER.log("Get one activity with id: " + req.params.activityId, req)
    try {
      const activity = await Activity.findById(req.params.activityId).populate("owner", "username email").populate("post")
      //let result = await toActivityDTO(activity)
      return res.status(200).send(activity)
    } catch (err) {
      LOGGER.log("ERROR. Get activity with id :" + req.params.activityId +
        ", ERROR: " + err, req)
      return res.status(409).send({ message: "activity by id not found" })
    }
  },
  likes: async (req, res) => {
    LOGGER.log("Get all LIKE activities", req)
    try {
      const activities = await Activity.find()
      let result = []
      for (const activity of activities) {
        if (activity.type == 'like' && activity.body == '1') {
          result.push(activity)
        }
      }

      return res.status(200).send(result)
    } catch (err) {
      return res.status(409).send({ message: err })
    }
  },
  dislikes: async (req, res) => {
    LOGGER.log("Get all LIKE activities", req)
    try {
      const activities = await Activity.find()
      let result = []
      for (const activity of activities) {
        if (activity.type == 'like' && activity.body == '0') {
          result.push(activity)
        }
      }

      return res.status(200).send(result)
    } catch (err) {
      return res.status(409).send({ message: err })
    }
  },
  comments: async (req, res) => {
    LOGGER.log("Get all LIKE activities", req)
    try {
      const activities = await Activity.find()
      let result = []
      for (const activity of activities) {
        if (activity.type == 'comment') {
          result.push(activity)
        }
      }

      return res.status(200).send(result)
    } catch (err) {
      return res.status(409).send({ message: err })
    }
  },
}

const validateActivityInputs = (type, body) => {

  if (type !== 'like' && type !== 'comment') {
    return false
  }

  if (type == 'like') {
    if (body !== "1" && body !== "0") {
      return false
    }
  }
  return true
}