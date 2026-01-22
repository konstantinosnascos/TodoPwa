import './style.css'
import {
    getTodos,
    createTodo as apiCreateTodo,
    updateTodo as apiUpdateTodo,
    deleteTodo as apiDeleteTodo
} from './api.js'

let isOnline = navigator.onLine;
let TodoTasks = []; // Tom array, vi hämtar data från API istället

const statusBadge = document.getElementById("status");
const offlineBanner = document.getElementById("offline-banner")
const todoList = document.getElementById("todo-list");
const todoForm = document.getElementById("task-form");

todoForm.addEventListener("submit", async (event)=> {
    event.preventDefault();
    const title = document.getElementById("todo-input");
    const date = document.getElementById("todo-date");
    const task = {title:title.value, dueDate: date.value};
    createTodo(task);
});

todoList.addEventListener("click", (event) => {
    const todoItem = event.target.closest(".todo-item")
    const id = parseInt(todoItem.dataset.id)

    if (event.target.classList.contains("todo-checkbox")) {
        toggleTodo(id)
    }

    if (event.target.classList.contains("todo-delete")) {
        deleteTodo(id);
    }
})

function showLoading() {
    todoList.innerHTML = '<li class="loading">Laddar todos...</li>';
}

function showError(message) {
    todoList.innerHTML = `<li class="error-banner">Fel: ${message}</li>`;
}

async function loadTodos() {
    showLoading();

    try {
        TodoTasks = await getTodos();
        renderTodos();

        // Om vi återhämtat oss från ett fel
        if (!backendAvailable) {
            console.log('Backend är åter tillgängligt!');
            hideErrorBanner();
        }

    } catch (error) {
        console.error('Kunde inte ladda todos:', error);
        showError('Kunde inte ansluta till servern. Kontrollera att json-server körs på port 3001.');
        showErrorBanner('Backend är inte tillgänglig. Appen är i läsläge.');
    }
}

async function createTodo(task) {
    if (!isOnline) {
        console.log('Kan inte skapa - offline')
        return
    }

    // Disable submit-knappen medan vi väntar på API
    const submitButton = document.getElementById("todo-button");
    const todoInput = document.getElementById("todo-input");
    const todoDate = document.getElementById("todo-date");

    submitButton.disabled = true;
    submitButton.textContent = "Sparar...";

    try {
        const newTodo = {
            title: task.title,
            completed: false,
            description: "",
            dueDate: task.dueDate || "",
            project: "Inbox"
        };

        // Skicka till backend
        const createdTodo = await apiCreateTodo(newTodo);

        // Lägg till i lokal array först när backend bekräftar
        TodoTasks.push(createdTodo);

        // Rensa formuläret
        todoInput.value = "";
        todoDate.value = "";

        renderTodos();
        console.log('Todo skapad:', createdTodo);

    } catch (error) {
        console.error('Kunde inte skapa todo:', error);
        // Visa felmeddelande till användaren
        alert('Kunde inte spara todo. Kontrollera att servern körs.');
    } finally {
        // Aktivera knappen igen
        submitButton.disabled = false;
        submitButton.textContent = "Add task";
    }
}

async function deleteTodo(id) {
    if (!isOnline) {
        console.log('Kan inte radera - offline');
        return;
    }

    try {
        // Ta bort från backend först
        await apiDeleteTodo(id);

        // Ta bort från lokal array först när backend bekräftar
        TodoTasks = TodoTasks.filter(t => t.id !== id);

        renderTodos();
        console.log("Raderade todo med id:", id);

    } catch (error) {
        console.error('Kunde inte radera todo:', error);
        alert('Kunde inte radera todo. Kontrollera att servern körs.');
    }
}

async function toggleTodo(id) {
    console.log("=== toggleTodo startad ===");
    console.log("id:", id);
    console.log("isOnline:", isOnline);

    if (!isOnline) {
        console.log("Kan inte uppdatera offline");
        return;
    }

    const todo = TodoTasks.find(t => t.id === id);
    console.log("Hittad todo:", todo);

    if (!todo) {
        console.log("Ingen todo hittades!");
        return;
    }

    const oldCompleted = todo.completed;

    try {
        todo.completed = !todo.completed;
        renderTodos();

        const updatedTodo = await apiUpdateTodo(id, { completed: todo.completed });

        console.log("Svar från API:", updatedTodo);

        // Merga istället för att ersätta helt
        const todoIndex = TodoTasks.findIndex(t => t.id === id);
        TodoTasks[todoIndex] = { ...TodoTasks[todoIndex], ...updatedTodo };
        // Behåller title, dueDate etc. och uppdaterar bara det som kom från API

        console.log("Uppdaterad todo i array:", TodoTasks[todoIndex]);
        console.log("=== toggleTodo klar ===");

    } catch (error) {
        console.error("FEL i toggleTodo:", error);
        todo.completed = oldCompleted;
        renderTodos();
        alert('Kunde inte uppdatera todo. Kontrollera att servern körs.');
    }
}

function updateConnected() {
    const offlineBanner = document.getElementById("offline-banner");

    if (isOnline) {
        statusBadge.textContent = "Online";
        document.body.className = "online";
        offlineBanner.style.display = "none";
    } else {
        statusBadge.textContent = "Offline";
        document.body.className = "offline";
        offlineBanner.style.display = "block";
    }
}

window.addEventListener("online", () => {
    isOnline = true;
    console.log("Online nu");
    updateConnected();
})

window.addEventListener("offline", () => {
    isOnline= false;
    console.log("Offline nu");
    updateConnected();
})

function renderTodos() {
    todoList.innerHTML = TodoTasks.map(todo => `
    <li class="todo-item" data-id="${todo.id}">
      <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} />
      <div class="todo-info">
        <span class="todo-title ${todo.completed ? 'completed' : ''}">${todo.title}</span>
        ${todo.dueDate ? `<span class="todo-due-date">${todo.dueDate}</span>` : ''}
      </div>
      <button class="todo-delete">✕</button>
    </li>
  `).join('')
}


let backendAvailable = true;

function showErrorBanner(message) {
    const errorBanner = document.getElementById("error-banner");
    errorBanner.textContent = message + " Försöker återansluta...";
    errorBanner.style.display = "block";
    backendAvailable = false;
    lockUI();
    startBackendHealthCheck(); // Starta automatisk kontroll
}

function hideErrorBanner() {
    const errorBanner = document.getElementById("error-banner");
    errorBanner.style.display = "none";
    backendAvailable = true;
    unlockUI();
    stopBackendHealthCheck(); // Stoppa automatisk kontroll
}

function lockUI() {
    document.body.classList.add("backend-unavailable");

    // Disable alla form-element
    const form = document.getElementById("task-form");
    const inputs = form.querySelectorAll("input, button");
    inputs.forEach(input => input.disabled = true);

    // Disable alla checkboxes i todo-listan
    const checkboxes = document.querySelectorAll(".todo-checkbox");
    checkboxes.forEach(cb => cb.disabled = true);
}

function unlockUI() {
    document.body.classList.remove("backend-unavailable");

    // Enable alla form-element (om vi är online)
    if (isOnline) {
        const form = document.getElementById("task-form");
        const inputs = form.querySelectorAll("input, button");
        inputs.forEach(input => input.disabled = false);

        const checkboxes = document.querySelectorAll(".todo-checkbox");
        checkboxes.forEach(cb => cb.disabled = false);
    }
}

let backendCheckInterval = null;

// Kontrollera om backend är tillgängligt
async function checkBackendHealth() {
    try {
        const response = await fetch(`http://localhost:3001/todos`, {
            method: 'HEAD', // Endast kontrollera att servern svarar
            signal: AbortSignal.timeout(3000) // 3 sekunders timeout
        });

        if (response.ok) {
            return true;
        }
        return false;
    } catch (error) {
        return false;
    }
}

// Starta automatisk kontroll av backend
function startBackendHealthCheck() {
    if (backendCheckInterval) return; // Redan igång

    console.log('Startar automatisk backend-kontroll...');
    backendCheckInterval = setInterval(async () => {
        if (!backendAvailable) {
            console.log('Kontrollerar om backend är tillbaka...');
            const isHealthy = await checkBackendHealth();

            if (isHealthy) {
                console.log('Backend är tillbaka! Laddar om todos...');
                clearInterval(backendCheckInterval);
                backendCheckInterval = null;
                await loadTodos(); // Ladda om todos automatiskt
            }
        }
    }, 5000); // Kontrollera var 5:e sekund
}

// Stoppa automatisk kontroll
function stopBackendHealthCheck() {
    if (backendCheckInterval) {
        clearInterval(backendCheckInterval);
        backendCheckInterval = null;
        console.log('Stoppade automatisk backend-kontroll');
    }
}

// Ladda todos från API när appen startar
loadTodos()
updateConnected()