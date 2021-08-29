
const express = require('express')
const router = express.Router()
const get = require('../Handlers/get')

router.get('/example', get.example)

module.exports = router