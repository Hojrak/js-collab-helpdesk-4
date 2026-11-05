import {
    STATUSES,
    createTicket,
    filterTickets,
    getNextId,
    removeTicket,
    setTicketStatus,
    updateTicket,
} from "./domain.js";

const key = "tickets";

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
let lastId = getNextId(tickets);

function saveTickets() {
    localStorage.setItem(key, JSON.stringify(tickets));
}

function showMessage(text, isError = false) {
    message.textContent = text;
    message.classList.toggle("error", isError);
}

function getVisibleTickets() {
    return filterTickets(tickets, filterInput.value);
}

function addTicket(title, priority) {
    const ticket = createTicket(tickets, lastId, title, priority);
    lastId += 1;
    tickets = [...tickets, ticket];
    saveTickets();
    return ticket;
}

function changeStatus(id, status) {
    tickets = setTicketStatus(tickets, id, status);
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

    STATUSES.forEach((status) => {
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
        tickets = removeTicket(tickets, ticket.id);
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
            tickets = updateTicket(tickets, editId, title, priority);
            saveTickets();
            showMessage(`Zapisano zgłoszenie ${editId}.`);
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
