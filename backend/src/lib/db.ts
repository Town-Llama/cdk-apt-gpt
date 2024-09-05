import { Pool } from "pg";

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PW,
  port: Number(process.env.DB_PORT),
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

pool.on("error", (err: any) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

export const dbCall = async (query: string, values: any) => {
  try {
    const client = await pool.connect();
    try {
      const res = await client.query(query, values);
      return res.rows;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("Error executing query", err.stack);
    throw err;
  }
};
