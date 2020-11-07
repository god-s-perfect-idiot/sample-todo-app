const path = require('path')
const cors = require('cors')
const express = require('express')
const bodyparser = require('body-parser')

const routes = require('./routes/router')

const app = express()

app.use(cors())

app.use(bodyparser.urlencoded({extended: false}))
app.use(bodyparser.json())

app.use(routes)

app.listen(3000)