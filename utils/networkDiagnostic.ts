import { API_CONFIG } from '../constants/config';

export interface NetworkDiagnosticResult {
  isConnected: boolean;
  primaryServerReachable: boolean;
  fallbackServerReachable: boolean;
  internetConnection: boolean;
  errors: string[];
  recommendations: string[];
}

export const runNetworkDiagnostic = async (): Promise<NetworkDiagnosticResult> => {
  const result: NetworkDiagnosticResult = {
    isConnected: false,
    primaryServerReachable: false,
    fallbackServerReachable: false,
    internetConnection: false,
    errors: [],
    recommendations: []
  };

  // Test internet connection
  try {
    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      mode: 'no-cors',
      signal: AbortSignal.timeout(5000)
    });
    result.internetConnection = true;
  } catch (error) {
    result.internetConnection = false;
    result.errors.push('Tidak ada koneksi internet');
    result.recommendations.push('Periksa koneksi WiFi atau data seluler Anda');
  }

  // Test primary server
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TEST_CONNECTION}`, {
      method: 'GET',
      signal: AbortSignal.timeout(10000)
    });
    result.primaryServerReachable = response.ok;
    if (!response.ok) {
      result.errors.push(`Server utama tidak dapat dijangkau (HTTP ${response.status})`);
    }
  } catch (error) {
    result.primaryServerReachable = false;
    result.errors.push(`Server utama tidak dapat dijangkau: ${(error as Error).message}`);
    result.recommendations.push('Pastikan server backend berjalan di http://10.251.109.30/hadirinapp');
  }

  // Test fallback server
  try {
    const response = await fetch(`${API_CONFIG.FALLBACK_URL}${API_CONFIG.ENDPOINTS.TEST_CONNECTION}`, {
      method: 'GET',
      signal: AbortSignal.timeout(10000)
    });
    result.fallbackServerReachable = response.ok;
    if (!response.ok) {
      result.errors.push(`Server fallback tidak dapat dijangkau (HTTP ${response.status})`);
    }
  } catch (error) {
    result.fallbackServerReachable = false;
    result.errors.push(`Server fallback tidak dapat dijangkau: ${(error as Error).message}`);
    result.recommendations.push('Pastikan server backend berjalan di localhost/hadirinapp');
  }

  // Overall connection status
  result.isConnected = result.primaryServerReachable || result.fallbackServerReachable;

  // Add general recommendations
  if (!result.isConnected) {
    result.recommendations.push(
      'Periksa apakah server backend sudah berjalan',
      'Pastikan IP address dan port server sudah benar',
      'Coba restart aplikasi dan server backend'
    );
  }

  return result;
};

export const printDiagnosticReport = (result: NetworkDiagnosticResult) => {
  console.log('=== NETWORK DIAGNOSTIC REPORT ===');
  console.log(`Internet Connection: ${result.internetConnection ? '✅' : '❌'}`);
  console.log(`Primary Server (${API_CONFIG.BASE_URL}): ${result.primaryServerReachable ? '✅' : '❌'}`);
  console.log(`Fallback Server (${API_CONFIG.FALLBACK_URL}): ${result.fallbackServerReachable ? '✅' : '❌'}`);
  console.log(`Overall Status: ${result.isConnected ? '✅ Connected' : '❌ Disconnected'}`);
  
  if (result.errors.length > 0) {
    console.log('\n=== ERRORS ===');
    result.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
  
  if (result.recommendations.length > 0) {
    console.log('\n=== RECOMMENDATIONS ===');
    result.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
  }
  
  console.log('================================');
};