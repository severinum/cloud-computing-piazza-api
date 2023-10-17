/**
 *  Author: Seweryn Michota
 *  Date: October 2023
 */
const express = require('express');
const bcryptjs = require('bcryptjs')
const jsonwebtoken = require('jsonwebtoken')
const dotenv = require('dotenv')

const User = require('../models/User');
const {authUser, authRole} = require('../verifyToken') // Verify JWT Tokens
const {registerValidation, loginValidation} = require('../validators/validation');
const Logger = require('../utils/Logger');
const LOGGER = new Logger();

const router = express.Router();

/* 
*   POST. User registration
*   Example JSON payload:
    {
        "username": "Admin name",
        "email" :"admin@email.com",
        "password" : "adminPasswordHere",
        "roles": ["admin", "audit", "user"," analytics"]
    }
*/
router.post('/register',  async (req, res) => {
    // Validate request data
    let {error} = registerValidation(req.body);
    if(error) {
        res.status(400).send({message: error['details'][0]['message']});
    } else {

        const salt = await bcryptjs.genSaltSync(5);
        const hashedPassword = await bcryptjs.hash(req.body.password, salt);

        // Register User
        const user = new User({
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword,
            roles: req.body.roles
        });

        // Check if username of email is already taken. If so, refuse to register new user.
        const accountRegisteredMessage = await doesAccountExists(user.username, user.email);
        if (accountRegisteredMessage) {
            // Username or email has been already registred.
            return res.status(409).send({message: accountRegisteredMessage });
        } 
        
        try {
            // Save user
            const savedUser = await user.save();
            res.status(201).send(savedUser);
        } catch (err) {
            return res.status(500).send({message:err});
        }
        
    }    
});

/* 
*   POST. User login
*   Example JSON Payload:
    {
    "email" :"my@email.com",
    "password" : "myPasswordHere"
    }
*/
router.post('/login',  async (req, res) => {
    LOGGER.log("Login attempt for: " + req.body.email , req)
    // Validate request data
    let {error} = loginValidation(req.body);
    if(error) {
        res.status(400).send({message: error['details'][0]['message']});
    } 

    // Validate if user exists
    const userExists = await User.findOne({email: req.body.email});
    if (!userExists) {
        return res.status(400).send({message: "User does not exist"});
    }

    // Do not allow users with inactive accounts
    if (userExists.active === false) {
        return res.status(401).send({message: "Inactive account"})
    }

    // Validate password
    const passwordValidation = await bcryptjs.compare(req.body.password, userExists.password);
    if(!passwordValidation) {
        return res.status(409).send({message: "Invalid password"});
    }

    // Generate auth-token
    const token = jsonwebtoken.sign(
        {
            user_id:userExists._id, 
            user_roles: userExists.roles,
            user_username: userExists.username
            
        }, 
        process.env.TOKEN_SECRET,
        {
            expiresIn: process.env.TOKEN_EXPIRY_TIME,
            algorithm: 'HS512'
        }
        );
    
        return res.header('Authorization', 'Bearer ' + token).send({'token': token})

});

/* 
*   DELETE All users
*/
router.delete("/all", authUser, authRole("admin"), async (req, res) => {
    LOGGER.log("Deleting all users", req)
    try {
        User.deleteMany({}, () => {
            console.log('All users were deleted')
        })
    } catch(err) {
        LOGGER.log("ERROR. Can't delete all users. ERROR: " + err , req)
        return res.status(404).send({message: "Can't delete all users"})
    }
    res.status(200).send({message: "All users deleted"})
})

/* 
*   Delete user.
*   Only admin can delete user account.
*   This is done, soe the account can be deleted only on request
*/
router.delete('/:userId', authUser, authRole("admin"),  async (req, res) => {
    const userId = req.params.userId
    LOGGER.log("Attempt to delete user id: DELETE /users/" + userId , req)
    // Check if user exists.
    try {
        const user = await User.findById(userId);
    } catch (err) {
        return res.status(403).send({message: "Not found"})
    }
    
    try {
        User.deleteOne({_id: userId}, () => {
        })
        LOGGER.log("User deleted: DELETE users/ " + userId, req)
        res.status(200).send({message: "User deleted : " + userId})
    } catch(err) {
        LOGGER.log("Error deleting user : DELETE users/" + userId, req)
        res.status(409).send({message: "Error deleting user " + userId})
    }

})

/* 
*   GET All Users
*/
router.get('/', authUser, async (req, res) => {
    try {
        const users = await User.find()
        return res.status(200).send(users)
    } catch (err) {
        return res.status(404).send({message: "Not found"})
    }
})


/* 
*   Helper function. Its task is to check if username and email already exists in db.
*   Username and email must be unique within the system.
*/
const doesAccountExists = async (username, email) => { 
    return await User.findOne({
        $or: [{
            email: email
        }, {
            username: username
        }]
    }).then(foundUser => {
        if(foundUser) {
            let message = {};
            if(username === foundUser.username) {
                message = "Username is taken";
            } 
            if(email === foundUser.email) {
                message = "Email is taken";
            }
            return message;
        }
        return false;
    });
}

/* 
*   Helper function. Similar to 'doesAccountExists' but it returns user if found one.
*/
const findUser = async (username, email) => { 
    return await User.findOne({
        $or: [{
            email: email
        }, {
            username: username
        }]
    }).then(foundUser => {
        if(foundUser) {
            return foundUser
        }
        return false;
    });
}

/* 
*   POST. Used to find users by username and/or email
*/
router.post('/find', authUser, async (req, res) => {
    // Check if username of email is already taken. If so, refuse to register new user.
    LOGGER.log("Searching for a user: $post USER /users/find username: " + req.body.username + " , email: " + req.body.email  , req)
    const user = await findUser(req.body.username, req.body.email);
    const userDto = userToUserDTO(user)
    if (user) {
        // User found
        LOGGER.log("User found" , req)
        return res.status(200).send(userDto);
    }
    LOGGER.log("User not found" , req)
    return res.status(404).send({message: 'User not found'})
})

/* 
*   DTO object. Used to secure user sensitive data (ex. password)
*   Returned in find user request
*/
const userToUserDTO = (user) => {
    return {
        _id: user._id,
        username: user.username,
        email: user.email,
        roles: user.roles,
        active: user.active,
        penalties: user.penalties,
        date: user.date
    }
}

/* 
*   PATCH. Update User
*/
router.patch("/:userId", authUser, authRole('admin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
        Object.assign(user, req.body)
        user.save();
        return res.status(200).send(user)
    } catch (err) {
        return res.status(404).send({message: 'User not found'})
    }
})




module.exports = router;