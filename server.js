import http from 'node:http';
import { readFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 3000);
const table = process.env.DB_TABLE;
if (!table || !process.env.DB_NAME) {
  throw new Error('Configura DB_NAME e DB_TABLE nel file .env.');
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 20,
  connectTimeout: 5000,
  supportBigNumbers: true,
  bigNumberStrings: true,
});
const page = await readFile(new URL('./public/index.html', import.meta.url));

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return json(res, 405, { error: 'Metodo non consentito.' });
    }
    if (url.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(page);
    }
    if (url.pathname !== '/api/rows') {
      return json(res, 404, { error: 'Endpoint non trovato.' });
    }
    const limit = Number(url.searchParams.get('limit') ?? 50);
    const offset = Number(url.searchParams.get('offset') ?? 0);
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100 ||
        !Number.isSafeInteger(offset) || offset < 0) {
      return json(res, 400, { error: 'limit deve essere un intero tra 1 e 100; offset un intero >= 0.' });
    }
    // Il nome della tabella arriva solo dalla configurazione ed è escapato.
    const [rows, fields] = await pool.query(
      `SELECT * FROM ${mysql.escapeId(table, true)} LIMIT ? OFFSET ?`,
      [limit, offset],
    );
    return json(res, 200, { data: rows, columns: fields.map(field => field.name), limit, offset });
  } catch (error) {
    console.error('Errore richiesta:', error.code || error.message);
    return json(res, 500, { error: 'Impossibile leggere i dati. Verifica MySQL e la configurazione nel file .env.' });
  }
});

server.listen(port, host, () => console.log(`Server avviato: http://${host}:${port}`));
server.on('error', async error => {
  console.error('Errore server:', error.message);
  await pool.end();
  process.exitCode = 1;
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    server.close(async () => { await pool.end(); });
  });
}
