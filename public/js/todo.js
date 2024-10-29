const apiUrl = "api";
let editListener = null; // Holds the listener for accepting the edit of an item
let items = []; // Drag/Session: Holds the last GET itemlist
let draggedItem = null; // Drag: Holds the currently dragged item
let draggedLi = null;

document.addEventListener('DOMContentLoaded', () => {

    // fetch to GET todo elements
    fetch(apiUrl)
    .then(response => response.json())
    .then(data => printTodoElements(data));

    // Add listener that POST fetches the new entry on submit of the todo-form
    document.getElementById('todo-form').addEventListener('submit', e => {
        e.preventDefault();
        const todoInput = document.getElementById('todo-input').value;
        const newItem = { text: todoInput };
        let li;
        fetch(apiUrl, {
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify(newItem)
        })
        .then(response => response.json())
        .then(data => {
            newItem.id = data.id;
            if (li) {
                li.id = data.id;
            }
        });

        newItem.done = 0;
        newItem.ix = items.length > 0 ? items[items.length - 1].ix + 1 : 0;
        items.push(newItem);
        const todoList = document.getElementById('todo-list');
        li = addTodoElement(todoList, newItem);
        document.getElementById('todo-input').value = "";
    });

    document.getElementById('abort-edit').addEventListener('click', () => switchForms());
});

/**
 * Calls createTodo for the given item and adds the returned li to the given list.
 * @param {*} list 
 * @param {*} item 
 */
function addTodoElement(list, item) {
    const li = createTodoElement(item);
    list.appendChild(li);
    return li
}

/**
 * Adds the delete button with funtionality for the given item to the given li-element.
 * @param {*} li 
 * @param {*} item 
 */
function addDeleteButton(li, item) {
    const button = createRoundButton();
    button.classList.add('del-btn');
    button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16"><path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"/></svg>';
    button.addEventListener('click', () => {
        fetch(apiUrl, {
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'DELETE',
            body: JSON.stringify({ id: item.id })
        });

        li.remove();
        items.splice(items.indexOf(item), 1);
    });
    li.appendChild(button);
}

/**
 * Adds the done button with funtionality for the given item to the given li-element.
 * @param {*} li 
 * @param {*} item 
 */
function addDoneButton(li, item) {
    const button = createRoundButton();
    button.classList.add('done-btn');
    button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-lg" viewBox="0 0 16 16"><path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z"/></svg>';
    button.addEventListener('click', () => {
        item.done = li.classList.contains('done') ? 0 : 1;
        updateItem(item, false);
    });
    li.appendChild(button);
}

/**
 * Adds everything needed for drag'n'drop to work: The attribute 'draggable' 
 * and the eventlisteners 'dragstart', 'dragenter', 'dragover' and 'drop'.
 * @param {*} li 
 * @param {*} item 
 */
function addDragFunctionality(li, item) {
    li.setAttribute('draggable', 'true');
    li.addEventListener('dragstart', ev => dragstart(ev, item));
    li.addEventListener('dragenter', dragenter);
    li.addEventListener('dragover', ev => {
        if (ev.dataTransfer.types.includes('text/plain') && ev.dataTransfer.effectAllowed === 'move')
            ev.preventDefault();
    });
    li.addEventListener('drop', drop);
}

/**
 * Adds the edit button with funtionality for the given item to the given li-element.
 * @param {*} li 
 * @param {*} item 
 */
function addEditButton(li, item) {
    const button = createRoundButton();
    button.classList.add('edit-btn');
    button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325"/></svg>';
    button.addEventListener('click', (ev) => {
        const editForm = document.getElementById('edit-form');
        const editInput = document.getElementById('edit-input');
        if (editForm.classList.contains('hidden')) {
            editForm.removeEventListener('submit', editListener);
            editListener = (ev) => {
                ev.preventDefault();
                item.text = editInput.value;
                updateItem(item, true);
            }
            editForm.addEventListener('submit', editListener);
        }
        switchForms();
        editInput.value = item.text;
    });
    li.appendChild(button);
}

/**
 * Creates a button element with the classes 'btn btn-primary rounded-circle'.
 * @returns The created button
 */
function createRoundButton() {
    const btn = document.createElement('button');
    btn.classList.add('btn');
    btn.classList.add('btn-primary');
    btn.classList.add('rounded-circle');
    return btn;
}

/**
 * Creates a li-element for the given todo item, adding the "done" class if needed and all eventlisteners to the buttons.
 * @returns The created li element
 */
function createTodoElement(item) {
    const li = document.createElement('li');
    const text = document.createElement('span');
    if (item.id)
        li.id = item.id;
    if (item.done)
        li.classList.add('done');
    text.textContent = item.text;
    li.appendChild(text);
    addDragFunctionality(li, item);
    addDoneButton(li, item);
    addEditButton(li, item);
    addDeleteButton(li, item);
    return li;
}

// Removes and deletes the dragShadow.
function deleteDragShadow() {
    if (dragShadow) dragShadow.remove();
    dragShadow = null;
}

/**
 * Lets the draggedLi switch position with the li element currently under the mouse. 
 * For this a clone is created and equipped with all needed drag eventhandlers.
 * @param {*} ev 
 */
function dragenter(ev) {
    if (ev.dataTransfer.types.includes('text/plain') && ev.dataTransfer.effectAllowed === 'move') {
        ev.preventDefault();
        const targetLi = getTargetLi(ev);
        if (targetLi && targetLi.tagName === "LI" && targetLi.id != draggedLi.id) {
            const ul = targetLi.parentNode;
            const presentDraggedLi = ul.querySelector(`li[id="${draggedLi.id}"]`);
            if (presentDraggedLi) {
                const item = items.find(el => el.id == targetLi.id);
                const targetLiClone = createTodoElement(item);
                ul.replaceChild(targetLiClone, presentDraggedLi);
            }
            ul.replaceChild(draggedLi, targetLi);
        }
    }
}

/**
 * Sets the dataTransfer to 'text/plain' and 'move, draggedItem to the todolist item and draggedLi to a clone of the eventTarget li.
 * @param {*} ev 
 * @param {*} item 
 */
function dragstart(ev, item) {
    ev.dataTransfer.effectAllowed = 'move';
    ev.dataTransfer.setData('text/plain', item.id);
    draggedItem = item;
    draggedLi = createTodoElement(item);
}

/**
 * Compares the ul with the items list and runs the updateItems function to update all changes. 
 * Even if no changes are made, the printTodoElements is called to print the ul anew to ensure full functionality 
 * (because the cloned li lack some eventhandlers).
 * @param {*} ev 
 */
function drop(ev) {
    if (ev.dataTransfer.types.includes('text/plain') && ev.dataTransfer.effectAllowed === 'move') {
        ev.preventDefault();
        const toUpdate = [];
        const lis = document.getElementById('todo-list').childNodes;
        for (i = 0; i < lis.length; i++) {
            const item = items[i].id == lis[i].id ? items[i] : items.find(el => el.id == lis[i].id);
            if (item.ix !== i) {
                item.ix = i;
                toUpdate.push(item);
            }
        }
        if (toUpdate.length != 0)
            updateItems(toUpdate);
        else printTodoElements(items);
    }
}

// Returns the target li element of the given event
function getTargetLi(event) {
    let targetLi = event.target;
    while (targetLi.tagName !== 'LI') { // Go up the DOM if a child element is the drag-target
        targetLi = targetLi.parentNode;
        if (targetLi.tagName == 'UL' || targetLi.tagName == 'body')
            return null;  // Failsave
    }
    return targetLi;
}

/**
 * Inserts the given item into the itemslist.
 * @param {*} item A todo item
 */
function insertItem(item) {
    const { id, text, ix, done } = item;
    const newItem = { id, text, ix, done };
    const index = items.findIndex(el => el.id == id);
    if (index != -1)
        items[index] = newItem;
    else items.push(newItem);
}

/**
 * Inserts the given items into the items list and rerenders the ul#todolist.
 * @param {*} items An array of todo items
 * @param {*} update If true, the given todo items are merged with the existing ones
 */
function printTodoElements(newItems, update = false) {
    if (update && items && items.length > 0) {
        newItems.forEach(item => insertItem(item));
    }
    else items = newItems;
    items.sort((a, b) => a.ix - b.ix);
    const todoList = document.getElementById('todo-list');
    todoList.innerHTML = '';
    items.forEach(item => addTodoElement(todoList, item));
}

/**
 * Sets the todo-form hidden and the edit-form unhidden an vise versa.
 */
function switchForms() {
    document.getElementById('todo-form').classList.toggle('hidden');
    document.getElementById('edit-form').classList.toggle('hidden');
    document.getElementById('todo-input').value = "";
    document.getElementById('edit-input').value = "";
}

/**
 * Does a PUT request with the given item and updates the ul#todolist and the items list after response
 * @param {*} item 
 * @param {*} editFormActive 
 */
function updateItem(item, editFormActive = false) {
    fetch(apiUrl, {
        headers: {
            'Content-Type': 'application/json'
        },
        method: 'PUT',
        body: JSON.stringify(item)
    });

    printTodoElements([item], true);
    if (editFormActive)
        switchForms();
}

/**
 * Fetches the given todo items as PUT, then inserts it into items list and ul#todolist.
 * @param {*} toUpdate 
 */
function updateItems(toUpdate) {
    if (!toUpdate || toUpdate.length === 0) return;

    fetch(apiUrl, {
        headers: {
            'Content-Type': 'application/json'
        },
        method: 'PUT',
        body: JSON.stringify({ items: toUpdate })
    });

    printTodoElements(toUpdate, true);
}