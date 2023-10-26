/**
 *  Author: Seweryn Michota
 *  Date: October 2023
 */
const express = require('express')
const { authUser, authRole, authOwner } = require('../verifyToken') // Verify JWT Tokens
const router = express.Router()

const PostController = require('../controllers/PostController');

router.post('/', authUser, PostController.create)
router.patch("/:postId", authUser, PostController.update)
router.get('/', authUser, PostController.findAll)
router.get('/:postId', authUser, PostController.findOne)
router.get('/topic/:topicName', authUser, PostController.postsByTopic)
router.get('/expired/:topicName', authUser, PostController.expiredTopicPosts)
router.get('/top/:topicName', authUser, PostController.getTopicTopPost)
router.delete('/all', authRole('admin'), PostController.deleteAll)
router.delete('/:postId', authRole('admin'), PostController.delete)

module.exports = router