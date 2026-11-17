 1. Cel testowania

Testy obejmują:
- zapis i odczyt danych w localStorage,
- import zgłoszeń z pliku JSON,
- import zgłoszeń przez fetch,
- walidację importowanych danych,
- obsługę błędów podczas importowania,
- blokowanie aplikacji na czas importu,
- poprawność działania adaptera danych.

2. Testy localStorage

Nr 1
Test: Dodanie zgłoszenia i odświeżenie strony.
Wynik: Zgłoszenie pomimo odświeżenia strony nadal pojawia się na liście.

Nr 2
Test: Odmowa zapisu do localStorage.
Wynik: Aplikacja wyświetla komunikat o błędzie zapisu, nie zawiesza się, a dane pozostają w pamięci aplikacji.

Nr 3
Test: Umieszczenie niepoprawnego JSON-a w localStorage.
Wynik: Aplikacja informuje o błędzie i nie usuwa automatycznie uszkodzonego zapisu.

3. Testy importowania danych z pliku

Nr 4
Test: Import pustej tablicy `[]`.
Wynik: Lista zostaje opróżniona po potwierdzeniu importu.

Nr 5
Test: Import poprawnego pliku JSON.
Wynik: Dotychczasowe zgłoszenia zostają zastąpione nowymi.

Nr 6
Test: Import pliku z niepoprawnym składniowo JSON-em.
Wynik: Import zostaje odrzucony, a poprzednia lista pozostaje bez zmian.

Nr 7
Test: Import danych zawierających duplikaty ID.
Wynik: Import zostaje odrzucony, a poprzednia lista pozostaje bez zmian.

Nr 8
Test: Import danych z niepoprawnym ostatnim rekordem.
Wynik: Cały import zostaje odrzucony. Nie dochodzi do częściowej zmiany listy.

Nr 9
Test: Import danych z nieprawidłowymi polami zgłoszenia.
Wynik: Walidacja odrzuca import, a poprzednia lista pozostaje bez zmian.

Nr 10
Test: Anulowanie potwierdzenia importu.
Wynik: Poprzednia lista pozostaje bez zmian.

4. Testy importowania za pomocą fetch

Nr 11
Test: Import poprawnego pliku JSON przez fetch.
Wynik: Dane zostają poprawnie pobrane i zaimportowane.

Nr 12
Test: Próba pobrania nieistniejącego pliku (404).
Wynik: Aplikacja wyświetla komunikat o błędzie HTTP, a poprzednia lista pozostaje bez zmian.

Nr 13
Test: Otrzymanie HTML zamiast JSON-a.
Wynik: Import zostaje odrzucony, ponieważ odpowiedź nie jest poprawnym JSON-em.

Nr 14
Test: Otrzymanie niepoprawnych danych z serwera.
Wynik: Import zostaje odrzucony bez utraty poprzedniej listy.

Nr 15
Test: Brak połączenia z serwerem.
Wynik: Aplikacja wyświetla komunikat o błędzie pobierania danych. Poprzednia lista pozostaje bez zmian.

5. Testy blokowania aplikacji

Nr 16
Test: Podwójne kliknięcie przycisku importowania.
Wynik: Nie rozpoczynają się dwa importy jednocześnie.

Nr 17
Test: Próba dodania zgłoszenia podczas importu.
Wynik: Dodawanie zgłoszeń jest zablokowane.

Nr 18
Test: Próba zmiany statusu podczas importu.
Wynik: Zmiana statusu jest zablokowana.

Nr 19
Test: Próba usunięcia zgłoszenia podczas importu.
Wynik: Usuwanie zgłoszeń jest zablokowane.

Nr 20
Test: Próba kolejnego importu podczas trwającego importu.
Wynik: Kolejny import jest zablokowany.

Nr 21
Test: Zakończenie importu lub wystąpienie błędu.
Wynik: Blokada aplikacji zostaje zdjęta niezależnie od wyniku operacji.

Nr 22
Test: Import przez fetch przy wolnym połączeniu internetowym.
Wynik: Aplikacja pozostaje zablokowana do czasu zakończenia importu. Po zakończeniu operacji zostaje odblokowana.

6. Adapter danych

W projekcie wykorzystujemy dwa sposoby pobierania danych.

1. Import z pliku użytkownika

- Użytkownik wybiera plik JSON.
- Plik jest odczytywany za pomocą `File.text()`.
- Tekst jest zamieniany na dane za pomocą `JSON.parse()`.
- W przypadku błędu odczytu lub parsowania zgłaszany jest wyjątek.

Wykorzystywana funkcja: `readJsonFile(file)`.

2. Import przez fetch

- Aplikacja pobiera plik JSON z podanego adresu.
- Sprawdzany jest status odpowiedzi HTTP za pomocą `response.ok`.
- Dane są odczytywane za pomocą `response.json()`.
- W przypadku błędu HTTP, połączenia lub parsowania zgłaszany jest wyjątek.

Wykorzystywana funkcja: `fetchJson(url)`.