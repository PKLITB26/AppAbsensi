// Network testing utility for HadirinApp
import { API_CONFIG } from '../constants/config';

export const NetworkTest = {
  // Test basic connectivity
  testConnection: async () => {
    const results = {
      localhost: false,
      currentIP: false,
      serverReachable: false,
      details: [] as string[]
    };

    // Test localhost
    try {
      const response = await fetch('http://localhost/hadirinapp/test-connection.php', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      results.localhost = response.ok;
      results.details.push(`Localhost: ${response.ok ? 'OK' : 'Failed'}`);
    } catch (error) {
      results.details.push(`Localhost: Failed - ${(error as Error).message}`);
    }

    // Test current IP
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/test-connection.php`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      results.currentIP = response.ok;
      results.details.push(`Current IP (192.168.1.8): ${response.ok ? 'OK' : 'Failed'}`);
    } catch (error) {
      results.details.push(`Current IP: Failed - ${(error as Error).message}`);
    }

    // Test server reachability
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/admin/pengaturan/api/lokasi-kantor.php`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });
      results.serverReachable = response.ok;
      results.details.push(`Server API: ${response.ok ? 'OK' : `Failed (${response.status})`}`);
    } catch (error) {
      results.details.push(`Server API: Failed - ${(error as Error).message}`);
    }

    return results;
  },

  // Get network suggestions
  getSuggestions: () => {
    return [
      '1. Pastikan HP dan komputer terhubung ke WiFi yang sama',
      '2. Periksa apakah XAMPP/server backend sudah berjalan',
      '3. Coba akses http://192.168.1.8/hadirinapp di browser HP',
      '4. Pastikan firewall tidak memblokir port 80',
      '5. Restart router WiFi jika masih bermasalah'
    ];
  }
};