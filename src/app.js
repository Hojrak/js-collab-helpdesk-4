import {
    STATUSES,
    createTicket,
    filterTickets,
    getNextId,
    removeTicket,
    setTicketStatus,
    updateTicket,
    validateTickets
} from "./domain.js";

import {
    readJsonFile,
    fetchJson
} from "./adapter.js";

const key = "tickets";

const form = document.querySelector("#ticket-form");
const titleInput = document.querySelector("#title");
const priorityInput = document.querySelector("#priority");
const submitButton = document.querySelector("#submit");
const filterInput = document.querySelector("#filter");
const ticketsDom = document.querySelector("#tickets");
const message = document.querySelector("#message");
const counter = document.querySelector("#counter");

const jsonFileInput = document.querySelector("#json-file");
const importFileButton = document.querySelector("#import-file");
const importFetchButton = document.querySelector("#import-fetch");

const ticketsUrl = "../testy/tickets.json";

let isImporting = false;

function showMessage(text, isError = false) {
    message.textContent = text;
    message.classList.toggle("error", isError);
}

function loadTickets() {
    const saved = localStorage.getItem(key);

    if (saved === null) {
        return [];
    }

    return validateTickets(JSON.parse(saved));
}

let tickets = [];

try {
    tickets = loadTickets();
} catch (error) {
    showMessage(
        `Błąd odczytu danych: ${error.message}`,
        true
    );
}

let editId = null;
let lastId = getNextId(tickets);

function saveTickets(newTickets = tickets) {
    localStorage.setItem(key, JSON.stringify(newTickets));
}

function getVisibleTickets() {
    return filterTickets(tickets, filterInput.value);
}

function addTicket(title, priority) {
    const ticket = createTicket(tickets, lastId, title, priority);
    const newTickets = [...tickets, ticket];

    saveTickets(newTickets);

    tickets = newTickets;
    lastId = getNextId(tickets);

    return ticket;
}

function changeStatus(id, status) {
    const newTickets = setTicketStatus(tickets, id, status);

    saveTickets(newTickets);

    tickets = newTickets;
}

function createTicketRow(ticket) {
    const row = document.createElement("li");
    row.textContent = `#${ticket.id} / ${ticket.title} / ${ticket.priority} / `;

    const statusLabel = document.createElement("label");
    statusLabel.htmlFor = `status-${ticket.id}`;
    statusLabel.textContent = "Status ";

    const statusSelect = document.createElement("select");
    statusSelect.id = `status-${ticket.id}`;
    statusSelect.disabled = isImporting;

    STATUSES.forEach((status) => {
        const option = document.createElement("option");
        option.value = status;
        option.textContent = status;
        option.selected = status === ticket.status;
        statusSelect.appendChild(option);
    });

    statusSelect.addEventListener("change", (event) => {
        if (isImporting) return;

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
    editButton.disabled = isImporting;

    editButton.addEventListener("click", () => {
        if (isImporting) return;

        titleInput.value = ticket.title;
        priorityInput.value = ticket.priority;
        editId = ticket.id;
        submitButton.textContent = "Zapisz";
        titleInput.focus();
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Usuń";
    deleteButton.disabled = isImporting;

    deleteButton.addEventListener("click", () => {
        if (isImporting) return;

        try {
            const newTickets = removeTicket(tickets, ticket.id);

            saveTickets(newTickets);
            tickets = newTickets;

            if (editId === ticket.id) {
                editId = null;
                form.reset();
                priorityInput.value = "normal";
                submitButton.textContent = "Dodaj";
            }

            showMessage(`Usunięto zgłoszenie ${ticket.id}.`);
        } catch (error) {
            showMessage(error.message, true);
        }

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

function setImporting(value) {
    isImporting = value;

    jsonFileInput.disabled = value;
    importFileButton.disabled = value;
    importFetchButton.disabled = value;

    form.querySelectorAll("input, select, button").forEach((element) => {
        element.disabled = value;
    });

    update();
}

async function importFrom(load) {
    if (isImporting) {
        return;
    }

    const confirmed = confirm(
        "Import zastąpi wszystkie obecne zgłoszenia. Czy chcesz kontynuować?"
    );

    if (!confirmed) {
        showMessage("Import został anulowany.");
        return;
    }

    setImporting(true);

    try {
        const data = await load();

        const newTickets = validateTickets(data);

        saveTickets(newTickets);

        tickets = newTickets;
        lastId = getNextId(tickets);

        editId = null;

        form.reset();
        priorityInput.value = "normal";
        submitButton.textContent = "Dodaj";

        jsonFileInput.value = "";

        showMessage(`Zaimportowano ${tickets.length} zgłoszeń.`);
    } catch (error) {
        showMessage(`Błąd importu: ${error.message}`, true);
    } finally {
        setImporting(false);
    }
}

importFileButton.addEventListener("click", () => {
    if (isImporting) return;

    const file = jsonFileInput.files[0];

    if (!file) {
        showMessage("Najpierw wybierz plik JSON.", true);
        return;
    }

    importFrom(() => readJsonFile(file));
});

importFetchButton.addEventListener("click", () => {
    if (isImporting) return;

    importFrom(() => fetchJson(ticketsUrl));
});

form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (isImporting) return;

    try {
        const data = new FormData(form);
        const title = String(data.get("title") || "").trim();
        const priority = String(data.get("priority") || "").trim();

        if (editId === null) {
            const ticket = addTicket(title, priority);
            showMessage(`Dodano zgłoszenie ${ticket.id}.`);
        } else {
            const newTickets = updateTicket(
                tickets,
                editId,
                title,
                priority
            );

            saveTickets(newTickets);
            tickets = newTickets;

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
