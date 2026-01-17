import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LaporanAPI } from '../../constants/config';

export default function LaporanAdminScreen() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalAbsen: 0,
    totalDinas: 0,
    totalIzin: 0,
    totalLembur: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLaporanStats();
  }, []);

  const fetchLaporanStats = async () => {
    try {
      console.log('Fetching laporan stats...');
      const response = await LaporanAPI.getLaporan();
      console.log('Laporan API Response:', response);
      if (response && response.stats) {
        console.log('Stats received:', response.stats);
        setStats(response.stats);
      } else {
        console.log('No stats in response:', response);
      }
    } catch (error) {
      console.error('Error fetching laporan stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async (type?: string) => {
    try {
      Alert.alert('Export PDF', 'Sedang memproses export...');
      
      const params = type ? { type } : {};
      const blob = await LaporanAPI.exportPDF(params);
      
      Alert.alert('Sukses', 'Laporan berhasil di-export ke PDF');
    } catch (error) {
      Alert.alert('Error', 'Gagal export laporan');
    }
  };

  const laporanItems = [
    { 
      type: 'absen', 
      label: 'Laporan Absen', 
      icon: 'time-outline', 
      color: '#4CAF50', 
      desc: 'Data kehadiran pegawai harian',
      count: stats.totalAbsen
    },
    { 
      type: 'dinas', 
      label: 'Laporan Dinas', 
      icon: 'car-outline', 
      color: '#2196F3', 
      desc: 'Data perjalanan dinas pegawai',
      count: stats.totalDinas
    },
    { 
      type: 'izin', 
      label: 'Laporan Izin/Cuti', 
      icon: 'document-text-outline', 
      color: '#FF9800', 
      desc: 'Data izin dan cuti pegawai',
      count: stats.totalIzin
    },
    { 
      type: 'lembur', 
      label: 'Laporan Lembur', 
      icon: 'moon-outline', 
      color: '#9C27B0', 
      desc: 'Data lembur pegawai',
      count: stats.totalLembur
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.stickyHeader}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backBtn}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#004643" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Laporan</Text>
          </View>
          <TouchableOpacity 
            style={styles.exportBtn}
            onPress={() => {
              Alert.alert(
                'Export PDF',
                'Pilih laporan yang akan di-export:',
                [
                  { text: 'Semua Laporan', onPress: () => handleExportPDF() },
                  { text: 'Laporan Absen', onPress: () => handleExportPDF('absen') },
                  { text: 'Laporan Dinas', onPress: () => handleExportPDF('dinas') },
                  { text: 'Batal', style: 'cancel' }
                ]
              );
            }}
          >
            <Ionicons name="download-outline" size={18} color="#004643" />
            <Text style={styles.exportText}>Export PDF</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#004643" />
          <Text style={styles.loadingText}>Memuat statistik laporan...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>Pilih jenis laporan yang ingin dilihat</Text>
          
          <View style={styles.laporanGrid}>
            {laporanItems.map((item) => (
              <TouchableOpacity
                key={item.type}
                style={styles.laporanCard}
                onPress={() => {
                  router.push(`/laporan/laporan-detail-${item.type}` as any);
                }}
              >
                <View style={[styles.laporanIcon, { backgroundColor: item.color }]}>
                  <Ionicons name={item.icon as any} size={24} color="#fff" />
                </View>
                <View style={styles.laporanInfo}>
                  <Text style={styles.laporanTitle}>{item.label}</Text>
                  <Text style={styles.laporanDesc}>{item.desc}</Text>
                  <Text style={styles.laporanCount}>{item.count} data</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  stickyHeader: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  backBtn: {
    padding: 10,
    marginRight: 15,
    borderRadius: 10,
    backgroundColor: '#F5F5F5'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#004643',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F0EF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  exportText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#004643',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 25,
    textAlign: 'center',
  },
  laporanGrid: {
    gap: 15,
  },
  laporanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  laporanIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  laporanInfo: {
    flex: 1,
  },
  laporanTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  laporanDesc: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  laporanCount: {
    fontSize: 11,
    color: '#004643',
    fontWeight: 'bold',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 10,
    color: '#666'
  },
});
