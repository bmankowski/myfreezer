# **Aplikacja – MyFreezer**

## **Główny problem**

Użytkownicy często nie pamiętają, co i gdzie znajduje się w ich lodówce lub zamrażarce. Przydałaby się aplikacja, która umożliwia prostą i intuicyjną obsługę głosową, pomagającą zarządzać zawartością urządzeń chłodniczych.

## **Założenia funkcjonalne**

Aplikacja powinna umożliwiać:

- Opisanie, **co znajduje się w lodówce lub zamrażarce**
- Informację, **gdzie dokładnie** (w której lodówce/zamrażarce i na której półce) dany produkt się znajduje
- Sprawdzenie, **czy dany produkt jest dostępny** i **ile go pozostało**
- **Dodawanie produktów** do określonego miejsca (półki) za pomocą głosu
- **Usuwanie produktów** (np. gdy coś zostało wyjęte) także za pomocą głosu
- Obsługę głosową realizowaną **po naciśnięciu jednego przycisku aktywującego tryb nasłuchiwania** – bez konieczności określania, czy coś dodajemy czy usuwamy; system powinien to rozpoznać kontekstowo
- **Wyświetlanie zawartości** wszystkich lodówek/zamrażarek na stronie internetowej

## **Minimalny zestaw funkcjonalności (MVP)**

Zakres MVP obejmuje:

- Logowanie użytkownika przez Google
- Głosowe dodawanie produktów
- Głosowe usuwanie produktów
- Możliwość zapytania „Co znajduje się w lodówce?”
- Możliwość zapytania „Czy mam [produkt]?” i uzyskania informacji, **czy jest dostępny i gdzie się znajduje**

## **Zakres wykluczony z MVP**

Z MVP **na razie wyłączone** są:

- Obsługa wielu użytkowników na jednym koncie (np. rodziny)
- Historia zmian (kto/co/kiedy dodał/wyjął)
- Obsługa kodów kreskowych lub rozpoznawania obrazu
- System powiadomień (np. o kończących się produktach)
- Integracja z aplikacjami zakupowymi
- Funkcja planowania posiłków lub sugerowania dań na podstawie zawartości lodówki
