
const express = require('express')
const router = express.Router()
const post = require('../Handlers/post')

router.post('/login', post.login)

module.exports = router