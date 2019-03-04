import {
    LightningElement,
    api,
    track
} from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getToDos from '@salesforce/apex/ToDoApp.getToDos';
import deleteToDo from '@salesforce/apex/ToDoApp.deleteToDo';
import upsertToDo from '@salesforce/apex/ToDoApp.upsertToDo';

const columns = [{
        label: 'Done',
        fieldName: 'IsClosed',
        type: 'checkbox'
    },
    {
        label: 'Subject',
        fieldName: 'Subject',
    }
];

export default class ToDoApp extends LightningElement {
    @api recordId;
    @track todos;
    @track error;
    
    newToDo = { sobjectType: 'Task'};
    columns = columns;
    whatId;
    
    // init handler
    connectedCallback() {
        if (this.recordId) {
            this.whatId = this.recordId;
        }
        this.loadToDos();
    }

    loadToDos() {
        getToDos({whatId: this.whatId})
            .then(result => {
                this.todos = result;
            })
            .catch(error => {
                this.error = error;
            });
    }

    handleKeyUp(event) {
        if (event.keyCode === 13) {
            this.handleSave();
            event.target.value = '';
        }
    }
    
    handleNewToDoChange(event) {
        const field = event.target.name;
        this.newToDo[field] = event.target.value;
    }

    handleChange(event) {
        const field = event.target.name;
        let newToDo = this.todos.find(each => {
            return each.Id === event.currentTarget.dataset.itemId;
        });
        // copy it for editting
        newToDo = JSON.parse(JSON.stringify(newToDo));
        // when dealing with checkboxes you have to get the 'checked' property
        let val;
        if (event.target.type === 'checkbox') {
            val = event.target.checked;
        } else {
            val = event.target.value;
        }
        newToDo[field] = val;
        this.save(newToDo);
    }

    handleSave() {
        const newToDo = this.newToDo;
        this.save(newToDo, true);
    }

    save(newToDo, reset) {
        // we can't write to the IsClosed field, only the Status field
        newToDo.Status = newToDo.IsClosed ? 'Closed' : 'Open';
        delete newToDo.IsClosed;

        if (this.recordId) {
            newToDo.WhatId = this.recordId;
        }

        upsertToDo({newToDo})
            .then(() => {
                if (reset) {
                    this.newToDo = {
                        sobjectType: 'Task',
                        Subject: '',
                        IsClosed: false
                    }
                }
                // refresh the table
                this.loadToDos();
            })
            .catch(error => {
                this.showNotification({
                    variant: 'error',
                    title: 'Error',
                    message: error.body.message
                });
            });
    }

    showNotification(toastParams) {
        const toastEvent = new ShowToastEvent(toastParams);
        this.dispatchEvent(toastEvent);
    }

    handleDelete(event) {
        const recordId = event.currentTarget.dataset.itemId;
        deleteToDo({recordId})
            .then(() => {
                // refresh the table
                this.loadToDos();
            })
            .catch(error => {
                this.showNotification({
                    variant: 'error',
                    title: 'Error',
                    message: error.body.message
                });
            });
    }
}