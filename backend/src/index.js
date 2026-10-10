import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/db.js';
import matakuliahRoutes from './routes/matakuliah.js';
import kelasRoutes from './routes/kelas.js';
import praktikanRoutes from './routes/praktikan.js';
import modulRoutes from './routes/modul.js';
import rubrikRoutes from './routes/rubrik.js';
import penilaianRoutes from './routes/penilaian.js';
import rekapRoutes from './routes/rekap.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Rute Dasar
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Asisten Praktikum Tools API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      dbStatus: '/api/db-status',
      matakuliah: '/api/matakuliah',
      kelas: '/api/kelas',
      praktikan: '/api/praktikan',
      modul: '/api/modul',
      rubrik: '/api/rubrik',
      penilaian: '/api/penilaian',
      rekap: '/api/rekap',
    },
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Endpoint pengujian koneksi database MySQL
app.get('/api/db-status', async (req, res) => {
  const result = await testConnection();
  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

// Rute API
app.use('/api/matakuliah', matakuliahRoutes);
app.use('/api/kelas', kelasRoutes);
app.use('/api/praktikan', praktikanRoutes);
app.use('/api/modul', modulRoutes);
app.use('/api/rubrik', rubrikRoutes);
app.use('/api/penilaian', penilaianRoutes);
app.use('/api/rekap', rekapRoutes);

// Jalankan server
app.listen(PORT, async () => {
  console.log(`🚀 Server backend berjalan di http://localhost:${PORT}`);
  console.log('📡 Memeriksa koneksi ke MySQL...');
  const dbStatus = await testConnection();
  if (dbStatus.success) {
    console.log(`✅ [MySQL Status] ${dbStatus.message}`);
  } else {
    console.warn(`⚠️ [MySQL Status] Belum terhubung: ${dbStatus.error}`);
    console.warn('   Pastikan MySQL di Laragon/XAMPP sudah dalam kondisi Start.');
  }
});
