
const express = require('express')
const app = express()
const routes = require('./src/Routes/router')

app.use(express.urlencoded({extended: false}))
app.use(express.json());
routes(app)

app.listen(4000, () => {
    console.log('Started on PORT ', 4000)
})