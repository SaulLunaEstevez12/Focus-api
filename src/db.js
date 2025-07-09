import sql from 'mssql';
import 'dotenv/config.js';

const pool = new sql.ConnectionPool({
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server:   process.env.DB_HOST,
  database: process.env.DB_NAME,
  port:     parseInt(process.env.DB_PORT || '1433'),
  options: {
    encrypt: true,                 // necesario para Somee
    trustServerCertificate: true  // evita errores SSL
  }
});

export default pool.connect();
