# HadirinApp Backend (Node.js)

Backend API untuk aplikasi HadirinApp yang dikonversi dari PHP ke Node.js.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 atau lebih baru)
- XAMPP dengan MySQL running
- Database `hadirin_db` sudah ada

### Installation
```bash
cd backend
npm install
```

### Running the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📡 API Endpoints

### Authentication
- `POST /auth/api/login` - Login user
- `GET /auth/api/profile` - Get user profile

### Admin
- `GET /admin/api/admin` - Get admin dashboard data
- `POST /admin/api/admin` - Update admin profile

### Pegawai Management
- `GET /admin/pegawai-akun/api/data-pegawai` - Get all pegawai data
- `POST /admin/pegawai-akun/api/data-pegawai` - Create new pegawai
- `PUT /admin/pegawai-akun/api/update-pegawai/:id` - Update pegawai
- `DELETE /admin/pegawai-akun/api/delete-pegawai/:id` - Delete pegawai

### Presensi
- `GET /pegawai/presensi/api/presensi` - Get presensi data
- `POST /pegawai/presensi/api/presensi` - Submit presensi

## 🔧 Configuration

Database configuration in `src/config/database.js`:
```javascript
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hadirin_db'
};
```

## 📱 Mobile App Integration

Server berjalan di:
- Local: `http://localhost:3000`
- Network: `http://192.168.1.100:3000`

Update API base URL di mobile app untuk menggunakan endpoint Node.js ini.

## 🛠️ Troubleshooting

### Database Connection Error
```
❌ Database connection failed: ECONNREFUSED
```

**Solution:**
1. Buka XAMPP Control Panel
2. Start MySQL service
3. Pastikan database `hadirin_db` ada
4. Restart server Node.js

### Port Already in Use
```
Error: listen EADDRINUSE :::3000
```

**Solution:**
```bash
# Kill process using port 3000
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Or use different port
PORT=3001 npm start
```

## 📦 Dependencies

- **express** - Web framework
- **mysql2** - MySQL driver
- **bcryptjs** - Password hashing
- **cors** - CORS handling
- **multer** - File upload
- **dotenv** - Environment variables

## 🔄 Migration from PHP

Semua endpoint PHP telah dikonversi ke Node.js dengan response format yang sama:

```json
{
  "success": true/false,
  "message": "...",
  "data": {...}
}
```

Frontend React Native tidak perlu diubah, cukup update base URL API.