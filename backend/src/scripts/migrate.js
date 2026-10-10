import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log('🔄 Memulai proses inisialisasi & migrasi database MySQL...');

  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: Number(process.env.DB_PORT) || 3306,
    multipleStatements: true,
  };

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log(`🔌 Terhubung ke server MySQL di ${dbConfig.host}:${dbConfig.port}`);

    // Baca file schema.sql
    const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
    const sqlContent = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Mengeksekusi script SQL dari database/schema.sql...');
    await connection.query(sqlContent);

    // Ambil daftar tabel yang baru dibuat
    await connection.query(`USE \`${process.env.DB_NAME || 'asisten_praktikum_db'}\``);
    const [tables] = await connection.query('SHOW TABLES');

    console.log(`✅ Berhasil! Database '${process.env.DB_NAME || 'asisten_praktikum_db'}' siap digunakan.`);
    console.log('📋 Tabel yang berhasil dibuat:');
    tables.forEach((row) => {
      const tableName = Object.values(row)[0];
      console.log(`   - ${tableName}`);
    });

  } catch (error) {
    console.error('❌ Gagal menjalankan migrasi:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();
