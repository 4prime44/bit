Aplikacja w stylu When2meet: tworzysz wydarzenie, wysyłasz link,
każdy zaznacza dostępność na siatce, a aplikacja pokazuje najlepszy termin.
## Funkcje
- Tworzenie wydarzenia (dni + zakres godzin + długość slotu) z unikalnym linkiem
- Uproszczone logowanie: imię + opcjonalny PIN (powrót z innego urządzenia)
- Zaznaczanie dostępności przeciąganiem (mysz/dotyk) i klawiaturą
- Heatmapa dostępności grupy + lista najlepszych terminów
- Edycja i usuwanie własnej dostępności
- Panel twórcy: zatwierdzenie terminu, eksport .ics
## Stack
React 19 + TypeScript + Vite · TanStack Query · React Router ·
Express 5 · Prisma 6 + SQLite · Zod (współdzielone schematy) · Vitest
## Uruchomienie
Wymagany Node.js 22+ (zalecany 24 LTS).
```bash
npm install
npm run db:push
# tworzy plik bazy SQLite
npm run dev
# front: http://localhost:5173, API: http://localhost:3000
npm test
# testy API i frontu
```
## Architektura
(krótki opis monorepo: apps/web, apps/api, packages/shared + diagram przepływu)
## Kluczowe decyzje
- **Sloty jako tekstowe klucze "RRRR-MM-DDTGG:MM"**: proste porównania i Set,
bez stref czasowych (świadome uproszczenie, wszyscy w PL).
- **PUT całej listy slotów**: idempotentne, bezpieczne do ponowienia.
- **Szkic + przycisk Zapisz**: użytkownik nie traci zmian przy błędzie sieci.
- **Token w localStorage zamiast kont**: niski próg wejścia; PIN opcjonalny.
- (…dopisz własne)
## Co bym zrobił dalej
Strefy czasowe, WebSockety zamiast odpytywania, konta i historia wydarzeń, rate limiting PIN-u.
## Wykorzystanie AI
Do przygotowania planu projektu użyłem Claude (Anthropic), również do wygenerowania podstawowych informacji jak np to readme( nie chcialo mi sie go pisac XD).
Kod napisałem samodzielnie na ich podstawie (wspomagałem się czasami przy jakis błędach, czasami przy jakis problemach (pointerdown zeby nie popelnić błedu) ), rozumiem każdą jego część i mogę ją wyjaśnić.
A i kod css wygenerowany przez AI + testy frontend