# Plan implementacji widoku: Pusty Stan

## 1. Przegląd

Widok pustego stanu to pierwsza interakcja zalogowanego użytkownika z aplikacją MyFreezer, gdy nie posiada jeszcze żadnych kontenerów. Jego celem jest onboarding nowych użytkowników przez prezentację funkcjonalności i umożliwienie łatwego utworzenia pierwszego kontenera.

## 2. Routing widoku

**Ścieżka**: `/` (stan uwierzytelniony bez kontenerów)
**Warunki dostępu**: 
- Użytkownik zalogowany (aktywna sesja)
- Brak kontenerów w bazie danych

**Przekierowania po akcjach**:
- Po utworzeniu pierwszego kontenera → Main Dashboard View
- Przy błędach auth → Login/Landing View

## 3. Struktura komponentów

```
EmptyStateView
├── Header
│   ├── AppTitle  
│   └── UserProfile
├── EmptyStateContent
│   ├── WelcomeSection
│   │   ├── WelcomeHeading
│   │   ├── AppDescription
│   │   └── FeaturesList
│   ├── CallToAction
│   │   ├── PrimaryButton ("Dodaj pierwszą zamrażarkę")
│   │   └── SecondaryHint (info o komendach głosowych)
│   └── IllustrationOrIcon
└── CreateContainerModal
    ├── ModalHeader
    ├── ContainerForm
    │   ├── NameInput
    │   ├── TypeSelector (Zamrażarka/Lodówka)
    │   └── FormActions
    └── LoadingState
```

## 4. Szczegóły komponentów

### EmptyStateView (główny kontener)

- **Opis komponentu**: Główny kontener widoku pustego stanu, zarządza stanem tworzenia pierwszego kontenera
- **Główne elementy**: Header, centralna sekcja z welcome message, modal do tworzenia kontenera
- **Komponenty podrzędne**: Header, EmptyStateContent, CreateContainerModal
- **Obsługiwane interakcje**:
  - Sprawdzenie czy użytkownik ma kontenery przy montowaniu
  - Obsługa otwarcia modala tworzenia kontenera
  - Przekierowanie do dashboard po utworzeniu kontenera
  - Zarządzanie stanem loading i błędów
- **Walidacja**:
  - Weryfikacja stanu uwierzytelnienia
  - Sprawdzenie czy rzeczywiście brak kontenerów
  - Weryfikacja uprawnień do tworzenia kontenerów
- **Typy**: `ContainerListResponseDTO`, `CreateContainerCommandDTO`, stan modala
- **Props**: Brak (główny komponent strony)

### Header

- **Opis komponentu**: Uproszczony header bez wyszukiwania, z logo i profilem użytkownika
- **Główne elementy**: Logo/nazwa aplikacji, avatar użytkownika z podstawowym menu
- **Komponenty podrzędne**: UserProfile (opcjonalnie)
- **Obsługiwane interakcje**:
  - Menu użytkownika (wylogowanie)
  - Branding aplikacji
- **Walidacja**: Brak
- **Typy**: User session info
- **Props**: 
  - `userName?: string`
  - `onLogout?: () => void`

### EmptyStateContent

- **Opis komponentu**: Główna sekcja z welcome message i call-to-action
- **Główne elementy**: Welcome heading, opis aplikacji, lista funkcjonalności, główny przycisk akcji
- **Komponenty podrzędne**: WelcomeSection, CallToAction, IllustrationOrIcon
- **Obsługiwane interakcje**:
  - Kliknięcie głównego CTA → otwarcie modala
  - Prezentacja informacji o aplikacji
- **Walidacja**: Brak
- **Typy**: Event handlers dla otwierania modala
- **Props**:
  - `onCreateFirstContainer: () => void`

### WelcomeSection

- **Opis komponentu**: Sekcja powitalna z opisem aplikacji i jej możliwości
- **Główne elementy**: 
  - Nagłówek "Witaj w MyFreezer!"
  - Opis "Zarządzaj zawartością lodówki i zamrażarki głosowo"
  - Lista głównych funkcjonalności
- **Komponenty podrzędne**: FeaturesList
- **Obsługiwane interakcje**: Prezentacja informacji
- **Walidacja**: Brak
- **Typy**: Brak specjalnych typów
- **Props**: Brak

### FeaturesList

- **Opis komponentu**: Lista głównych funkcjonalności aplikacji dla nowych użytkowników
- **Główne elementy**: 
  - Ikony z opisami funkcjonalności:
    - 🎤 "Dodawaj produkty głosowo"
    - 🔍 "Sprawdzaj zawartość jedną komendą"
    - 📱 "Zarządzaj przez interfejs"
    - 🗂️ "Organizuj w półki i kontenery"
- **Obsługiwane interakcje**: Statyczna prezentacja
- **Walidacja**: Brak
- **Typy**: Lista feature items
- **Props**: Brak

### CallToAction

- **Opis komponentu**: Sekcja z głównym call-to-action i wskazówkami
- **Główne elementy**: 
  - Główny przycisk "Dodaj pierwszą zamrażarkę"
  - Dodatkowa informacja o komendach głosowych
  - Hint "Po utworzeniu kontenera będziesz mógł używać komend głosowych"
- **Obsługiwane interakcje**:
  - Kliknięcie przycisku → otwarcie modala
- **Walidacja**: Brak
- **Typy**: Event handlers
- **Props**:
  - `onPrimaryAction: () => void`
  - `isLoading?: boolean`

### CreateContainerModal

- **Opis komponentu**: Modal do tworzenia pierwszego kontenera z formularzem
- **Główne elementy**: Header modala, formularz z polami, przyciski akcji, loading state
- **Komponenty podrzędne**: ContainerForm
- **Obsługiwane interakcje**:
  - Wypełnienie formularza (nazwa, typ)
  - Walidacja danych
  - Wysłanie żądania POST /api/containers
  - Zamknięcie modala
  - Obsługa błędów
- **Walidacja**:
  - Nazwa kontenera (niepusta, max 255 znaków)
  - Typ kontenera (zamrażarka/lodówka)
  - Sprawdzenie czy formularz jest kompletny
- **Typy**: `CreateContainerCommandDTO`, `ContainerDTO`, formularz state
- **Props**:
  - `isOpen: boolean`
  - `onClose: () => void`
  - `onSuccess: (container: ContainerDTO) => void`
  - `onError: (error: string) => void`

### ContainerForm

- **Opis komponentu**: Formularz w modalu do wprowadzenia danych kontenera
- **Główne elementy**: 
  - Input dla nazwy kontenera
  - Radio/Select dla typu (zamrażarka/lodówka)
  - Przyciski "Anuluj" i "Utwórz"
  - Komunikaty walidacji
- **Obsługiwane interakcje**:
  - Wpisywanie nazwy z walidacją
  - Wybór typu kontenera
  - Submit formularza
  - Reset formularza przy anulowaniu
- **Walidacja**:
  - Nazwa: required, minLength: 1, maxLength: 255
  - Typ: required, one of ['freezer', 'fridge']
  - Real-time walidacja z komunikatami błędów
- **Typy**: `CreateContainerCommandDTO`, form validation state
- **Props**:
  - `onSubmit: (data: CreateContainerCommandDTO) => void`
  - `onCancel: () => void`
  - `isSubmitting: boolean`
  - `error?: string`

## 5. Typy

### Nowe typy widokowe

```typescript
interface EmptyStateViewState {
  isModalOpen: boolean;
  isCreatingContainer: boolean;
  createError: string | null;
  hasCheckedContainers: boolean;
}

interface CreateContainerFormData {
  name: string;
  type: 'freezer' | 'fridge';
}

interface CreateContainerFormState {
  data: CreateContainerFormData;
  errors: Partial<Record<keyof CreateContainerFormData, string>>;
  touched: Partial<Record<keyof CreateContainerFormData, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
}

interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

interface CreateContainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (container: ContainerDTO) => void;
  onError: (error: string) => void;
}
```

### Wykorzystywane typy z types.ts

- `CreateContainerCommandDTO` - dane do utworzenia kontenera
- `ContainerDTO` - odpowiedź po utworzeniu kontenera
- `ContainerListResponseDTO` - sprawdzenie czy są kontenery
- `ContainerType` - typ kontenera (freezer/fridge)
- `HealthCheckResponseDTO` - weryfikacja sesji

## 6. Zarządzanie stanem

### Stan lokalny głównego komponentu

```typescript
const useEmptyState = () => {
  const [state, setState] = useState<EmptyStateViewState>({
    isModalOpen: false,
    isCreatingContainer: false,
    createError: null,
    hasCheckedContainers: false
  });
  
  const openModal = () => setState(prev => ({ ...prev, isModalOpen: true }));
  const closeModal = () => setState(prev => ({ ...prev, isModalOpen: false, createError: null }));
  
  const createContainer = async (data: CreateContainerCommandDTO) => {
    // implementacja tworzenia kontenera
  };
  
  return { state, openModal, closeModal, createContainer };
}
```

### Stan formularza w modalu

```typescript
const useCreateContainerForm = () => {
  const [formState, setFormState] = useState<CreateContainerFormState>({
    data: { name: '', type: 'freezer' },
    errors: {},
    touched: {},
    isValid: false,
    isSubmitting: false
  });
  
  const validateField = (field: keyof CreateContainerFormData, value: string) => {
    // walidacja poszczególnych pól
  };
  
  const handleSubmit = async (onSubmit: (data: CreateContainerCommandDTO) => void) => {
    // obsługa wysłania formularza
  };
  
  return { formState, validateField, handleSubmit, resetForm };
}
```

### Custom hooks

- `useContainerCheck` - sprawdzenie czy użytkownik ma kontenery
- `useCreateContainer` - logika tworzenia pierwszego kontenera
- `useRedirectAfterCreate` - przekierowanie po utworzeniu kontenera

## 7. Integracja z API

### Wykorzystywane endpointy

**Sprawdzenie kontenerów**
- **Endpoint**: `GET /api/containers`
- **Typ żądania**: Brak parametrów
- **Typ odpowiedzi**: `ContainerListResponseDTO`
- **Zastosowanie**: Weryfikacja czy użytkownik rzeczywiście nie ma kontenerów

**Tworzenie kontenera**
- **Endpoint**: `POST /api/containers`
- **Typ żądania**: `CreateContainerCommandDTO`
- **Typ odpowiedzi**: `ContainerDTO`
- **Zastosowanie**: Utworzenie pierwszego kontenera użytkownika

**Weryfikacja sesji**
- **Endpoint**: `GET /api/health`
- **Typ żądania**: Brak parametrów
- **Typ odpowiedzi**: `HealthCheckResponseDTO`
- **Zastosowanie**: Sprawdzenie czy użytkownik jest nadal zalogowany

## 8. Interakcje użytkownika

### Pierwsze wejście do aplikacji

1. Użytkownik loguje się i zostaje przekierowany do `/`
2. System sprawdza kontenery przez `GET /api/containers`
3. Jeśli brak kontenerów → wyświetlenie Empty State View
4. Jeśli są kontenery → przekierowanie do Main Dashboard

### Utworzenie pierwszego kontenera

1. Użytkownik klika "Dodaj pierwszą zamrażarkę"
2. Otwarcie modala z formularzem
3. Wypełnienie nazwy kontenera (np. "Zamrażarka kuchenna")
4. Wybór typu (zamrażarka/lodówka)
5. Kliknięcie "Utwórz"
6. Walidacja formularza po stronie frontend
7. Wysłanie `POST /api/containers` z danymi
8. Wyświetlenie loading state w modalu
9. Po sukcesie → zamknięcie modala + przekierowanie do Dashboard
10. Po błędzie → wyświetlenie komunikatu w modalu

### Anulowanie procesu

1. Użytkownik może zamknąć modal przez X lub "Anuluj"
2. Reset formularza do stanu początkowego
3. Powrót do Empty State View

## 9. Warunki i walidacja

### Walidacja dostępu do widoku

- Sprawdzenie aktywnej sesji przez `/api/health`
- Weryfikacja że użytkownik nie ma kontenerów
- Przekierowanie jeśli powyższe warunki nie są spełnione

### Walidacja formularza kontenera

**Nazwa kontenera**:
- Required: "Nazwa kontenera jest wymagana"
- Minimum length (1): "Nazwa nie może być pusta"
- Maximum length (255): "Nazwa może mieć maksymalnie 255 znaków"
- Trim whitespace przed walidacją

**Typ kontenera**:
- Required: "Wybierz typ kontenera"
- Enum validation: musi być 'freezer' lub 'fridge'

### Walidacja biznesowa

- Sprawdzenie czy użytkownik może tworzyć kontenery (limity)
- Weryfikacja uprawnień w bazie danych
- Sprawdzenie unikalności nazwy (opcjonalnie)

## 10. Obsługa błędów

### Błędy sprawdzania kontenerów

- **401 Unauthorized**: Przekierowanie do logowania
- **500 Server Error**: Toast "Błąd ładowania danych, spróbuj ponownie"
- **Network Error**: Toast "Sprawdź połączenie internetowe"

### Błędy tworzenia kontenera

- **400 Bad Request**: Wyświetlenie komunikatu walidacji w modalu
- **401 Unauthorized**: Przekierowanie do logowania  
- **500 Server Error**: Toast "Błąd tworzenia kontenera"
- **Network Timeout**: Toast "Przekroczono czas oczekiwania"

### Błędy walidacji formularza

- **Pusta nazwa**: "Nazwa kontenera jest wymagana" pod polem
- **Za długa nazwa**: "Nazwa może mieć maksymalnie 255 znaków"
- **Brak typu**: "Wybierz typ kontenera" pod selekcją

### Scenariusze fallback

- **Błąd ładowania**: Przycisk "Spróbuj ponownie" zamiast głównego CTA
- **Błędy API**: Możliwość retry dla operacji
- **Błędy sesji**: Automatyczne przekierowanie do logowania

## 11. Kroki implementacji

1. **Podstawowa struktura widoku**
   - Utworzenie logiki routingu w `src/pages/index.astro`
   - Dodanie warunków sprawdzania kontenerów
   - Implementacja podstawowego layoutu Empty State

2. **Komponenty prezentacyjne**
   - `EmptyStateContent.tsx` z welcome message
   - `FeaturesList.tsx` z listą funkcjonalności
   - Responsive design zgodny z Tailwind + Shadcn/ui

3. **Modal i formularz**
   - `CreateContainerModal.tsx` z podstawową strukturą
   - `ContainerForm.tsx` z polami nazwa/typ
   - Implementacja walidacji formularza

4. **Integracja z API**
   - Custom hook `useCreateContainer`
   - Obsługa `POST /api/containers`
   - Zarządzanie stanem loading/error

5. **Sprawdzanie kontenerów**
   - Logic sprawdzania czy użytkownik ma kontenery
   - Integration z `GET /api/containers`
   - Przekierowania między widokami

6. **System błędów i UX**
   - Toast notifications dla błędów
   - Loading states w modalu i przyciskach
   - Graceful error handling

7. **Walidacja i edge cases**
   - Frontend validation dla formularza
   - Obsługa scenariuszy błędów
   - Testowanie edge cases

8. **Finalizacja i optymalizacja**
   - Responsive design testing
   - Accessibility improvements
   - Performance optimizations
   - Animations i micro-interactions 