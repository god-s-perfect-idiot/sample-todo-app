const express = require('express')

const router = express.Router()

const appDriver = require('../controllers/appDriver')

router.post("/addToDo", appDriver.addToDo)
router.get("/", appDriver.fetchToDos)
router.post("/updateToDo", appDriver.updateToDos)

module.exports = router