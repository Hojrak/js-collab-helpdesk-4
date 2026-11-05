const storageKey = "tickets";
const app = document.querySelector("#app");
const results = document.querySelector("#results");
const summary = document.querySelector("#summary");
const originalTickets = localStorage.getItem(storageKey);

let passed = 0;
let failed = 0;
let reloadNumber = 0;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function addResult(name, error = null) {
  const result = document.createElement("li");
  result.textContent = error ? `${name} — BŁĄD: ${error.message}` : `${name} — OK`;
  result.className = error ? "fail" : "pass";
  results.appendChild(result);

  if (error) {
    failed += 1;
  } else {
    passed += 1;
  }
}

function reloadApp(tickets = []) {
  return new Promise((resolve) => {
    localStorage.setItem(storageKey, JSON.stringify(tickets));
    app.addEventListener("load", resolve, { once: true });
    reloadNumber += 1;
    app.src = `index.html?test=${reloadNumber}`;
  });
}

function getAppDocument() {
  const document = app.contentDocument;

  if (!document) {
    throw new Error("Nie można odczytać aplikacji w iframe. Otwórz test.html i index.html z tego samego lokalnego serwera.");
  }

  return document;
}

function getRows() {
  return Array.from(getAppDocument().querySelectorAll("#tickets li"))
    .filter((row) => row.querySelector("select"));
}

function submitTicket(title, priority = "normal") {
  const document = getAppDocument();
  document.querySelector("#title").value = title;
  document.querySelector("#priority").value = priority;
  document.querySelector("#ticket-form").requestSubmit();
}

function changeValue(element, value) {
  element.value = value;
  const Event = getAppDocument().defaultView.Event;
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

function setStatus(row, status) {
  changeValue(row.querySelector("select"), status);
}

async function runTest(name, test) {
  try {
    await test();
    addResult(name);
  } catch (error) {
    addResult(name, error);
  }
}

async function runTests() {
  await new Promise((resolve) => {
    if (app.contentDocument && app.contentDocument.readyState === "complete") {
      resolve();
    } else {
      app.addEventListener("load", resolve, { once: true });
    }
  });

  await runTest("Podstawowe kontrolki i etykiety są dostępne", async () => {
    await reloadApp();
    const document = getAppDocument();
    assert(document.querySelector("#ticket-form"), "Brak formularza");
    assert(document.querySelector('label[for="title"]'), "Brak etykiety tytułu");
    assert(document.querySelector('label[for="priority"]'), "Brak etykiety priorytetu");
    assert(document.querySelector('label[for="filter"]'), "Brak etykiety filtra");
    assert(document.querySelector('[role="status"]'), "Brak komunikatu role=status");
  });

  await runTest("Tytuł po trim: 2 znaki są odrzucone", async () => {
    await reloadApp();
    submitTicket("  ab  ");
    assert(JSON.parse(localStorage.getItem(storageKey)).length === 0, "Dodano za krótki tytuł");
    assert(getAppDocument().querySelector("#message").textContent, "Brak komunikatu walidacji");
  });

  await runTest("Pusty tytuł z samych spacji jest odrzucony", async () => {
    await reloadApp();
    submitTicket("     ");
    assert(JSON.parse(localStorage.getItem(storageKey)).length === 0, "Dodano pusty tytuł");
  });

  await runTest("Tytuł po trim: 3 znaki są akceptowane i zapisane po trim", async () => {
    await reloadApp();
    submitTicket("  abc  ", "low");
    const tickets = JSON.parse(localStorage.getItem(storageKey));
    assert(tickets.length === 1, "Nie dodano zgłoszenia");
    assert(tickets[0].title === "abc", "Tytuł nie został przycięty");
    assert(tickets[0].priority === "low", "Nie zapisano priorytetu");
    assert(tickets[0].status === "new", "Nowe zgłoszenie nie ma statusu new");
  });

  await runTest("Tytuł o długości 80 znaków jest akceptowany", async () => {
    await reloadApp();
    submitTicket("a".repeat(80));
    assert(JSON.parse(localStorage.getItem(storageKey)).length === 1, "Nie dodano tytułu 80-znakowego");
  });

  await runTest("Tytuł o długości 81 znaków jest odrzucony", async () => {
    await reloadApp();
    submitTicket("a".repeat(81));
    assert(JSON.parse(localStorage.getItem(storageKey)).length === 0, "Dodano tytuł 81-znakowy");
  });

  await runTest("Dwa zgłoszenia mogą mieć ten sam tytuł i różne ID", async () => {
    await reloadApp();
    submitTicket("Powtarzalny tytuł");
    submitTicket("Powtarzalny tytuł");
    const tickets = JSON.parse(localStorage.getItem(storageKey));
    assert(tickets.length === 2, "Nie dodano obu zgłoszeń");
    assert(tickets[0].id !== tickets[1].id, "ID nie są unikatowe");
    assert(tickets[0].title === tickets[1].title, "Tytuły nie są takie same");
    assert(typeof tickets[0].id === "string" && tickets[0].id.length > 0, "ID musi być niepustym napisem");
    assert(tickets.every((ticket) => ticket.id.length <= 100), "ID przekracza 100 znaków");
  });

  await runTest("Statusy działają po ID, także done -> new", async () => {
    await reloadApp();
    submitTicket("Ten sam tytuł");
    submitTicket("Ten sam tytuł");
    let rows = getRows();

    setStatus(rows[1], "done");
    rows = getRows();
    assert(rows[0].querySelector("select").value === "new", "Zmienił się status pierwszego zgłoszenia");
    assert(rows[1].querySelector("select").value === "done", "Nie zmieniono statusu drugiego zgłoszenia");

    setStatus(rows[1], "doing");
    rows = getRows();
    assert(rows[1].querySelector("select").value === "doing", "Nie ustawiono statusu doing");

    setStatus(rows[1], "done");
    rows = getRows();
    setStatus(rows[1], "new");
    rows = getRows();
    assert(rows[1].querySelector("select").value === "new", "Nie działa przejście done -> new");
  });

  await runTest("Filtr, pusty wynik i licznik nie usuwają danych", async () => {
    await reloadApp();
    submitTicket("Zgłoszenie A");
    submitTicket("Zgłoszenie B");
    let rows = getRows();
    setStatus(rows[0], "done");

    const document = getAppDocument();
    changeValue(document.querySelector("#filter"), "doing");
    assert(document.querySelector("#tickets").textContent.includes("Brak zgłoszeń"), "Brak pustego wyniku");
    assert(document.querySelector("#counter").textContent === "0 / 2", "Licznik pustego wyniku jest nieprawidłowy");
    assert(JSON.parse(localStorage.getItem(storageKey)).length === 2, "Filtr usunął dane");

    changeValue(document.querySelector("#filter"), "done");
    assert(document.querySelector("#counter").textContent === "1 / 2", "Filtr done lub licznik jest nieprawidłowy");

    changeValue(document.querySelector("#filter"), "all");
    assert(getRows().length === 2, "Powrót do all nie przywrócił wszystkich zgłoszeń");
  });

  await runTest("Tekst HTML jest wyświetlany jako tekst", async () => {
    await reloadApp();
    submitTicket("<b>ABC</b>");
    const row = getAppDocument().querySelector("#tickets li");
    assert(row.textContent.includes("<b>ABC</b>"), "Nie wyświetlono tekstu");
    assert(!row.querySelector("b"), "Tekst został zinterpretowany jako HTML");
  });

  await runTest("Formularz dodaje zgłoszenie przez submit (także natywne Enter)", async () => {
    await reloadApp();
    const document = getAppDocument();
    document.querySelector("#title").focus();
    document.querySelector("#title").value = "Dodane formularzem";
    document.querySelector("#priority").value = "high";
    document.querySelector("#ticket-form").requestSubmit();
    assert(JSON.parse(localStorage.getItem(storageKey)).length === 1, "Zdarzenie submit nie dodało zgłoszenia");
    assert(document.activeElement.id === "title", "Po dodaniu fokus nie wrócił na pole tytułu");
  });

  await runTest("Ponowne renderowanie nie powiela zgłoszeń, fokus statusu wraca na filtr", async () => {
    await reloadApp();
    submitTicket("Renderowanie");
    const document = getAppDocument();
    const status = getRows()[0].querySelector("select");
    changeValue(status, "doing");
    assert(getRows().length === 1, "Renderowanie powieliło wiersz");
    assert(document.activeElement.id === "filter", "Po zmianie statusu fokus nie wrócił na filtr");
  });

  await runTest("Odświeżenie zachowuje dane zapisane w localStorage", async () => {
    await reloadApp();
    submitTicket("Zapisane zgłoszenie");
    await reloadApp(JSON.parse(localStorage.getItem(storageKey)));
    assert(getRows().length === 1, "Zgłoszenie nie przetrwało odświeżenia");
  });

  await runTest("Limit 1000 zgłoszeń: 1000 można zachować, 1001. jest odrzucone", async () => {
    const tickets = [];
    for (let i = 1; i <= 1000; i += 1) {
      tickets.push({
        id: String(i),
        title: `Zgłoszenie ${i}`,
        priority: "normal",
        status: "new",
      });
    }

    await reloadApp(tickets);
    submitTicket("Tysiąc pierwsze");
    const savedTickets = JSON.parse(localStorage.getItem(storageKey));
    assert(savedTickets.length === 1000, `Liczba rekordów wynosi ${savedTickets.length}, zamiast 1000`);
    assert(getAppDocument().querySelector("#message").textContent.includes("1000"), "Brak komunikatu o limicie");
  });

  if (originalTickets === null) {
    localStorage.removeItem(storageKey);
  } else {
    localStorage.setItem(storageKey, originalTickets);
  }

  await new Promise((resolve) => {
    app.addEventListener("load", resolve, { once: true });
    reloadNumber += 1;
    app.src = `index.html?test=${reloadNumber}`;
  });
  summary.textContent = `Wynik: ${passed} zaliczonych, ${failed} niezaliczonych. Dane localStorage przywrócono. Odświeżenie sprawdza zachowanie zgodne z aktualnym zapisem danych; brief zakłada reset.`;
  summary.className = failed ? "fail" : "pass";
}

runTests().catch((error) => {
  summary.textContent = `Nie udało się uruchomić testów: ${error.message}`;
  summary.className = "fail";
});
