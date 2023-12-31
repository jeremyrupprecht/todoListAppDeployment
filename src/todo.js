function createTodo(inputedId, title, details, dueDate, priority, isFinished, inputtedParentProjectId) {
    const todo = Object.create(todoPrototype);
    todo.id = inputedId;
    todo.title = title;
    todo.details = details;
    todo.dueDate = dueDate;
    todo.priority = priority;
    todo.isFinished = isFinished;
    todo.parentProjectId = inputtedParentProjectId;
    return todo;
}
    
const todoPrototype = {
    getTodo: function() {
        return {id: this.id, title: this.title, details: this.details, 
                dueDate: this.dueDate, priority: this.priority,
                isFinished: this.isFinished, parentProjectId: this.parentProjectId}
    },
}

export { createTodo }