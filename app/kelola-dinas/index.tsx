import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppHeader } from '../../components';
import { getApiUrl, API_CONFIG } from '../../constants/config';

export default function KelolaDinasScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    dinasAktif: 0,
    pegawaiDinas: 0,
    belumAbsen: 0,
    selesaiDinas: 0
  });

  useEffect(() => {
    fetchDinasData();
  }, []);

  const fetchDinasData = async () => {
    try {
      setLoading(true);
      // Fetch dinas statistics from API
      const response = await fetch(getApiUrl('/admin/kelola-dinas/api/stats'));
      const result = await response.json();
      
      if (result.success) {
        setStats({
          dinasAktif: result.data.dinasAktif || 0,
          pegawaiDinas: result.data.pegawaiDinas || 0,
          belumAbsen: result.data.belumAbsen || 0,
          selesaiDinas: result.data.selesaiDinas || 0
        });
      }
    } catch (error) {
      console.log('Error fetching dinas data:', error);
      // Keep default values on error
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDinasData();
    setRefreshing(false);
  };

  const getCurrentDate = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return today.toLocaleDateString('id-ID', options);
  };

  const totalDinas = stats.dinasAktif + stats.selesaiDinas;
  const absenPercentage = stats.pegawaiDinas > 0 ? Math.round(((stats.pegawaiDinas - stats.belumAbsen) / stats.pegawaiDinas) * 100) : 0;
  const belumAbsenPercentage = stats.pegawaiDinas > 0 ? Math.round((stats.belumAbsen / stats.pegawaiDinas) * 100) : 0;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent={true} backgroundColor="transparent" />
      
      {/* HEADER */}
      <AppHeader 
        title="Kelola Dinas"
        showBack={true}
        fallbackRoute="/admin/dashboard-admin"
      />

      <ScrollView 
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >

        {/* Combined Stats and Menu Card */}
        <View style={styles.combinedCard}>
          {/* Stats Header */}
          <View style={styles.statsHeader}>
            <Text style={styles.sectionTitle}>Ringkasan Dinas</Text>
            <View style={styles.dateTimeContainer}>
              <Text style={styles.statsDate}>{getCurrentDate()}</Text>
              <Text style={styles.timeText}>
                {new Date().toLocaleTimeString('id-ID', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })} WIB
              </Text>
            </View>
          </View>

          {/* Stats Content */}
          <View style={styles.chartContainer}>
            {/* Simple Donut Chart */}
            <View style={styles.donutChart}>
              <View style={styles.donutOuter}>
                <View style={styles.donutInner}>
                  <Text style={styles.donutNumber}>{totalDinas}</Text>
                  <Text style={styles.donutLabel}>Total Dinas</Text>
                </View>
              </View>
              {/* Chart Legend */}
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
                  <Text style={styles.legendText}>Aktif ({stats.dinasAktif})</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#9C27B0' }]} />
                  <Text style={styles.legendText}>Selesai ({stats.selesaiDinas})</Text>
                </View>
              </View>
            </View>
            
            {/* Stats Cards */}
            <View style={styles.statsCards}>
              <View style={styles.statMiniCard}>
                <View style={styles.statMiniHeader}>
                  <Ionicons name="people" size={16} color="#2196F3" />
                  <Text style={styles.statMiniNumber}>{stats.pegawaiDinas}</Text>
                </View>
                <Text style={styles.statMiniLabel}>Pegawai Dinas</Text>
                <View style={styles.statMiniBar}>
                  <View style={[styles.statMiniBarFill, { width: stats.pegawaiDinas > 0 ? '100%' : '0%', backgroundColor: '#2196F3' }]} />
                </View>
              </View>
              
              <View style={styles.statMiniCard}>
                <View style={styles.statMiniHeader}>
                  <Ionicons name="time" size={16} color="#FF9800" />
                  <Text style={styles.statMiniNumber}>{stats.belumAbsen}</Text>
                </View>
                <Text style={styles.statMiniLabel}>Belum Absen</Text>
                <View style={styles.statMiniBar}>
                  <View style={[styles.statMiniBarFill, { width: `${belumAbsenPercentage}%`, backgroundColor: '#FF9800' }]} />
                </View>
              </View>
            </View>
          </View>
          
          {/* Progress Summary */}
          <View style={styles.progressSummary}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Progress Absensi Hari Ini</Text>
              <Text style={styles.progressPercentage}>{absenPercentage}%</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${absenPercentage}%` }]} />
              </View>
            </View>
            <Text style={styles.progressSubtext}>
              {stats.pegawaiDinas - stats.belumAbsen} dari {stats.pegawaiDinas} pegawai sudah absen
            </Text>
          </View>

          {/* Menu Section - Inside Same Card */}
          <View style={styles.menuDivider} />
          <Text style={styles.menuSectionTitle}>Menu Kelola Dinas</Text>
          <View style={styles.mainMenuRow}>
            {[
              { id: 1, name: 'Data Dinas Aktif', icon: 'today-outline', color: '#E8F5E9', iconColor: '#2E7D32', route: '/kelola-dinas/dinas-aktif' },
              { id: 2, name: 'Riwayat Dinas', icon: 'document-text-outline', color: '#E3F2FD', iconColor: '#1976D2', route: '/kelola-dinas/riwayat-dinas' },
              { id: 3, name: 'Validasi Absen', icon: 'checkmark-circle-outline', color: '#FFF3E0', iconColor: '#F57C00', route: '/kelola-dinas/validasi-absen' },
            ].map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.mainMenuItem}
                onPress={() => router.push(item.route as any)}
              >
                <View style={[styles.menuIconCircle, { backgroundColor: item.color }]}>
                  <Ionicons name={item.icon as any} size={22} color={item.iconColor} />
                </View>
                <Text style={styles.menuLabel}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Aktivitas Terbaru</Text>
          <View style={styles.emptyState}>
            <Ionicons name="briefcase-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>Belum ada aktivitas dinas hari ini</Text>
          </View>
        </View>
        </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFB' 
  },
  contentContainer: {
    flex: 1,
    paddingTop: 15,
  },

  // Combined Card Style
  combinedCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  
  // Stats Section
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: Platform.OS === 'android' ? 5 : 10
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  dateTimeContainer: {
    alignItems: 'flex-end'
  },
  statsDate: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 2
  },
  timeText: {
    fontSize: 14,
    color: '#004643',
    fontWeight: 'bold'
  },
  
  // Menu Divider
  menuDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 20
  },
  menuSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15
  },
  
  // Menu Section - Inside Combined Card
  mainMenuRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: Platform.OS === 'ios' ? 5 : 0,
  },
  mainMenuItem: { 
    width: Platform.OS === 'ios' ? '30%' : '31%', 
    alignItems: 'center' 
  },
  menuIconCircle: { 
    width: Platform.OS === 'ios' ? 52 : 56, 
    height: Platform.OS === 'ios' ? 52 : 56, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  menuLabel: { 
    fontSize: 11, 
    color: '#444', 
    fontWeight: '500', 
    textAlign: 'center' 
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  donutChart: {
    alignItems: 'center',
    marginRight: 20
  },
  donutOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  donutInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  donutNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  donutLabel: {
    fontSize: 10,
    color: '#666'
  },
  chartLegend: {
    gap: 6
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  legendText: {
    fontSize: 11,
    color: '#666'
  },
  statsCards: {
    flex: 1,
    gap: 12
  },
  statMiniCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12
  },
  statMiniHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6
  },
  statMiniNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  statMiniLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 6
  },
  statMiniBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden'
  },
  statMiniBarFill: {
    height: '100%',
    borderRadius: 2
  },
  progressSummary: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#004643'
  },
  progressBarContainer: {
    marginBottom: 8
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#004643',
    borderRadius: 4
  },
  progressSubtext: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center'
  },



  // Recent Activity
  recentSection: { 
    paddingHorizontal: 20, 
    marginBottom: 30,
    marginTop: Platform.OS === 'android' ? 10 : 0
  },
  emptyState: { 
    alignItems: 'center', 
    paddingVertical: Platform.OS === 'android' ? 30 : 40 
  },
  emptyText: { 
    fontSize: Platform.OS === 'android' ? 13 : 14, 
    color: '#999', 
    marginTop: 10,
    textAlign: 'center',
    lineHeight: Platform.OS === 'android' ? 16 : 18
  }
});