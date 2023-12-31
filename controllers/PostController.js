/**
 *  Author: Seweryn Michota
 *  Date: October 2023
 */

const Logger = require('../utils/Logger');
const LOGGER = new Logger();
const { postValidation } = require('../validators/validation');
const { Token, TokenDecoded } = require('../utils/Token');

const Post = require('../models/Post')
const User = require('../models/User')
const Topic = require('../models/Topic')

module.exports = {

  create: async (req, res) => {
    // Validate post data
    const { error } = postValidation(req.body)
    if (error) {
      return res.status(500).send({ message: error['details'][0]['message'] })
    }

    const jwtToken = Token(req)
    const loggedInUserId = TokenDecoded(req).user_id

    // Check if all post categories (topics) exist
    // Must exist to be assigned
    if (req.body.category.length > 0) {
      for (let i = 0; i < req.body.category.length; i++) {
        let currTopic = req.body.category[i]
        if (!await checkIfTopicExists(currTopic)) {
          return res.status(409).send({ message: "Topic must exist to be assinged {" + currTopic + "}" })
        }
      }
    }

    // calculate and set expire time
    var expireTime = calculateExpirationdate(new Date(), req.body.expiration_time)

    const newPost = new Post({
      title: req.body.title,
      category: req.body.category,
      body: req.body.body,
      date_expire: expireTime,
      owner_id: loggedInUserId,
      owner: loggedInUserId
    })

    const savedPost = await newPost.save()

    // Find user and assign post to him
    const user = await User.findById(loggedInUserId);
    user.posts.push(savedPost)
    await user.save()

    res.status(201).send(savedPost)
  },

  update: async (req, res) => {
    const postId = req.params.postId
    LOGGER.log("Attempt to update post id: PATCH /posts/" + postId, req)
    try {
      const post = await Post.findById(postId)
      // Reset expiry time in case of any changes in that value
      if (req.body.expiration_time != null) {
        console.log("OLD POST EXPIRE DATE: " + req.body.date_expire)
        var expireTime = calculateExpirationdate(post.date_register,
          req.body.expiration_time)
        LOGGER.log('Expiration time change. POST id: ' + post._id + ' to: ' +
          expireTime, req)
        req.body.date_expire = expireTime
        console.log("NEW POST EXPIRE DATE: " + req.body.date_expire)
      }

      Object.assign(post, req.body)
      post.save();
      LOGGER.log('POST updated, id: ' + post._id, req)
      return res.status(200).send(post)
    } catch (err) {
      LOGGER.log("PATCH /posts/" + postId + " error : " + err, req)
      return res.status(404).send({ message: 'Item not found' })
    }
  },
  delete: async (req, res) => {
    const postId = req.params.postId
    LOGGER.log("Attempt to delete post id: DELETE /posts/" + postId, req)
    const post = await Post.findById(postId);

    try {
      // Check if user own post or is admin.
      if (!authOwner(post.owner_id, req)) {
        LOGGER.log("Unauthorised access: DELETE posts/" + postId, req)
        return res.status(403).send({ message: "Unauthorized access" })
      }
    } catch (err) {
      return res.status(403).send({ message: "Not found" })
    }

    try {
      post.deleteOne({ _id: postId }, () => {
        LOGGER.log("post deleted: DELETE posts/" + postId, req)
      })

      return res.status(200).send({ message: "post deleted : " + postId })
    } catch (err) {
      LOGGER.log("Error deleting post : DELETE posts/" + postId + ', ERROR: ' + err, req)
      return res.status(409).send({ message: "Error deleting post " + postId })
    }
  },
  deleteAll: async (req, res) => {
    LOGGER.log("Deleting all posts", req)
    try {
      Post.deleteMany({}, () => {
        LOGGER.log('All posts were deleted', req)
      })
    } catch (err) {
      LOGGER.log("ERROR. Can't delete all posts. ERROR: " + err, req)
      return res.status(404).send({ message: "Can't delete all posts." })
    }
    res.status(200).send({ message: "All posts deleted" })
  },
  findAll: async (req, res) => {
    LOGGER.log("Get all posts", req)
    try {
      const posts = await Post.find().populate("owner", "username email").populate("activities")
      let result = []
      for (const post of posts) {
        result.push(await toPostDTO(post))
      }
      return res.status(200).send(result)
    } catch (err) {
      console.log(err)
      LOGGER("ERROR: Get all posts, ERROR:  " + err, req)
      return res.status(409).send({ message: err })
    }
  },
  findOne: async (req, res) => {
    LOGGER.log("Get one post with id: " + req.params.postId, req)
    try {
      const post = await Post.findById(req.params.postId).populate("owner", "username email").populate("activities")

      let result = await toPostDTO(post)

      const minToExpire = calculateMinutesToexpire(result.date_expire)
      result.minutes_to_expire = minToExpire

      return res.status(200).send(result)
    } catch (err) {
      LOGGER.log("ERROR. Get post with id :" + req.params.postId +
        ", ERROR: " + err, req)
      return res.status(409).send({ message: "Post by id not found" })
    }
  },
  postsByTopic: async (req, res) => {
    const topicName = req.params.topicName
    LOGGER.log("Get posts by topic: " + topicName, req)
    try {
      const posts = await Post.find().populate("owner", "username email").populate("activities")

      let result = []
      for (const post of posts) {
        for (const category of post.category) {
          if (category === topicName) {
            result.push(await toPostDTO(post))
          }
        }
      }

      return res.status(200).send(result)
    } catch (err) {
      LOGGER.log("ERROR. Get post with id :" + req.params.postId +
        ", ERROR: " + err, req)
      return res.status(409).send({ message: "Can't read posts" })
    }
  },
  expiredTopicPosts: async (req, res) => {
    const topicName = req.params.topicName
    LOGGER.log("Get posts by topic: " + topicName, req)
    try {
      const posts = await Post.find().populate("owner", "username email").populate("activities")

      let result = []
      for (const post of posts) {
        for (const category of post.category) {
          if (category === topicName && post.date_expire <= Date.now()) {
            result.push(await toPostDTO(post))
          }
        }
      }

      return res.status(200).send(result)
    } catch (err) {
      LOGGER.log("ERROR. Get post with id :" + req.params.postId +
        ", ERROR: " + err, req)
      return res.status(409).send({ message: "Can't read posts" })
    }
  },
  getTopicTopPost: async (req, res) => {
    const topicName = req.params.topicName
    LOGGER.log("Get top post in topic: " + topicName, req)
    try {
      const posts = await Post.find().populate("owner", "username email").populate("activities")

      if (posts.length == 0) {
        return res.status(200).send({ message: "No posts found" })
      }

      let result = []

      // Get Active post in topic
      for (const post of posts) {
        for (const category of post.category) {
          if (category === topicName && Date.now() < post.date_expire) {
            result.push(await toPostDTO(post))
          }
        }
      }

      // Find top comments
      // Return all if just one post
      if (result.length == 1) {
        return res.status(200).send(result)
      }

      // If more than 1, get the top comment
      let topComment = result[0]
      let topSumOfLikeAndDislike = parseInt(topComment['like']) + parseInt(topComment['dislike'])
      for (let i = 1; i < result.length; i++) {
        let currSumOfLikesAndDislakes = parseInt(result[i]['like']) + parseInt(result[i]['dislike'])
        if (currSumOfLikesAndDislakes > topSumOfLikeAndDislike) {
          topComment = result[i]
        }
      }

      return res.status(200).send(topComment)
    } catch (err) {
      LOGGER.log("ERROR. Get post with id :" + req.params.postId +
        ", ERROR: " + err, req)
      return res.status(409).send({ message: "Can't read posts" })
    }
  }
}

/*
* Transform Post object do PostDTO. It is adding caluclated fields"
*/
const toPostDTO = async (post) => {
  let status = 'Live'
  if (Date.now() > post.date_expire) {
    status = 'Expired'
  }
  const minToExpire = calculateMinutesToexpire(post.date_expire)

  const activities = getPostActivities(post.activities)

  return {
    _id: post._id,
    title: post.title,
    category: post.category,
    body: post.body,
    owner_id: post.owner_id,
    owner: post.owner,
    date_register: post.date_register,
    date_expire: post.date_expire,
    status: status,
    minutes_to_expire: minToExpire,
    activities: post.activities,
    like: activities.like,
    dislike: activities.dislike,
    comments: activities.comments
  }
}

const calculateExpirationdate = (currentDate, expirationTime) => {
  var expireTime = new Date();
  return expireTime.setTime(currentDate.getTime() + (expirationTime * 60 * 1000));
}

const calculateMinutesToexpire = (expirationTime) => {
  var timeToexpire = (Math.floor(Date.now() - expirationTime) / 1000) / 60
  timeToexpire = Math.floor(timeToexpire)
  if (timeToexpire >= 0)
    return 0
  return Math.abs(timeToexpire)
}

const getPostActivities = (postActivities) => {
  let result = {
    comments: 0,
    like: 0,
    dislike: 0,
  }

  if (postActivities.length > 0) {
    postActivities.forEach(activity => {
      if (activity.type == 'comment') {
        result.comments += 1
      }
      if (activity.type == 'like' && activity.body == '1') {
        result.like += 1
      }
      if (activity.type == 'like' && activity.body == '0') {
        result.dislike += 1
      }
    })
  }
  return result
}


const checkIfTopicExists = async (findName) => {
  return await Topic.findOne({
    name: findName
  }).then(foundTopic => {
    if (foundTopic) {
      return true
    }
    return false
  });
}
