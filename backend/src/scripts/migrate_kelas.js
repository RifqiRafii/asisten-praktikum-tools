import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function migrateKelas() {
  console.log('🔄 Memulai migrasi penambahan tabel kelas & relasi praktikan...');

  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'asisten_praktikum_db',
    port: Number(process.env.DB_PORT) || 3306,
  };

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('🔌 Terhubung ke database MySQL...');

    // 1. Buat tabel kelas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`kelas\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`matakuliah_id\` INT NOT NULL,
        \`nama_kelas\` VARCHAR(50) NOT NULL,
        CONSTRAINT \`fk_kelas_matakuliah\`
          FOREIGN KEY (\`matakuliah_id\`) REFERENCES \`matakuliah\` (\`id\`)\
          ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Tabel `kelas` siap.');

    // 2. Periksa apakah kolom kelas_id sudah ada di praktikan
    const [cols] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'praktikan' AND COLUMN_NAME = 'kelas_id'
    `, [dbConfig.database]);

    if (cols.length === 0) {
      console.log('➕ Menambahkan kolom `kelas_id` ke tabel `praktikan`...');
      await connection.query('ALTER TABLE `praktikan` ADD COLUMN `kelas_id` INT NULL AFTER `id`');
      await connection.query(`
        ALTER TABLE \`praktikan\` 
        ADD CONSTRAINT \`fk_praktikan_kelas\` 
        FOREIGN KEY (\`kelas_id\`) REFERENCES \`kelas\` (\`id\`) 
        ON DELETE CASCADE ON UPDATE CASCADE
      `);
      console.log('✅ Kolom `kelas_id` dan Foreign Key berhasil ditambahkan.');
    } else {
      console.log('ℹ️ Kolom `kelas_id` sudah ada di tabel `praktikan`.');
    }

    // 3. Buat default "Kelas A" untuk setiap matakuliah yang belum punya kelas
    const [matkuls] = await connection.query('SELECT id, nama FROM matakuliah');
    for (const mk of matkuls) {
      const [existingKelas] = await connection.query('SELECT id FROM kelas WHERE matakuliah_id = ?', [mk.id]);
      if (existingKelas.length === 0) {
        const [res] = await connection.query('INSERT INTO kelas (matakuliah_id, nama_kelas) VALUES (?, ?)', [mk.id, 'Kelas A']);
        console.log(`✨ Dibuat "Kelas A" otomatis untuk mata kuliah: ${mk.nama}`);
        
        // Hubungkan praktikan yang belum berkelas ke kelas ini jika ini matakuliah pertama
        await connection.query('UPDATE praktikan SET kelas_id = ? WHERE kelas_id IS NULL', [res.insertId]);
      }
    }

    // 4. Hapus unique index global 'nim' jika ada, agar bisa NIM sama di beda kelas atau matkul
    const [indices] = await connection.query(`
      SHOW INDEX FROM praktikan WHERE Key_name = 'nim'
    `);
    if (indices.length > 0) {
      await connection.query('ALTER TABLE praktikan DROP INDEX nim');
      console.log('🔓 Index unik global `nim` disesuaikan agar fleksibel per kelas.');
    }

    console.log('🎉 Migrasi penambahan kelas selesai dengan sukses!');
  } catch (error) {
    console.error('❌ Gagal menjalankan migrasi kelas:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

migrateKelas();
