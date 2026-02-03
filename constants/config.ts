// Konfigurasi API untuk HadirinApp - Node.js Backend

const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';
const BASE_URL = 'http://10.251.109.92:3000';

const debugLog = (message: string, data?: any) => {
  if (isDevelopment) {
    console.log(`[HadirinApp Debug] ${message}`, data || '');
  }
};

export const API_CONFIG = {
  BASE_URL,
  ENDPOINTS: {
    // Auth
    LOGIN: '/auth/api/login',
    PROFILE: '/auth/api/profile',
    
    // Admin
    ADMIN: '/admin/api/admin',
    
    // Pegawai & Akun
    DATA_PEGAWAI: '/admin/pegawai-akun/api/data-pegawai',
    DETAIL_PEGAWAI: '/admin/pegawai-akun/api/detail-pegawai',
    UPDATE_PEGAWAI: '/admin/pegawai-akun/api/update-pegawai',
    DELETE_PEGAWAI: '/admin/pegawai-akun/api/delete-pegawai',
    CHECK_EMAILS: '/admin/pegawai-akun/api/check-emails',
    
    // Laporan
    LAPORAN: '/admin/laporan/api/laporan',
    DETAIL_ABSEN_PEGAWAI: '/admin/laporan/api/detail-absen-pegawai',
    DETAIL_ABSEN: '/admin/laporan/api/detail-absen',
    
    // Pengaturan
    LOKASI_KANTOR: '/admin/pengaturan/api/lokasi-kantor',
    JAM_KERJA: '/admin/pengaturan/api/jam-kerja',
    HARI_LIBUR: '/admin/pengaturan/api/hari-libur',
    
    // Presensi
    TRACKING: '/admin/presensi/api/tracking',
    
    // Persetujuan
    APPROVAL: '/admin/persetujuan/api/approval',
    
    // Kelola Dinas
    DINAS_AKTIF: '/admin/kelola-dinas/api/dinas-aktif',
    CREATE_DINAS: '/admin/kelola-dinas/api/create-dinas',
    RIWAYAT_DINAS: '/admin/kelola-dinas/api/riwayat-dinas',
    VALIDASI_ABSEN: '/admin/kelola-dinas/api/validasi-absen',
    
    // Pegawai
    PEGAWAI_DASHBOARD: '/pegawai/api/dashboard',
    PEGAWAI_PRESENSI: '/pegawai/presensi/api/presensi',
    PEGAWAI_PENGAJUAN: '/pegawai/pengajuan/api/pengajuan',
    PEGAWAI_PROFILE: '/pegawai/profil/api/profile',
  }
};

export const getApiUrl = (endpoint: string) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

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

// Auth API
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

// Admin API
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

// Pegawai API
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

// Pegawai Akun API
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
      });
      return response.json();
    } catch (error) {
      return { success: false, message: 'Tidak dapat terhubung ke server' };
    }
  },
};

// Kelola Dinas API
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
  
  getRiwayatDinas: async () => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.RIWAYAT_DINAS));
      return response.json();
    } catch (error) {
      return { success: false, message: 'Tidak dapat terhubung ke server', data: [] };
    }
  },
  
  getValidasiAbsen: async () => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.VALIDASI_ABSEN));
      return response.json();
    } catch (error) {
      return { success: false, message: 'Tidak dapat terhubung ke server', data: [] };
    }
  },
};

// Pengaturan API
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
  
  getHariLibur: async () => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.HARI_LIBUR));
      return response.json();
    } catch (error) {
      return { success: false, message: 'Tidak dapat terhubung ke server', data: [] };
    }
  },
  
  getJamKerja: async () => {
    try {
      const response = await fetchWithRetry(getApiUrl(API_CONFIG.ENDPOINTS.JAM_KERJA));
      return response.json();
    } catch (error) {
      return { success: false, message: 'Tidak dapat terhubung ke server', data: [] };
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
  
  saveHariLibur: async (data: any) => {
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
      });
      return response.json();
    } catch (error) {
      return { success: false, message: 'Tidak dapat terhubung ke server' };
    }
  },
  
  updateLokasi: async (id: number, data: any) => {
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
  
  deleteLokasi: async (id: number) => {
    try {
      const response = await fetchWithRetry(`${getApiUrl(API_CONFIG.ENDPOINTS.LOKASI_KANTOR)}/${id}`, {
        method: 'DELETE',
      });
      return response.json();
    } catch (error) {
      return { success: false, message: 'Tidak dapat terhubung ke server' };
    }
  },
};

export default API_CONFIG;