import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

// Minimal SSL handling driven by PGSSLMODE
// - 'disable' => ssl: false
// - 'verify-full' => SSL with strict verification (recommended)
// - any other value => SSL enabled but not strict
const ssl = process.env.PGSSLMODE === 'disable'
  ? false
  : { rejectUnauthorized: process.env.PGSSLMODE === 'verify-full' };

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl,
});

export const db = drizzle(pool);
