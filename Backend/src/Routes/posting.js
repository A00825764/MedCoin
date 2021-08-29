
const express = require('express')
const router = express.Router()
const post = require('../Handlers/post')

router.post('/example', post.example)

module.exports = router