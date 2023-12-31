import { createNote } from "./note";

function createNoteManager() {

    const getNoteFromStorage = (id) => {
        const note = JSON.parse(localStorage.getItem(`note-${id}`));        
        return note
    }

    const getAllNotes = () => {
        const allNotes = [];
        const keys = Object.keys(localStorage);
        for (let i = 0; i < keys.length; i++) {
            if (keys[i].includes("note-")) {
                allNotes.push(JSON.parse(localStorage.getItem(keys[i])));
            }
        }
        return allNotes;
    }

    const createAndSaveNote = (title, details) => {
        let id = localStorage.getItem('noteIdCount');
        if (!id) {
            localStorage.setItem('noteIdCount', 0);
            id = 0;
        } else {
            id++;
            // Double check to not allow duplicate id's
            if (localStorage.getItem(`note-${id}`)) {
                console.log("A note with that id already exists!");
                return
            }
            localStorage.setItem('noteIdCount', id);
        }
        const newNote = createNote(id, title, details);
        localStorage.setItem(`note-${id}`, JSON.stringify(newNote.getNote()));
        return newNote;
    }

    const editNote = (id, title, details) => {
        const noteValues = JSON.parse(localStorage.getItem(`note-${id}`));
        if (noteValues) {
            const editedNote = createNote(id, title, details);
            localStorage.setItem(`note-${id}`, JSON.stringify(editedNote.getNote())); 
            return 
        }
        console.log("This note does not exist!");
    }

    const deleteNote = (idOfNoteToDelete) => {
        if (localStorage.getItem(`note-${idOfNoteToDelete}`)) {
            localStorage.removeItem(`note-${idOfNoteToDelete}`);
            return
        }
        console.log('This note does not exist!');
    }

    // PubSub Subscriptions
    const listenForCreatedNotes = PubSub.subscribe('createNote', function(topicName, requestType) {
        const newNote = createAndSaveNote(requestType.title, requestType.details);
        PubSub.publishSync('assignNote', newNote.getNote());
    });
    const listenForEditedNotes = PubSub.subscribe('editNote', function(topicName, requestType) {
        editNote(requestType.id, requestType.title, requestType.details);
    });
    const listenForDeletedNotes = PubSub.subscribe('deleteNote', function(topicName, id) {
        deleteNote(id);
    });
    const listenForRequestedNotes = PubSub.subscribe('requestNote', function(topicName, id) {
        const note = getNoteFromStorage(id);
        PubSub.publishSync('sendNote', note);
    });
    const listenForRequestedAllNotes = PubSub.subscribe('requestAllNotes', function(topicName) {
        const allNotes = getAllNotes();
        PubSub.publishSync('sendAllNotes', allNotes);
    });
}

export { createNoteManager }