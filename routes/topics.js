/**
 *  Author: Seweryn Michota
 *  Date: October 2023
 */
const express = require('express')
const router = express.Router()
const { authUser, authRole } = require('../verifyToken') // Verify JWT Tokens

const TopicController = require("../controllers/TopicController")

router.post('/', authUser, authRole("admin"), TopicController.create)
router.get('/', authUser, TopicController.all)
router.get('/:topicId', authUser, TopicController.one)
router.delete("/all", authRole("admin"), TopicController.deleteAll)
router.delete("/:topicId", authRole("admin"), TopicController.delete)

module.exports = router