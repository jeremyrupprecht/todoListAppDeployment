function createNote(inputedId, title, details) {
    const note = Object.create(notePrototype);
    note.id = inputedId;
    note.title = title;
    note.details = details;
    return note;
}

const notePrototype = {
    getNote: function() {
        return {id: this.id, title: this.title, details: this.details}
    },
}

export { createNote }