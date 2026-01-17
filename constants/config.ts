// Konfigurasi API untuk HadirinApp
export const API_CONFIG = {
  BASE_URL: 'http://192.168.1.7/hadirinapp', // Ganti dengan IP yang benar
  
  // Endpoint APIcls
  ENDPOINTS: {
    // Auth endpoints (untuk pegawai)
    LOGIN: '/auth/api/login.php',
    PROFILE: '/auth/api/profile.php',
    
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

// API helper functions untuk semua modul
export const AuthAPI = {
  login: async (email: string, password: string) => {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.LOGIN), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },
  
  getProfile: async () => {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.PROFILE));
    return response.json();
  },
};

export const PegawaiAkunAPI = {
  getDataPegawai: async () => {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.DATA_PEGAWAI));
    return response.json();
  },
  
  deletePegawai: async (id: number) => {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.DELETE_PEGAWAI), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    return response.json();
  },
  
  getAkunLogin: async () => {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.AKUN_LOGIN));
    return response.json();
  },
  
  checkEmails: async () => {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.CHECK_EMAILS));
    return response.json();
  },
};

export const PresensiAPI = {
  getTracking: async () => {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.TRACKING));
    return response.json();
  },
};

export const PersetujuanAPI = {
  getApproval: async (params: any = {}) => {
    const queryParams = new URLSearchParams(params);
    const url = `${getApiUrl(API_CONFIG.ENDPOINTS.APPROVAL)}?${queryParams.toString()}`;
    const response = await fetch(url);
    return response.json();
  },
  
  updateApproval: async (data: any) => {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.APPROVAL), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
};

export const LaporanAPI = {
  getLaporan: async (params: any = {}) => {
    const queryParams = new URLSearchParams(params);
    const url = `${getApiUrl(API_CONFIG.ENDPOINTS.LAPORAN)}?${queryParams.toString()}`;
    const response = await fetch(url);
    return response.json();
  },
  
  getDetailLaporan: async (params: any = {}) => {
    const queryParams = new URLSearchParams(params);
    const url = `${getApiUrl(API_CONFIG.ENDPOINTS.DETAIL_LAPORAN)}?${queryParams.toString()}`;
    const response = await fetch(url);
    return response.json();
  },
  
  getDetailAbsen: async (params: any = {}) => {
    const queryParams = new URLSearchParams(params);
    const url = `${getApiUrl(API_CONFIG.ENDPOINTS.DETAIL_ABSEN)}?${queryParams.toString()}`;
    const response = await fetch(url);
    return response.json();
  },
  
  exportPDF: async (params: any = {}) => {
    const queryParams = new URLSearchParams(params);
    const url = `${getApiUrl(API_CONFIG.ENDPOINTS.EXPORT_PDF)}?${queryParams.toString()}`;
    const response = await fetch(url);
    return response.blob();
  },
};

export const AdminAPI = {
  getAdmin: async () => {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ADMIN));
    return response.json();
  },
  
  getKelolaPegawai: async (params: any = {}) => {
    const queryParams = new URLSearchParams(params);
    const url = `${getApiUrl(API_CONFIG.ENDPOINTS.KELOLA_PEGAWAI)}?${queryParams.toString()}`;
    const response = await fetch(url);
    return response.json();
  },
  
  createAdmin: async (data: any) => {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.CREATE_ADMIN), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  
  createAccounts: async (data: any) => {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.CREATE_ACCOUNTS), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
};
export const KelolaDinasAPI = {
  // Get dinas aktif
  getDinasAktif: async () => {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.DINAS_AKTIF));
    return response.json();
  },
  
  // Get riwayat dinas dengan filter
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
      console.log('Fetching riwayat dinas from:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      console.log('Response text:', text.substring(0, 200));
      
      // Check if response is HTML (error page)
      if (text.trim().startsWith('<')) {
        throw new Error('Server returned HTML instead of JSON. Check server logs.');
      }
      
      return JSON.parse(text);
    } catch (error) {
      console.error('Error in getRiwayatDinas:', error);
      throw error;
    }
  },
  
  // Get validasi absen dengan filter
  getValidasiAbsen: async (params: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    const url = `${getApiUrl(API_CONFIG.ENDPOINTS.VALIDASI_ABSEN)}?${queryParams.toString()}`;
    const response = await fetch(url);
    return response.json();
  },
  
  // Update validasi absen
  updateValidasiAbsen: async (data: {
    id: number;
    action: 'approve' | 'reject';
    keterangan?: string;
  }) => {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.VALIDASI_ABSEN), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  
  // Create dinas baru
  createDinas: async (data: any) => {
    try {
      console.log('Sending data to API:', data);
      
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.DINAS_AKTIF), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data),
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('API Response:', result);
      return result;
    } catch (error) {
      console.error('Error in createDinas:', error);
      throw error;
    }
  },
};

export const PengaturanAPI = {
  // Jam Kerja
  getJamKerja: async () => {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.JAM_KERJA));
    return response.json();
  },
  
  saveJamKerja: async (data: any) => {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.JAM_KERJA), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  
  // Hari Libur
  getHariLibur: async () => {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.HARI_LIBUR));
    return response.json();
  },
  
  saveHariLibur: async (data: any) => {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.HARI_LIBUR), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  
  deleteHariLibur: async (id: number) => {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.HARI_LIBUR), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    return response.json();
  },
  
  // Lokasi Kantor
  getLokasiKantor: async () => {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.LOKASI_KANTOR));
    return response.json();
  },
  
  saveLokasiKantor: async (data: any) => {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.LOKASI_KANTOR), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  
  deleteLokasi: async (id: number) => {
    try {
      console.log('Calling deleteLokasi API with ID:', id);
      
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.LOKASI_KANTOR), {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ id }),
      });
      
      console.log('Delete response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Delete response data:', result);
      return result;
    } catch (error) {
      console.error('Error in deleteLokasi:', error);
      throw error;
    }
  },
};

export const NotifikasiAPI = {
  getNotifikasiAdmin: async () => {
    try {
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.NOTIFIKASI_ADMIN));
      const text = await response.text();
      
      // Check if response is HTML (error page)
      if (text.trim().startsWith('<')) {
        console.error('Server returned HTML instead of JSON:', text.substring(0, 200));
        return {
          success: false,
          message: 'Server error',
          data: [],
          total_unread: 0
        };
      }
      
      return JSON.parse(text);
    } catch (error) {
      console.error('Error in getNotifikasiAdmin:', error);
      return {
        success: false,
        message: 'Network error',
        data: [],
        total_unread: 0
      };
    }
  },
};