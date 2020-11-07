const {Client} = require('pg')


const connect = () => {
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'tododb',
        password: '8594',
        port: 5432
    })
    
    client.on('error', (err, client) => {
        console.error('Error: ',err);
    })
    client.connect()
    return client
}

const createTable = async () => {

    const client = connect()
    let passed = true

    const query = 
    `CREATE TABLE IF NOT EXISTS 
    todotable(
        todo_id SERIAL PRIMARY KEY,
        todo_body TEXT NOT NULL,
        todo_checked BOOLEAN NOT NULL
    );`

    try{
        const res = await client.query(query)
        console.log("Table created!")
    }
    catch (err){
        passed = false
    }
    finally{
        client.end()
    }
    return passed

}

exports.addToDo = (todo_body, todo_checked) => {

    const passed = createTable()
    const client = connect()

    passed.then( async (res) => {
        if(res === true){
            
            const query = 
            `INSERT INTO todotable
            (todo_body, todo_checked)
            VALUES
            ('${todo_body}',${todo_checked});`

            try{
                const res = await client.query(query)
                console.log('Entry added!')
            }
            catch(err){
                console.log(err)
            }
            finally{
                client.end()
            }

        }
    })
    
}

exports.fetchToDos = () => {

    const passed = createTable()
    const client = connect()
    let response = []

    response = passed.then( async (res) => {
        if(res === true){
            
            const query = 
            `SELECT * FROM todotable;`

            try{
                const res = await client.query(query)
                response = [...res.rows]
            }
            catch(err){
                console.log(err)
            }
            finally{
                client.end()
            }
        }
        return response
    })

    return response
} 

exports.updateToDo = async (todo_id, todo_status) => {

    const client = connect()
    
    const query = 
    `UPDATE todotable
    SET todo_checked = ${todo_status}
    WHERE todo_id = ${todo_id}`

    try{
        const res = await client.query(query)
        console.log('Updation successful!')
    }
    catch(err){
        console.log(err)
    }
    finally{
        client.end()
    }

}
