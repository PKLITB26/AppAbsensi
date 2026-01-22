import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PegawaiAPI } from '../../constants/config';

interface UserData {
  nama: string;
  jabatan: string;
  statusAbsen: string;
  jamMasuk: string;
  jamKeluar: string;
  totalJamKerja: string;
}

export default function BerandaScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData>({
    nama: '',
    jabatan: '',
    statusAbsen: 'Belum Absen',
    jamMasuk: '08:00',
    jamKeluar: '17:00',
    totalJamKerja: '0j 0m'
  });
  const [loading, setLoading] = useState(true);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchUserData();
    
    // Update time every 30 seconds
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const formatDate = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    const day = days[currentTime.getDay()];
    const date = currentTime.getDate();
    const month = months[currentTime.getMonth()];
    const year = currentTime.getFullYear();
    
    return `${day}, ${date} ${month} ${year}`;
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 11) return 'Selamat Pagi';
    if (hour >= 11 && hour < 15) return 'Selamat Siang';
    if (hour >= 15 && hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const fetchUserData = async () => {
    try {
      // Ambil user data dari AsyncStorage (dari hasil login)
      const userData = await AsyncStorage.getItem('userData');
      console.log('AsyncStorage userData:', userData);
      
      if (!userData) {
        console.log('No userData in AsyncStorage');
        // Gunakan data fallback jika tidak ada data login
        setUserData({
          nama: 'Pengguna',
          jabatan: 'Pegawai', 
          statusAbsen: 'Belum Absen',
          jamMasuk: '08:00',
          jamKeluar: '17:00',
          totalJamKerja: '0h'
        });
        return;
      }
      
      const user = JSON.parse(userData);
      console.log('Parsed user:', user);
      
      // Gunakan id atau id_user yang tersedia
      const userId = user.id_user || user.id;
      if (!userId) {
        throw new Error('No user ID found');
      }
      
      const result = await PegawaiAPI.getDashboard(userId.toString());
      console.log('Dashboard API result:', result);
      console.log('Jam kerja data:', result.data?.jam_kerja);
      console.log('Jam masuk dari API:', result.data?.jam_kerja?.jam_masuk);
      console.log('Jam keluar dari API:', result.data?.jam_kerja?.jam_keluar);
      
      if (result.success) {
        const data = result.data;
        setUserData({
          nama: data.user_info?.nama_lengkap || user.nama || 'Pengguna',
          jabatan: data.user_info?.jabatan || 'Pegawai',
          statusAbsen: data.presensi_hari_ini ? 'Sudah Absen' : 'Belum Absen',
          jamMasuk: data.jam_kerja?.jam_masuk || '08:00',
          jamKeluar: data.jam_kerja?.jam_keluar || '17:00',
          totalJamKerja: data.summary_bulan_ini?.total_hadir + 'h' || '0h'
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.log('Dashboard Error:', error);
      
      // Gunakan data fallback dari AsyncStorage jika ada
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        setUserData({
          nama: user.nama_lengkap || user.nama || 'Pengguna',
          jabatan: user.jabatan || 'Pegawai',
          statusAbsen: 'Belum Absen',
          jamMasuk: '08:00',
          jamKeluar: '17:00',
          totalJamKerja: '0h'
        });
        
        // Hanya tampilkan alert jika benar-benar error koneksi, bukan data kosong
        if (error instanceof Error && error.message.includes('fetch')) {
          Alert.alert('Info', 'Menggunakan data offline - tidak dapat terhubung ke server');
        }
      } else {
        // Jika tidak ada data sama sekali
        setUserData({
          nama: 'Pengguna',
          jabatan: 'Pegawai',
          statusAbsen: 'Belum Absen',
          jamMasuk: '08:00',
          jamKeluar: '17:00',
          totalJamKerja: '0h'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* SECTION 1: HEADER & USER PROFILE */}
        <View style={styles.headerSection}>
          <View>
            <Text style={styles.greetingText}>{getGreeting()},</Text>
            <Text style={styles.userName}>{userData.nama || 'Memuat...'}</Text>
            <Text style={styles.userJob}>{userData.jabatan || 'Memuat...'}</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
            <View style={styles.dotBadge} />
          </TouchableOpacity>
        </View>

        {/* SECTION 2: STATUS ABSENSI CARD */}
        <TouchableOpacity style={styles.statusCard} activeOpacity={0.8}>
          <View style={styles.cardGradientOverlay} />
          <View style={styles.statusHeader}>
            <View style={styles.statusLeft}>
              <View style={[styles.iconContainer, userData.statusAbsen === 'Sudah Absen' && styles.iconContainerSuccess]}>
                <Ionicons name={userData.statusAbsen === 'Belum Absen' ? 'time-outline' : 'checkmark-circle'} size={26} color="#fff" />
              </View>
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusTitle}>
                  {userData.statusAbsen === 'Belum Absen' ? 'Belum Melakukan Absen Masuk' : 'Sudah Absen'}
                </Text>
                <Text style={styles.statusDate}>{formatDate()}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, userData.statusAbsen === 'Sudah Absen' && styles.statusBadgeSuccess]}>
              <Text style={styles.badgeText}>{userData.statusAbsen === 'Belum Absen' ? 'PENDING' : 'DONE'}</Text>
            </View>
          </View>
          <Text style={styles.statusDescription}>
            {userData.statusAbsen === 'Belum Absen' 
              ? 'Segera lakukan presensi hari ini' 
              : 'Presensi berhasil dicatat'}
          </Text>
        </TouchableOpacity>

        {/* SECTION 3: ATTENDANCE LOGS */}
        <View style={styles.logContainer}>
          <View style={styles.logBox}>
            <View style={[styles.iconBox, { backgroundColor: '#E6F0EF' }]}>
              <Ionicons name="timer-outline" size={20} color="#004643" />
            </View>
            <View>
              <Text style={styles.logLabel}>Jam Masuk</Text>
              <Text style={styles.logValue}>{userData.jamMasuk || '08:00'}</Text>
            </View>
          </View>

          <View style={styles.logBox}>
            <View style={[styles.iconBox, { backgroundColor: '#FFF4E5' }]}>
              <Ionicons name="calendar-outline" size={20} color="#F9BC60" />
            </View>
            <View>
              <Text style={styles.logLabel}>Jam Pulang</Text>
              <Text style={styles.logValue}>{userData.jamKeluar || '17:00'}</Text>
            </View>
          </View>
        </View>

        {/* SECTION 4: MENU LAYANAN */}
        <View style={styles.menuSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Layanan</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.menuGrid}>
            {[
              { id: 1, name: 'Kegiatan', icon: 'document-text-outline', color: '#E3F2FD' },
              { id: 3, name: 'Pengajuan', icon: 'clipboard-outline', color: '#FFF3E0' },
              { id: 4, name: 'Lembur', icon: 'moon-outline', color: '#F3E5F5' },
              { id: 6, name: 'Bantuan', icon: 'help-circle-outline', color: '#FFEBEE' },
            ].map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => {
                  if (item.name === 'Pengajuan') {
                    router.push('/pengajuan'); // Arahkan ke file pengajuan.tsx di root
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

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  scrollContent: { paddingBottom: 100 }, // Increased bottom padding for navigation
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 20,
  },
  greetingText: { fontSize: 14, color: '#777' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  userJob: { fontSize: 12, color: '#004643', fontWeight: '500' },
  notificationBtn: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    position: 'relative',
  },
  dotBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4D4D',
    borderWidth: 1,
    borderColor: '#fff',
  },
  statusCard: {
    marginHorizontal: 20,
    padding: 20,
    backgroundColor: '#004643',
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  cardGradientOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 50,
    transform: [{ translateX: 30 }, { translateY: -30 }],
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  iconContainerSuccess: {
    backgroundColor: 'rgba(144,238,144,0.2)',
    borderColor: 'rgba(144,238,144,0.3)',
  },
  progressContainer: {
    marginVertical: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    minWidth: 35,
  },
  statusBadgeSuccess: {
    backgroundColor: 'rgba(144,238,144,0.3)',
    borderColor: 'rgba(144,238,144,0.4)',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statusDate: {
    color: '#B2D2D0',
    fontSize: 12,
    fontWeight: '500',
  },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  statusDescription: {
    color: '#B2D2D0',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  logContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    justifyContent: 'space-between',
  },
  logBox: {
    backgroundColor: '#fff',
    width: '48%',
    padding: 16,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 0,
  },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  logLabel: { fontSize: 10, color: '#888' },
  logValue: { fontSize: 13, fontWeight: 'bold', color: '#333' },
  menuSection: { marginTop: 30, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  seeAll: { fontSize: 12, color: '#004643', fontWeight: '600' },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  menuItem: { width: '22%', alignItems: 'center', marginBottom: 25 },
  menuIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuLabel: { fontSize: 11, color: '#444', fontWeight: '500', textAlign: 'center' },
  footer: { marginTop: 20, alignItems: 'center' },
  footerText: { fontSize: 10, color: '#BBB' },
});
