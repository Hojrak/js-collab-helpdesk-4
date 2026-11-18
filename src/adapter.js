export async function readJsonFile(file) {
    if (!file) {
        throw new Error("Nie wybrano pliku.");
    }

    let text;

    try {
        text = await file.text();
    } catch (error) {
        throw new Error("Nie udało się odczytać pliku.");
    }

    try {
        return JSON.parse(text);
    } catch (error) {
        throw new Error("Plik nie zawiera poprawnego JSON-a.");
    }
}

export async function fetchJson(url) {
    let response;

    try {
        response = await fetch(url);
    } catch (error) {
        throw new Error("Nie udało się pobrać danych.");
    }

    if (!response.ok) {
        throw new Error(`Błąd HTTP: ${response.status}`);
    }

    try {
        return await response.json();
    } catch (error) {
        throw new Error("Odpowiedź serwera nie zawiera poprawnego JSON-a.");
    }
}
