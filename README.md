# Urban Properties — opis aplikacije i tehnologije.

Urban Properties je full-stack veb aplikacija namenjena upravljanju prodajom nekretnina, pregledom ponuda i zakazivanjem termina za razgledanje. Aplikacija nastaje kao odgovor na potrebu za centralizovanom i preglednom platformom koja povezuje kupce i prodajne agente kroz jasan i kontrolisan proces: od pretrage i pregleda nekretnina, preko zakazivanja gledanja, do slanja ponuda i praćenja ishoda.

![Urban Properties Logo](./urban-properties-frontend/public/favicon.ico)

Glavni cilj aplikacije je da kupcima omogući jednostavno pretraživanje i detaljan pregled nekretnina, uz vizuelno atraktivan prikaz (slike, 3D prikaz kada je dostupan), kao i brzu akciju u vidu zakazivanja viewing appointment termina i slanja ponude. Paralelno, Urban Properties prodajnim agentima pruža alat za upravljanje sopstvenim nekretninama, viewing appointment zahtevima i ponudama, dok administratorima omogućava upravljanje korisnicima, generisanje izveštaja i praćenje metrika sistema.

---

## Ciljna grupa i uloge korisnika.

Ciljna grupa korisnika obuhvata tri glavna tipa korisnika, kao i posetioca:

- **Posetilac (guest)**: korisnik koji nije registrovan ili nije ulogovan.
- **Kupac (buyer)**: korisnik koji pretražuje nekretnine, zakazuje termine razgledanja, šalje ponude i prati svoje aktivnosti.
- **Prodajni agent (sales_agent)**: korisnik koji kreira i održava oglase nekretnina, upravlja terminima razgledanja i obradom ponuda.
- **Administrator (administrator)**: korisnik koji upravlja korisnicima i prati metrika i izveštaje o aktivnostima u sistemu.

---

## Ključne funkcionalnosti.

### Posetilac.
- Pregled javne liste nekretnina.
- Pregled detalja nekretnine.
- Registracija i prijava u sistem.

### Kupac (buyer).
- Pregled i filtriranje nekretnina (npr. grad, tip, cena, broj soba, paginacija).
- Detaljan prikaz nekretnine uključujući slike i dodatne vizuelne resurse (npr. 3D prikaz ako postoji).
- Zakazivanje viewing appointment termina za odabranu nekretninu.
- Pregled sopstvenih viewing appointment termina i otkazivanje (u dozvoljenom statusu).
- Kreiranje ponude (offer) za odabranu nekretninu.
- Pregled sopstvenih ponuda i povlačenje ponude (ako je u odgovarajućem statusu).
- Pregled sopstvenih aktivnosti (appointments, offers, transactions), preko agregiranog endpoint-a.

### Prodajni agent (sales_agent).
- Dodavanje, izmena i brisanje sopstvenih nekretnina.
- Pregled viewing appointment termina za sopstvene nekretnine.
- Ažuriranje statusa viewing appointment termina (npr. scheduled → completed ili scheduled → cancelled).
- Pregled ponuda (offers) koje su pristigle za sopstvene nekretnine.
- Ažuriranje statusa ponuda (npr. pending → accepted ili pending → rejected/cancelled), u skladu sa backend pravilima.
- Praćenje transakcija vezanih za ponude i nekretnine (kada postoje u sistemu).

### Administrator (administrator).
- Pregled korisnika (kupci i prodajni agenti), uz uvid u brojače aktivnosti (properties_count, offers_count, viewing_appointments_count, transactions_count).
- Generisanje izveštaja po periodu i filterima (npr. agent, grad).
- Pregled metrika sistema (agregacije po agentu i po mesecima).
- Vizuelizacija metrika kroz grafikone u admin delu pomoću **MUI X Charts** biblioteke.

---

# Predlog tehnologija koje će biti korišćene.

## Frontend — React.

**React** je biblioteka za izradu modernih korisničkih interfejsa zasnovana na komponentnom pristupu. Urban Properties frontend je realizovan kao SPA aplikacija sa role-based navigacijom, gde se prikaz stranica i akcija prilagođava ulozi korisnika (buyer, sales_agent, administrator).

U Urban Properties aplikaciji, React je zadužen za:
- Prikaz liste nekretnina (grid i kartice), filtere i paginaciju.
- Prikaz detalja nekretnine kroz posebnu stranicu ili modal (u zavisnosti od UX odluke).
- Kontrolisane forme za login/register i kreiranje entiteta (property, viewing appointment, offer).
- Role-based rute i zaštitu stranica kroz komponentu tipa `RequireAuth`.
- Reusable UI komponente (npr. `Card`, `Button`, `Modal`, `NavigationMenu`, `Slider`), radi konzistentnog dizajna i brže izrade.

### Integracije u React-u.
- **3D prikaz / 3D slika**: prikaz se radi preko URL polja iz backend-a, kroz standardni `<img>` ili embed, u zavisnosti od formata linka.
- **Grafikoni (Admin)**: prikaz metrika u admin delu se radi pomoću **MUI X Charts** (BarChart, LineChart).
- **Komunikacija sa API-jem**: frontend poziva Laravel REST API putem HTTP zahteva, uz prosleđivanje tokena u `Authorization: Bearer {token}` headeru za zaštićene rute.

---

## Backend — Laravel 12 (REST API).

**Laravel 12** predstavlja backend sloj aplikacije i zadužen je za:
- Poslovnu logiku (pravila statusa ponuda i termina, vlasništvo nad resursima, filtriranje i autorizacija).
- Validaciju ulaznih podataka.
- Kontrolu pristupa na osnovu uloge i vlasništva nad resursima.
- Rad sa bazom podataka preko **Eloquent ORM**-a.
- Izlaganje REST API ruta za React frontend.

### Autentifikacija i autorizacija.
- Koristi se token-based autentifikacija preko **Laravel Sanctum**-a.
- Token se šalje u headeru: `Authorization: Bearer {token}`.
- Rute su ograničene po ulozi (buyer, sales_agent, administrator) i dodatno po vlasništvu (npr. agent može menjati samo svoje nekretnine i statuse vezane za njih).

---

## Baza podataka — MySQL.

**MySQL** je relacioni sistem baza podataka, pogodan za jasno definisane relacije između entiteta. U Urban Properties sistemu MySQL čuva podatke o:
- korisnicima (`users`),
- nekretninama (`properties`),
- terminima razgledanja (`viewing_appointments`),
- ponudama (`offers`),
- transakcijama (`transactions`).

Kroz Laravel migracije se definišu kolone, tipovi, indeksi i strani ključevi, dok seed-eri generišu test podatke radi razvoja i demonstracije.

---

# Tehnologije korišćene (sažetak).

- **Frontend.**
  - React (SPA, komponentni UI).
  - JavaScript.
  - react-router-dom (rutiranje).
  - Fetch ili axios (HTTP pozivi ka API-ju).
  - MUI X Charts (grafikoni u admin delu).
  - Reusable UI komponente (Card, Button, Modal, Slider, NavigationMenu).

- **Backend.**
  - PHP 8.2+.
  - Laravel 12 (rutiranje, validacija, kontroleri, Eloquent ORM).
  - Laravel Sanctum (Bearer token auth).
  - API Resources (formatiranje JSON odgovora).

- **Baza.**
  - MySQL.

- **DevOps / alati.**
  - Git (verzionisanje).
  - Swagger UI + OpenAPI specifikacija za dokumentaciju API-ja.
  - Docker za kontejnerizaciju.

---

## Git i GitHub verzionisanje projekta

- Kod je okacen na GitHub repozitorijum: https://github.com/elab-development/internet-tehnologije-2025-urbanproperties_2018_0328.git

- Komanda za kloniranje projekta:

```bash
git clone https://github.com/elab-development/internet-tehnologije-2025-urbanproperties_2018_0328.git
```
---

## Pokretanje projekta (lokalno bez Docker-a).

> Pretpostavke: instalirani **Node 18+**, **PHP 8.2+**, **Composer**, **MySQL** (npr. XAMPP).
> Napomena: pokrenuti MySQL servis pre migracija.

1. Pozicionirajte se u backend:
```bash
cd urban-properties-api
composer install
php artisan migrate:fresh --seed
php artisan serve
```

2. Pokrenite frontend:
```bash
cd urban-properties-frontend
npm install
npm start
```

3. Aplikacija:
- Frontend: `http://localhost:3000`.
- Backend API: `http://127.0.0.1:8000/api`.

---

## Pokretanje projekta uz Docker.

> Pretpostavke: instaliran i pokrenut **Docker Desktop**.
> Napomena: lokalni MySQL ne treba pokretati ako ga koristi Docker.

1. U root folderu (gde je `docker-compose.yml`) pokrenite:
```bash
docker compose down -v
docker compose up --build
```

2. Aplikacija:
- Frontend: `http://localhost:3000`.
- Backend API: `http://127.0.0.1:8000/api`.
- Swagger UI: `http://127.0.0.1:8000/docs/index.html` (ako docs stoje u `public/docs`).
