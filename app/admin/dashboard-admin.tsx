import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet, View, Text, ScrollView, TouchableOpacity, 
  Image, RefreshControl, Modal, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl, API_CONFIG } from '../../constants/config';

interface RecentActivity {
  nama_lengkap: string;
  status: string;
  jam_masuk: string;
}

interface DashboardData {
  stats: {
    hadir: number;
    tidak_hadir: number;
  };
  recent: RecentActivity[];
  user?: {
    nama_lengkap: string;
    email: string;
    password?: string;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData>({
    stats: { hadir: 0, tidak_hadir: 0 }, 
    recent: [],
    user: { nama_lengkap: 'Administrator', email: '', password: '' }
  });
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    loadUserData();
    getDashboardData();
    
    // Auto refresh setiap 30 detik
    const interval = setInterval(() => {
      getDashboardData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        setData(prev => ({
          ...prev,
          user: {
            nama_lengkap: user.nama || user.nama_lengkap || 'Administrator',
            email: user.email || '',
            password: ''
          }
        }));
      }
    } catch (error) {
      console.log('Error loading user data:', error);
    }
  };

  const getDashboardData = async () => {
    try {
      console.log('Fetching dashboard data from:', getApiUrl(API_CONFIG.ENDPOINTS.ADMIN));
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ADMIN));
      console.log('Response status:', response.status);
      
      const result = await response.json();
      console.log('API Result:', result);
      
      if (result.success) {
        setData({
          stats: {
            hadir: result.stats?.hadir || 0,
            tidak_hadir: result.stats?.tidak_hadir || 0
          },
          recent: result.recent || [],
          user: result.user || { nama_lengkap: 'Administrator', email: 'admin@itb.ac.id', password: '' }
        });
      } else {
        console.log('API returned success: false', result.message);
      }
    } catch (error) {
      console.log("Koneksi Error:", error);
      // Set default data jika error
      setData({
        stats: { hadir: 0, tidak_hadir: 0 },
        recent: [],
        user: { nama_lengkap: 'Administrator', email: 'admin@itb.ac.id', password: '' }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent={true} backgroundColor="transparent" />
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={getDashboardData} />}
      >
        
        {/* SECTION 1: HEADER */}
        <View style={styles.headerSection}>
          <View style={styles.adminInfo}>
            <Text style={styles.greetingText}>Selamat datang,</Text>
            <Text style={styles.userName}>Administrator</Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationBtn}
            onPress={() => setShowNotifications(true)}
          >
            <Ionicons name="notifications-outline" size={24} color="#333" />
            <View style={styles.dotBadge} />
          </TouchableOpacity>
        </View>

        {/* SECTION 2: RINGKASAN KEHADIRAN */}
        <View style={styles.summarySection}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryTitleRow}>
              <View style={styles.titleIconContainer}>
                <Ionicons name="analytics" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.summaryTitle}>Ringkasan Kehadiran</Text>
            </View>
            <View style={styles.dateBadge}>
              <Text style={styles.dateText}>Hari Ini</Text>
            </View>
          </View>
          
          {/* Main Percentage */}
          <View style={styles.mainPercentage}>
            <Text style={styles.percentageNumber}>
              {data.stats.hadir + data.stats.tidak_hadir > 0 ? 
                Math.round((data.stats.hadir / (data.stats.hadir + data.stats.tidak_hadir)) * 100) : 0}%
            </Text>
            <Text style={styles.percentageLabel}>Tingkat Kehadiran</Text>
          </View>
          
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { 
                width: `${data.stats.hadir + data.stats.tidak_hadir > 0 ? 
                  (data.stats.hadir / (data.stats.hadir + data.stats.tidak_hadir)) * 100 : 0}%` 
              }]} />
            </View>
          </View>
          
          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.statNumber}>{data.stats.hadir}</Text>
              <Text style={styles.statLabel}>Hadir</Text>
            </View>
            
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: '#F44336' }]} />
              <Text style={styles.statNumber}>{data.stats.tidak_hadir}</Text>
              <Text style={styles.statLabel}>Tidak Hadir</Text>
            </View>
            
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: '#2196F3' }]} />
              <Text style={styles.statNumber}>{data.stats.hadir + data.stats.tidak_hadir}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
          
          {/* Summary Text */}
          <Text style={styles.summaryText}>
            {data.stats.hadir} dari {data.stats.hadir + data.stats.tidak_hadir} pegawai telah hadir hari ini
          </Text>
        </View>

        {/* SECTION 3: MENU LAYANAN */}
        <View style={styles.menuSection}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Layanan</Text>
            </View>
            
            {/* Baris pertama - 4 menu utama */}
            <View style={styles.mainMenuRow}>
                {[
                { id: 1, name: 'Pegawai', icon: 'people-outline', color: '#E8F5E9', route: '/pegawai-akun' },
                { id: 2, name: 'Dinas', icon: 'business-outline', color: '#E3F2FD', route: '/kelola-dinas' },
                { id: 3, name: 'Persetujuan', icon: 'checkbox-outline', color: '#FFF3E0', route: '/approval-admin' },
                { id: 4, name: 'Laporan', icon: 'document-text-outline', color: '#F3E5F5', route: '/laporan/laporan-admin' },
                ].map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.mainMenuItem}
                  onPress={() => router.push(item.route as any)}
                >
                    <View style={[styles.menuIconCircle, { backgroundColor: item.color }]}>
                    <Ionicons name={item.icon as any} size={22} color="#333" />
                    </View>
                    <Text style={styles.menuLabel}>{item.name}</Text>
                </TouchableOpacity>
                ))}
            </View>
            
            {/* Baris kedua - Pengaturan di bawah Pegawai */}
            <View style={styles.settingsRow}>
                <TouchableOpacity 
                  style={styles.mainMenuItem}
                  onPress={() => router.push('/pengaturan' as any)}
                >
                    <View style={[styles.menuIconCircle, { backgroundColor: '#FFEBEE' }]}>
                    <Ionicons name="settings-outline" size={22} color="#333" />
                    </View>
                    <Text style={styles.menuLabel}>Pengaturan</Text>
                </TouchableOpacity>
            </View>
        </View>

        {/* SECTION 4: LOG AKTIVITAS */}
        <View style={styles.recentList}>
          <Text style={styles.sectionTitle}>Aktivitas Terbaru</Text>
          
          {(data.recent && Array.isArray(data.recent) && data.recent.length > 0) ? (
            data.recent.map((item: any, index: number) => (
              <View key={index} style={styles.activityCard}>
                <Image 
                    source={{ uri: `https://ui-avatars.com/api/?name=${item.nama_lengkap}&background=random` }} 
                    style={styles.avatar} 
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.nameText}>{item.nama_lengkap}</Text>
                  <Text style={styles.activityText}>{item.status} • {item.jam_masuk ? item.jam_masuk.substring(0,5) : '-'} WIB</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'Hadir' ? '#E8F5E9' : '#FFF4E5' }]}>
                  <Text style={{ color: item.status === 'Hadir' ? '#2E7D32' : '#F9BC60', fontSize: 10, fontWeight: 'bold' }}>{item.status}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={{ textAlign: 'center', color: '#999', marginTop: 20 }}>Belum ada aktivitas hari ini</Text>
          )}
        </View>


      </ScrollView>
      
      {/* Modal Notifikasi */}
      <Modal
        visible={showNotifications}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowNotifications(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowNotifications(false)}
        >
          <View style={styles.notificationDropdown}>
            <View style={styles.dropdownArrow} />
            <View style={styles.dropdownHeader}>
              <Text style={styles.modalTitle}>Notifikasi</Text>
              <TouchableOpacity onPress={() => {
                setShowNotifications(false);
                router.push('/notifikasi-admin' as any);
              }}>
                <Text style={styles.seeAllText}>Lihat Semua</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.notificationList}>
              <View style={styles.notificationItem}>
                <View style={styles.notificationIcon}>
                  <Ionicons name="person-add" size={16} color="#4CAF50" />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>Pegawai Baru Terdaftar</Text>
                  <Text style={styles.notificationDesc}>John Doe telah mendaftar sebagai pegawai baru</Text>
                  <Text style={styles.notificationTime}>2 jam yang lalu</Text>
                </View>
              </View>
              
              <View style={styles.notificationItem}>
                <View style={styles.notificationIcon}>
                  <Ionicons name="time" size={16} color="#FF9800" />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>Keterlambatan</Text>
                  <Text style={styles.notificationDesc}>5 pegawai terlambat masuk hari ini</Text>
                  <Text style={styles.notificationTime}>1 jam yang lalu</Text>
                </View>
              </View>
              
              <View style={styles.notificationItem}>
                <View style={styles.notificationIcon}>
                  <Ionicons name="checkmark-circle" size={16} color="#2196F3" />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>Persetujuan Cuti</Text>
                  <Text style={styles.notificationDesc}>3 pengajuan cuti menunggu persetujuan</Text>
                  <Text style={styles.notificationTime}>30 menit yang lalu</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  scrollContent: { paddingBottom: 30 },
  headerSection: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    marginBottom: 20 
  },
  adminInfo: { flex: 1 },
  credentialRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  emailText: { fontSize: 12, color: '#666', fontFamily: 'monospace' },
  passwordText: { fontSize: 12, color: '#666', fontFamily: 'monospace' },
  eyeBtn: { padding: 2, marginLeft: 2 },
  greetingText: { fontSize: 14, color: '#777' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  userJob: { fontSize: 12, color: '#004643', fontWeight: '500', marginTop: 2 },
  notificationBtn: { padding: 10, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#F0F0F0' },
  dotBadge: { position: 'absolute', top: 10, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF4D4D', borderWidth: 1, borderColor: '#fff' },
  summarySection: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#004643',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  dateBadge: {
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dateText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#2196F3',
  },
  mainPercentage: {
    alignItems: 'center',
    marginBottom: 16,
  },
  percentageNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#004643',
  },
  percentageLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
  },
  summaryText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    lineHeight: 14,
  },
  menuSection: { marginTop: 10, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  mainMenuRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 20,
    paddingHorizontal: Platform.OS === 'ios' ? 5 : 0,
  },
  mainMenuItem: { 
    width: Platform.OS === 'ios' ? '22%' : '23%', 
    alignItems: 'center' 
  },
  settingsRow: { flexDirection: 'row', justifyContent: 'flex-start', marginTop: 10 },
  menuIconCircle: { 
    width: Platform.OS === 'ios' ? 52 : 56, 
    height: Platform.OS === 'ios' ? 52 : 56, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  menuLabel: { fontSize: 11, color: '#444', fontWeight: '500', textAlign: 'center' },
  recentList: { paddingHorizontal: 20, marginTop: 10 },
  activityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: '#F0F0F0' },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  nameText: { fontWeight: 'bold', fontSize: 14, color: '#333' },
  activityText: { fontSize: 12, color: '#888' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  footer: { marginTop: 20, alignItems: 'center' },
  footerText: { fontSize: 10, color: '#BBB' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  notificationDropdown: { 
    position: 'absolute', 
    top: Platform.OS === 'ios' ? 100 : 80, 
    right: 15, 
    width: 280, 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: 400
  },
  dropdownArrow: {
    position: 'absolute',
    top: -8,
    right: 20,
    width: 16,
    height: 16,
    backgroundColor: '#fff',
    transform: [{ rotate: '45deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  dropdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  seeAllText: { fontSize: 12, color: '#004643', fontWeight: '600' },
  notificationList: { maxHeight: 300 },
  notificationItem: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F8F8F8' },
  notificationIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5', marginRight: 10 },
  notificationContent: { flex: 1 },
  notificationTitle: { fontSize: 13, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  notificationDesc: { fontSize: 11, color: '#666', marginBottom: 2 },
  notificationTime: { fontSize: 9, color: '#999' },
});
