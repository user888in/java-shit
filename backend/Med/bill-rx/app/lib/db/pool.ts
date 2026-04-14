import { Pool } from 'pg';

let pool: Pool;

if (!global.pgPool) {
    global.pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
}

pool = global.pgPool;

// Add type for global
declare global {
    var pgPool: Pool;
}

export { pool };

export const query = (text: string, params?: any[]) => pool.query(text, params);
