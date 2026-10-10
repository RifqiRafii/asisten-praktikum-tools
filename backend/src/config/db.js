import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'asisten_praktikum_db',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Pool koneksi ke database target
export const pool = mysql.createPool(dbConfig);

// Fungsi utilitas untuk menguji koneksi MySQL
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT 1 + 1 AS test');
    connection.release();
    return {
      success: true,
      status: 'connected',
      message: `Terhubung ke MySQL database: ${dbConfig.database}`,
      testResult: rows[0].test,
    };
  } catch (error) {
    // Jika database belum dibuat (Langkah 3), tes apakah server MySQL itu sendiri hidup
    if (error.code === 'ER_BAD_DB_ERROR') {
      try {
        const testConn = await mysql.createConnection({
          host: dbConfig.host,
          user: dbConfig.user,
          password: dbConfig.password,
          port: dbConfig.port,
        });
        await testConn.query('SELECT 1');
        await testConn.end();
        return {
          success: true,
          status: 'server_ready_db_pending',
          message: `Server MySQL aktif, namun database '${dbConfig.database}' belum dibuat (siap untuk Langkah 3).`,
        };
      } catch (errServer) {
        return {
          success: false,
          status: 'error',
          error: errServer.message,
        };
      }
    }
    return {
      success: false,
      status: 'error',
      error: error.message,
      code: error.code,
    };
  }
};
