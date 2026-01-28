// Konfigurasi API untuk HadirinApp - Node.js Backend

// Base URL configuration
const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';
const BASE_URL = isDevelopment ? 'http://10.251.109.84:3000' : 'http://10.251.109.84:3000';

// Debug logging helper
const debugLog = (message: string, data?: any) => {
  if (isDevelopment) {
    console.log(`[HadirinApp Debug] ${message}`, data || '');
  }
};

export const API_CONFIG = {
  BASE_URL,
  
  // Endpoint API - Node.js Backend LENGKAP
  ENDPOINTS: {
    // Auth endpoints ✅
    LOGIN: '/auth/api/login',
    PROFILE: '/auth/api/profile',
    
    // Admin endpoints ✅
    ADMIN: '/admin/api/admin',
    
    // Admin - Pegawai & Akun ✅
    DATA_PEGAWAI: '/admin/pegawai-akun/api/data-pegawai',
    DETAIL_PEGAWAI: '/admin/pegawai-akun/api/detail-pegawai',
    UPDATE_PEGAWAI: '/admin/pegawai-akun/api/update-pegawai',
    DELETE_PEGAWAI: '/admin/pegawai-akun/api/delete-pegawai',
    KELOLA_PEGAWAI: '/admin/api/kelola-pegawai',
    AKUN_LOGIN: '/admin/pegawai-akun/api/akun-login',
    CHECK_EMAILS: '/admin/pegawai-akun/api/check-emails',
    
    // Admin - Laporan ✅
    LAPORAN: '/admin/laporan/api/laporan',
    DETAIL_ABSEN_PEGAWAI: '/admin/laporan/api/detail-absen-pegawai',
    DETAIL_LAPORAN: '/admin/laporan/api/detail-laporan',
    DETAIL_ABSEN: '/admin/laporan/api/detail-absen',
    EXPORT_PDF: '/admin/laporan/api/export-pdf',
    
    // Admin - Pengaturan ✅
    LOKASI_KANTOR: '/admin/pengaturan/api/lokasi-kantor',
    UPDATE_LOKASI: '/admin/pengaturan/api/update-lokasi',
    JAM_KERJA: '/admin/pengaturan/api/jam-kerja',
    HARI_LIBUR: '/admin/pengaturan/api/hari-libur',
    
    // Admin - Presensi ✅
    TRACKING: '/admin/presensi/api/tracking',
    
    // Admin - Persetujuan ✅
    APPROVAL: '/admin/persetujuan/api/approval',
    
    // Admin - Kelola Dinas ✅
    DINAS_AKTIF: '/admin/kelola-dinas/api/dinas-aktif',
    CREATE_DINAS: '/admin/kelola-dinas/api/create-dinas',
    RIWAYAT_DINAS: '/admin/kelola-dinas/api/riwayat-dinas',
    VALIDASI_ABSEN: '/admin/kelola-dinas/api/validasi-absen',
    
    // Pegawai endpoints ✅
    PEGAWAI_DASHBOARD: '/pegawai/api/dashboard',
    PEGAWAI_PRESENSI: '/pegawai/presensi/api/presensi',
    PEGAWAI_PENGAJUAN: '/pegawai/pengajuan/api/pengajuan',
    PEGAWAI_PROFILE: '/pegawai/profil/api/profile',
  }
};

// Helper function untuk membuat URL lengkap
export const getApiUrl = (endpoint: string) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function untuk fetch dengan error handling
export const fetchWithRetry = async (url: string, options: any = {}): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  
  debugLog('API Request', { url, method: options.method || 'GET' });
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      }
    });
    
    clearTimeout(timeoutId);
    debugLog('API Response', { url, status: response.status });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    debugLog('API Error', { url, error: error.message });
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - Server tidak merespons');
    }
    
    throw new Error(error.message || 'Tidak dapat terhubung ke server');
  }
};

// API helper functions - Hanya yang sudah dibuat
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
  
  getProfile: async (user_id: string) => {
    try {
      const response = await fetchWithRetry(`${getApiUrl(API_CONFIG.ENDPOINTS.PROFILE)}?user_id=${user_id}`);
      return response.json();
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Tidak dapat terhubung ke server'
      };
    }
  },
};

// API untuk admin
export const AdminAPI = {
  getAdminData: async (user_id?: string) => {
    try {
      const url = user_id ? `${getApiUrl(API_CONFIG.ENDPOINTS.ADMIN)}?user_id=${user_id}` : getApiUrl(API_CONFIG.ENDPOINTS.ADMIN);
      const response = await fetchWithRetry(url);
      return response.json();
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Tidak dapat terhubung ke server'
      };
    }
  },
  
  updateProfile: async (data: any) => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.ADMIN), {
        method: 'POST',
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

// API untuk pegawai akun management
export const PegawaiAkunAPI = {
  getDataPegawai: async () => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.DATA_PEGAWAI));
      return response.json();
    } catch (error) {
      return { success: false, message: 'Tidak dapat terhubung ke server', data: [] };
    }
  },
  
  getDetailPegawai: async (id: number) => {
    try {
      const response = await fetchWithRetry(`${getApiUrl(API_CONFIG.ENDPOINTS.DETAIL_PEGAWAI)}/${id}`);
      return response.json();
    } catch (error) {
      return { success: false, message: 'Tidak dapat terhubung ke server', data: null };
    }
  },
  
  createPegawai: async (data: any) => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.DATA_PEGAWAI), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    } catch (error) {
      return { success: false, message: 'Tidak dapat terhubung ke server' };
    }
  },
  
  updatePegawai: async (id: number, data: any) => {
    try {
      const response = await fetchWithRetry(`${getApiUrl(API_CONFIG.ENDPOINTS.UPDATE_PEGAWAI)}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    } catch (error) {
      return { success: false, message: 'Tidak dapat terhubung ke server' };
    }
  },
  
  deletePegawai: async (id: number) => {
    try {
      const response = await fetchWithRetry(`${getApiUrl(API_CONFIG.ENDPOINTS.DELETE_PEGAWAI)}/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.json();
    } catch (error) {
      return { success: false, message: 'Tidak dapat terhubung ke server' };
    }
  },
};

// API untuk kelola dinas
export const KelolaDinasAPI = {
  getDinasAktif: async () => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.DINAS_AKTIF));
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
};

// API untuk laporan admin
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
};

// API untuk pengaturan admin
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
  
  updateLokasiKantor: async (id: number, data: any) => {
    try {
      const response = await fetchWithRetry(`${getApiUrl(API_CONFIG.ENDPOINTS.LOKASI_KANTOR)}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    } catch (error) {
      return { success: false, message: 'Tidak dapat terhubung ke server' };
    }
  },
  
  deleteLokasiKantor: async (id: number) => {
    try {
      const response = await fetchWithRetry(`${getApiUrl(API_CONFIG.ENDPOINTS.LOKASI_KANTOR)}/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
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
  
  saveJamKerja: async (data: any) => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.JAM_KERJA), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    } catch (error) {
      return { success: false, message: 'Tidak dapat terhubung ke server' };
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
  
  createHariLibur: async (data: any) => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.HARI_LIBUR), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    } catch (error) {
      return { success: false, message: 'Tidak dapat terhubung ke server' };
    }
  },
  
  deleteHariLibur: async (id: number) => {
    try {
      const response = await fetchWithRetry(`${getApiUrl(API_CONFIG.ENDPOINTS.HARI_LIBUR)}/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.json();
    } catch (error) {
      return { success: false, message: 'Tidak dapat terhubung ke server' };
    }
  },
};

// API untuk approval admin
export const AdminAPI2 = {
  getApproval: async () => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.APPROVAL));
      return response.json();
    } catch (error) {
      return { success: false, message: 'Tidak dapat terhubung ke server', data: [] };
    }
  },
  
  updateApproval: async (id: number, data: any) => {
    try {
      const response = await fetchWithRetry(`${getApiUrl(API_CONFIG.ENDPOINTS.APPROVAL)}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    } catch (error) {
      return { success: false, message: 'Tidak dapat terhubung ke server' };
    }
  },
};

// API untuk tracking presensi
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

// Export default config
export default API_CONFIG;