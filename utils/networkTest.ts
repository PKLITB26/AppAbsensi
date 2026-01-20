// Utility untuk test koneksi dan debugging network issues
import { API_CONFIG } from '../constants/config';

export const testServerConnection = async () => {
  const results = {
    primaryUrl: { success: false, error: '', responseTime: 0 },
    fallbackUrl: { success: false, error: '', responseTime: 0 },
    recommendations: []
  };

  // Test Primary URL
  try {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/test-connection.php`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    results.primaryUrl.responseTime = Date.now() - startTime;
    
    if (response.ok) {
      results.primaryUrl.success = true;
    } else {
      results.primaryUrl.error = `HTTP ${response.status}: ${response.statusText}`;
    }
  } catch (error) {
    results.primaryUrl.error = error.message || 'Unknown error';
  }

  // Test Fallback URL
  try {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${API_CONFIG.FALLBACK_URL}/test-connection.php`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    results.fallbackUrl.responseTime = Date.now() - startTime;
    
    if (response.ok) {
      results.fallbackUrl.success = true;
    } else {
      results.fallbackUrl.error = `HTTP ${response.status}: ${response.statusText}`;
    }
  } catch (error) {
    results.fallbackUrl.error = error.message || 'Unknown error';
  }

  // Generate recommendations
  if (!results.primaryUrl.success && !results.fallbackUrl.success) {
    results.recommendations.push('Tidak ada koneksi ke server. Periksa:');
    results.recommendations.push('1. Koneksi internet Anda');
    results.recommendations.push('2. Server mungkin sedang maintenance');
    results.recommendations.push('3. Firewall atau proxy blocking');
  } else if (!results.primaryUrl.success && results.fallbackUrl.success) {
    results.recommendations.push('Server utama bermasalah, gunakan localhost');
  } else if (results.primaryUrl.responseTime > 5000) {
    results.recommendations.push('Koneksi lambat, periksa jaringan');
  }

  return results;
};

export const getNetworkErrorMessage = (error: any): string => {
  if (error.name === 'AbortError') {
    return 'Koneksi timeout - Server tidak merespons dalam waktu yang ditentukan';
  }
  
  if (error.message?.includes('Network request failed')) {
    return 'Gagal terhubung ke server - Periksa koneksi internet';
  }
  
  if (error.message?.includes('22')) {
    return 'Error 22: Masalah koneksi jaringan - Coba lagi dalam beberapa saat';
  }
  
  if (error.message?.includes('ECONNREFUSED')) {
    return 'Server menolak koneksi - Server mungkin sedang offline';
  }
  
  if (error.message?.includes('ETIMEDOUT')) {
    return 'Koneksi timeout - Jaringan terlalu lambat atau server sibuk';
  }
  
  return `Error koneksi: ${error.message || 'Unknown error'}`;
};