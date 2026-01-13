import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, View, Text, ScrollView, TouchableOpacity, 
  SafeAreaView, StatusBar, Image, RefreshControl 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface RecentActivity {
  nama_lengkap: string;
  status: string;
  jam_masuk: string;
}

interface DashboardData {
  stats: {
    hadir: number;
    lambat: number;
  };
  recent: RecentActivity[];
  user?: {
    nama_lengkap: string;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData>({
    stats: { hadir: 0, lambat: 0 }, 
    recent: [],
    user: { nama_lengkap: 'Administrator ITB' }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardData();
  }, []);

  const getDashboardData = async () => {
    try {
      const response = await fetch('http://10.251.109.131/hadirinapp/admin.php');
      const result = await response.json();
      
      if (result.success) {
        setData({
          stats: {
            hadir: result.stats.hadir || 0,
            lambat: result.stats.lambat || 0
          },
          recent: result.recent || [],
          user: result.user || { nama_lengkap: 'Administrator ITB' }
        });
      }
    } catch (error) {
      console.log("Koneksi Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={getDashboardData} />}
      >
        
        {/* SECTION 1: HEADER */}
        <View style={styles.headerSection}>
          <View>
            <Text style={styles.greetingText}>Administrator,</Text>
            <Text style={styles.userName}>{data.user?.nama_lengkap || ''}</Text>
            <Text style={styles.userJob}>HR & Operational Manager</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
            <View style={styles.dotBadge} />
          </TouchableOpacity>
        </View>

        {/* SECTION 2: RINGKASAN STATUS */}
        <View style={styles.statusCard}>
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>Ringkasan Kehadiran</Text>
            <View style={styles.limitBadge}>
              <Text style={styles.limitText}>Hari Ini</Text>
            </View>
          </View>
          <Text style={styles.statusDescription}>
            Sistem memantau {data.stats.hadir} pegawai yang sudah masuk secara tepat waktu hari ini.
          </Text>
        </View>

        {/* SECTION 3: QUICK STATS */}
        <View style={styles.logContainer}>
          <View style={styles.logBox}>
            <View style={[styles.iconBox, { backgroundColor: '#E6F0EF' }]}>
              <Ionicons name="people-outline" size={20} color="#004643" />
            </View>
            <View>
              <Text style={styles.logLabel}>Total Hadir</Text>
              <Text style={styles.logValue}>{data.stats.hadir} Pegawai</Text>
            </View>
          </View>

          <View style={styles.logBox}>
            <View style={[styles.iconBox, { backgroundColor: '#FFF4E5' }]}>
              <Ionicons name="alert-circle-outline" size={20} color="#F9BC60" />
            </View>
            <View>
              <Text style={styles.logLabel}>Terlambat</Text>
              <Text style={styles.logValue}>{data.stats.lambat} Orang</Text>
            </View>
          </View>
        </View>

        {/* SECTION 4: MENU LAYANAN */}
        <View style={styles.menuSection}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Layanan Kelola</Text>
            </View>
            <View style={styles.menuGrid}>
                {[
                { id: 1, name: 'Data Pegawai', icon: 'people-outline', color: '#E3F2FD' },
                { id: 2, name: 'Akun Login', icon: 'key-outline', color: '#FFF9C4' },
                { id: 3, name: 'Approval', icon: 'checkbox-outline', color: '#E8F5E9' },
                { id: 4, name: 'Tracking', icon: 'map-outline', color: '#FFF3E0' },
                { id: 5, name: 'Laporan', icon: 'document-text-outline', color: '#F3E5F5' },
                { id: 6, name: 'Pengaturan', icon: 'settings-outline', color: '#FFEBEE' },
                ].map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.menuItem}
                  onPress={() => {
                    if (item.name === 'Data Pegawai') {
                      router.push('/data-pegawai-admin');
                    } else if (item.name === 'Akun Login') {
                      router.push('/akun-login-admin');
                    } else if (item.name === 'Approval') {
                      router.push('/approval-admin');
                    } else if (item.name === 'Tracking') {
                      router.push('/tracking-admin');
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

        {/* SECTION 5: LOG AKTIVITAS */}
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
                  <Text style={styles.activityText}>{item.status} • {item.jam_masuk.substring(0,5)} WIB</Text>
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

        <View style={styles.footer}>
          <Text style={styles.footerText}>Hadir.in Admin v1.0.0</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  scrollContent: { paddingBottom: 30 },
  headerSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, marginBottom: 20 },
  greetingText: { fontSize: 14, color: '#777' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  userJob: { fontSize: 12, color: '#004643', fontWeight: '500' },
  notificationBtn: { padding: 10, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#F0F0F0' },
  dotBadge: { position: 'absolute', top: 10, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF4D4D', borderWidth: 1, borderColor: '#fff' },
  statusCard: { marginHorizontal: 20, padding: 20, backgroundColor: '#004643', borderRadius: 20 },
  statusInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  limitBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  limitText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  statusDescription: { color: '#B2D2D0', fontSize: 12, lineHeight: 18 },
  logContainer: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 20, justifyContent: 'space-between' },
  logBox: { backgroundColor: '#fff', width: '48%', padding: 15, borderRadius: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#F0F0F0' },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  logLabel: { fontSize: 10, color: '#888' },
  logValue: { fontSize: 13, fontWeight: 'bold', color: '#333' },
  menuSection: { marginTop: 30, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  menuItem: { width: '30%', alignItems: 'center', marginBottom: 25 },
  menuIconCircle: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  menuLabel: { fontSize: 11, color: '#444', fontWeight: '500', textAlign: 'center' },
  recentList: { paddingHorizontal: 20, marginTop: 10 },
  activityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: '#F0F0F0' },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  nameText: { fontWeight: 'bold', fontSize: 14, color: '#333' },
  activityText: { fontSize: 12, color: '#888' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  footer: { marginTop: 20, alignItems: 'center' },
  footerText: { fontSize: 10, color: '#BBB' },
});
