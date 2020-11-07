<script>
import { text } from "svelte/internal";
import {createEventDispatcher} from "svelte"

const dispatch = createEventDispatcher()

let data={
    todo_body:""
}

const addToDoAPI = 'http://localhost:3000/addToDo'

let addToDo = async () => {

    if(data.todo_body.trim() === ''){
        return
    }
    
    const res = await fetch(`${addToDoAPI}`,{
        method: 'POST',
        headers:{
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)    
    })

    const post = res.json()
    dispatch("Entry Added!", post)

    let todoBox = document.getElementById('todoBox')
    todoBox.value = ''
}

</script>
<div class="container">
    <form on:submit|preventDefault={addToDo}>
        <div class="add-card row col-sm-12">
            <div class="todo-input">
                <input id='todoBox' autocomplete='off' type="text" bind:value={data.todo_body} class="input-card"/>
            </div>
            <div class='add-btn'>
                <button class='plus-btn' type="submit">+
                </button>
            </div>
        </div>
    </form>  
</div>


<style>
    
    .todo-input{
        text-align: right;
    }
    .add-btn{
        text-align: left;
    }
    .input-card{
        width: 400px;
        height:50px;
        border-top-left-radius: 15px;
        border-bottom-left-radius: 15px;
    }
    .input-card:focus, .plus-btn:focus{
        outline:none;
    }
    .plus-btn{
        height: 50px;
        width: 50px;
        border-top-right-radius: 15px;
        border-bottom-right-radius: 15px;
    }
</style>