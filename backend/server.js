const express = require('express');
const { connectDB } = require('./src/config/database');
const corsMiddleware = require('./src/middleware/cors');

// Import routes
const authRoutes = require('./src/routes/auth');
const adminRoutes = require('./src/routes/admin-admin');
const pegawaiRoutes = require('./src/routes/pegawai-admin');
const presensiRoutes = require('./src/routes/presensi');
const dashboardRoutes = require('./src/routes/dashboard');
const laporanRoutes = require('./src/routes/laporan-admin');
const pengaturanRoutes = require('./src/routes/pengaturan-admin');
const trackingRoutes = require('./src/routes/tracking-admin');
const approvalRoutes = require('./src/routes/approval-admin');
const pengajuanRoutes = require('./src/routes/pengajuan');
const dinasRoutes = require('./src/routes/dinas-admin');
const profileRoutes = require('./src/routes/profile');
const akunRoutes = require('./src/routes/akun-admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/auth/api', authRoutes);
app.use('/admin/api', adminRoutes);
app.use('/admin/pegawai-akun/api', pegawaiRoutes);
app.use('/admin/pegawai-akun/api', akunRoutes);
app.use('/pegawai/presensi/api', presensiRoutes);
app.use('/pegawai/api', dashboardRoutes);
app.use('/admin/laporan/api', laporanRoutes);
app.use('/admin/pengaturan/api', pengaturanRoutes);
app.use('/admin/presensi/api', trackingRoutes);
app.use('/admin/persetujuan/api', approvalRoutes);
app.use('/pegawai/pengajuan/api', pengajuanRoutes);
app.use('/admin/kelola-dinas/api', dinasRoutes);
app.use('/pegawai/profil/api', profileRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'HadirinApp Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Endpoint not found' 
  });
});

// Start server
const startServer = async () => {
  try {
    console.log('🚀 Starting HadirinApp Backend Server...');
    console.log('📍 Environment:', process.env.NODE_ENV || 'development');
    console.log('🔌 Port:', PORT);
    
    // Try to connect to database
    try {
      await connectDB();
    } catch (error) {
      console.warn('⚠️  Database connection failed, but server will start anyway');
      console.warn('Some endpoints may not work until database is available');
    }
    
    app.listen(PORT, () => {
      console.log(`\n✅ Server running successfully!`);
      console.log(`🌐 Local: http://localhost:${PORT}`);
      console.log(`📱 Mobile: http://192.168.1.100:${PORT}`);
      console.log(`\n📄 Available endpoints:`);
      console.log(`   POST /auth/api/login`);
      console.log(`   GET  /auth/api/profile`);
      console.log(`   GET  /admin/api/admin`);
      console.log(`   POST /admin/api/admin`);
      console.log(`   GET  /admin/pegawai-akun/api/data-pegawai`);
      console.log(`   POST /admin/pegawai-akun/api/data-pegawai`);
      console.log(`   PUT  /admin/pegawai-akun/api/update-pegawai/:id`);
      console.log(`   DEL  /admin/pegawai-akun/api/delete-pegawai/:id`);
      console.log(`   GET  /pegawai/api/dashboard`);
      console.log(`   GET  /pegawai/presensi/api/presensi`);
      console.log(`   POST /pegawai/presensi/api/presensi`);
      console.log(`   GET  /admin/laporan/api/laporan`);
      console.log(`   GET  /admin/pengaturan/api/lokasi-kantor`);
      console.log(`   POST /admin/pengaturan/api/lokasi-kantor`);
      console.log(`   PUT  /admin/pengaturan/api/lokasi-kantor/:id`);
      console.log(`   DEL  /admin/pengaturan/api/lokasi-kantor/:id`);
      console.log(`   GET  /admin/presensi/api/tracking`);
      console.log(`\n🔄 Ready to serve HadirinApp mobile app\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();