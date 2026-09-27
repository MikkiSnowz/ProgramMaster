import pg from 'pg';
import { SCHEMA, SEED } from './sql.js';

pg.types.setTypeParser(pg.types.builtins.INT8, Number);
pg.types.setTypeParser(pg.types.builtins.NUMERIC, parseFloat);
pg.types.setTypeParser(pg.types.builtins.DATE, (v) => v); // keep 'YYYY-MM-DD', no timezone shift

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export const q = async (sql: string, params: unknown[] = []) => (await pool.query(sql, params)).rows;

export const seed = () => pool.query(SEED);

export async function initDb() {
  await pool.query(SCHEMA);
  const [{ n }] = await q('SELECT count(*) AS n FROM tutors');
  if (!n) await seed();
}
