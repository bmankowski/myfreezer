# Product Requirements Document (PRD) - MyFreezer

## 1. Przegląd Produktu

### Nazwa produktu
MyFreezer

### Cel produktu
Aplikacja webowa umożliwiająca zarządzanie zawartością lodówek i zamrażarek za pomocą intuicyjnych poleceń głosowych oraz graficznego interfejsu użytkownika.

### Wizja produktu
Stworzyć najprostszą w obsłudze aplikację do śledzenia produktów w urządzeniach chłodniczych, eliminującą problem zapominania o zawartości lodówki przez wykorzystanie naturalnych poleceń głosowych.

### Zakres MVP
Podstawowa funkcjonalność głosowego dodawania/usuwania produktów z możliwością zapytań o zawartość, logowanie przez Google oraz responsywny interfejs webowy.

### Technologie
- Frontend: Astro 5, TypeScript 5, React 19, Tailwind 4, Shadcn/ui
- Backend: Supabase z PostgreSQL + Row Level Security
- AI: OpenRouter + GPT-4o-mini + TTS
- Autentykacja: Google OAuth przez Supabase Auth

## 2. Problem Użytkownika

### Podstawowy problem
Użytkownicy często nie pamiętają, co i gdzie znajduje się w ich lodówce lub zamrażarce, co prowadzi do:
- Marnowania żywności
- Niepotrzebnych zakupów duplikatów
- Frustracji podczas gotowania
- Braku świadomości dostępnych składników

### Grupa docelowa
Osoby prywatne zarządzające domowymi lodówkami i zamrażarkami, szczególnie:
- Osoby z wieloma urządzeniami chłodniczymi
- Osoby często zapominające o zawartości lodówki
- Użytkownicy preferujący głosowe interakcje zamiast manualnego wprowadzania danych

### Obecne rozwiązania i ich ograniczenia
- Papierowe listy - łatwo gubione, nieaktualne
- Aplikacje na telefon - wymagają manualnego wprowadzania danych
- Pamięć - zawodna, szczególnie przy dużej ilości produktów

## 3. Wymagania Funkcjonalne

### Funkcjonalności głosowe
- Dodawanie produktów głosowo z określeniem lokalizacji (zamrażarka/półka)
- Usuwanie produktów głosowo z automatyczną aktualizacją ilości
- Zapytania o zawartość lodówki/zamrażarki
- Sprawdzanie dostępności konkretnych produktów z lokalizacją
- Obsługa poleceń złożonych (wieloakcyjnych)
- Aktywacja przez floating button z timeout 30 sekund

### Zarządzanie danymi
- Struktura hierarchiczna: Kontenery → Półki → Produkty
- Definiowanie własnych nazw zamrażarek/lodówek
- Tworzenie i nazywanie półek w każdym kontenerze
- Automatyczne zwiększanie ilości przy duplikatach
- Jednostki miary w sztukach (różne rozmiary jako oddzielne produkty)

### Interfejs użytkownika
- Responsywny design (desktop/tablet/mobile)
- Grid layout: 2 karty na desktop/tablet, 1 karta na mobile
- Wyszukiwanie tekstowe produktów
- Edycja nazw kontenerów/półek przez UI
- Toast notifications dla błędów i potwierdzeń
- Wyświetlanie hierarchii: Kontenery → Półki → Lista produktów z ilościami

### Bezpieczeństwo i dostęp
- Logowanie przez Google OAuth
- Row Level Security (RLS) - izolacja danych użytkowników
- Brak cachowania - zawsze fresh data z bazy danych

## 4. Granice Produktu

### Włączone w MVP
- Logowanie przez Google
- Głosowe dodawanie/usuwanie produktów
- Zapytania "Co mam w lodówce?"
- Zapytania "Czy mam [produkt]?" z lokalizacją
- Definiowanie własnych nazw zamrażarek/półek
- Polecenia złożone (wieloakcyjne)
- Wyszukiwanie tekstowe
- Responsywny design (desktop/tablet/mobile)

### Wykluczone z MVP
- Multi-user accounts (konta rodzinne)
- Historia zmian i audyt
- Kody kreskowe/rozpoznawanie obrazu
- Powiadomienia o kończących się produktach
- Integracje z aplikacjami zakupowymi
- Planowanie posiłków
- Integracja z asystentami głosowymi (Google/Alexa)
- Export/backup danych
- Funkcjonalność offline
- Tutorial/onboarding
- Metryki i analytics
- Obsługa konfliktów multi-device
- Historia poleceń głosowych

### Ograniczenia techniczne
- Wymagane połączenie internetowe
- Obsługa tylko przeglądarek wspierających Web Speech API
- Brak limitów na ilość zamrażarek/półek/produktów

## 5. Historie Użytkownika

### US-001: Rejestracja i logowanie
Jako nowy użytkownik chcę zalogować się przez Google, aby uzyskać dostęp do aplikacji.

Kryteria akceptacji:
- System wyświetla przycisk "Zaloguj się przez Google"
- Po kliknięciu przekierowuje do autoryzacji Google OAuth
- Po pomyślnej autoryzacji użytkownik zostaje zalogowany
- System tworzy profil użytkownika w bazie danych
- Użytkownik zostaje przekierowany na główną stronę aplikacji

### US-002: Dodawanie pierwszej zamrażarki
Jako zalogowany użytkownik chcę dodać swoją pierwszą zamrażarkę, aby rozpocząć korzystanie z aplikacji.

Kryteria akceptacji:
- System wyświetla przycisk "Dodaj zamrażarkę"
- Po kliknięciu pojawia się formularz z polem nazwa
- Użytkownik może wybrać typ: zamrażarka/lodówka
- Po zapisaniu zamrażarka pojawia się na głównym ekranie
- System automatycznie tworzy rekord w tabeli containers

### US-003: Dodawanie półek do zamrażarki
Jako użytkownik chcę dodać półki do mojej zamrażarki, aby móc organizować produkty.

Kryteria akceptacji:
- W karcie zamrażarki dostępny jest przycisk "Dodaj półkę"
- Po kliknięciu pojawia się formularz z polem nazwa półki
- Użytkownik może określić pozycję półki
- Po zapisaniu półka pojawia się w strukturze zamrażarki
- System tworzy rekord w tabeli shelves

### US-004: Głosowe dodawanie produktu
Jako użytkownik chcę dodać produkt głosowo, aby szybko zaktualizować zawartość lodówki.

Kryteria akceptacji:
- Na ekranie widoczny jest floating button mikrofonu
- Po kliknięciu system aktywuje nasłuchiwanie (max 30s)
- System wyświetla wizualny feedback podczas nagrywania
- Po wypowiedzeniu "dodaj mleko do pierwszej półki" system rozpoznaje polecenie
- Jeśli brak lokalizacji, system pyta głosowo o szczegóły
- Produkt zostaje dodany do odpowiedniej półki z ilością 1
- System wyświetla toast z potwierdzeniem operacji

### US-005: Głosowe usuwanie produktu
Jako użytkownik chcę usunąć produkt głosowo, aby zaktualizować stan po zużyciu.

Kryteria akceptacji:
- Po aktywacji mikrofonu wypowiadam "wyjąłem mleko"
- System rozpoznaje polecenie usunięcia
- Jeśli produkt istnieje w wielu lokalizacjach, system pyta o precyzyjną lokalizację
- Produkt zostaje usunięty lub zmniejszona jego ilość
- System wyświetla toast z potwierdzeniem operacji
- Jeśli produktu nie ma, system wyświetla odpowiedni komunikat

### US-006: Zapytanie o zawartość
Jako użytkownik chcę zapytać "co mam w zamrażarce", aby poznać pełną zawartość.

Kryteria akceptacji:
- Po aktywacji mikrofonu wypowiadam "co mam w zamrażarce kuchennej"
- System rozpoznaje zapytanie i wskazuje odpowiednią zamrażarkę
- System wyświetla listę wszystkich produktów pogrupowanych po półkach
- Każdy produkt wyświetlany z ilością i lokalizacją
- Lista jest czytelna i zorganizowana hierarchicznie

### US-007: Sprawdzanie dostępności produktu
Jako użytkownik chcę zapytać "czy mam pomidory", aby sprawdzić dostępność konkretnego produktu.

Kryteria akceptacji:
- Po aktywacji mikrofonu wypowiadam "czy mam pomidory"
- System przeszukuje wszystkie lokalizacje użytkownika
- Jeśli produkt istnieje, system odpowiada "Tak, masz 2 sztuki na pierwszej półce w zamrażarce kuchennej"
- Jeśli produkt nie istnieje, system odpowiada "Nie masz pomidorów"
- Odpowiedź jest precyzyjna i zawiera lokalizację

### US-008: Polecenia złożone
Jako użytkownik chcę wydać polecenie "dodaj mleko i usuń ser", aby wykonać wiele operacji jednocześnie.

Kryteria akceptacji:
- System rozpoznaje polecenie złożone
- AI parsuje polecenie na listę pojedynczych akcji
- System wykonuje akcje sekwencyjnie
- Po każdej akcji wyświetla toast z potwierdzeniem
- Jeśli któraś akcja się nie powiedzie, pozostałe są nadal wykonywane
- System informuje o powodzeniu/niepowodzeniu każdej akcji

### US-009: Wyszukiwanie tekstowe
Jako użytkownik chcę wyszukać produkt przez wpisanie nazwy, aby szybko go znaleźć.

Kryteria akceptacji:
- Na głównym ekranie dostępne jest pole wyszukiwania
- Po wpisaniu nazwy produktu system filtruje wyniki w czasie rzeczywistym
- Wyszukiwanie używa LIKE/ILIKE do częściowego dopasowania
- Wyniki pokazują produkt z jego lokalizacją i ilością
- Wyszukiwanie działa dla wszystkich zamrażarek użytkownika

### US-010: Edycja nazw kontenerów
Jako użytkownik chcę zmienić nazwę zamrażarki, aby lepiej ją zidentyfikować.

Kryteria akceptacji:
- W karcie zamrażarki dostępny jest przycisk edycji nazwy
- Po kliknięciu pojawia się edytowalny input z aktualną nazwą
- Po zatwierdzeniu nazwa zostaje zaktualizowana w bazie danych
- Zmiana jest natychmiast widoczna w interfejsie
- System wyświetla toast z potwierdzeniem zmiany

### US-011: Edycja nazw półek
Jako użytkownik chcę zmienić nazwę półki, aby lepiej ją opisać.

Kryteria akceptacji:
- Przy każdej półce dostępny jest przycisk edycji
- Po kliknięciu pojawia się edytowalny input
- Po zatwierdzeniu nazwa zostaje zaktualizowana
- Zmiana jest natychmiast widoczna
- System wyświetla toast z potwierdzeniem

### US-012: Usuwanie pustych kontenerów
Jako użytkownik chcę usunąć pustą zamrażarkę, której już nie używam.

Kryteria akceptacji:
- Przycisk usuwania dostępny tylko dla pustych zamrażarek
- System sprawdza czy zamrażarka nie zawiera żadnych produktów
- Po kliknięciu pojawia się dialog potwierdzenia
- Po potwierdzeniu zamrażarka zostaje usunięta z cascade na półki
- System wyświetla toast z potwierdzeniem operacji

### US-013: Usuwanie pustych półek
Jako użytkownik chcę usunąć pustą półkę, której już nie potrzebuję.

Kryteria akceptacji:
- Przycisk usuwania dostępny tylko dla pustych półek
- System sprawdza czy półka nie zawiera żadnych produktów
- Po kliknięciu pojawia się dialog potwierdzenia
- Po potwierdzeniu półka zostaje usunięta
- System wyświetla toast z potwierdzeniem

### US-014: Obsługa błędów mikrofonu
Jako użytkownik chcę otrzymać jasny komunikat, gdy mikrofon nie działa.

Kryteria akceptacji:
- System sprawdza uprawnienia mikrofonu przed rozpoczęciem nagrywania
- Jeśli brak uprawnień, wyświetla toast "Sprawdź uprawnienia mikrofonu"
- Jeśli mikrofon jest zajęty, wyświetla odpowiedni komunikat
- System gracefully obsługuje wszystkie błędy związane z mikrofonem
- Użytkownik zawsze otrzymuje jasny feedback o problemie

### US-015: Obsługa błędów sieci
Jako użytkownik chcę otrzymać informację, gdy brak jest połączenia z internetem.

Kryteria akceptacji:
- System wykrywa brak połączenia internetowego
- Wyświetla toast "Brak połączenia. Sprawdź internet."
- Polecenia głosowe są blokowane podczas braku połączenia
- Po przywróceniu połączenia system automatycznie wznawia działanie
- Wszystkie operacje wymagają aktywnego połączenia

### US-016: Responsywny design na desktopie
Jako użytkownik komputera chcę wygodnie korzystać z aplikacji na dużym ekranie.

Kryteria akceptacji:
- Layout wyświetla 2 karty zamrażarek obok siebie
- Karty są proporcjonalnie rozłożone na dostępnej przestrzeni
- Floating button mikrofonu jest łatwo dostępny
- Wszystkie elementy UI są czytelne i dobrze rozłożone
- Aplikacja wykorzystuje dostępną przestrzeń ekranu

### US-017: Responsywny design na mobile
Jako użytkownik telefonu chcę wygodnie korzystać z aplikacji na małym ekranie.

Kryteria akceptacji:
- Layout wyświetla 1 kartę zamrażarki na szerokość ekranu
- Wszystkie elementy są łatwo dostępne palcem
- Floating button mikrofonu jest odpowiednio pozycjonowany
- Tekst jest czytelny bez zbędnego przewijania
- Aplikacja działa płynnie na urządzeniach mobilnych

### US-018: Automatyczne zwiększanie ilości duplikatów
Jako użytkownik chcę, aby dodanie istniejącego produktu zwiększyło jego ilość.

Kryteria akceptacji:
- Gdy wypowiem "dodaj mleko" a mleko już istnieje na tej półce
- System zwiększa ilość mleka o 1 zamiast tworzyć nowy rekord
- Jeśli określę konkretną ilość "dodaj 3 mleka", system dodaje 3 do istniejącej ilości
- Operacja jest potwierdzona przez toast
- Zmiana jest natychmiast widoczna w UI

### US-019: Rozpoznawanie synonimów przez AI
Jako użytkownik chcę móc używać różnych nazw tego samego produktu.

Kryteria akceptacji:
- AI rozpoznaje "pomidory", "pomidor", "pomidorki" jako ten sam produkt
- System inteligentnie dopasowuje podobne nazwy
- Użytkownik może używać naturalnego języka
- AI uwzględnia kontekst istniejących produktów użytkownika
- Decyzje AI są konsystentne i przewidywalne

### US-020: Timeout sesji głosowej
Jako użytkownik chcę, aby sesja głosowa automatycznie się kończyła.

Kryteria akceptacji:
- Po aktywacji mikrofon nasłuchuje maksymalnie 30 sekund
- System wyświetla wizualny countdown lub progress bar
- Po upływie czasu sesja automatycznie się kończy
- Użytkownik może wcześniej zakończyć sesję przez ponowne kliknięcie
- System informuje o zakończeniu sesji

## 6. Metryki Sukcesu

### Metryka podstawowa
Zadowolenie użytkowników mierzone przez:
- Częstotliwość korzystania z aplikacji
- Czas spędzony w aplikacji
- Liczba wykonanych poleceń głosowych dziennie

### Metryki funkcjonalne
- Dokładność rozpoznawania poleceń głosowych (target: >90%)
- Czas odpowiedzi systemu na polecenia (target: <3 sekundy)
- Częstotliwość błędów AI w interpretacji poleceń (target: <5%)

### Metryki użyteczności
- Łatwość pierwszego użycia (onboarding completion rate)
- Retencja użytkowników po tygodniu (target: >60%)
- Średnia liczba produktów na użytkownika (wskaźnik adopcji)

### Metryki techniczne
- Uptime aplikacji (target: >99%)
- Czas ładowania strony (target: <2 sekundy)
- Błędy związane z integracją Supabase (target: <1%)

### Definicja sukcesu MVP
MVP zostanie uznane za sukces, jeśli:
- Użytkownicy będą w stanie intuicyjnie korzystać z poleceń głosowych bez instrukcji
- Aplikacja będzie stabilnie działać na różnych urządzeniach i przeglądarkach
- Podstawowe operacje (dodawanie/usuwanie/sprawdzanie produktów) będą działać bezproblemowo
- Użytkownicy będą wyrażać chęć dalszego korzystania z aplikacji 