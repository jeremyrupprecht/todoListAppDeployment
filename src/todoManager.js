import { createTodo } from "./todo";
import { PubSub } from 'pubsub-js';
import { format, startOfToday, startOfWeek, endOfWeek } from 'date-fns';

function createTodoManager() {

    const getTodoFromStorage = (id) => {
        const todo = JSON.parse(localStorage.getItem(`todo-${id}`));
        return todo
    }

    const getAllTodos = () => {
        const allTodos = []
        const keys = Object.keys(localStorage);
        for (let i = 0; i < keys.length; i++) {
            if (keys[i].includes("todo-")) {
                allTodos.push(JSON.parse(localStorage.getItem(keys[i])));
            }
        }
        return allTodos;
    }

    const getAllTodosDueToday = () => {
        const allTodos = getAllTodos();
        const today = format(startOfToday(), 'yyyy-MM-dd');
        const allTodosDueToday = [];
        for (let i = 0; i < allTodos.length; i++) {
            if (today == allTodos[i].dueDate) {
                allTodosDueToday.push(allTodos[i]);
            }
        }
        return allTodosDueToday;
    }

    const getAllTodosDueThisWeek = () => {
        const allTodos = getAllTodos();
        const allTodosDueThisWeek = [];
        const weekStart = format(startOfWeek(startOfToday()), 'yyyy-MM-dd');
        const weekEnd = format(endOfWeek(startOfToday()), 'yyyy-MM-dd');

        for (let i = 0; i < allTodos.length; i++) {
            if (weekStart < allTodos[i].dueDate && 
                allTodos[i].dueDate < weekEnd) {
                allTodosDueThisWeek.push(allTodos[i]);
            }
        }
        return allTodosDueThisWeek;
    }
    
    const getTodosOfThisProject = (projectId) => {
        const retrievedIds = JSON.parse(localStorage.getItem(`project-${projectId}`)).todoIds;
        const todosToReturn = [];
        for (let i = 0; i < retrievedIds.length; i++) {
            todosToReturn.push(JSON.parse(localStorage.getItem(`todo-${retrievedIds[i]}`)));
        }
        return todosToReturn;
    }

    const getUnfinishedTodosOfThisProject = (projectId) => {
        const retrievedIds = JSON.parse(localStorage.getItem(`project-${projectId}`)).todoIds;
        const todosToReturn = [];
        for (let i = 0; i < retrievedIds.length; i++) {
            const retrievedTodo = JSON.parse(localStorage.getItem(`todo-${retrievedIds[i]}`))
            if (!retrievedTodo.isFinished) {
                todosToReturn.push(retrievedTodo)
            }
        }
        return todosToReturn;
    }

    const createAndSaveTodo = (title, details, dueDate, priority, isFinished, parentProjectId) => {
        // Give the todo an id (this id does not decrease if a todo is 
        // deleted, to prevent duplicate ids)
        let id = localStorage.getItem('todoIdCount');
        if (!id) {
            localStorage.setItem('todoIdCount', 0);
            id = 0;
        } else {
            id++;
            // Double check to not allow duplicate id's
            if (localStorage.getItem(`todo-${id}`)) {
                console.log("A todo with that id already exists!");
                return
            }
            localStorage.setItem('todoIdCount', id);
        }
        const newTodo = createTodo(id, title, details, dueDate, priority, isFinished, parentProjectId);
        localStorage.setItem(`todo-${id}`, JSON.stringify(newTodo.getTodo())); 
        return newTodo;
    }

    const editTodo = (idOfTodoToEdit, title, details, dueDate, priority) => {
        const todoFromStorage = JSON.parse(localStorage.getItem(`todo-${idOfTodoToEdit}`));

        if (todoFromStorage) {
            const editedTodo = createTodo(idOfTodoToEdit, title, details, dueDate, 
                                          priority, todoFromStorage.isFinished,
                                          todoFromStorage.parentProjectId);
            localStorage.setItem(`todo-${idOfTodoToEdit}`, JSON.stringify(editedTodo.getTodo())); 
            return editedTodo;
        }
        console.log("Error editing todo!");
    }

    const finishTodo = (idOfTodoToFinish, isFinished) => {
        const todoValues = JSON.parse(localStorage.getItem(`todo-${idOfTodoToFinish}`));
        if (todoValues) {
            const editedTodo = createTodo(todoValues.id, todoValues.title, 
                                          todoValues.details, todoValues.dueDate,
                                          todoValues.priority, isFinished, 
                                          todoValues.parentProjectId);
            localStorage.setItem(`todo-${idOfTodoToFinish}`, JSON.stringify(editedTodo.getTodo())); 
        }
    }

    const deleteTodo = (idOfTodoToDelete) => {
        if (localStorage.getItem(`todo-${idOfTodoToDelete}`)) {
            // Publish todo deletion to project manager
            PubSub.publishSync('removeTodoReferenceFromProject', idOfTodoToDelete);
            localStorage.removeItem(`todo-${idOfTodoToDelete}`);
            return
        }
        console.log('This todo does not exist!');
    } 

    // Called WHENEVER a project is deleted --> all of it's todos are deleted as well
    const deleteAllTodosForThisProject = (projectId) => {
        const todos = getTodosOfThisProject(projectId); 
        for (let i = 0; i < todos.length; i++) {
            localStorage.removeItem(`todo-${todos[i].id}`);
        }
    }

    // PubSub Subscriptions
    const listenForDeletedProjects = PubSub.subscribe('deleteProject', function(topicName, idOfProjectToDelete) {
        deleteAllTodosForThisProject(idOfProjectToDelete);
    });
    
    const listenForCreatedTodos = PubSub.subscribe('createTodo', function(topicName, todoValues) {
        const newTodo = createAndSaveTodo(todoValues.title, todoValues.details, todoValues.dueDate,
                          todoValues.priority, todoValues.isFinished, 
                          todoValues.parentProjectId);
        // Publish todo creation to project manager and publish todo id back
        // to the dom manager (to link the DOM element and todo together)
        PubSub.publishSync('addTodoReferenceToProject', newTodo.getTodo().id);
        PubSub.publishSync('assignTodo', newTodo.getTodo());
    });

    const listenForFinishedTodos = PubSub.subscribe('finishTodo', function(topicName, requestType) {
        finishTodo(requestType.id, requestType.finished);
    });

    const listenForDeletedTodos = PubSub.subscribe('deleteTodo', function(topicName, todoId) {
        deleteTodo(todoId);
    });

    const listenForEditedTodos = PubSub.subscribe('editTodo', function(topicName, todoValues) {
        const editedTodo = editTodo(todoValues.id, todoValues.title, todoValues.details,
                                    todoValues.dueDate, todoValues.priority);
        if (editTodo) {
            PubSub.publishSync('renderEditedTodo', editedTodo.getTodo());
        }
    });

    const listenForRequestedTodo = PubSub.subscribe('requestTodo', function(topicName, todoId) {
        const todo = getTodoFromStorage(todoId);
        PubSub.publishSync('sendTodo', todo);
    });

    const listenForRequestedTodosOfAProject = PubSub.subscribe('requestTodosOfProject', function(topicName, projectId) {
        const todosToReturn = getTodosOfThisProject(projectId)
        PubSub.publishSync('sendTodosOfProject', todosToReturn);
    });

    const listenForRequestedTodosForToday = PubSub.subscribe('requestTodosOfToday', function(topicName, requestType) {
        let todos = getAllTodosDueToday();
        if (requestType.type == 'unfinished') {
            todos = todos.filter((todo) => !todo.isFinished);
            PubSub.publishSync('sendUnfinishedTodosOfToday', todos);
            return 
        } 
        PubSub.publishSync('sendTodosOfToday', todos);
    });

    const listenForRequestedTodosForThisWeek = PubSub.subscribe('requestTodosOfThisWeek', function(topicName, requestType) {
        let todos = getAllTodosDueThisWeek();
        if (requestType.type == 'unfinished') {
            todos = todos.filter((todo) => !todo.isFinished);
            PubSub.publishSync('sendUnfinishedTodosOfThisWeek', todos);
            return 
        } 
        PubSub.publishSync('sendTodosOfThisWeek', todos);
    });

    const listenForRequestedUnfinishedTodosOfAProject = PubSub.subscribe('requestUnfinishedTodosOfThisProject', (topicName, projectId) => {
        const todos = getUnfinishedTodosOfThisProject(projectId);
        PubSub.publishSync('sendUnfinishedTodos', todos);
    });

    // Don't need to return any methods as todo manager only interacts with 
    // other modules through publishing and subscribing
}

export { createTodoManager }