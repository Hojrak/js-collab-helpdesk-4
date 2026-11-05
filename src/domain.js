// domain.js - reguły helpdesku. Bez document, bez localStorage, bez efektów ubocznych.

export const STATUSES = ["new", "doing", "done"];
export const PRIORITIES = ["low", "normal", "high"];
export const MIN_TITLE = 3;
export const MAX_TITLE = 80;
export const MAX_TICKETS = 1000;

export function validateTitle(title) {
    const trimmed = String(title ?? "").trim();
    if (trimmed.length < MIN_TITLE || trimmed.length > MAX_TITLE) {
        throw new Error(`Tytuł musi mieć od ${MIN_TITLE} do ${MAX_TITLE} znaków`);
    }
    return trimmed;
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
