const API_BASE_URL = 'http://localhost:3001';

// Hämta alla todos från backend
export async function getTodos() {
    try {
        console.log('Hämtar todos från API...');
        const response = await fetch(`${API_BASE_URL}/todos`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const todos = await response.json();
        console.log('Todos hämtade:', todos);
        return todos;
    } catch (error) {
        console.error('Fel vid hämtning av todos:', error);
        throw error; // Kasta vidare felet så att anropande kod kan hantera det
    }
}

// Skapa en ny todo i backend
export async function createTodo(todo) {
    try {
        console.log('Skapar todo via API...', todo);
        const response = await fetch(`${API_BASE_URL}/todos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(todo)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const createdTodo = await response.json();
        console.log('Todo skapad:', createdTodo);
        return createdTodo;
    } catch (error) {
        console.error('Fel vid skapande av todo:', error);
        throw error;
    }
}

// Uppdatera en todo i backend
export async function updateTodo(id, updates) {
    try {
        console.log(`Uppdaterar todo ${id} via API...`, updates);
        const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const updatedTodo = await response.json();
        console.log('Todo uppdaterad:', updatedTodo);
        return updatedTodo;
    } catch (error) {
        console.error('Fel vid uppdatering av todo:', error);
        throw error;
    }
}

// Radera en todo från backend
export async function deleteTodo(id) {
    try {
        console.log(`Raderar todo ${id} via API...`);
        const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log(`Todo ${id} raderad från backend`);
        return true;
    } catch (error) {
        console.error('Fel vid radering av todo:', error);
        throw error;
    }
}