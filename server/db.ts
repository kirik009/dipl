import { drizzle } from "drizzle-orm/node-postgres";
import  pkg  from 'pg';
const {Pool} = pkg;
import dotenv from "dotenv";
dotenv.config();
export const pool = new Pool({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DATABASE, 
  password: process.env.PASSWORD, 
  port: Number(process.env.DB_PORT), 
});

pool.connect()
  .then(() => console.log("Connected to PostgreSQL database"))
  .catch((err) => console.error("Error connecting to PostgreSQL:", err));

export const db = drizzle(pool);