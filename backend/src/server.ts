import 'dotenv/config';
import express from 'express';
import { initDb } from './db.js';
import { onError } from './http.js';
import api from './routes.js';

const port = Number(process.env.PORT) || 5000;

await initDb();
express()
  .use(express.json())
  .use('/api', api)
  .use(onError)
  .listen(port, () => console.log(`API listening on :${port}`));
