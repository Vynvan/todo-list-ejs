document.addEventListener("DOMContentLoaded", function() {

    // Define the URL to our PHP API.
    const apiUrl = "api";

    function loadItems() {
        fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            const todoList = document.getElementById('todo-list');
            todoList.innerHTML = "";
            data.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item.text;
                li.id = item.id;
                if (item.completed) {
                    li.className = "completed";
                }

                const deleteButton = document.createElement('button');
                deleteButton.className = 'btn btn-danger';
                deleteButton.textContent = 'Löschen';

                // Handle delete button click
                deleteButton.addEventListener('click', function(evt) {
                    fetch(apiUrl, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ id: item.id })
                    })
                    .then(response => response.json())
                    .then(() => {
                        li.remove(); // Remove the todo from the list
                    });
                });
                li.appendChild(deleteButton);

                const completeButton = document.createElement('button');
                completeButton.className = 'btn btn-success';
                completeButton.textContent = 'Erledigt';

                // Handle complete button click
                completeButton.addEventListener('click', function(evt) {
                    fetch(apiUrl, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ id: item.id })
                    })
                    .then(response => response.json())
                    .then(() => {
                        loadItems(); // Reload the list
                    });
                });
                li.appendChild(completeButton);

                todoList.appendChild(li);
            });
        });
    }

    document.getElementById('todo-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const todoInput = document.getElementById('todo-input').value;

        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: todoInput })
        })
        .then(response => response.json())
        .then(data => {
            loadItems();
        });
    });

    loadItems();
});