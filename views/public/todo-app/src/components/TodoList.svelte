<script>
    import {onMount} from 'svelte'
    import AddTodo from './AddTodo.svelte'

    let data = {
        todo_id: '',
        todo_status: ''
    }
   
    const updateToDoAPI = 'http://localhost:3000/updateToDO'
    const todolistAPI = 'http://localhost:3000/'

    let todos = []

    onMount(async () => {
        let res = await fetch(todolistAPI)
        todos = await res.json()
        console.log(todos)
    })

    const updateUI = (event) => {
        let pendingBlock = document.getElementById('pending')
        let completeBlock = document.getElementById('completed')
        let current = document.getElementById(event.target.id+'Holder')
        current.remove()
        if(event.target.checked === true){
            completeBlock.innerHTML += current.innerHTML
        }
        else{
            console.log(false)
        }
    }

    const change = async (event) => {
        data.todo_id = event.target.id
        data.todo_status = event.target.checked

         let s = document.getElementById(data.todo_id)
         data.todo_status =  s.checked
        

         const res = await fetch(`${updateToDoAPI}`,{
             method: 'POST',
             headers: {
                 'Content-Type' : 'application/json'
             },
             body: JSON.stringify(data)
         })

         const post = res.json()
         updateUI(event)
    }

    

</script>

<div class="container app-card">
    <div class='app-title'>
        <p>To Do App<p>
    </div>
    <div class="container todo-list">
        <div class="add-card">
            <AddTodo/>
        </div>
        <div class="todos">
            <div class='title'>
                <p>Pending:<p>
            </div>
            <div id='pending'>
                {#each todos as todo}
                    {#if todo.todo_checked === false}
                    <div class="container" id={todo.holder}>
                        <div class="row">
                            <div class="todo col-sm-12">
                                <div class="todo-card" >
                                    <label class="content" for='check'>
                                        <input id={todo.todo_id} type="checkbox" checked={todo.todo_checked} on:click='{event => change(event)}'/>{todo.todo_body}
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/if}
                {/each}
            </div>
        </div>
        <div>
            <div class='title'>
                <p>Completed:<p>
            </div>
            <div id='completed'>
                {#each todos as todo}
                    {#if todo.todo_checked === true}
                    <div class="container" id={todo.holder}>
                        <div class="row done">
                            <div class="todo col-sm-12">
                                <div class="todo-card">
                                    <label class="content done" for='check'>
                                        <input id={todo.todo_id} type="checkbox" checked={todo.todo_checked} on:click='{event => change(event)}'/>{todo.todo_body}
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/if}
                {/each}
            </div>
        </div>
    </div>
</div>



<style>
    .app-title{
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        font-size:x-large;
        text-align:left;
        margin-bottom: 50px;
    }
    .app-card{
        position:absolute;
        top:15%;
        left:30%;
    }
    .title{
        margin-top: 20px;
        font-size: larger;
        font-weight:bolder;
    }
    .done{
        text-decoration: line-through;
    }
    .todo-list{
        position: relative;
        margin: 0 auto;
        padding-left: 5%;
    }
    .todos{
        margin-top: 30px;
    }
    .add-card{
        margin-top: 30px;
    }
    .todo{
        margin-bottom: 5x;
        font-size: large;
    }
    .todo-card{
        max-width: 500px;
    }
    .content{
        width: 450px;
        overflow: hidden;
        display: inline-block;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    input[type='checkbox']{
        vertical-align: middle;
        margin-right:20px;
    }
</style>