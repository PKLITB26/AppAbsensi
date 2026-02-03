import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
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
      <StatusBar style="dark" translucent={true} backgroundColor="transparent" />
      
      {/* HEADER */}
      <AppHeader 
        title="Kelola Dinas"
        showBack={true}
        fallbackRoute="/admin/dashboard-admin"
      />

      <View style={styles.contentContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>

        {/* Ringkasan Stats - Simple List */}
        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>Ringkasan Dinas Hari Ini</Text>
          <View style={styles.statsList}>
            <View style={styles.statsItem}>
              <Ionicons name="briefcase" size={20} color="#004643" />
              <Text style={styles.statsLabel}>Dinas Aktif</Text>
              <Text style={styles.statsNumber}>3</Text>
            </View>
            <View style={styles.statsItem}>
              <Ionicons name="people" size={20} color="#004643" />
              <Text style={styles.statsLabel}>Pegawai Dinas</Text>
              <Text style={styles.statsNumber}>12</Text>
            </View>
            <View style={styles.statsItem}>
              <Ionicons name="time" size={20} color="#004643" />
              <Text style={styles.statsLabel}>Belum Absen</Text>
              <Text style={styles.statsNumber}>2</Text>
            </View>
          </View>
        </View>
        <View style={styles.menuSection}>
          {/* Baris pertama - 3 menu utama */}
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
    marginTop: -10, 
    marginHorizontal: 20, 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 20
  },
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

  recentSection: { 
    paddingHorizontal: 20, 
    marginBottom: 30,
    marginTop: Platform.OS === 'android' ? 10 : 0
  },
  sectionTitle: {
    fontSize: Platform.OS === 'android' ? 15 : 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    lineHeight: Platform.OS === 'android' ? 18 : 20
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: Platform.OS === 'android' ? 5 : 10
  },
  statsList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  statsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  statsLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 12
  },
  statsNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#004643'
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