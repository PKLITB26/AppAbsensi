import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { API_CONFIG, getApiUrl } from '../../../constants/config';
import { AppHeader } from '../../../components';

interface DetailLembur {
  id_pengajuan: number;
  nama_lengkap: string;
  nip: string;
  foto_profil?: string;
  jabatan: string;
  jenis_pengajuan: string;
  tanggal_mulai: string;
  jam_mulai: string;
  jam_selesai: string;
  alasan_text: string;
  dokumen_foto?: string;
  status: string;
  tanggal_pengajuan: string;
  tanggal_approval?: string;
  catatan_approval?: string;
}

export default function DetailLemburScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [data, setData] = useState<DetailLembur | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${getApiUrl(API_CONFIG.ENDPOINTS.DETAIL_LAPORAN)}?type=lembur&id=${id}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setData(result.data);
      } else {
        console.error('Failed to fetch detail:', result.message);
      }
    } catch (error) {
      console.error('Error fetching detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'rejected': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Disetujui';
      case 'pending': return 'Menunggu';
      case 'rejected': return 'Ditolak';
      default: return status;
    }
  };

  const getJenisLabel = (jenis: string) => {
    const labels: any = {
      'lembur_weekday': 'Lembur Hari Kerja',
      'lembur_weekend': 'Lembur Weekend',
      'lembur_holiday': 'Lembur Hari Libur',
      'lembur_libur': 'Lembur Hari Libur'
    };
    return labels[jenis] || jenis;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" translucent={true} backgroundColor="transparent" />
        <AppHeader 
          title="Detail Lembur"
          showBack={true}
          fallbackRoute="/laporan/laporan-detail-lembur"
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#004643" />
        </View>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" translucent={true} backgroundColor="transparent" />
        <AppHeader 
          title="Detail Lembur"
          showBack={true}
          fallbackRoute="/laporan/laporan-detail-lembur"
        />
        <View style={styles.errorContainer}>
          <Text>Data tidak ditemukan</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent={true} backgroundColor="transparent" />
      
      <AppHeader 
        title="Detail Lembur"
        showBack={true}
        fallbackRoute="/laporan/laporan-detail-lembur"
      />

      <ScrollView style={styles.contentWrapper}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            {data.foto_profil ? (
              <Image source={{ uri: data.foto_profil }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{data.nama_lengkap.charAt(0).toUpperCase()}</Text>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{data.nama_lengkap}</Text>
            <Text style={styles.profileNip}>NIP: {data.nip}</Text>
            <Text style={styles.profileJob}>{data.jabatan}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(data.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(data.status) }]}>
              {getStatusLabel(data.status)}
            </Text>
          </View>
        </View>

        {/* Detail Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Lembur</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="moon-outline" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Jenis Lembur</Text>
              <Text style={styles.infoValue}>{getJenisLabel(data.jenis_pengajuan)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Tanggal</Text>
              <Text style={styles.infoValue}>{data.tanggal_mulai}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Waktu Lembur</Text>
              <Text style={styles.infoValue}>{data.jam_mulai} - {data.jam_selesai}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="document-text-outline" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Keterangan</Text>
              <Text style={styles.infoValue}>{data.alasan_text}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Tanggal Pengajuan</Text>
              <Text style={styles.infoValue}>{data.tanggal_pengajuan}</Text>
            </View>
          </View>

          {data.tanggal_approval && (
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Tanggal Approval</Text>
                <Text style={styles.infoValue}>{data.tanggal_approval}</Text>
              </View>
            </View>
          )}

          {data.catatan_approval && (
            <View style={styles.infoRow}>
              <Ionicons name="chatbox-outline" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Catatan Approval</Text>
                <Text style={styles.infoValue}>{data.catatan_approval}</Text>
              </View>
            </View>
          )}
        </View>

        {data.dokumen_foto && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dokumen Pendukung</Text>
            <Image source={{ uri: data.dokumen_foto }} style={styles.dokumenImage} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff",
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: "#F8FAFB",
    padding: 20
  },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 20, elevation: 2 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#E1BEE7', justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden' },
  avatarImage: { width: 60, height: 60, borderRadius: 30 },
  avatarText: { color: '#9C27B0', fontWeight: 'bold', fontSize: 24 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  profileNip: { fontSize: 12, color: '#666', marginBottom: 2 },
  profileJob: { fontSize: 12, color: '#888' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  section: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  infoRow: { flexDirection: 'row', marginBottom: 16 },
  infoContent: { flex: 1, marginLeft: 12 },
  infoLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  infoValue: { fontSize: 14, color: '#333', fontWeight: '500' },
  dokumenImage: { width: '100%', height: 200, borderRadius: 8, resizeMode: 'cover' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
