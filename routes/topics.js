/**
 *  Author: Seweryn Michota
 *  Date: October 2023
 */
const express = require('express')
const router = express.Router()

const {topicValidation} = require('../validators/validation');
const {Token, TokenDecoded} = require('../utils/Token');
const {authUser, authRole, authOwner} = require('../verifyToken') // Verify JWT Tokens
const Logger = require('../utils/Logger');
const LOGGER = new Logger();

const Topic = require('../models/Topic')

/* 
*   GET All topics
*/
router.get('/', async (req, res) => {
    LOGGER.log("Get all topics", req)
    try {
        const topics = await Topic.find()
        return res.status(200).send(topics)
    } catch (err) {
        return res.status(409).send({message:err})
    }
})

/* 
*   POST. Add topic
*   Example JSON payload:
    {
        "name": "Kittens"
    }
*/
router.post('/',  async (req, res) => {
    // Validate item data
    const {error} = topicValidation(req.body)
    if(error) {
        return res.status(500).send({message: error['details'][0]['message']})
    }
    const isNameTaken = await checkIfTopicNameAlreadyTaken(req.body.name)

    if (isNameTaken) {
        // Topic name already taken.
        return res.status(409).send({message: isNameTaken });
    }

    // // Get loggedin user data from JWT token
    // const jwtToken = Token(req)
    // const loggedInUserId = TokenDecoded(req).user_id
 
    const topic = new Topic({
        name: req.body.name
    })

    const savedTopic = await topic.save()
    res.status(201).send(savedTopic)
})

/* 
*   GET One topic
*/
router.get('/:topicId', authUser, async (req, res) => {
    try {
        const foundTopic = await Topic.findById(req.params.topicId)
        return res.status(200).send(foundTopic)
    } catch (err) {
        return res.status(409).send({message: "Topic id not found"})
    }
})


const checkIfTopicNameAlreadyTaken = async (findName) => {
    return await Topic.findOne({
        name: findName
    }).then(foundTopic => {
        if(foundTopic) {
            let message = {};
            if(foundTopic.name === findName) {
                message =  "Topic name taken"
            }
            return message;
        }
        return false;
    });
}

module.exports = router