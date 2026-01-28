import { Alert } from 'react-native';
import { API_CONFIG } from '../constants/config';

export const NetworkDebugger = {
  // Test koneksi ke server
  testConnection: async () => {
    try {
      console.log('Testing connection to:', API_CONFIG.BASE_URL);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/test-connection.php`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Connection test successful:', data);
        return { success: true, data };
      } else {
        console.log('Connection test failed with status:', response.status);
        return { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error: any) {
      console.error('Connection test error:', error);
      return { success: false, error: error.message };
    }
  },

  // Debug info untuk troubleshooting
  getDebugInfo: () => {
    return {
      baseUrl: API_CONFIG.BASE_URL,
      timestamp: new Date().toISOString(),
    };
  },

  // Show network error alert
  showNetworkError: (error: string) => {
    Alert.alert(
      'Network Error',
      `Tidak dapat terhubung ke server:\n${error}\n\nPastikan:\n1. Koneksi internet aktif\n2. Server berjalan di ${API_CONFIG.BASE_URL}\n3. IP address benar`,
      [{ text: 'OK' }]
    );
  }
};

export default NetworkDebugger;