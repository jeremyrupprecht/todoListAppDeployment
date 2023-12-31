import { createProject } from "./project";
import { PubSub } from 'pubsub-js';

function createProjectManager() {

    const getProjectFromStorage = (id) => {
        const projectValues = JSON.parse(localStorage.getItem(`project-${id}`));
        if (projectValues) {
            const projectToReturn = createProject(projectValues.id, 
                                    projectValues.title, projectValues.todoIds);
            return projectToReturn;
        }
        console.log("Project does not Exist!");
        return null
    }

    const getAllProjects = () => {
        const allProjects = [];
        const keys = Object.keys(localStorage);
        for (let i = 0; i < keys.length; i++) {
            if (keys[i].includes("project-")) {
                allProjects.push(JSON.parse(localStorage.getItem(keys[i])));
            }
        }
        return allProjects;
    }

    // Called WHENEVER a todo is created (every todo must have a parent project)
    const addTodoToProject = (idOfTodoToAdd) => {
        const todoToAdd = JSON.parse(localStorage.getItem(`todo-${idOfTodoToAdd}`));
        const projectToBeAddedto = getProjectFromStorage(todoToAdd.parentProjectId);
        projectToBeAddedto.addTodo(todoToAdd.id);
        localStorage.setItem(`project-${projectToBeAddedto.getProject().id}`, JSON.stringify(projectToBeAddedto.getProject()));
    }
    
    // Called WHENEVER a todo is deleted (the parent's todo is reference must be deleted)
    const deleteTodoFromProject = (idOfTodoToDelete) => {
        const todoToDelete = JSON.parse(localStorage.getItem(`todo-${idOfTodoToDelete}`));
        const projectToBeDeletedFrom = getProjectFromStorage(todoToDelete.parentProjectId);
        projectToBeDeletedFrom.removeTodo(todoToDelete.id);
        localStorage.setItem(`project-${projectToBeDeletedFrom.getProject().id}`, JSON.stringify(projectToBeDeletedFrom.getProject()));
    }

    const createAndSaveProject = (title) => {
        // Give the project an id (this id does not decrease if a project is 
        // deleted, to prevent duplicate ids)
        let id = localStorage.getItem('projectIdCount');
        if (!id) {
            localStorage.setItem('projectIdCount', 0);
            id = 0;
        } else {
            id++;
            // Double check to not allow duplicate id's
            if (localStorage.getItem(`project-${id}`)) {
                console.log("A Project with that id already exists!");
                return
            }
            localStorage.setItem('projectIdCount', id);
        }
        const newProject = createProject(id, title, []);
        localStorage.setItem(`project-${id}`, JSON.stringify(newProject.getProject()));
        return newProject;
    }

    const editProjectTitle = (idOfProjectToEdit, title) => {
        const projectToEdit = getProjectFromStorage(idOfProjectToEdit);
        projectToEdit.setTitle(title);
        localStorage.setItem(`project-${projectToEdit.getProject().id}`, JSON.stringify(projectToEdit.getProject())); 
        return projectToEdit;
    }

    const deleteProject = (idOfProjectToDelete) => {
        localStorage.removeItem(`project-${idOfProjectToDelete}`);
    }

    // Listen for todo creations or deletions as the associated projects 
    // need to update their lists of todo references (for display later)
    const listenForCreatedTodos = PubSub.subscribe('addTodoReferenceToProject', function(topicName, idOfTodoToAdd) {
        addTodoToProject(idOfTodoToAdd);
    });

    const listenForDeletedTodos = PubSub.subscribe('removeTodoReferenceFromProject', function(topicName, idOfTodoToDelete) {
        deleteTodoFromProject(idOfTodoToDelete);
    });

    const listenForCreatedProjects = PubSub.subscribe('createProject', function(topicName, requestType) {
        const project = createAndSaveProject(requestType.title);
        PubSub.publishSync('sendNewProject', project);
    });

    const listenForRequestedAllProjects = PubSub.subscribe('requestAllProjects', (topicName) => {
        const allProjects = getAllProjects();
        PubSub.publishSync('sendAllProjects', allProjects);
    });

    const listenForRequestedProjects = PubSub.subscribe('requestProject', (topicName, requestType) => {
        const project = getProjectFromStorage(requestType.id);
        PubSub.publishSync('sendProject', project);
    });

    const listenForEditedProjects = PubSub.subscribe('editProject', function(topicName, requestType) {
        const project = editProjectTitle(requestType.id, requestType.title);
        PubSub.publishSync('sendEditedProject', project);
    });
    
    const listenForDeletedProjects = PubSub.subscribe('deleteProjectFromDOM', function(topicName, idOfProjectToDelete) {
        PubSub.publishSync('deleteProject', idOfProjectToDelete);
        deleteProject(idOfProjectToDelete);
    });

    // Don't need to return any methods as project manager only interacts with 
    // other modules through publishing and subscribing
}

export { createProjectManager }