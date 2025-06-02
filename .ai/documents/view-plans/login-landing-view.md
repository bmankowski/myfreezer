# Plan implementacji widoku: Logowanie/Strona główna

## 1. Przegląd

Widok logowania/strony głównej jest pierwszym punktem kontaktu użytkownika z aplikacją MyFreezer. Służy do prezentacji aplikacji oraz uwierzytelnienia przez Google OAuth. Po zalogowaniu przekierowuje do głównego dashboard'u lub widoku pustego stanu.

## 2. Routing widoku

**Ścieżka**: `/` (stan nieuwierzytelniony)
**Przekierowania**: 
- Po zalogowaniu → `/` (stan uwierzytelniony - Main Dashboard lub Empty State)
- Jeśli już zalogowany → automatyczne przekierowanie do dashboard'u

## 3. Struktura komponentów

```
LoginLandingView
├── Header (opcjonalny branding)
├── Hero Section
│   ├── AppBranding
│   ├── FeatureDescription
│   └── GoogleOAuthButton
└── Footer (opcjonalny)
```

## 4. Szczegóły komponentów

### LoginLandingView (główny kontener)

- **Opis komponentu**: Główny kontener dla widoku logowania, zarządza stanem uwierzytelnienia
- **Główne elementy**: Layout wrapper, hero section, loading states
- **Komponenty podrzędne**: Hero section z Google OAuth button
- **Obsługiwane interakcje**: 
  - Kliknięcie przycisku logowania
  - Obsługa powrotu z OAuth flow
  - Wykrywanie już zalogowanego użytkownika
- **Walidacja**: 
  - Sprawdzenie czy użytkownik jest już zalogowany (redirect)
  - Obsługa błędów OAuth
- **Typy**: Stan autoryzacji z Supabase session
- **Props**: Brak (główny komponent strony)

### Hero Section

- **Opis komponentu**: Centralna sekcja prezentująca aplikację i call-to-action
- **Główne elementy**: 
  - Logo/nazwa aplikacji (MyFreezer)
  - Headline z wartością propozycji
  - Opis funkcjonalności (zarządzanie lodówką głosowo)
  - Lista głównych korzyści
- **Komponenty podrzędne**: GoogleOAuthButton
- **Obsługiwane interakcje**: Prezentacja informacji
- **Walidacja**: Brak
- **Typy**: Brak specjalnych typów
- **Props**: Brak

### GoogleOAuthButton

- **Opis komponentu**: Przycisk inicjujący proces uwierzytelnienia przez Google
- **Główne elementy**: Button z ikoną Google, loading spinner, tekst stanu
- **Obsługiwane interakcje**:
  - Kliknięcie inicjuje OAuth flow
  - Wyświetlanie loading state podczas procesu
  - Obsługa błędów i powodzenia
- **Walidacja**:
  - Sprawdzenie czy Google OAuth jest dostępne
  - Weryfikacja permissions
- **Typy**: Event handlers, loading state boolean
- **Props**: 
  - `onAuthStart?: () => void`
  - `onAuthSuccess?: () => void`  
  - `onAuthError?: (error: string) => void`

## 5. Typy

### Nowe typy widokowe

```typescript
interface LoginViewState {
  isLoading: boolean;
  authError: string | null;
  isCheckingAuth: boolean;
}

interface AuthFlowState {
  status: 'idle' | 'loading' | 'success' | 'error';
  error?: string;
}

interface GoogleOAuthButtonProps {
  onAuthStart?: () => void;
  onAuthSuccess?: () => void;
  onAuthError?: (error: string) => void;
  disabled?: boolean;
}
```

### Wykorzystywane typy z types.ts

- Supabase auth types (Session, User z biblioteki)
- Brak dodatkowych DTOs - autoryzacja odbywa się przez Supabase

## 6. Zarządzanie stanem

### Stan lokalny komponentu

- `isLoading` - stan ładowania podczas procesu OAuth
- `authError` - błędy uwierzytelnienia do wyświetlenia
- `isCheckingAuth` - sprawdzanie aktualnego stanu autoryzacji

### Custom hook: useAuth

```typescript
const useAuth = () => {
  const [authState, setAuthState] = useState<AuthFlowState>({ status: 'idle' });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  const signInWithGoogle = async () => {
    setAuthState({ status: 'loading' });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      
      if (error) {
        setAuthState({ status: 'error', error: error.message });
      }
    } catch (err) {
      setAuthState({ status: 'error', error: 'Błąd logowania' });
    }
  };
  
  const checkAuthStatus = () => {
    const { data: { session } } = supabase.auth.getSession();
    setIsAuthenticated(!!session?.user);
    return !!session?.user;
  };
  
  return { authState, isAuthenticated, signInWithGoogle, checkAuthStatus };
}
```

## 7. Integracja z API

### Wykorzystywane endpointy

**Supabase Auth**
- **Endpoint**: `supabase.auth.signInWithOAuth()` (nie bezpośrednie API)
- **Typ żądania**: OAuth provider configuration
- **Typ odpowiedzi**: Session object lub error
- **Zastosowanie**: Uwierzytelnienie użytkownika przez Google

**Sprawdzenie sesji**
- **Endpoint**: `supabase.auth.getSession()` (lokalne sprawdzenie)
- **Typ żądania**: Brak - lokalne sprawdzenie
- **Typ odpowiedzi**: Session object z user
- **Zastosowanie**: Weryfikacja czy użytkownik jest już zalogowany

**Nasłuchiwanie zmian autoryzacji**
- **Endpoint**: `supabase.auth.onAuthStateChange()` (subscription)
- **Typ żądania**: Callback function
- **Typ odpowiedzi**: AuthChangeEvent + Session
- **Zastosowanie**: Reaktywne aktualizacje stanu autoryzacji

## 8. Interakcje użytkownika

### Kliknięcie "Zaloguj się przez Google"

1. Użytkownik klika przycisk
2. Wyświetlenie loading state na przycisku
3. Inicjacja Supabase OAuth flow przez `signInWithOAuth()`
4. Przekierowanie do Google OAuth
5. Powrót do aplikacji z tokenem lub błędem
6. Supabase automatycznie ustanawia sesję
7. Reaktywne przekierowanie do dashboard'u lub wyświetlenie błędu

### Automatyczne sprawdzenie autoryzacji

1. Przy ładowaniu strony sprawdzenie `supabase.auth.getSession()`
2. Jeśli zalogowany - automatyczne przekierowanie do dashboard'u
3. Jeśli nie - wyświetlenie widoku logowania
4. Nasłuchiwanie zmian przez `onAuthStateChange()` dla reaktywnych aktualizacji

## 9. Warunki i walidacja

### Walidacja przed logowaniem

- Sprawdzenie dostępności Supabase client
- Weryfikacja konfiguracji Google OAuth w Supabase
- Sprawdzenie połączenia internetowego (opcjonalnie)

### Walidacja podczas procesu

- Timeout dla procesu OAuth (30 sekund)
- Walidacja odpowiedzi od Supabase auth
- Sprawdzenie czy użytkownik otrzymał prawidłową sesję

### Walidacja po logowaniu

- Potwierdzenie aktywnej sesji przez `getSession()`
- Sprawdzenie czy session zawiera user object
- Weryfikacja czy profil użytkownika ma wymagane pola

## 10. Obsługa błędów

### Błędy OAuth

- **Odmowa dostępu przez użytkownika**: Toast z informacją "Logowanie anulowane"
- **Błąd konfiguracji**: Toast z "Błąd konfiguracji systemu logowania"
- **Timeout**: Toast z "Przekroczono czas oczekiwania na logowanie"
- **Błąd sieci**: Toast z "Sprawdź połączenie internetowe"

### Błędy weryfikacji

- **Brak sesji po OAuth**: Wylogowanie i restart procesu
- **Nieprawidłowa sesja**: Toast z "Błąd autoryzacji, spróbuj ponownie"
- **Błąd Supabase**: Toast z "Problem z systemem autoryzacji"

### Fallback scenarios

- Przy błędach OAuth - możliwość ponownej próby
- Przy błędach sieci - informacja o problemie i retry button
- Ogólne błędy - podstawowa informacja z przyciskiem "Spróbuj ponownie"

## 11. Kroki implementacji

1. **Przygotowanie layoutu**
   - Utworzenie podstawowej struktury Astro page w `src/pages/index.astro`
   - Implementacja responsywnego layoutu z Tailwind
   - Dodanie podstawowych elementów Hero section

2. **Integracja Supabase Auth**
   - Konfiguracja Supabase client w komponencie React
   - Implementacja funkcji `signInWithGoogle()` przez `signInWithOAuth()`
   - Dodanie obsługi callback'ów OAuth przez `onAuthStateChange()`

3. **Komponenty React**
   - Utworzenie `GoogleOAuthButton.tsx` w `src/components/`
   - Implementacja custom hook `useAuth` w `src/lib/hooks/`
   - Dodanie zarządzania stanem loading/error

4. **Sprawdzenie stanu autoryzacji**
   - Implementacja sprawdzenia sesji przez `getSession()` przy ładowaniu
   - Dodanie reaktywnego nasłuchiwania przez `onAuthStateChange()`
   - Implementacja automatycznego przekierowania dla zalogowanych

5. **Obsługa błędów i UX**
   - Implementacja toast notifications
   - Dodanie loading states i visual feedback
   - Testowanie różnych scenariuszy błędów

6. **Stylizacja i finalizacja**
   - Implementacja designu zgodnego z Shadcn/ui
   - Dodanie animacji i micro-interactions
   - Sprawdzenie responsywności na wszystkich urządzeniach

7. **Testowanie**
   - Testowanie pełnego flow OAuth
   - Weryfikacja przekierowań i reaktywności
   - Testy obsługi błędów i edge cases 