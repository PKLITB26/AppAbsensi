import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { runNetworkDiagnostic, printDiagnosticReport, NetworkDiagnosticResult } from '../utils/networkDiagnostic';
import { API_CONFIG } from '../constants/config';

export const NetworkTestScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<NetworkDiagnosticResult | null>(null);

  const runDiagnostic = async () => {
    setIsLoading(true);
    try {
      const result = await runNetworkDiagnostic();
      setDiagnosticResult(result);
      printDiagnosticReport(result);
      
      if (result.isConnected) {
        Alert.alert('Sukses', 'Koneksi ke server berhasil!');
      } else {
        Alert.alert('Error', 'Tidak dapat terhubung ke server. Lihat detail di bawah.');
      }
    } catch (error) {
      Alert.alert('Error', `Diagnostic gagal: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testSpecificEndpoint = async (endpoint: string, name: string) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });
      
      Alert.alert(
        `Test ${name}`,
        `Status: ${response.status}\nResponse: ${response.ok ? 'OK' : 'Error'}`
      );
    } catch (error) {
      Alert.alert(`Test ${name}`, `Error: ${(error as Error).message}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Network Diagnostic Tool</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Server Configuration</Text>
        <Text style={styles.configText}>Primary: {API_CONFIG.BASE_URL}</Text>
        <Text style={styles.configText}>Fallback: {API_CONFIG.FALLBACK_URL}</Text>
      </View>

      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={runDiagnostic}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Running Diagnostic...' : 'Run Network Diagnostic'}
        </Text>
      </TouchableOpacity>

      {diagnosticResult && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diagnostic Results</Text>
          
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Internet Connection:</Text>
            <Text style={[styles.resultValue, diagnosticResult.internetConnection ? styles.success : styles.error]}>
              {diagnosticResult.internetConnection ? '✅ Connected' : '❌ No Internet'}
            </Text>
          </View>
          
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Primary Server:</Text>
            <Text style={[styles.resultValue, diagnosticResult.primaryServerReachable ? styles.success : styles.error]}>
              {diagnosticResult.primaryServerReachable ? '✅ Reachable' : '❌ Unreachable'}
            </Text>
          </View>
          
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Fallback Server:</Text>
            <Text style={[styles.resultValue, diagnosticResult.fallbackServerReachable ? styles.success : styles.error]}>
              {diagnosticResult.fallbackServerReachable ? '✅ Reachable' : '❌ Unreachable'}
            </Text>
          </View>

          {diagnosticResult.errors.length > 0 && (
            <View style={styles.errorSection}>
              <Text style={styles.errorTitle}>Errors:</Text>
              {diagnosticResult.errors.map((error, index) => (
                <Text key={index} style={styles.errorText}>• {error}</Text>
              ))}
            </View>
          )}

          {diagnosticResult.recommendations.length > 0 && (
            <View style={styles.recommendationSection}>
              <Text style={styles.recommendationTitle}>Recommendations:</Text>
              {diagnosticResult.recommendations.map((rec, index) => (
                <Text key={index} style={styles.recommendationText}>• {rec}</Text>
              ))}
            </View>
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Specific Endpoints</Text>
        
        <TouchableOpacity 
          style={styles.smallButton} 
          onPress={() => testSpecificEndpoint(API_CONFIG.ENDPOINTS.TEST_CONNECTION, 'Connection')}
        >
          <Text style={styles.buttonText}>Test Connection</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.smallButton} 
          onPress={() => testSpecificEndpoint(API_CONFIG.ENDPOINTS.LOGIN, 'Login Endpoint')}
        >
          <Text style={styles.buttonText}>Test Login Endpoint</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.smallButton} 
          onPress={() => testSpecificEndpoint(API_CONFIG.ENDPOINTS.PEGAWAI_DASHBOARD, 'Dashboard')}
        >
          <Text style={styles.buttonText}>Test Dashboard</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  configText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  smallButton: {
    backgroundColor: '#34C759',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  success: {
    color: '#34C759',
  },
  error: {
    color: '#FF3B30',
  },
  errorSection: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#FFE6E6',
    borderRadius: 6,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 5,
  },
  errorText: {
    fontSize: 14,
    color: '#CC0000',
    marginBottom: 3,
  },
  recommendationSection: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#E6F3FF',
    borderRadius: 6,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  recommendationText: {
    fontSize: 14,
    color: '#0066CC',
    marginBottom: 3,
  },
});

export default NetworkTestScreen;