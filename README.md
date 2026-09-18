# API MySQL con Node.js

Richiede Node.js >= 20.12 e un server MySQL avviato (ad esempio tramite Laragon).

1. Esegui `npm install`.
2. Modifica `.env` con le credenziali MySQL, `DB_NAME` e `DB_TABLE` di una tabella esistente. Se il file manca, copia `.env.example` in `.env`.
3. Esegui `npm start` (oppure `npm run dev` per riavviare automaticamente quando modifichi il codice).
4. Apri http://127.0.0.1:3000 per vedere i dati.

## API

`GET /api/rows?limit=50&offset=0`

Restituisce `{ "data": [...], "columns": [...], "limit": 50, "offset": 0 }`.
Il limite predefinito è 50, il massimo 100. Parametri non validi restituiscono HTTP 400; errori del database HTTP 500.

Esempio JavaScript dalla stessa origine:

```js
const response = await fetch('/api/rows?limit=10&offset=0');
const result = await response.json();
if (!response.ok) throw new Error(result.error);
console.log(result.data);
```

Il server ascolta solo su localhost per impostazione predefinita. L'app non include autenticazione: è pensata per uso locale. Usa preferibilmente un utente MySQL con solo permesso SELECT sulla tabella. La tabella è configurata sul server, non selezionabile dalla richiesta.

La query legge tutte le colonne. La paginazione non impone un ordinamento: per un ordine stabile aggiungi un ORDER BY su una colonna univoca della tua tabella in `server.js`.
