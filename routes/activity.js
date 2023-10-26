/**
 *  Author: Seweryn Michota
 *  Date: October 2023
 */
const express = require('express')
const router = express.Router()
const {authUser, authRole, authOwner} = require('../verifyToken') // Verify JWT Tokens

const ActivityController = require('../controllers/ActivityController')

router.post('/', authUser, ActivityController.create)
router.get('/', authUser, ActivityController.all)
router.get('/likes', authUser,ActivityController.likes)
router.get('/dislikes', authUser,ActivityController.dislikes)
router.get('/comments', authUser,ActivityController.comments)
router.get('/:activityId', authUser, ActivityController.one)
router.delete('/all', authRole('admin'), ActivityController.deleteAll)
router.delete('/:activityId', authRole('admin'), ActivityController.delete)

module.exports = router