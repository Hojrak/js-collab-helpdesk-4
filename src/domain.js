// domain.js - reguły helpdesku. Bez document, bez localStorage, bez efektów ubocznych.

export const STATUSES = ["new", "doing", "done"];
export const PRIORITIES = ["low", "normal", "high"];
export const MIN_TITLE = 3;
export const MAX_TITLE = 80;
export const MAX_TICKETS = 1000;

export function validateTitle(title) {
    if (typeof title !== "string") {
    throw new Error("Tytuł musi być tekstem.");
}

const trimmed = title.trim();
    if (trimmed.length < MIN_TITLE || trimmed.length > MAX_TITLE) {
        throw new Error(`Tytuł musi mieć od ${MIN_TITLE} do ${MAX_TITLE} znaków`);
    }
    return trimmed;
}

export function validateTickets(data) {
    if (!Array.isArray(data)) {
        throw new Error("Importowane dane muszą być tablicą.");
    }

    if (data.length > MAX_TICKETS) {
        throw new Error("Przekroczono limit zgłoszeń.");
    }

    const ids = [];
    const noweZgloszenia = [];

    for (let i = 0; i < data.length; i++) {
        const ticket = data[i];

        if (ticket === null || typeof ticket !== "object" || Array.isArray(ticket)) {
            throw new Error(`Nieprawidłowe zgłoszenie nr ${i + 1}.`);
        }

        if (
            !Object.prototype.hasOwnProperty.call(ticket, "id") ||
            !Object.prototype.hasOwnProperty.call(ticket, "title") ||
            !Object.prototype.hasOwnProperty.call(ticket, "priority") ||
            !Object.prototype.hasOwnProperty.call(ticket, "status")
        ) {
            throw new Error(`Brak wymaganych pól w zgłoszeniu nr ${i + 1}.`);
        }

        if (
            typeof ticket.id !== "string" ||
            !/^[1-9]\d*$/.test(ticket.id) ||
            !Number.isSafeInteger(Number(ticket.id))
        ) {
            throw new Error(`Nieprawidłowe ID w zgłoszeniu nr ${i + 1}.`);
        }

        if (ids.includes(ticket.id)) {
            throw new Error(`Powtarzające się ID: ${ticket.id}.`);
        }

        const title = validateTitle(ticket.title);
        const priority = validatePriority(ticket.priority);
        const status = validateStatus(ticket.status);

        ids.push(ticket.id);

        noweZgloszenia.push({
            id: ticket.id,
            title: title,
            priority: priority,
            status: status
        });
    }

    return noweZgloszenia;
}

export function validatePriority(priority) {
    if (!PRIORITIES.includes(priority)) {
        throw new Error("Wybierz prawidłowy priorytet");
    }
    return priority;
}

export function validateStatus(status) {
    if (!STATUSES.includes(status)) {
        throw new Error("Wybierz prawidłowy status");
    }
    return status;
}

// Pierwsze wolne ID (liczone od 1) na podstawie istniejących zgłoszeń.
export function getNextId(tickets) {
    let next = 1;
    tickets.forEach((ticket) => {
        const number = Number(ticket.id);
        if (number >= next) next = number + 1;
    });
    return next;
}

// Zwraca NOWE zgłoszenie (nie modyfikuje listy). Rzuca Error przy złych danych.
export function createTicket(tickets, id, title, priority) {
    const cleanTitle = validateTitle(title);
    const cleanPriority = validatePriority(priority);

    if (tickets.length >= MAX_TICKETS) {
        throw new Error(`Można dodać max. ${MAX_TICKETS} zgłoszeń`);
    }

    return { id: String(id), title: cleanTitle, priority: cleanPriority, status: "new" };
}

// Zwraca NOWĄ listę ze zmienionym statusem.
export function setTicketStatus(tickets, id, status) {
    if (!tickets.some((ticket) => ticket.id === id)) {
        throw new Error("Nie znaleziono zgłoszenia");
    }
    validateStatus(status);
    return tickets.map((ticket) => (ticket.id === id ? { ...ticket, status } : ticket));
}

// Zwraca NOWĄ listę ze zmienionym tytułem i priorytetem.
export function updateTicket(tickets, id, title, priority) {
    if (!tickets.some((ticket) => ticket.id === id)) {
        throw new Error("Nie znaleziono zgłoszenia do edycji");
    }
    const cleanTitle = validateTitle(title);
    const cleanPriority = validatePriority(priority);
    return tickets.map((ticket) =>
        ticket.id === id ? { ...ticket, title: cleanTitle, priority: cleanPriority } : ticket
    );
}

export function removeTicket(tickets, id) {
    return tickets.filter((ticket) => ticket.id !== id);
}

export function filterTickets(tickets, status) {
    if (status === "all") return tickets;
    return tickets.filter((ticket) => ticket.status === status);
}
