/**
 *  Author: Seweryn Michota
 *  Date: October 2023
 */
const express = require('express')
const router = express.Router()

const {topicValidation} = require('../validators/validation');

const Logger = require('../utils/Logger');
const LOGGER = new Logger();

/* 
*   GET All topics
*/
router.get('/', async (req, res) => {
    LOGGER.log("Get all topics", req)
    try {
        const items = await Item.find()
        return res.status(200).send(items)
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
    // Get loggedin user data from JWT token
    const jwtToken = Token(req)
    const loggedInUserId = TokenDecoded(req).user_id
 
    const item = new Item({
        name: req.body.name,
        condition: req.body.condition,
        description: req.body.description,
        owner_id: loggedInUserId,
        initial_price: req.body.initial_price
    })

    const savedItem = await item.save()
    res.status(201).send(savedItem)
})

module.exports = router