const key = "tickets";
const statuses = ["new", "doing", "done"];
const priorities = ["low", "normal", "high"];

const form = document.querySelector("#ticket-form");
const titleInput = document.querySelector("#title");
const priorityInput = document.querySelector("#priority");
const submitButton = document.querySelector("#submit");
const filterInput = document.querySelector("#filter");
const ticketsDom = document.querySelector("#tickets");
const message = document.querySelector("#message");
const counter = document.querySelector("#counter");

function loadTickets() {
    return JSON.parse(localStorage.getItem(key)) || [];
}

let tickets = loadTickets();
let editId = null;
let lastId = 1;

tickets.forEach((ticket) => {
    const number = Number(ticket.id);
    if (number >= lastId) lastId = number + 1;
});


function saveTickets() {
    localStorage.setItem(key, JSON.stringify(tickets));
}

function showMessage(text, isError = false) {
    message.textContent = text;
    message.classList.toggle("error", isError);
}

function getVisibleTickets() {
    if (filterInput.value === "all") return tickets;
    return tickets.filter((ticket) => ticket.status === filterInput.value);
}

function addTicket(title, priority) {
    title = title.trim();
    if (title.length < 3 || title.length > 80) {
        throw new Error("Tytuł musi mieć od 3 do 80 znaków");
    }

    if (!priorities.includes(priority)) {
        throw new Error("Wybierz prawidłowy priorytet");
    }

    if (tickets.length >= 1000) {
        throw new Error("Można dodać max. 1000 zgłoszeń");
    }

    const ticket = {
        id: `${lastId++}`,
        title: title,
        priority: priority,
        status: "new",
    };

    tickets.push(ticket);
    saveTickets();
    return ticket;
}

function changeStatus(id, status) {
    const ticket = tickets.find((item) => item.id === id);

    if (!ticket) {
        throw new Error("Nie znaleziono zgłoszenia");
    }

    if (!statuses.includes(status)) {
        throw new Error("Wybierz prawidłowy status");
    }

    ticket.status = status;
    saveTickets();
}

function createTicketRow(ticket) {
    const row = document.createElement("li");
    row.textContent = `#${ticket.id} / ${ticket.title} / ${ticket.priority} / `;

    const statusLabel = document.createElement("label");
    statusLabel.htmlFor = `status-${ticket.id}`;
    statusLabel.textContent = "Status ";

    const statusSelect = document.createElement("select");
    statusSelect.id = `status-${ticket.id}`;

    statuses.forEach((status) => {
        const option = document.createElement("option");
        option.value = status;
        option.textContent = status;
        option.selected = status === ticket.status;
        statusSelect.appendChild(option);
    });

    statusSelect.addEventListener("change", (event) => {
        try {
            changeStatus(ticket.id, event.target.value);
            showMessage(`Zmieniono status zgłoszenia ${ticket.id}.`);
        } catch (error) {
            showMessage(error.message, true);
        }

        update();
        filterInput.focus();
    });

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Edytuj";
    editButton.addEventListener("click", () => {
        titleInput.value = ticket.title;
        priorityInput.value = ticket.priority;
        editId = ticket.id;
        submitButton.textContent = "Zapisz";
        titleInput.focus();
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Usuń";
    deleteButton.addEventListener("click", () => {
        tickets = tickets.filter((item) => item.id !== ticket.id);
        saveTickets();

        if (editId === ticket.id) {
            editId = null;
            form.reset();
            priorityInput.value = "normal";
            submitButton.textContent = "Dodaj";
        }

        showMessage(`Usunięto zgłoszenie ${ticket.id}.`);
        update();
    });

    row.appendChild(statusLabel);
    row.appendChild(statusSelect);
    row.appendChild(editButton);
    row.appendChild(deleteButton);

    return row;
}

function update() {
    const visibleTickets = getVisibleTickets();
    ticketsDom.replaceChildren();

    if (visibleTickets.length === 0) {
        const emptyRow = document.createElement("li");
        emptyRow.textContent = "Brak zgłoszeń";
        ticketsDom.appendChild(emptyRow);
    } else {
        visibleTickets.forEach((ticket) => {
            ticketsDom.appendChild(createTicketRow(ticket));
        });
    }

    counter.textContent = `${visibleTickets.length} / ${tickets.length}`;
}

form.addEventListener("submit", (event) => {
    event.preventDefault();

    try {
        const data = new FormData(form);
        const title = String(data.get("title") || "").trim();
        const priority = String(data.get("priority") || "").trim();

        if (editId === null) {
            const ticket = addTicket(title, priority);
            showMessage(`Dodano zgłoszenie ${ticket.id}.`);
        } else {
            const ticket = tickets.find((item) => item.id === editId);

            if (!ticket) {
                throw new Error("Nie znaleziono zgłoszenia do edycji");
            }

            if (title.length < 3 || title.length > 80) {
                throw new Error("Tytuł musi mieć od 3 do 80 znaków");
            }

            if (!priorities.includes(priority)) {
                throw new Error("Wybierz priorytet");
            }

            ticket.title = title;
            ticket.priority = priority;
            saveTickets();
            showMessage(`Zapisano zgłoszenie ${ticket.id}.`);
            editId = null;
            submitButton.textContent = "Dodaj";
        }

        form.reset();
        priorityInput.value = "normal";
        titleInput.focus();
        update();
    } catch (error) {
        showMessage(error.message, true);
    }
});

filterInput.addEventListener("change", update);
priorityInput.value = "normal";


update();