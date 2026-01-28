import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView, TouchableOpacity, Alert } from 'react-native';
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER */}
      <AppHeader 
        title="Kelola Dinas"
        showBack={true}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  contentContainer: {
    flex: 1,
    paddingTop: 10,
  },
  
  statsContainer: { paddingHorizontal: 20, marginBottom: 30, marginTop: 10 },
  statsHeaderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
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
    width: 48,
    height: 48,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2
  },
  statsDate: {
    fontSize: 12,
    color: '#666'
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center'
  },
  statIconContainer: {
    marginBottom: 12
  },
  statIconBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center'
  },
  statContent: {
    alignItems: 'center'
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2
  },
  statSubtext: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center'
  },

  menuSection: { marginTop: 30, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  menuGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between'
  },
  menuItem: { 
    width: '30%', 
    alignItems: 'center', 
    marginBottom: 25 
  },
  menuIconCircle: { 
    width: 56, 
    height: 56, 
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

  recentSection: { paddingHorizontal: 20, marginBottom: 30 },
  emptyState: { 
    alignItems: 'center', 
    paddingVertical: 40 
  },
  emptyText: { 
    fontSize: 14, 
    color: '#999', 
    marginTop: 10 
  },
});
