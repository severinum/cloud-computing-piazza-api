/**
 *  Author: Seweryn Michota
 *  Date: October 2023
 */

const Logger = require('../utils/Logger');
const LOGGER = new Logger();
const bcryptjs = require('bcryptjs')
const jsonwebtoken = require('jsonwebtoken')
const { registerValidation, loginValidation } = require('../validators/validation');

const User = require('../models/User');

module.exports = {
  register: async (req, res) => {
    // Validate request data
    let { error } = registerValidation(req.body);
    if (error) {
      res.status(400).send({ message: error['details'][0]['message'] });
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
        return res.status(409).send({ message: accountRegisteredMessage });
      }

      try {
        // Save user
        const savedUser = await user.save();
        res.status(201).send(savedUser);
      } catch (err) {
        return res.status(500).send({ message: err });
      }

    }
  },
  login: async (req, res) => {
    LOGGER.log("Login attempt for: " + req.body.email, req)
    // Validate request data
    let { error } = loginValidation(req.body);
    if (error) {
      res.status(400).send({ message: error['details'][0]['message'] });
    }

    // Validate if user exists
    const userExists = await User.findOne({ email: req.body.email });
    if (!userExists) {
      return res.status(400).send({ message: "User does not exist" });
    }

    // Do not allow users with inactive accounts
    if (userExists.active === false) {
      return res.status(401).send({ message: "Inactive account" })
    }

    // Validate password
    const passwordValidation = await bcryptjs.compare(req.body.password, userExists.password);
    if (!passwordValidation) {
      return res.status(409).send({ message: "Invalid password" });
    }

    // Generate auth-token
    const token = jsonwebtoken.sign(
      {
        user_id: userExists._id,
        user_roles: userExists.roles,
        user_username: userExists.username

      },
      process.env.TOKEN_SECRET,
      {
        expiresIn: process.env.TOKEN_EXPIRY_TIME,
        algorithm: 'HS512'
      }
    );

    return res.header('Authorization', 'Bearer ' + token).send({ 'token': token })
  },
  getAll: async (req, res) => {
    try {
      const users = await User.find().populate("activities")
      return res.status(200).send(users)
    } catch (err) {
      return res.status(404).send({ message: "Not found" })
    }
  },
  getOne: async (req, res) => {
    LOGGER.log("Get one user with id: " + req.params.userId, req)
    try {
      const user = await User.findById(req.params.userId, { password: 0 }).populate("posts").populate("activities")
      return res.status(200).send(user)
    } catch (err) {
      LOGGER.log("ERROR. Get user with id :" + req.params.userId +
        ", ERROR: " + err, req)
      return res.status(409).send({ message: "Error when getting user" })
    }
  },
  delete: async (req, res) => {
    const userId = req.params.userId
    LOGGER.log("Attempt to delete user id: DELETE /users/" + userId, req)
    // Check if user exists.
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(403).send({ message: "Not found" })
      }
    } catch (err) {
      return res.status(403).send({ message: "ERROR: Can't find user, ERROR:" + err })
    }

    try {
      User.deleteOne({ _id: userId }, () => {
      })
      LOGGER.log("User deleted: DELETE users/ " + userId, req)
      res.status(200).send({ message: "User deleted : " + userId })
    } catch (err) {
      LOGGER.log("Error deleting user : DELETE users/" + userId, req)
      res.status(409).send({ message: "Error deleting user " + userId })
    }
  },
  deleteAll: async (req, res) => {
    LOGGER.log("Deleting all users", req)
    try {
      User.deleteMany({}, () => {
        LOGGER.log('All users were deleted', req)
      })
    } catch (err) {
      LOGGER.log("ERROR. Can't delete all users. ERROR: " + err, req)
      return res.status(404).send({ message: "Can't delete all users" })
    }
    res.status(200).send({ message: "All users deleted" })
  },
  find: async (req, res) => {
    // Check if username of email is already taken. If so, refuse to register new user.
    LOGGER.log("Searching for a user: $post USER /users/find username: " + req.body.username + " , email: " + req.body.email, req)
    const user = await findUser(req.body.username, req.body.email);
    const userDto = userToUserDTO(user)
    if (user) {
      // User found
      LOGGER.log("User found", req)
      return res.status(200).send(userDto);
    }
    LOGGER.log("User not found", req)
    return res.status(404).send({ message: 'User not found' })
  },
  update: async (req, res) => {
    try {
      const user = await User.findById(req.params.userId)
      Object.assign(user, req.body)
      user.save();
      return res.status(200).send(user)
    } catch (err) {
      return res.status(404).send({ message: 'User not found' })
    }
  }
}

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
    if (foundUser) {
      let message = {};
      if (username === foundUser.username) {
        message = "Username is taken";
      }
      if (email === foundUser.email) {
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
    if (foundUser) {
      return foundUser
    }
    return false;
  });
}