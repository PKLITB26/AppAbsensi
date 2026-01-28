import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { getApiUrl, API_CONFIG } from '../../../constants/config';
import { AppHeader } from '../../../components';

export default function DetailPegawai() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [pegawai, setPegawai] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fungsi untuk mengecek kelengkapan data
  const isDataComplete = (data: any) => {
    return data && 
           data.email && data.email.trim() !== '' && 
           data.has_password === true &&
           data.nama_lengkap && data.nama_lengkap.trim() !== '' && 
           data.nip && data.nip.trim() !== '';
  };

  const getMissingDataInfo = (data: any) => {
    if (!data) return 'Data tidak ditemukan';
    const missing = [];
    if (!data.email || data.email.trim() === '') missing.push('Email Login');
    if (data.has_password !== true) missing.push('Password');
    if (!data.nama_lengkap || data.nama_lengkap.trim() === '') missing.push('Nama Lengkap');
    if (!data.nip || data.nip.trim() === '') missing.push('NIP');
    return missing.length > 0 ? `Kurang: ${missing.join(', ')}` : 'Data Lengkap';
  };

  useEffect(() => {
    fetchPegawaiDetail();
  }, [id]);

  const fetchPegawaiDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${getApiUrl(API_CONFIG.ENDPOINTS.DETAIL_PEGAWAI)}?id=${id}`);
      const result = await response.json();
      
      if (result.success) {
        console.log('Detail pegawai data:', result.data);
        console.log('has_password value:', result.data.has_password);
        console.log('email value:', result.data.email);
        setPegawai(result.data);
      } else {
        Alert.alert('Error', result.message || 'Gagal memuat data pegawai');
      }
    } catch (error) {
      Alert.alert('Koneksi Error', 'Pastikan XAMPP nyala dan HP satu Wi-Fi dengan laptop.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#004643" />
          <Text style={styles.loadingText}>Memuat data pegawai...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!pegawai) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#F44336" />
          <Text style={styles.errorText}>Data pegawai tidak ditemukan</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Kembali</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER */}
      <AppHeader 
        title="Detail Pegawai"
        showBack={true}
        showStats={true}
        statsText={isDataComplete(pegawai) ? 'Informasi Lengkap' : 'Belum Lengkap'}
      />

      <View style={styles.contentContainer}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileCard}>
            <View style={styles.photoContainer}>
              {pegawai.foto_profil ? (
                <Image source={{ uri: pegawai.foto_profil }} style={styles.profilePhoto} />
              ) : (
                <View style={styles.defaultPhoto}>
                  <Text style={styles.avatarText}>{pegawai.nama_lengkap?.charAt(0) || 'P'}</Text>
                </View>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.nama}>{pegawai.nama_lengkap || 'Nama belum diisi'}</Text>
              <Text style={styles.pegawaiEmail}>{pegawai.email || 'Email belum diisi'}</Text>
              <Text style={styles.pegawaiNip}>NIP: {pegawai.nip || 'Belum diisi'}</Text>
            </View>
          </View>
        </View>

        {/* Info Cards */}
        <View style={styles.infoSection}>
          {/* Informasi Pribadi */}
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="person-outline" size={20} color="#004643" />
              <Text style={styles.cardTitle}>Informasi Pribadi</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Telepon</Text>
                  <Text style={styles.infoValue}>{pegawai.no_telepon || 'Belum diisi'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Tanggal Lahir</Text>
                  <Text style={styles.infoValue}>{pegawai.tanggal_lahir || 'Belum diisi'}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Jenis Kelamin</Text>
                  <Text style={styles.infoValue}>{pegawai.jenis_kelamin || 'Belum diisi'}</Text>
                </View>
              </View>
              <View style={styles.infoRowLast}>
                <View style={styles.infoItemFull}>
                  <Text style={styles.infoLabel}>Alamat</Text>
                  <Text style={styles.alamatText}>{pegawai.alamat || 'Alamat belum diisi'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Informasi Kepegawaian */}
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="briefcase-outline" size={20} color="#004643" />
              <Text style={styles.cardTitle}>Informasi Kepegawaian</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Jabatan</Text>
                  <Text style={styles.infoValue}>{pegawai.jabatan || 'Belum diisi'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Divisi</Text>
                  <Text style={styles.infoValue}>{pegawai.divisi || 'Belum diisi'}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Status Kepegawaian</Text>
                  <Text style={styles.infoValue}>{pegawai.status_pegawai || 'Belum diisi'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Informasi Akun Login */}
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="key-outline" size={20} color="#004643" />
              <Text style={styles.cardTitle}>
                {(pegawai.email && pegawai.email.trim() !== '' && 
                  pegawai.has_password === true && 
                  pegawai.nama_lengkap && pegawai.nama_lengkap.trim() !== '' && 
                  pegawai.nip && pegawai.nip.trim() !== '') ? 'Informasi Akun Login' : 'Informasi Tidak Lengkap'}
              </Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.accountStatusContainer}>
                <View style={[styles.accountStatusBadge, {
                  backgroundColor: (pegawai.email && pegawai.email.trim() !== '' && 
                                  pegawai.has_password === true && 
                                  pegawai.nama_lengkap && pegawai.nama_lengkap.trim() !== '' && 
                                  pegawai.nip && pegawai.nip.trim() !== '') ? '#E8F5E9' : '#FFEBEE'
                }]}>
                  <Ionicons 
                    name={(pegawai.email && pegawai.email.trim() !== '' && 
                          pegawai.has_password === true && 
                          pegawai.nama_lengkap && pegawai.nama_lengkap.trim() !== '' && 
                          pegawai.nip && pegawai.nip.trim() !== '') ? "checkmark-circle" : "close-circle"} 
                    size={16} 
                    color={(pegawai.email && pegawai.email.trim() !== '' && 
                           pegawai.has_password === true && 
                           pegawai.nama_lengkap && pegawai.nama_lengkap.trim() !== '' && 
                           pegawai.nip && pegawai.nip.trim() !== '') ? '#2E7D32' : '#F44336'} 
                  />
                  <Text style={[styles.accountStatusText, {
                    color: (pegawai.email && pegawai.email.trim() !== '' && 
                           pegawai.has_password === true && 
                           pegawai.nama_lengkap && pegawai.nama_lengkap.trim() !== '' && 
                           pegawai.nip && pegawai.nip.trim() !== '') ? '#2E7D32' : '#F44336'
                  }]}>
                    {(pegawai.email && pegawai.email.trim() !== '' && 
                      pegawai.has_password === true && 
                      pegawai.nama_lengkap && pegawai.nama_lengkap.trim() !== '' && 
                      pegawai.nip && pegawai.nip.trim() !== '') ? 'Akun Sudah Dibuat' : 'Data Belum Lengkap'}
                  </Text>
                </View>
              </View>
              
              {/* Missing Data Alert */}
              {!(pegawai.email && pegawai.email.trim() !== '' && 
                pegawai.has_password === true && 
                pegawai.nama_lengkap && pegawai.nama_lengkap.trim() !== '' && 
                pegawai.nip && pegawai.nip.trim() !== '') && (
                <View style={styles.missingDataAlert}>
                  <Text style={styles.missingDataTitle}>Data yang belum lengkap:</Text>
                  {(!pegawai.email || pegawai.email.trim() === '') && (
                    <Text style={styles.missingDataItem}>❌ Email kosong atau hanya spasi</Text>
                  )}
                  {(pegawai.has_password !== true) && (
                    <Text style={styles.missingDataItem}>❌ Password belum diset</Text>
                  )}
                  {(!pegawai.nama_lengkap || pegawai.nama_lengkap.trim() === '') && (
                    <Text style={styles.missingDataItem}>❌ Nama lengkap kosong</Text>
                  )}
                  {(!pegawai.nip || pegawai.nip.trim() === '') && (
                    <Text style={styles.missingDataItem}>❌ NIP kosong</Text>
                  )}
                </View>
              )}
              
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Email Login</Text>
                  <Text style={styles.infoValue}>{(pegawai.email && pegawai.email.trim() !== '') ? pegawai.email : 'Belum ada email'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Password</Text>
                  <Text style={styles.infoValue}>{pegawai.has_password === true ? '••••••••' : 'Belum diset'}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Role</Text>
                  <Text style={styles.infoValue}>{pegawai.role || 'pegawai'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Status Login</Text>
                  <Text style={[styles.infoValue, {
                    color: (pegawai.email && pegawai.email.trim() !== '' && 
                           pegawai.has_password === true && 
                           pegawai.nama_lengkap && pegawai.nama_lengkap.trim() !== '' && 
                           pegawai.nip && pegawai.nip.trim() !== '') ? '#2E7D32' : '#F44336'
                  }]}>
                    {(pegawai.email && pegawai.email.trim() !== '' && 
                      pegawai.has_password === true && 
                      pegawai.nama_lengkap && pegawai.nama_lengkap.trim() !== '' && 
                      pegawai.nip && pegawai.nip.trim() !== '') ? 'Dapat Login' : 'Tidak Dapat Login'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

        </View>
        </ScrollView>
      </View>
      
      {/* Conditional Edit Button - Only show if data incomplete */}
      {!isDataComplete(pegawai) && (
        <TouchableOpacity 
          style={styles.floatingEditBtn}
          onPress={() => router.push(`/pegawai-akun/detail/edit/${pegawai.id_pegawai || pegawai.id_user}` as any)}
        >
          <Ionicons name="create-outline" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFB',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  backBtn: {
    padding: 10,
    marginRight: 15,
    borderRadius: 10,
    backgroundColor: '#F5F5F5'
  },
  backBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  contentContainer: {
    flex: 1,
  },

  content: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: '#fff',
    marginTop: 10,
    marginHorizontal: 15,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  photoContainer: {
    marginRight: 16,
  },
  profilePhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  defaultPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E6F0EF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#004643',
    fontWeight: 'bold',
    fontSize: 20
  },
  profileInfo: {
    flex: 1,
  },
  nama: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  pegawaiEmail: {
    color: '#888',
    fontSize: 12,
    marginBottom: 2,
  },
  pegawaiNip: {
    color: '#666',
    fontSize: 12,
  },
  infoSection: {
    paddingHorizontal: 5,
    paddingBottom: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#004643',
    marginLeft: 8,
  },
  cardContent: {
    padding: 15,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoRowLast: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  infoItem: {
    flex: 1,
    marginRight: 8,
  },
  infoItemFull: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  accountStatusContainer: {
    marginBottom: 16,
  },
  accountStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  accountStatusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  missingDataAlert: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  missingDataTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F44336',
    marginBottom: 8,
  },
  missingDataItem: {
    fontSize: 13,
    color: '#F44336',
    marginBottom: 4,
  },
  alamatText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  floatingEditBtn: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});