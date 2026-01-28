import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppHeader } from '../../components';

export default function KelolaDinasScreen() {
  const router = useRouter();
  const [stats, setStats] = useState({
    dinasAktif: 0,
    pegawaiDinas: 0,
    belumAbsen: 0
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent={true} backgroundColor="transparent" />
      
      {/* HEADER */}
      <AppHeader 
        title="Kelola Dinas"
        showBack={true}
        fallbackRoute="/admin/dashboard-admin"
      />

      <View style={styles.contentContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsHeaderCard}>
            <View style={styles.statsHeaderContent}>
              <View style={styles.statsHeaderLeft}>
                <View style={styles.statsIconBg}>
                  <Ionicons name="analytics" size={24} color="#004643" />
                </View>
                <View>
                  <Text style={styles.statsTitle}>Ringkasan Dinas</Text>
                  <Text style={styles.statsDate}>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
                </View>
              </View>
              <View style={styles.statsHeaderRight}>
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>Live</Text>
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <View style={[styles.statIconBg, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="briefcase" size={24} color="#1976D2" />
                </View>
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statNumber}>{stats.dinasAktif}</Text>
                <Text style={styles.statLabel}>Dinas Aktif</Text>
                <Text style={styles.statSubtext}>Kegiatan berlangsung</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <View style={[styles.statIconBg, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="people" size={24} color="#388E3C" />
                </View>
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statNumber}>{stats.pegawaiDinas}</Text>
                <Text style={styles.statLabel}>Pegawai Dinas</Text>
                <Text style={styles.statSubtext}>Sedang bertugas</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <View style={[styles.statIconBg, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="time" size={24} color="#F57C00" />
                </View>
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statNumber}>{stats.belumAbsen}</Text>
                <Text style={styles.statLabel}>Belum Absen</Text>
                <Text style={styles.statSubtext}>Perlu tindakan</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Menu Grid */}
        <View style={styles.menuSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Menu Kelola Dinas</Text>
          </View>
          
          <View style={styles.menuGrid}>
            {[
              { id: 1, name: 'Data Dinas Aktif', icon: 'today-outline', color: '#E8F5E9' },
              { id: 2, name: 'Riwayat Dinas', icon: 'document-text-outline', color: '#FFF3E0' },
              { id: 3, name: 'Validasi Absen', icon: 'checkmark-circle-outline', color: '#F3E5F5' },
            ].map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.menuItem}
                onPress={() => {
                  if (item.name === 'Data Dinas Aktif') {
                    router.push('/kelola-dinas/dinas-aktif' as any);
                  } else if (item.name === 'Riwayat Dinas') {
                    router.push('/kelola-dinas/riwayat-dinas' as any);
                  } else if (item.name === 'Validasi Absen') {
                    router.push('/kelola-dinas/validasi-absen' as any);
                  }
                }}
              >
                <View style={[styles.menuIconCircle, { backgroundColor: item.color }]}>
                  <Ionicons name={item.icon as any} size={22} color="#333" />
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
    paddingTop: Platform.OS === 'android' ? 5 : 10,
  },
  
  statsContainer: { 
    paddingHorizontal: 20, 
    marginBottom: 25, 
    marginTop: Platform.OS === 'android' ? 5 : 10 
  },
  statsHeaderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: Platform.OS === 'android' ? 16 : 20,
    marginBottom: 16,
    elevation: Platform.OS === 'android' ? 4 : 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  statsHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  statsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  statsIconBg: {
    width: Platform.OS === 'android' ? 44 : 48,
    height: Platform.OS === 'android' ? 44 : 48,
    borderRadius: 12,
    backgroundColor: '#F0F8F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  statsHeaderRight: {
    alignItems: 'flex-end'
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginRight: 4
  },
  liveText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4CAF50'
  },
  statsTitle: {
    fontSize: Platform.OS === 'android' ? 15 : 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
    lineHeight: Platform.OS === 'android' ? 18 : 20
  },
  statsDate: {
    fontSize: Platform.OS === 'android' ? 11 : 12,
    color: '#666',
    lineHeight: Platform.OS === 'android' ? 14 : 16
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Platform.OS === 'android' ? 8 : 12
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: Platform.OS === 'android' ? 12 : 16,
    elevation: Platform.OS === 'android' ? 4 : 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
    minHeight: Platform.OS === 'android' ? 120 : 130
  },
  statIconContainer: {
    marginBottom: Platform.OS === 'android' ? 8 : 12
  },
  statIconBg: {
    width: Platform.OS === 'android' ? 44 : 50,
    height: Platform.OS === 'android' ? 44 : 50,
    borderRadius: Platform.OS === 'android' ? 22 : 25,
    justifyContent: 'center',
    alignItems: 'center'
  },
  statContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center'
  },
  statNumber: {
    fontSize: Platform.OS === 'android' ? 20 : 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    lineHeight: Platform.OS === 'android' ? 24 : 28
  },
  statLabel: {
    fontSize: Platform.OS === 'android' ? 11 : 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
    textAlign: 'center',
    lineHeight: Platform.OS === 'android' ? 14 : 16
  },
  statSubtext: {
    fontSize: Platform.OS === 'android' ? 9 : 10,
    color: '#666',
    textAlign: 'center',
    lineHeight: Platform.OS === 'android' ? 12 : 14
  },

  menuSection: { 
    marginTop: Platform.OS === 'android' ? 20 : 30, 
    paddingHorizontal: 20 
  },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: Platform.OS === 'android' ? 16 : 20 
  },
  sectionTitle: { 
    fontSize: Platform.OS === 'android' ? 15 : 16, 
    fontWeight: 'bold', 
    color: '#333',
    lineHeight: Platform.OS === 'android' ? 18 : 20
  },
  menuGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between'
  },
  menuItem: { 
    width: '30%', 
    alignItems: 'center', 
    marginBottom: Platform.OS === 'android' ? 20 : 25,
    paddingHorizontal: 4
  },
  menuIconCircle: { 
    width: Platform.OS === 'android' ? 52 : 56, 
    height: Platform.OS === 'android' ? 52 : 56, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 8,
    elevation: Platform.OS === 'android' ? 2 : 0
  },
  menuLabel: { 
    fontSize: Platform.OS === 'android' ? 10 : 11, 
    color: '#444', 
    fontWeight: '500', 
    textAlign: 'center',
    lineHeight: Platform.OS === 'android' ? 13 : 15,
    paddingHorizontal: 2
  },

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
  },
});
