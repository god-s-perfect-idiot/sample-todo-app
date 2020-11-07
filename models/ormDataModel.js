const Sequelize = require('sequelize')
const db = require('../config/database')
 
db.authenticate()
.then(() => {
    console.log('Connected')
})
.catch((err) => {
    console.log(err)
})

const todo = db.define('todo',{
    todo_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    todo_body: {
        type: Sequelize.STRING,
        allowNull:false
    },
    todo_checked: {
        type: Sequelize.BOOLEAN,
        allowNull:false
    }
},{
   tableName: 'todotable',
   timestamps: false     
})

module.exports = todo