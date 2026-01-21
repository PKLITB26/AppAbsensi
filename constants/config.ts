// Konfigurasi API untuk HadirinApp
export const API_CONFIG = {
  BASE_URL: 'http://192.168.1.8/hadirinapp', // IP dari ipconfig
  FALLBACK_URL: 'http://localhost/hadirinapp', // Localhost sebagai fallback
  ALTERNATIVE_IPS: [
    'http://192.168.1.8/hadirinapp',
    'http://192.168.0.8/hadirinapp', // Common alternative subnet
    'http://10.0.0.8/hadirinapp',    // Another common subnet
    'http://localhost/hadirinapp'     // Final fallback
  ],
  TEST_URL: 'http://192.168.1.8', // Test basic connection
  
  // Endpoint APIcls
  ENDPOINTS: {
    // Auth endpoints (untuk semua user)
    LOGIN: '/auth/api/login.php',
    PROFILE: '/auth/api/profile.php',
    
    // Pegawai endpoints - khusus untuk pegawai
    PEGAWAI_DASHBOARD: '/pegawai/api/dashboard.php',
    PEGAWAI_PROFILE: '/pegawai/profil/api/profile.php',
    PEGAWAI_PRESENSI: '/pegawai/presensi/api/presensi.php',
    PEGAWAI_PENGAJUAN: '/pegawai/pengajuan/api/pengajuan.php',
    
    // Admin endpoints - semua fitur admin
    ADMIN: '/admin/api/admin.php',
    KELOLA_PEGAWAI: '/admin/api/kelola-pegawai.php',
    CREATE_ADMIN: '/admin/api/create-admin.php',
    CREATE_ACCOUNTS: '/admin/api/create-accounts.php',
    
    // Admin - Pegawai & Akun
    DATA_PEGAWAI: '/admin/pegawai-akun/api/data-pegawai.php',
    UPDATE_PEGAWAI: '/admin/pegawai-akun/api/update-pegawai.php',
    DETAIL_PEGAWAI: '/admin/pegawai-akun/api/detail-pegawai.php',
    DELETE_PEGAWAI: '/admin/pegawai-akun/api/delete-pegawai.php',
    AKUN_LOGIN: '/admin/pegawai-akun/api/akun-login.php',
    CHECK_EMAILS: '/admin/pegawai-akun/api/check-emails.php',
    
    // Admin - Presensi
    TRACKING: '/admin/presensi/api/tracking.php',
    
    // Admin - Persetujuan
    APPROVAL: '/admin/persetujuan/api/approval.php',
    
    // Admin - Laporan
    LAPORAN: '/admin/laporan/api/laporan.php',
    DETAIL_LAPORAN: '/admin/laporan/api/detail-laporan.php',
    DETAIL_ABSEN: '/admin/laporan/api/detail-absen.php',
    DETAIL_ABSEN_PEGAWAI: '/admin/laporan/api/detail-absen-pegawai.php',
    EXPORT_PDF: '/admin/laporan/api/export-pdf.php',
    
    // Admin - Kelola Dinas
    DINAS_AKTIF: '/admin/kelola-dinas/api/dinas-aktif.php',
    RIWAYAT_DINAS: '/admin/kelola-dinas/api/riwayat-dinas.php',
    VALIDASI_ABSEN: '/admin/kelola-dinas/api/validasi-absen.php',
    CREATE_DINAS: '/admin/kelola-dinas/api/create-dinas.php',
    
    // Admin - Pengaturan
    JAM_KERJA: '/admin/pengaturan/api/jam-kerja.php',
    HARI_LIBUR: '/admin/pengaturan/api/hari-libur.php',
    LOKASI_KANTOR: '/admin/pengaturan/api/lokasi-kantor.php',
    
    // Admin - Notifikasi
    NOTIFIKASI_ADMIN: '/backend_notifikasi_admin.php',
    
    // Legacy endpoints (masih di root)
    TEST_API: '/test-api.php',
    TEST_CONNECTION: '/test-connection.php',
  }
};

// Helper function untuk membuat URL lengkap dengan retry
export const getApiUrl = (endpoint: string) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Network connectivity check
export const checkNetworkConnectivity = async () => {
  try {
    // Test dengan endpoint sederhana
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.TEST_CONNECTION), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000) // 5 detik timeout
    });
    return response.ok;
  } catch (error) {
    console.log('Network connectivity check failed:', error);
    return false;
  }
};

// Helper function untuk fetch dengan retry dan fallback
export const fetchWithRetry = async (url: string, options: any = {}): Promise<Response> => {
  console.log('Trying URL:', url);
  
  // Get all possible URLs to try
  const getUrlVariants = (originalUrl: string) => {
    const variants = [];
    
    // Try original URL first
    variants.push({ timeout: 15000, url: originalUrl });
    
    // Try alternative IPs
    API_CONFIG.ALTERNATIVE_IPS.forEach(baseUrl => {
      const endpoint = originalUrl.replace(API_CONFIG.BASE_URL, '');
      const newUrl = baseUrl + endpoint;
      if (newUrl !== originalUrl) {
        variants.push({ timeout: 20000, url: newUrl });
      }
    });
    
    return variants;
  };
  
  const attempts = getUrlVariants(url);
  
  for (let i = 0; i < attempts.length; i++) {
    try {
      console.log(`Attempt ${i + 1}: ${attempts[i].url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), attempts[i].timeout);
      
      const response = await fetch(attempts[i].url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          ...options.headers
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`Success on attempt ${i + 1}`);
        return response;
      } else {
        console.log(`HTTP ${response.status} on attempt ${i + 1}`);
        if (i === attempts.length - 1) {
          throw new Error(`HTTP ${response.status}`);
        }
      }
    } catch (error: any) {
      console.log(`Attempt ${i + 1} failed:`, error.message);
      
      if (i === attempts.length - 1) {
        // Final attempt failed
        if (error.name === 'AbortError') {
          throw new Error('Koneksi timeout. Periksa koneksi internet dan pastikan HP dan komputer di WiFi yang sama.');
        } else {
          throw new Error('Tidak dapat terhubung ke server. Pastikan:\n1. HP dan komputer di WiFi yang sama\n2. Server backend berjalan\n3. Firewall tidak memblokir koneksi');
        }
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw new Error('All attempts failed');
};

// API helper functions untuk semua modul
export const AuthAPI = {
  login: async (email: string, password: string) => {
    try {
      console.log('Starting login request for:', email);
      
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.LOGIN), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password }),
      });
      
      const result = await response.json();
      console.log('Login response:', result);
      return result;
      
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.message || 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.'
      };
    }
  },
  
  getProfile: async () => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.PROFILE));
      return response.json();
    } catch (error) {
      console.error('Profile error:', error);
      return {
        success: false,
        message: (error as Error).message || 'Tidak dapat terhubung ke server'
      };
    }
  },
};

// API khusus untuk pegawai
export const PegawaiAPI = {
  getDashboard: async (user_id: string) => {
    try {
      console.log('Fetching dashboard for user_id:', user_id);
      const response = await fetchWithRetry(`${getApiUrl(API_CONFIG.ENDPOINTS.PEGAWAI_DASHBOARD)}?user_id=${user_id}`);
      const result = await response.json();
      console.log('Dashboard API response:', result);
      return result;
    } catch (error) {
      console.error('Dashboard error:', error);
      return {
        success: false,
        message: (error as Error).message || 'Tidak dapat terhubung ke server',
        data: null
      };
    }
  },
  
  getProfile: async (user_id: string) => {
    try {
      const response = await fetchWithRetry(`${getApiUrl(API_CONFIG.ENDPOINTS.PEGAWAI_PROFILE)}?user_id=${user_id}`);
      return response.json();
    } catch (error) {
      console.error('Profile error:', error);
      return {
        success: false,
        message: (error as Error).message || 'Tidak dapat terhubung ke server',
        data: null
      };
    }
  },
  
  updateProfile: async (data: any) => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.PEGAWAI_PROFILE), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        message: (error as Error).message || 'Tidak dapat terhubung ke server'
      };
    }
  },
  
  getPresensi: async (user_id: string, tanggal?: string) => {
    try {
      const params = new URLSearchParams({ user_id });
      if (tanggal) params.append('tanggal', tanggal);
      
      const response = await fetchWithRetry(`${getApiUrl(API_CONFIG.ENDPOINTS.PEGAWAI_PRESENSI)}?${params.toString()}`);
      return response.json();
    } catch (error) {
      console.error('Presensi error:', error);
      return {
        success: false,
        message: (error as Error).message || 'Tidak dapat terhubung ke server',
        data: null
      };
    }
  },
  
  submitPresensi: async (data: any) => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.PEGAWAI_PRESENSI), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    } catch (error) {
      console.error('Submit presensi error:', error);
      return {
        success: false,
        message: (error as Error).message || 'Tidak dapat terhubung ke server'
      };
    }
  },
  
  getPengajuan: async (user_id: string) => {
    try {
      const response = await fetchWithRetry(`${getApiUrl(API_CONFIG.ENDPOINTS.PEGAWAI_PENGAJUAN)}?user_id=${user_id}`);
      return response.json();
    } catch (error) {
      console.error('Pengajuan error:', error);
      return {
        success: false,
        message: (error as Error).message || 'Tidak dapat terhubung ke server',
        data: []
      };
    }
  },
  
  submitPengajuan: async (data: any) => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.PEGAWAI_PENGAJUAN), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    } catch (error) {
      console.error('Submit pengajuan error:', error);
      return {
        success: false,
        message: (error as Error).message || 'Tidak dapat terhubung ke server'
      };
    }
  },
};

export const PegawaiAkunAPI = {
  getDataPegawai: async () => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.DATA_PEGAWAI));
      return response.json();
    } catch (error) {
      console.error('Get data pegawai error:', error);
      return { success: false, message: 'Tidak dapat terhubung ke server', data: [] };
    }
  },
  
  deletePegawai: async (id: number) => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.DELETE_PEGAWAI), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      return response.json();
    } catch (error) {
      console.error('Delete pegawai error:', error);
      return { success: false, message: 'Tidak dapat terhubung ke server' };
    }
  },
  
  getAkunLogin: async () => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.AKUN_LOGIN));
      return response.json();
    } catch (error) {
      console.error('Get akun login error:', error);
      return { success: false, message: 'Tidak dapat terhubung ke server', data: [] };
    }
  },
  
  checkEmails: async () => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.CHECK_EMAILS));
      return response.json();
    } catch (error) {
      console.error('Check emails error:', error);
      return { success: false, message: 'Tidak dapat terhubung ke server', data: [] };
    }
  },
};

export const PresensiAPI = {
  getTracking: async () => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.TRACKING));
      return response.json();
    } catch (error) {
      console.error('Get tracking error:', error);
      return { success: false, message: 'Tidak dapat terhubung ke server', data: [] };
    }
  },
};

export const PersetujuanAPI = {
  getApproval: async (params: any = {}) => {
    try {
      const queryParams = new URLSearchParams(params);
      const url = `${getApiUrl(API_CONFIG.ENDPOINTS.APPROVAL)}?${queryParams.toString()}`;
      const response = await fetchWithRetry(url);
      return response.json();
    } catch (error) {
      console.error('Get approval error:', error);
      return { success: false, message: 'Tidak dapat terhubung ke server', data: [] };
    }
  },
  
  updateApproval: async (data: any) => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.APPROVAL), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    } catch (error) {
      console.error('Update approval error:', error);
      return { success: false, message: 'Tidak dapat terhubung ke server' };
    }
  },
};

export const LaporanAPI = {
  getLaporan: async (params: any = {}) => {
    try {
      const queryParams = new URLSearchParams(params);
      const url = `${getApiUrl(API_CONFIG.ENDPOINTS.LAPORAN)}?${queryParams.toString()}`;
      const response = await fetchWithRetry(url);
      return response.json();
    } catch (error) {
      console.error('Get laporan error:', error);
      return { success: false, message: 'Tidak dapat terhubung ke server', data: [] };
    }
  },
  
  getDetailLaporan: async (params: any = {}) => {
    try {
      const queryParams = new URLSearchParams(params);
      const url = `${getApiUrl(API_CONFIG.ENDPOINTS.DETAIL_LAPORAN)}?${queryParams.toString()}`;
      const response = await fetchWithRetry(url);
      return response.json();
    } catch (error) {
      console.error('Get detail laporan error:', error);
      return { success: false, message: 'Tidak dapat terhubung ke server', data: [] };
    }
  },
  
  getDetailAbsen: async (params: any = {}) => {
    try {
      const queryParams = new URLSearchParams(params);
      const url = `${getApiUrl(API_CONFIG.ENDPOINTS.DETAIL_ABSEN)}?${queryParams.toString()}`;
      const response = await fetchWithRetry(url);
      return response.json();
    } catch (error) {
      console.error('Get detail absen error:', error);
      return { success: false, message: 'Tidak dapat terhubung ke server', data: [] };
    }
  },
  
  exportPDF: async (params: any = {}) => {
    try {
      const queryParams = new URLSearchParams(params);
      const url = `${getApiUrl(API_CONFIG.ENDPOINTS.EXPORT_PDF)}?${queryParams.toString()}`;
      const response = await fetchWithRetry(url);
      return response.blob();
    } catch (error) {
      console.error('Export PDF error:', error);
      throw error;
    }
  },
};

export const AdminAPI = {
  getAdmin: async () => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.ADMIN));
      return response.json();
    } catch (error) {
      console.error('Get admin error:', error);
      return { success: false, message: 'Tidak dapat terhubung ke server', data: null };
    }
  },
  
  getKelolaPegawai: async (params: any = {}) => {
    try {
      const queryParams = new URLSearchParams(params);
      const url = `${getApiUrl(API_CONFIG.ENDPOINTS.KELOLA_PEGAWAI)}?${queryParams.toString()}`;
      const response = await fetchWithRetry(url);
      return response.json();
    } catch (error) {
      console.error('Get kelola pegawai error:', error);
      return { success: false, message: 'Tidak dapat terhubung ke server', data: [] };
    }
  },
  
  createAdmin: async (data: any) => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.CREATE_ADMIN), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    } catch (error) {
      console.error('Create admin error:', error);
      return { success: false, message: 'Tidak dapat terhubung ke server' };
    }
  },
  
  createAccounts: async (data: any) => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.CREATE_ACCOUNTS), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    } catch (error) {
      console.error('Create accounts error:', error);
      return { success: false, message: 'Tidak dapat terhubung ke server' };
    }
  },
};

export const KelolaDinasAPI = {
  getDinasAktif: async () => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.DINAS_AKTIF));
      return response.json();
    } catch (error) {
      console.error('Get dinas aktif error:', error);
      return { success: false, message: 'Tidak dapat terhubung ke server', data: [] };
    }
  },
  
  getRiwayatDinas: async (params: {
    filter_date?: string;
    selected_date?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
      
      const url = `${getApiUrl(API_CONFIG.ENDPOINTS.RIWAYAT_DINAS)}?${queryParams.toString()}`;
      const response = await fetchWithRetry(url);
      return response.json();
    } catch (error) {
      console.error('Get riwayat dinas error:', error);
      return { success: false, message: 'Tidak dapat terhubung ke server', data: [] };
    }
  },
  
  getValidasiAbsen: async (params: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
      
      const url = `${getApiUrl(API_CONFIG.ENDPOINTS.VALIDASI_ABSEN)}?${queryParams.toString()}`;
      const response = await fetchWithRetry(url);
      return response.json();
    } catch (error) {
      console.error('Get validasi absen error:', error);
      return { success: false, message: 'Tidak dapat terhubung ke server', data: [] };
    }
  },
  
  updateValidasiAbsen: async (data: {
    id: number;
    action: 'approve' | 'reject';
    keterangan?: string;
  }) => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.VALIDASI_ABSEN), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    } catch (error) {
      console.error('Update validasi absen error:', error);
      return { success: false, message: 'Tidak dapat terhubung ke server' };
    }
  },
  
  createDinas: async (data: any) => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.CREATE_DINAS), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data),
      });
      return response.json();
    } catch (error) {
      console.error('Error in createDinas:', error);
      return { success: false, message: 'Tidak dapat terhubung ke server' };
    }
  },
};

export const PengaturanAPI = {
  getJamKerja: async () => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.JAM_KERJA));
      return response.json();
    } catch (error) {
      console.error('Get jam kerja error:', error);
      return { success: false, message: 'Tidak dapat terhubung ke server', data: null };
    }
  },
  
  saveJamKerja: async (data: any) => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.JAM_KERJA), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    } catch (error) {
      console.error('Save jam kerja error:', error);
      return { success: false, message: 'Tidak dapat terhubung ke server' };
    }
  },
  
  getHariLibur: async () => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.HARI_LIBUR));
      return response.json();
    } catch (error) {
      console.error('Get hari libur error:', error);
      return { success: false, message: 'Tidak dapat terhubung ke server', data: [] };
    }
  },
  
  saveHariLibur: async (data: any) => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.HARI_LIBUR), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    } catch (error) {
      console.error('Save hari libur error:', error);
      return { success: false, message: 'Tidak dapat terhubung ke server' };
    }
  },
  
  deleteHariLibur: async (id: number) => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.HARI_LIBUR), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      return response.json();
    } catch (error) {
      console.error('Delete hari libur error:', error);
      return { success: false, message: 'Tidak dapat terhubung ke server' };
    }
  },
  
  getLokasiKantor: async () => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.LOKASI_KANTOR));
      return response.json();
    } catch (error) {
      console.error('Get lokasi kantor error:', error);
      return { success: false, message: 'Tidak dapat terhubung ke server', data: [] };
    }
  },
  
  saveLokasiKantor: async (data: any) => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.LOKASI_KANTOR), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    } catch (error) {
      console.error('Save lokasi kantor error:', error);
      return { success: false, message: 'Tidak dapat terhubung ke server' };
    }
  },
  
  deleteLokasi: async (id: number) => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.LOKASI_KANTOR), {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ id }),
      });
      return response.json();
    } catch (error) {
      console.error('Error in deleteLokasi:', error);
      return { success: false, message: 'Tidak dapat terhubung ke server' };
    }
  },
  
  updateLokasi: async (id: any, data: any) => {
    try {
      const response = await fetchWithRetry(`${getApiUrl('/admin/pengaturan/api/update-lokasi')}/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data),
      });
      return response.json();
    } catch (error) {
      console.error('Error in updateLokasi:', error);
      return { success: false, message: 'Tidak dapat terhubung ke server' };
    }
  },
};

export const NotifikasiAPI = {
  getNotifikasiAdmin: async () => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.NOTIFIKASI_ADMIN));
      return response.json();
    } catch (error) {
      console.error('Error in getNotifikasiAdmin:', error);
      return {
        success: false,
        message: 'Tidak dapat terhubung ke server',
        data: [],
        total_unread: 0
      };
    }
  },
};