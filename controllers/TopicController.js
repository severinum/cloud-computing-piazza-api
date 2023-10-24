/**
 *  Author: Seweryn Michota
 *  Date: October 2023
 */

const Logger = require('../utils/Logger');
const LOGGER = new Logger();
const { topicValidation } = require('../validators/validation');
const { authOwner } = require('../verifyToken') // Verify JWT Tokens
const { Token, TokenDecoded } = require('../utils/Token');

const Topic = require('../models/Topic')

module.exports = {
   create: async (req, res) => {
      // Validate topic data
      const { error } = topicValidation(req.body)
      if (error) {
         return res.status(500).send({ message: error['details'][0]['message'] })
      }
      const isNameTaken = await checkIfTopicExists(req.body.name)

      if (isNameTaken) {
         // Topic name already taken.
         return res.status(409).send({ message: "Topic name is taken" });
      }

      // Get loggedin user data from JWT token
      const jwtToken = Token(req)
      const loggedInUserId = TokenDecoded(req).user_id

      const topic = new Topic({
         name: req.body.name,
         owner_id: loggedInUserId
      })

      const savedTopic = await topic.save()
      res.status(201).send(savedTopic)
   },
   all: async (req, res) => {
      LOGGER.log("Get all topics", req)
      try {
         const topics = await Topic.find()
         return res.status(200).send(topics)
      } catch (err) {
         return res.status(409).send({ message: err })
      }
   },
   one: async (req, res) => {
      LOGGER.log("Get one topic. ID: " + req.params.topicId, req)
      try {
         const foundTopic = await Topic.findById(req.params.topicId)
         if (foundTopic != null) {
            return res.status(200).send(foundTopic)
         }
         return res.status(404).send({ message: "Topic id not found" })
      } catch (err) {
         LOGGER.log("ERROR. Get one topic. ID: " + req.params.topicId + ", error: " + err, req)
         return res.status(409).send({ message: "Error while retrieving topic with id: " + req.params.topicId })
      }
   },
   deleteAll: async (req, res) => {
      LOGGER.log("Deleting all topics", req)
      Topic.deleteMany({}, () => {
         LOGGER.log('All topics were deleted', req)
      })
      res.status(200).send({ message: "All topics deleted" })
   },
   delete: async (req, res) => {
      const topicId = req.params.topicId
      LOGGER.log("Attempt to delete topic id: DELETE /topics/" + topicId, req)
      try {
         const topic = await Topic.findById(topicId);
         // Check if user own topic or is admin.
         if (!authOwner(topic.owner_id, req)) {
            LOGGER.log("Unauthorised access: DELETE topics/" + topicId, req)
            return res.status(403).send({ message: "Unauthorized access" })
         }
      } catch (err) {
         LOGGER.log("ERROR: " + err, req)
         return res.status(409).send({ message: "ERROR: Can't delete topic" })
      }

      try {
         Topic.deleteOne({ _id: topicId }, () => {
            LOGGER.log("topic deleted: DELETE topics/" + topicId, req)
         })

         return res.status(200).send({ message: "topic deleted : " + topicId })
      } catch (err) {
         LOGGER.log("Error deleting topic : DELETE topics/" + topicId, req)
         return res.status(409).send({ message: "Error deleting topic " + topicId })
      }
   },
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
