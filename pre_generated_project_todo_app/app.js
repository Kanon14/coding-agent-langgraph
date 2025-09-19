// app.js - TodoApp implementation
// All functionality is encapsulated in the TodoApp namespace to avoid polluting the global scope.
(() => {
    const STORAGE_KEY = "todo_tasks";
    const FILTERS = { ALL: "all", ACTIVE: "active", COMPLETED: "completed" };

    // ----- Data Model -----
    class Task {
        constructor({ id = Date.now().toString(), title, description = "", completed = false } = {}) {
            this.id = id;
            this.title = title;
            this.description = description;
            this.completed = completed;
        }
    }

    // ----- Persistence Layer -----
    const TaskStore = {
        tasks: [],
        load() {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                try {
                    const parsed = JSON.parse(raw);
                    this.tasks = parsed.map(t => new Task(t));
                } catch (e) {
                    console.error("Failed to parse tasks from localStorage", e);
                    this.tasks = [];
                }
            } else {
                this.tasks = [];
            }
        },
        save() {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tasks));
        },
        add(task) {
            this.tasks.push(task);
            this.save();
        },
        update(updatedTask) {
            const idx = this.tasks.findIndex(t => t.id === updatedTask.id);
            if (idx !== -1) {
                this.tasks[idx] = updatedTask;
                this.save();
            }
        },
        remove(id) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.save();
        },
        toggleComplete(id) {
            const task = this.tasks.find(t => t.id === id);
            if (task) {
                task.completed = !task.completed;
                this.save();
            }
        }
    };

    // ----- UI Rendering -----
    const taskListEl = document.getElementById("task-list");
    const titleInput = document.getElementById("task-title");
    const descInput = document.getElementById("task-desc");
    let currentFilter = FILTERS.ALL;

    function clearTaskList() {
        taskListEl.innerHTML = "";
    }

    function createTaskElement(task) {
        const li = document.createElement("li");
        li.className = "task-item";
        li.dataset.id = task.id;
        li.setAttribute("role", "listitem");

        // Checkbox
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.completed;
        checkbox.setAttribute("aria-checked", task.completed);
        checkbox.className = "task-toggle";
        checkbox.title = task.completed ? "Mark as incomplete" : "Mark as complete";
        li.appendChild(checkbox);

        // Title (as span)
        const titleSpan = document.createElement("span");
        titleSpan.className = "task-title";
        titleSpan.textContent = task.title;
        if (task.completed) titleSpan.style.textDecoration = "line-through";
        li.appendChild(titleSpan);

        // Description (optional)
        if (task.description) {
            const descP = document.createElement("p");
            descP.className = "task-desc";
            descP.textContent = task.description;
            li.appendChild(descP);
        }

        // Edit button
        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "task-edit";
        editBtn.setAttribute("role", "button");
        editBtn.textContent = "Edit";
        li.appendChild(editBtn);

        // Delete button
        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "task-delete";
        delBtn.setAttribute("role", "button");
        delBtn.textContent = "Delete";
        li.appendChild(delBtn);

        // Event wiring for this item (delegated later, but we attach here for clarity)
        checkbox.addEventListener("change", handleToggleComplete);
        editBtn.addEventListener("click", handleEditTask);
        delBtn.addEventListener("click", handleDeleteTask);

        return li;
    }

    function renderTask(task) {
        const el = createTaskElement(task);
        taskListEl.appendChild(el);
    }

    function renderTaskList(filter = FILTERS.ALL) {
        currentFilter = filter;
        clearTaskList();
        const filtered = TaskStore.tasks.filter(task => {
            if (filter === FILTERS.ACTIVE) return !task.completed;
            if (filter === FILTERS.COMPLETED) return task.completed;
            return true; // all
        });
        filtered.forEach(renderTask);
        // Update filter button active state
        document.querySelectorAll("#filters button").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.filter === filter);
        });
    }

    // ----- Event Handlers -----
    function handleAddTask(event) {
        event.preventDefault();
        const title = titleInput.value.trim();
        if (!title) return;
        const description = descInput.value.trim();
        const newTask = new Task({ title, description });
        TaskStore.add(newTask);
        renderTaskList(currentFilter);
        // Reset form and focus
        titleInput.value = "";
        descInput.value = "";
        titleInput.focus();
    }

    function handleEditTask(event) {
        const li = event.target.closest("li.task-item");
        if (!li) return;
        const id = li.dataset.id;
        const task = TaskStore.tasks.find(t => t.id === id);
        if (!task) return;
        // Simple edit via prompt (could be a modal, but prompt keeps it lightweight)
        const newTitle = prompt("Edit title", task.title);
        if (newTitle === null) return; // cancel
        const newDesc = prompt("Edit description", task.description);
        if (newDesc === null) return;
        const updated = new Task({
            id: task.id,
            title: newTitle.trim() || task.title,
            description: newDesc.trim(),
            completed: task.completed
        });
        TaskStore.update(updated);
        renderTaskList(currentFilter);
        // Focus the edited item
        const newLi = taskListEl.querySelector(`li[data-id="${id}"]`);
        if (newLi) newLi.focus();
    }

    function handleDeleteTask(event) {
        const li = event.target.closest("li.task-item");
        if (!li) return;
        const id = li.dataset.id;
        TaskStore.remove(id);
        renderTaskList(currentFilter);
        // Focus next item or the title input if list empty
        const next = taskListEl.querySelector("li.task-item");
        if (next) next.focus();
        else titleInput.focus();
    }

    function handleToggleComplete(event) {
        const checkbox = event.target;
        const li = checkbox.closest("li.task-item");
        if (!li) return;
        const id = li.dataset.id;
        TaskStore.toggleComplete(id);
        renderTaskList(currentFilter);
        // Keep focus on the toggled checkbox
        const newLi = taskListEl.querySelector(`li[data-id="${id}"] input.task-toggle`);
        if (newLi) newLi.focus();
    }

    function handleFilterChange(event) {
        const btn = event.target.closest("button[data-filter]");
        if (!btn) return;
        const filter = btn.dataset.filter;
        renderTaskList(filter);
    }

    // ----- Keyboard Shortcuts -----
    function globalKeydownHandler(event) {
        const activeEl = document.activeElement;
        // Enter on title input to submit task (if form not already submitted)
        if (activeEl === titleInput && event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            document.getElementById("task-form").dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
            return;
        }
        // Ctrl+Enter to focus description textarea
        if (event.ctrlKey && event.key === "Enter") {
            event.preventDefault();
            descInput.focus();
            return;
        }
        // Esc while editing (we consider prompts not editable, but if a task item has attribute data-editing)
        if (event.key === "Escape") {
            // If an element within a task item is being edited via contenteditable (not used here), we would cancel.
            // For now, just blur the active element.
            if (activeEl && activeEl !== document.body) {
                activeEl.blur();
            }
        }
    }

    // ----- Initialization -----
    function init() {
        // Load persisted tasks
        TaskStore.load();
        // Initial render
        renderTaskList(FILTERS.ALL);
        // Bind form submit
        const form = document.getElementById("task-form");
        form.addEventListener("submit", handleAddTask);
        // Bind filter buttons (event delegation on the container)
        const filterContainer = document.getElementById("filters");
        filterContainer.addEventListener("click", handleFilterChange);
        // Global keyboard shortcuts
        document.addEventListener("keydown", globalKeydownHandler);
    }

    document.addEventListener("DOMContentLoaded", init);

    // Export namespace (useful for testing or further extensions)
    window.TodoApp = {
        Task,
        TaskStore,
        renderTask,
        renderTaskList,
        clearTaskList,
        handleAddTask,
        handleEditTask,
        handleDeleteTask,
        handleToggleComplete,
        handleFilterChange,
        init
    };
})();
