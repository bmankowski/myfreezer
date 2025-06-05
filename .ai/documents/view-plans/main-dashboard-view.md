# Plan implementacji widoku: Główny Dashboard

## 1. Przegląd

Główny Dashboard to centralne miejsce aplikacji MyFreezer, gdzie użytkownicy zarządzają zawartością swoich lodówek i zamrażarek. Widok obsługuje hierarchiczną strukturę Kontenery → Półki → Produkty, integruje funkcjonalność głosową, wyszukiwanie tekstowe oraz pełne zarządzanie danymi przez GUI.

## 2. Routing widoku

**Ścieżka**: `/` (stan uwierzytelniony z istniejącymi kontenerami)
**Warunki dostępu**: 
- Użytkownik zalogowany (sprawdzenie lokalnej sesji Supabase)
- Posiada co najmniej jeden kontener
- Aktywna sesja weryfikowana lokalnie

## 3. Struktura komponentów

```
MainDashboardView
├── Header
│   ├── AppTitle
│   ├── SearchInput
│   └── UserProfile
├── ContainerGrid
│   └── ContainerCard[]
│       ├── ContainerHeader
│       │   ├── ContainerTitle (edytowalny)
│       │   └── ContainerActions
│       └── ShelfList
│           └── ShelfSection[]
│               ├── ShelfHeader
│               │   ├── ShelfTitle (edytowalny)  
│               │   └── ShelfActions
│               └── ItemList
│                   └── ItemRow[]
├── FloatingMicrophone
├── ToastContainer
└── ModalContainer
    ├── EditContainerModal
    ├── EditShelfModal
    └── AddItemModal
```

## 4. Szczegóły komponentów

### MainDashboardView (główny kontener)

- **Opis komponentu**: Główny kontener zarządzający stanem całego dashboard'u i koordynujący komunikację między komponentami
- **Główne elementy**: Layout wrapper, grid kontenerów, floating elements
- **Komponenty podrzędne**: Header, ContainerGrid, FloatingMicrophone, ToastContainer, ModalContainer
- **Obsługiwane interakcje**:
  - Wczytywanie danych kontenerów przy montowaniu
  - Obsługa wyników wyszukiwania
  - Koordynacja między komponentami voice i GUI
  - Zarządzanie globalnym stanem loading/error
- **Walidacja**:
  - Sprawdzenie czy użytkownik ma kontenery
  - Weryfikacja aktywnej sesji lokalnie
  - Sprawdzenie uprawnień do operacji
- **Typy**: `ContainerListResponseDTO`, `ItemSearchResponseDTO`, stan globalny dashboard'u, Supabase session
- **Props**: Brak (główny komponent strony)

### Header

- **Opis komponentu**: Sticky header z wyszukiwaniem i informacjami o użytkowniku
- **Główne elementy**: Logo, pole wyszukiwania, avatar użytkownika
- **Komponenty podrzędne**: SearchInput, UserProfile
- **Obsługiwane interakcje**:
  - Wyszukiwanie w czasie rzeczywistym z debounce 300ms
  - Czyszczenie wyników wyszukiwania
  - Menu użytkownika (opcjonalnie)
- **Walidacja**: Walidacja długości query wyszukiwania (min 2 znaki)
- **Typy**: `ItemSearchParams`, search results state
- **Props**: 
  - `onSearch: (query: string) => void`
  - `searchResults?: ItemWithLocationDTO[]`
  - `isSearching?: boolean`

### ContainerGrid

- **Opis komponentu**: Responsywny grid wyświetlający karty kontenerów
- **Główne elementy**: CSS Grid z responsive breakpoints
- **Komponenty podrzędne**: ContainerCard dla każdego kontenera
- **Obsługiwane interakcje**: Przekazywanie danych do kart kontenerów
- **Walidacja**: Sprawdzenie czy są kontenery do wyświetlenia
- **Typy**: `ContainerDetailsDTO[]`
- **Props**:
  - `containers: ContainerDetailsDTO[]`
  - `searchQuery?: string`
  - `onContainerUpdate: (id: string, data: UpdateContainerCommandDTO) => void`
  - `onContainerDelete: (id: string) => void`

### ContainerCard

- **Opis komponentu**: Karta pojedynczego kontenera z hierarchiczną strukturą półek i produktów
- **Główne elementy**: Header z nazwą i typem, lista półek, przyciski akcji
- **Komponenty podrzędne**: ContainerHeader, ShelfList
- **Obsługiwane interakcje**:
  - Edycja nazwy kontenera (modal)
  - Dodawanie nowych półek
  - Usuwanie pustego kontenera
  - Filtrowanie produktów wg wyszukiwania
- **Walidacja**:
  - Sprawdzenie czy kontener jest pusty przed usunięciem
  - Walidacja nazwy przy edycji
- **Typy**: `ContainerDetailsDTO`, `CreateShelfCommandDTO`, `UpdateContainerCommandDTO`
- **Props**:
  - `container: ContainerDetailsDTO`
  - `searchQuery?: string`
  - `onUpdate: (data: UpdateContainerCommandDTO) => void`
  - `onDelete: () => void`
  - `onShelfAdd: (data: CreateShelfCommandDTO) => void`

### ContainerHeader

- **Opis komponentu**: Header karty kontenera z nazwą, typem i akcjami
- **Główne elementy**: Tytuł z kolorem wg typu, ikona, menu akcji
- **Obsługiwane interakcje**:
  - Kliknięcie w tytuł → edycja nazwy
  - Menu akcji → edytuj/usuń
- **Walidacja**: Walidacja nazwy (niepusta, max 255 znaków)
- **Typy**: Podstawowe string i event handlers
- **Props**:
  - `name: string`
  - `type: ContainerType`
  - `isEmpty: boolean`
  - `onEdit: () => void`
  - `onDelete: () => void`

### ShelfList

- **Opis komponentu**: Lista wszystkich półek w kontenerze
- **Główne elementy**: Sekcje półek posortowane według pozycji
- **Komponenty podrzędne**: ShelfSection dla każdej półki
- **Obsługiwane interakcje**: Zarządzanie półkami i ich produktami
- **Walidacja**: Sprawdzenie poprawności danych półek
- **Typy**: `ShelfWithItemsDTO[]`
- **Props**:
  - `shelves: ShelfWithItemsDTO[]`
  - `containerId: string`
  - `searchQuery?: string`
  - `onShelfUpdate: (shelfId: string, data: UpdateShelfCommandDTO) => void`
  - `onShelfDelete: (shelfId: string) => void`

### ShelfSection

- **Opis komponentu**: Sekcja pojedynczej półki z jej produktami
- **Główne elementy**: Header półki, lista produktów, przycisk dodawania
- **Komponenty podrzędne**: ShelfHeader, ItemList
- **Obsługiwane interakcje**:
  - Edycja nazwy półki
  - Dodawanie produktów
  - Usuwanie pustej półki
  - Zarządzanie produktami
- **Walidacja**:
  - Sprawdzenie czy półka jest pusta przed usunięciem
  - Walidacja nazwy półki
- **Typy**: `ShelfWithItemsDTO`, `AddItemCommandDTO`
- **Props**:
  - `shelf: ShelfWithItemsDTO`
  - `containerId: string`
  - `searchQuery?: string`
  - `onUpdate: (data: UpdateShelfCommandDTO) => void`
  - `onDelete: () => void`
  - `onItemAdd: (data: AddItemCommandDTO) => void`

### ShelfHeader

- **Opis komponentu**: Header sekcji półki z nazwą i akcjami
- **Główne elementy**: Nazwa półki, pozycja, menu akcji
- **Obsługiwane interakcje**:
  - Edycja nazwy przez kliknięcie
  - Menu akcji półki
- **Walidacja**: Walidacja nazwy półki
- **Typy**: Basic props i event handlers  
- **Props**:
  - `name: string`
  - `position: number`
  - `isEmpty: boolean`
  - `onEdit: () => void`
  - `onDelete: () => void`

### ItemList

- **Opis komponentu**: Lista produktów na półce
- **Główne elementy**: Lista elementów ItemRow
- **Komponenty podrzędne**: ItemRow dla każdego produktu
- **Obsługiwane interakcje**: Zarządzanie poszczególnymi produktami
- **Walidacja**: Filtrowanie wg wyszukiwania
- **Typy**: `Item[]` z półki
- **Props**:
  - `items: Item[]`
  - `searchQuery?: string`
  - `onItemUpdate: (itemId: string, data: UpdateItemQuantityCommandDTO) => void`
  - `onItemRemove: (itemId: string, data: RemoveItemQuantityCommandDTO) => void`
  - `onItemDelete: (itemId: string) => void`
  - `onItemMove: (itemId: string, data: MoveItemCommandDTO) => void`

### ItemRow

- **Opis komponentu**: Pojedynczy wiersz produktu z nazwą, ilością i akcjami
- **Główne elementy**: Nazwa produktu, ilość, przyciski +/-, usuń, przenieś
- **Obsługiwane interakcje**:
  - Zwiększanie/zmniejszanie ilości
  - Usuwanie produktu
  - Przenoszenie między półkami
  - Edycja nazwy (opcjonalnie)
- **Walidacja**:
  - Sprawdzenie czy ilość > 0
  - Walidacja docelowej półki przy przenoszeniu
- **Typy**: `Item`, wszystkie command DTOs dla operacji na produktach
- **Props**:
  - `item: Item`
  - `onQuantityUpdate: (data: UpdateItemQuantityCommandDTO) => void`
  - `onQuantityRemove: (data: RemoveItemQuantityCommandDTO) => void`
  - `onDelete: () => void`
  - `onMove: (data: MoveItemCommandDTO) => void`

### FloatingMicrophone

- **Opis komponentu**: Floating action button do obsługi poleceń głosowych
- **Główne elementy**: Circular button, progress ring, ikona mikrofonu, status indicator
- **Obsługiwane interakcje**:
  - Kliknięcie aktywuje nagrywanie (30s timeout)
  - Visual feedback podczas nagrywania
  - Wysyłanie komendy do `/api/voice/process`
  - Wyświetlanie wyników przez toast
- **Walidacja**:
  - Sprawdzenie dostępności Web Speech API
  - Weryfikacja uprawnień mikrofonu
  - Timeout na nagrywanie
- **Typy**: `VoiceProcessCommandDTO`, `VoiceProcessResponseDTO`
- **Props**:
  - `onCommandSuccess?: (response: VoiceProcessResponseDTO) => void`
  - `onCommandError?: (error: string) => void`

### ToastContainer

- **Opis komponentu**: System powiadomień dla wszystkich operacji
- **Główne elementy**: Fixed container, toast queue, różne typy (success/error/warning/info)
- **Obsługiwane interakcje**:
  - Auto-dismiss po 2 sekundach
  - Hover to persist
  - Kolejkowanie wielu powiadomień
- **Walidacja**: Brak
- **Typy**: Toast queue state, toast types
- **Props**:
  - `toasts: Toast[]`
  - `onDismiss: (id: string) => void`

## 5. Typy

### Nowe typy widokowe

```typescript
interface DashboardState {
  containers: ContainerDetailsDTO[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  searchResults: ItemWithLocationDTO[];
  isSearching: boolean;
  isAuthenticated: boolean | null;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

interface VoiceState {
  isRecording: boolean;
  isProcessing: boolean;
  hasPermission: boolean | null;
  error: string | null;
  progress: number; // 0-100 dla progress ring
}

interface ContainerCardProps {
  container: ContainerDetailsDTO;
  searchQuery?: string;
  onUpdate: (data: UpdateContainerCommandDTO) => void;
  onDelete: () => void;
  onShelfAdd: (data: CreateShelfCommandDTO) => void;
}

interface ItemRowProps {
  item: Item;
  onQuantityUpdate: (data: UpdateItemQuantityCommandDTO) => void;
  onQuantityRemove: (data: RemoveItemQuantityCommandDTO) => void;
  onDelete: () => void;
  onMove: (data: MoveItemCommandDTO) => void;
}
```

### Wykorzystywane typy z types.ts

- `ContainerListResponseDTO` - lista kontenerów
- `ContainerDetailsDTO` - szczegóły kontenera z półkami i produktami
- `CreateContainerCommandDTO`, `UpdateContainerCommandDTO` - operacje na kontenerach
- `CreateShelfCommandDTO`, `UpdateShelfCommandDTO` - operacje na półkach
- `AddItemCommandDTO`, `UpdateItemQuantityCommandDTO`, `RemoveItemQuantityCommandDTO`, `MoveItemCommandDTO` - operacje na produktach
- `ItemSearchResponseDTO`, `ItemWithLocationDTO` - wyszukiwanie
- `VoiceProcessCommandDTO`, `VoiceProcessResponseDTO` - komendy głosowe
- `ItemSearchParams` - parametry wyszukiwania
- Supabase Session, User types - zarządzanie autoryzacją

## 6. Zarządzanie stanem

### Stan globalny Dashboard

```typescript
const useDashboard = () => {
  const [state, setState] = useState<DashboardState>({
    containers: [],
    isLoading: true,
    error: null,
    searchQuery: '',
    searchResults: [],
    isSearching: false,
    isAuthenticated: null
  });
  
  const loadContainers = async () => { /* GET /api/containers z pełnymi danymi */ };
  const searchItems = async (query: string) => { /* GET /api/items?q=query */ };
  const updateContainer = async (id: string, data: UpdateContainerCommandDTO) => { /* PUT /api/containers/{id} */ };
  
  const checkAuth = () => {
    const { data: { session } } = supabase.auth.getSession();
    const isAuth = !!session?.user;
    setState(prev => ({ ...prev, isAuthenticated: isAuth }));
    return isAuth;
  };
  
  return { state, loadContainers, searchItems, updateContainer, checkAuth, ... };
}
```

### Stan lokalny komponentów

- **Search state**: debounce query, aktualny search, loading search
- **Voice state**: recording, processing, permissions, progress
- **Modal state**: aktualnie otwarty modal, dane do edycji
- **Toast state**: kolejka powiadomień
- **Auth state**: stan autoryzacji z Supabase session

### Custom hooks

- `useDebounce` - opóźnienie wyszukiwania
- `useVoiceRecording` - obsługa nagrywania głosowego  
- `useToasts` - zarządzanie powiadomieniami
- `useContainers` - operacje CRUD na kontenerach
- `useAuth` - zarządzanie stanem autoryzacji lokalnie

## 7. Integracja z API

### Wykorzystywane endpointy

**Autoryzacja**
- `supabase.auth.getSession()` → Lokalne sprawdzenie sesji
- `supabase.auth.onAuthStateChange()` → Reaktywne śledzenie zmian autoryzacji

**Containers**
- `GET /api/containers` → `ContainerListResponseDTO`
- `GET /api/containers/{id}` → `ContainerDetailsDTO`  
- `POST /api/containers` → Tworzenie kontenera
- `PUT /api/containers/{id}` → Aktualizacja kontenera
- `DELETE /api/containers/{id}` → Usuwanie kontenera

**Shelves**
- `POST /api/containers/{id}/shelves` → Tworzenie półki
- `PUT /api/shelves/{id}` → Aktualizacja półki
- `DELETE /api/shelves/{id}` → Usuwanie półki

**Items**
- `GET /api/items` → `ItemSearchResponseDTO` (wyszukiwanie)
- `POST /api/shelves/{id}/items` → Dodawanie produktu
- `PUT /api/items/{id}` → Aktualizacja ilości
- `PATCH /api/items/{id}/remove` → Zmniejszanie ilości
- `DELETE /api/items/{id}` → Usuwanie produktu
- `PATCH /api/items/{id}/move` → Przenoszenie produktu

**Voice**
- `POST /api/voice/process` → `VoiceProcessResponseDTO`
- `POST /api/voice/query` → `VoiceQueryResponseDTO`

## 8. Interakcje użytkownika

### Wyszukiwanie tekstowe

1. Użytkownik wpisuje w pole wyszukiwania
2. Debounce 300ms przed wysłaniem zapytania
3. Wywołanie `GET /api/items?q={query}`
4. Filtrowanie wyświetlanych produktów w interfejsie
5. Highlight znalezionych elementów
6. Czyszczenie przez X lub pusty query

### Głosowe dodawanie produktu

1. Kliknięcie floating microphone button
2. Sprawdzenie uprawnień mikrofonu
3. Rozpoczęcie nagrywania z progress ring (30s timeout)
4. Zatrzymanie nagrywania po kolejnym kliknięciu lub timeout
5. Wysłanie do `POST /api/voice/process`
6. Wyświetlenie wyników operacji przez toast
7. Odświeżenie danych jeśli sukces

### Zarządzanie kontenerami

**Dodawanie kontenera**:
1. Przycisk "Dodaj kontener" → modal
2. Formularz z nazwą i typem
3. `POST /api/containers`
4. Aktualizacja lokalnego stanu
5. Toast z potwierdzeniem

**Edycja kontenera**:
1. Kliknięcie nazwy lub menu → modal edycji
2. Formularz z aktualnymi danymi
3. `PUT /api/containers/{id}`
4. Aktualizacja stanu i UI
5. Toast z potwierdzeniem

**Usuwanie kontenera**:
1. Menu akcji → "Usuń" (tylko jeśli pusty)
2. Confirmation dialog
3. `DELETE /api/containers/{id}`
4. Usunięcie z lokalnego stanu
5. Toast z potwierdzeniem

### Zarządzanie półkami

Analogiczne do kontenerów, ale w kontekście danego kontenera.

### Zarządzanie produktami

**Dodawanie**: inline form w sekcji półki
**Edycja ilości**: przyciski +/- przy produkcie
**Usuwanie**: przycisk X z confirmation
**Przenoszenie**: dropdown z listą dostępnych półek

## 9. Warunki i walidacja

### Walidacja przed operacjami

- **Dodawanie kontenera**: niepusta nazwa, poprawny typ
- **Usuwanie kontenera**: sprawdzenie czy jest pusty
- **Dodawanie półki**: niepusta nazwa, unikalna pozycja w kontenerze
- **Usuwanie półki**: sprawdzenie czy jest pusta
- **Dodawanie produktu**: niepusta nazwa, ilość > 0
- **Edycja ilości**: wartość >= 0

### Walidacja autoryzacji

- Sprawdzenie aktywnej sesji przez `supabase.auth.getSession()`
- Reaktywne śledzenie zmian przez `onAuthStateChange()`
- RLS automatycznie filtruje dane użytkownika w API
- Przekierowanie do logowania przy braku sesji

### Walidacja UI

- Sprawdzenie czy kontener ma półki przed dodawaniem produktów
- Weryfikacja dostępności półek do przenoszenia
- Sprawdzenie czy są dane do wyświetlenia
- Walidacja uprawnień lokalnie przed wyświetleniem opcji

## 10. Obsługa błędów

### Błędy sieci/API

- **Timeout**: Toast "Przekroczono czas oczekiwania"
- **500 Server Error**: Toast "Błąd serwera, spróbuj ponownie"
- **401 Unauthorized**: Przekierowanie do logowania + wylogowanie lokalne
- **404 Not Found**: Toast "Zasób nie został znaleziony"
- **Błąd walidacji**: Toast z konkretnym komunikatem

### Błędy autoryzacji

- **Brak sesji**: Automatyczne przekierowanie do logowania
- **Sesja wygasła**: Wylogowanie + przekierowanie + toast z informacją
- **Błąd Supabase auth**: Toast "Problem z autoryzacją"
- **RLS violation**: Toast "Brak uprawnień do zasobu"

### Błędy voice

- **Brak uprawnień mikrofonu**: Toast "Zezwól na dostęp do mikrofonu"
- **Brak obsługi Web Speech API**: Ukrycie przycisku mikrofonu
- **Timeout nagrywania**: Toast "Czas nagrywania upłynął"
- **Błąd parsowania komendy**: Toast z sugestią poprawnej komendy

### Błędy walidacji

- **Puste pola**: Highlight pola + tooltip
- **Niepoprawne dane**: Komunikat pod polem
- **Konflikty**: Toast z wyjaśnieniem konfliktu

### Scenariusze fallback

- **Brak danych**: Wyświetlenie empty state
- **Błędy ładowania**: Przycisk "Spróbuj ponownie"
- **Częściowe błędy**: Wyświetlenie udanych operacji + błędów

## 11. Kroki implementacji

1. **Podstawowa struktura i routing**
   - Utworzenie `src/pages/index.astro` z warunkami dla auth
   - Implementacja podstawowego layoutu z Header i Grid
   - Dodanie responsywnego CSS Grid dla kontenerów

2. **Zarządzanie stanem globalnym i autoryzacji**
   - Implementacja `useDashboard` hook z autoryzacją w `src/lib/hooks/`
   - Dodanie `useAuth` hook z `getSession()` i `onAuthStateChange()`
   - Utworzenie serwisów API w `src/lib/services/`
   - Dodanie zarządzania stanem loading/error

3. **Komponenty kontenerów i hierarchii**
   - `ContainerCard.tsx` z podstawową strukturą
   - `ShelfSection.tsx` z listą produktów
   - `ItemRow.tsx` z operacjami na produktach
   - Integracja z API endpoints

4. **System wyszukiwania**
   - `SearchInput.tsx` z debounce
   - Integracja z `/api/items` endpoint
   - Filtrowanie i highlighting wyników
   - Zarządzanie stanem wyszukiwania

5. **Funkcjonalność głosowa**
   - `FloatingMicrophone.tsx` z Web Speech API
   - `useVoiceRecording` hook
   - Progress indicator i visual feedback
   - Integracja z `/api/voice/process`

6. **Modalne i formularze**
   - `EditContainerModal.tsx`, `EditShelfModal.tsx`
   - `AddItemModal.tsx` z walidacją
   - Zarządzanie stanem modali
   - Integracja z odpowiednimi API

7. **System powiadomień**
   - `ToastContainer.tsx` z kolejką
   - `useToasts` hook
   - Różne typy powiadomień
   - Auto-dismiss i hover to persist

8. **Optymalizacje i finalizacja**
   - Optymistic updates dla lepszego UX
   - Loading states dla wszystkich operacji
   - Error boundaries i graceful degradation
   - Performance optimizations (memo, useMemo)

9. **Testowanie i debugging**
   - Testowanie wszystkich user flows
   - Sprawdzenie responsywności
   - Testowanie voice functionality
   - Edge cases i error scenarios 