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
import { getApiUrl, API_CONFIG } from '../../constants/config';

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

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      console.log('Fetching user data...');
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.TEST_API), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 1 })
      });
      
      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('API Result:', result);
      
      if (result.success) {
        setUserData(result.data);
        console.log('User data set:', result.data);
      } else {
        console.log('API Error:', result.message);
        // Gunakan data fallback jika API error
        setUserData({
          nama: 'Demo User',
          jabatan: 'Staff IT',
          statusAbsen: 'Belum Absen',
          jamMasuk: '08:00',
          jamKeluar: '17:00',
          totalJamKerja: '0j 0m'
        });
        Alert.alert('Info', 'Menggunakan data demo. Error: ' + result.message);
      }
    } catch (error) {
      console.log('Fetch Error:', error);
      // Gunakan data fallback jika koneksi error
      setUserData({
        nama: 'Demo User',
        jabatan: 'Staff IT',
        statusAbsen: 'Belum Absen',
        jamMasuk: '08:00',
        jamKeluar: '17:00',
        totalJamKerja: '0j 0m'
      });
      Alert.alert(
        'Mode Demo', 
        'Tidak dapat terhubung ke server.\nMenggunakan data demo.\n\nPastikan:\n1. XAMPP sudah nyala\n2. HP dan laptop satu WiFi (10.251.109.x)\n3. Database hadirin_db ada\n4. File PHP ada di htdocs/hadirin-api/'
      );
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
            <Text style={styles.greetingText}>Selamat Pagi,</Text>
            <Text style={styles.userName}>{userData.nama || 'Memuat...'}</Text>
            <Text style={styles.userJob}>{userData.jabatan || 'Memuat...'}</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
            <View style={styles.dotBadge} />
          </TouchableOpacity>
        </View>

        {/* SECTION 2: STATUS ABSENSI CARD */}
        <View style={styles.statusCard}>
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>{userData.statusAbsen === 'Belum Absen' ? 'Belum Melakukan Absen Masuk' : `Status: ${userData.statusAbsen}`}</Text>
            <View style={styles.limitBadge}>
              <Text style={styles.limitText}>Batas: 08:45 WIB</Text>
            </View>
          </View>
          <Text style={styles.statusDescription}>
            Segera lakukan presensi. Jika Anda sedang Dinas Luar, pastikan memilih kategori 'Dinas' pada menu Presensi.
          </Text>
        </View>

        {/* SECTION 3: ATTENDANCE LOGS */}
        <View style={styles.logContainer}>
          <View style={styles.logBox}>
            <View style={[styles.iconBox, { backgroundColor: '#E6F0EF' }]}>
              <Ionicons name="timer-outline" size={20} color="#004643" />
            </View>
            <View>
              <Text style={styles.logLabel}>Log Kehadiran</Text>
              <Text style={styles.logValue}>{userData.totalJamKerja}</Text>
            </View>
          </View>

          <View style={styles.logBox}>
            <View style={[styles.iconBox, { backgroundColor: '#FFF4E5' }]}>
              <Ionicons name="calendar-outline" size={20} color="#F9BC60" />
            </View>
            <View>
              <Text style={styles.logLabel}>Jam Kerja</Text>
              <Text style={styles.logValue}>{userData.jamMasuk} - {userData.jamKeluar}</Text>
            </View>
          </View>
        </View>

        {/* SECTION 4: MENU LAYANAN */}
        <View style={styles.menuSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Layanan Mandiri</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.menuGrid}>
            {[
              { id: 1, name: 'Kegiatan', icon: 'document-text-outline', color: '#E3F2FD' },
              { id: 2, name: 'Presensi', icon: 'time-outline', color: '#E8F5E9' },
              { id: 3, name: 'Pengajuan', icon: 'clipboard-outline', color: '#FFF3E0' },
              { id: 4, name: 'Lembur', icon: 'moon-outline', color: '#F3E5F5' },
              { id: 5, name: 'Slip Gaji', icon: 'cash-outline', color: '#E0F2F1' },
              { id: 6, name: 'Bantuan', icon: 'help-circle-outline', color: '#FFEBEE' },
            ].map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.menuItem}
                onPress={() => {
                  if (item.name === 'Pengajuan') {
                    router.push('/pengajuan'); // Arahkan ke file pengajuan.tsx di root
                  } else if (item.name === 'Presensi') {
                    router.push('/(tabs)/presensi'); // Arahkan ke tab presensi
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
  scrollContent: { paddingBottom: 30 },
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
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statusInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', flex: 1 },
  limitBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  limitText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  statusDescription: { color: '#B2D2D0', fontSize: 12, lineHeight: 18 },
  logContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    justifyContent: 'space-between',
  },
  logBox: {
    backgroundColor: '#fff',
    width: '48%',
    padding: 15,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  logLabel: { fontSize: 10, color: '#888' },
  logValue: { fontSize: 13, fontWeight: 'bold', color: '#333' },
  menuSection: { marginTop: 30, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  seeAll: { fontSize: 12, color: '#004643', fontWeight: '600' },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  menuItem: { width: '30%', alignItems: 'center', marginBottom: 25 },
  menuIconCircle: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  menuLabel: { fontSize: 11, color: '#444', fontWeight: '500', textAlign: 'center' },
  footer: { marginTop: 20, alignItems: 'center' },
  footerText: { fontSize: 10, color: '#BBB' },
});
