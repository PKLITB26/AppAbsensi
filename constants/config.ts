// Konfigurasi API untuk HadirinApp
export const API_CONFIG = {
  BASE_URL: 'http://192.168.1.8/hadirinapp',
  
  // Endpoint API
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

// Helper function untuk membuat URL lengkap
export const getApiUrl = (endpoint: string) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function untuk fetch dengan error handling
export const fetchWithRetry = async (url: string, options: any = {}): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
  
  try {
    const response = await fetch(url, {
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
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - Server tidak merespons');
    }
    
    throw new Error(error.message || 'Tidak dapat terhubung ke server');
  }
};

// API helper functions
export const AuthAPI = {
  login: async (email: string, password: string) => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.LOGIN), {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      return response.json();
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Tidak dapat terhubung ke server'
      };
    }
  },
  
  getProfile: async () => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.PROFILE));
      return response.json();
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Tidak dapat terhubung ke server'
      };
    }
  },
};

// API untuk pegawai
export const PegawaiAPI = {
  getDashboard: async (user_id: string) => {
    try {
      const response = await fetchWithRetry(`${getApiUrl(API_CONFIG.ENDPOINTS.PEGAWAI_DASHBOARD)}?user_id=${user_id}`);
      return response.json();
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Tidak dapat terhubung ke server',
        data: null
      };
    }
  },
  
  getProfile: async (user_id: string) => {
    try {
      const url = `${getApiUrl(API_CONFIG.ENDPOINTS.PEGAWAI_PROFILE)}?user_id=${user_id}`;
      const response = await fetchWithRetry(url);
      return response.json();
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Tidak dapat terhubung ke server',
        data: null
      };
    }
  },
  
  updateProfile: async (data: any) => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.PEGAWAI_PROFILE), {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response.json();
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Tidak dapat terhubung ke server'
      };
    }
  },
  
  getPresensi: async (user_id: string, tanggal?: string) => {
    try {
      const params = new URLSearchParams({ user_id });
      if (tanggal) params.append('tanggal', tanggal);
      
      const response = await fetchWithRetry(`${getApiUrl(API_CONFIG.ENDPOINTS.PEGAWAI_PRESENSI)}?${params.toString()}`);
      return response.json();
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Tidak dapat terhubung ke server',
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
      return { success: false, message: 'Tidak dapat terhubung ke server' };
    }
  },
  
  getAkunLogin: async () => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.AKUN_LOGIN));
      return response.json();
    } catch (error) {
      return { success: false, message: 'Tidak dapat terhubung ke server', data: [] };
    }
  },
  
  checkEmails: async () => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.CHECK_EMAILS));
      return response.json();
    } catch (error) {
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
      return { success: false, message: 'Tidak dapat terhubung ke server', data: [] };
    }
  },
};

export const AdminAPI = {
  getApproval: async () => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.APPROVAL));
      return response.json();
    } catch (error) {
      return { success: false, message: 'Tidak dapat terhubung ke server', data: [] };
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
      throw error;
    }
  },
};

export const KelolaDinasAPI = {
  getDinasAktif: async () => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.DINAS_AKTIF));
      return response.json();
    } catch (error) {
      return { success: false, message: 'Tidak dapat terhubung ke server', data: [] };
    }
  },
  
  getRiwayatDinas: async (params: any = {}) => {
    try {
      const queryParams = new URLSearchParams(params);
      const url = `${getApiUrl(API_CONFIG.ENDPOINTS.RIWAYAT_DINAS)}?${queryParams.toString()}`;
      const response = await fetchWithRetry(url);
      return response.json();
    } catch (error) {
      return { success: false, message: 'Tidak dapat terhubung ke server', data: [] };
    }
  },
  
  getValidasiAbsen: async (params: any = {}) => {
    try {
      const queryParams = new URLSearchParams(params);
      const url = `${getApiUrl(API_CONFIG.ENDPOINTS.VALIDASI_ABSEN)}?${queryParams.toString()}`;
      const response = await fetchWithRetry(url);
      return response.json();
    } catch (error) {
      return { success: false, message: 'Tidak dapat terhubung ke server', data: [] };
    }
  },
  
  createDinas: async (data: any) => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.CREATE_DINAS), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    } catch (error) {
      return { success: false, message: 'Tidak dapat terhubung ke server' };
    }
  },
};

export const PengaturanAPI = {
  getLokasiKantor: async () => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.LOKASI_KANTOR));
      return response.json();
    } catch (error) {
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
      return { success: false, message: 'Tidak dapat terhubung ke server' };
    }
  },
  
  getJamKerja: async () => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.JAM_KERJA));
      return response.json();
    } catch (error) {
      return { success: false, message: 'Tidak dapat terhubung ke server', data: null };
    }
  },
  
  getHariLibur: async () => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.HARI_LIBUR));
      return response.json();
    } catch (error) {
      return { success: false, message: 'Tidak dapat terhubung ke server', data: [] };
    }
  },
};

// Export default config
export default API_CONFIG;