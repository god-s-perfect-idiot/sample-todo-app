const { response } = require('express')
const todo = require('../models/ormDataModel')

//const dataModel = require('../models/dataModel')
const ormModel = require('../models/ormDataModel')

exports.fetchToDos = (req, res, next) => {
    const todos = ormModel.findAll()
    todos.then(todolist => {
        console.log(todolist)
        const data = []
        for(const todo in todolist){
            console.log(todolist[todo].dataValues)
            
            todolist[todo].dataValues.holder = todolist[todo].dataValues.todo_id + 'Holder'
            data.push(todolist[todo].dataValues)
        }
         res.status(200).json(data)
    })
}

 exports.addToDo = (req, res, next) => {
    todo_body = req.body.todo_body
    ormModel.create({
        todo_body: todo_body,
        todo_checked: false
    })
    .then(() => {     
            console.log("Entry Added!")
            res.status(200).json(todo_body+" Added!")
    })
    .catch(err => {
        console.log(err)
    })
 }

 exports.updateToDos = (req, res, next) => {
    todo_status = req.body.todo_status
    todo_ID = req.body.todo_id
    ormModel.update({todo_checked:todo_status},{
        where:{
            todo_id:todo_ID
        }
    }).then(() => {
        res.status(200).json(todo_id+' Updated!')
    })
 }


 // exports.addToDo = (req, res, next) => {
//     todo_body = req.body.todo_body
//     dataModel.addToDo(todo_body, false)

//     res.status(200).json(req.body.todo+" Added!")
// }

// exports.fetchToDos = (req, res, next) => {
//     const todos = dataModel.fetchToDos()
//     todos.then(todolist => {
//         for (let todo in todolist){
//             todolist[todo].holder = todolist[todo].todo_id + 'Holder'
//         }
//         res.status(200).json(todolist)
//     })
// }

// exports.updateToDos = (req, res, next) => {
//     todo_status = req.body.todo_status
//     todo_id = req.body.todo_id
//     dataModel.updateToDo(todo_id, todo_status)
//     res.status(200).json(todo_id+' Updated!')
// }
