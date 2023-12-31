import './style.css';
import {format} from 'date-fns';
import { createTodoManager } from './todoManager';
import { createProjectManager } from './projectManager';
import { createNoteManager } from './noteManager';
import { renderScreen, setupListeners} from './domManager';

function preloadTodoData() {
    // Need to load template todos if there are none (like when the user first
    // opens the site) 
    if (!localStorage.getItem('todoIdCount')) {
        console.log("Empty local storage detected, preloading todo data...");

        const date0 = format(new Date(2023, 11, 21), 'yyyy-MM-dd');
        const date1 = format(new Date(2023, 11, 20), 'yyyy-MM-dd');
        const date2 = format(new Date(2023, 11, 16), 'yyyy-MM-dd');
        const date3 = format(new Date(2023, 11, 24), 'yyyy-MM-dd');

        // Set up a loop for these
        const values0 = {title: 'Brush Teeth', details: 'Remember to floss', dueDate: date0, 
        priority: 'high', isFinished: false, parentProjectId: 0};
        PubSub.publishSync('createTodo', values0);

        const values1 = {title: 'Get Dressed', details: 'Socks are downstairs', dueDate: date1, 
        priority: 'medium', isFinished: false, parentProjectId: 0};
        PubSub.publishSync('createTodo', values1);

        const values2 = {title: 'Feed the cat', details: 'He likes the chunky feed mix', dueDate: date2, 
        priority: 'low', isFinished: false, parentProjectId: 0};
        PubSub.publishSync('createTodo', values2);

        const values3 = {title: 'Get the mail', details: 'The key is in the upper kitchen cabinet by the toaster', dueDate: date3, 
        priority: 'low', isFinished: false, parentProjectId: 0};
        PubSub.publishSync('createTodo', values3);

        const values4 = {title: 'Go to the gym', details: 'Its a push day', dueDate: date3, 
        priority: 'low', isFinished: false, parentProjectId: 0};
        PubSub.publishSync('createTodo', values4);

    }
}

function preloadNoteData() {
    if (!localStorage.getItem('noteIdCount')) {
        console.log("Empty local storage detected, preloading note data...");

        const values0 = {title: 'Title', details: 'The title and details can be edited in place'};
        PubSub.publishSync('createNote', values0);
        
        const values1 = {title: 'Books', details: "Go buy some books they're pretty neat"};
        PubSub.publishSync('createNote', values1);
        
        const values2 = {title: 'Shopping list', details: 'butter<br>milk<br>eggs<br>cheese'};
        PubSub.publishSync('createNote', values2);

        const values3 = {title: 'Example note', details: 'example<br>with<br>lots<br>of<br>lines'};
        PubSub.publishSync('createNote', values3);

        const values4 = {title: 'Another example note', details: 'example<br><br>with<br><br>lines<br><br>aswell'};
        PubSub.publishSync('createNote', values4);

        const values5 = {title: 'One more example note', details: 'with<br><br><br>more<br><br><br>lines'};
        PubSub.publishSync('createNote', values5);
    }
}

function createDefaultProjects() {
    if (!localStorage.getItem('projectIdCount')) {
        PubSub.publishSync('createProject', {title: 'Home'});        
        PubSub.publishSync('createProject', {title: 'Today'});
        PubSub.publishSync('createProject', {title: 'Week'});
    }
}

createTodoManager();
createProjectManager();
createNoteManager();

createDefaultProjects();
preloadTodoData();
preloadNoteData();
renderScreen();
setupListeners();
