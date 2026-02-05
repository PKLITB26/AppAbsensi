import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppHeader, SkeletonLoader } from '../../../components';
import { KelolaDinasAPI, PegawaiAkunAPI, PengaturanAPI } from '../../../constants/config';

interface DetailDinas {
  id: number;
  namaKegiatan: string;
  nomorSpt: string;
  jenisDinas: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  jamMulai: string;
  jamSelesai: string;
  deskripsi?: string;
  lokasi: string;
  jamKerja: string;
  radius: number;
  koordinat_lat?: number;
  koordinat_lng?: number;
  status?: string;
  created_at?: string;
  dokumen_spt?: string;
  pegawai: Array<{
    nama: string;
    nip: string;
    jabatan: string;
    status: string;
    jamAbsen: string | null;
    id_user?: number;
  }>;
  lokasi_dinas?: Array<{
    id: number;
    nama_lokasi: string;
    jenis_lokasi: string;
  }>;
}

export default function DetailDinasScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [detailDinas, setDetailDinas] = useState<DetailDinas | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetailDinas();
  }, [id]);

  const fetchDetailDinas = async () => {
    try {
      setLoading(true);
      // Sementara menggunakan getDinasAktif karena endpoint detail-dinas belum tersedia
      const response = await KelolaDinasAPI.getDinasAktif();
      
      if (response.success && response.data) {
        // Cari data dinas berdasarkan ID
        const dinasData = response.data.find((item: any) => item.id === Number(id));
        
        if (dinasData) {
          console.log('Detail Dinas Data:', JSON.stringify(dinasData, null, 2));
          
          // Ambil data pegawai lengkap dari API pegawai
          const pegawaiResponse = await PegawaiAkunAPI.getDataPegawai();
          const lokasiResponse = await PengaturanAPI.getLokasiKantor();
          
          if (pegawaiResponse.success && pegawaiResponse.data) {
            // Map pegawai dinas dengan data pegawai lengkap
            const pegawaiLengkap = dinasData.pegawai.map((pegawaiDinas: any) => {
              const pegawaiData = pegawaiResponse.data.find((p: any) => 
                p.nama_lengkap === pegawaiDinas.nama
              );
              return {
                ...pegawaiDinas,
                nip: pegawaiData?.nip || '-',
                jabatan: pegawaiData?.jabatan || '-',
                id_user: pegawaiData?.id_user || pegawaiData?.id_pegawai || pegawaiData?.id
              };
            });
            
            // Parse jam kerja untuk mendapatkan jam mulai dan selesai
            const jamKerjaParts = dinasData.jamKerja ? dinasData.jamKerja.split('-') : ['', ''];
            const jamMulai = jamKerjaParts[0]?.trim() || '';
            const jamSelesai = jamKerjaParts[1]?.trim() || '';
            
            // Update data dinas dengan semua field lengkap
            const updatedDinasData = {
              ...dinasData,
              jamMulai,
              jamSelesai,
              jenisDinas: dinasData.jenisDinas || 'lokal',
              pegawai: pegawaiLengkap,
              lokasi_dinas: lokasiResponse.success ? lokasiResponse.data : []
            };
            
            setDetailDinas(updatedDinasData);
          } else {
            setDetailDinas(dinasData);
          }
        } else {
          Alert.alert('Error', 'Data dinas tidak ditemukan');
        }
      } else {
        Alert.alert('Error', response.message || 'Gagal memuat detail dinas');
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal memuat detail dinas');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hadir': return '#4CAF50';
      case 'terlambat': return '#FF9800';
      case 'belum_absen': return '#2196F3';
      case 'tidak_hadir': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'hadir': return 'Hadir';
      case 'terlambat': return 'Terlambat';
      case 'belum_absen': return 'Belum Absen';
      case 'tidak_hadir': return 'Tidak Hadir';
      default: return status;
    }
  };

  const getDinasStatus = () => {
    if (!detailDinas) return { status: 'Unknown', color: '#666' };
    
    const today = new Date();
    const mulai = new Date(detailDinas.tanggal_mulai);
    const selesai = new Date(detailDinas.tanggal_selesai);
    
    today.setHours(0, 0, 0, 0);
    mulai.setHours(0, 0, 0, 0);
    selesai.setHours(23, 59, 59, 999);
    
    if (today < mulai) {
      return { status: 'Belum Dimulai', color: '#FF9800' };
    } else if (today >= mulai && today <= selesai) {
      return { status: 'Sedang Berlangsung', color: '#4CAF50' };
    } else {
      return { status: 'Selesai', color: '#2196F3' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };



  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" translucent={true} backgroundColor="transparent" />
        <AppHeader 
          title="Detail Dinas"
          showBack={true}
          fallbackRoute="/kelola-dinas"
        />
        <SkeletonLoader type="detail" count={1} message="Memuat detail dinas..." />
      </View>
    );
  }

  if (!detailDinas) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" translucent={true} backgroundColor="transparent" />
        <AppHeader 
          title="Detail Dinas"
          showBack={true}
          fallbackRoute="/kelola-dinas"
        />
        <View style={styles.emptyState}>
          <Ionicons name="document-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>Data dinas tidak ditemukan</Text>
        </View>
      </View>
    );
  }

  const dinasStatus = getDinasStatus();
  const totalPegawai = detailDinas.pegawai.length;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent={true} backgroundColor="transparent" />
      
      <AppHeader 
        title="Detail Dinas"
        showBack={true}
        fallbackRoute="/kelola-dinas"
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Info */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.titleSection}>
              <Text style={styles.kegiatanTitle}>{detailDinas.namaKegiatan}</Text>
              <Text style={styles.sptNumber}>{detailDinas.nomorSpt}</Text>
            </View>
            <View style={[styles.dinasStatusBadge, { backgroundColor: dinasStatus.color }]}>
              <Text style={styles.dinasStatusText}>{dinasStatus.status}</Text>
            </View>
          </View>
          <Text style={styles.createdDate}>
            Tanggal dibuat: {detailDinas.created_at ? formatDate(detailDinas.created_at) : '-'}
          </Text>
        </View>

        {/* Informasi Kegiatan */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Informasi Kegiatan</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="briefcase-outline" size={20} color="#004643" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Jenis Dinas</Text>
              <Text style={styles.infoValue}>
                {detailDinas.jenisDinas === 'lokal' ? 'Dinas Lokal' : 
                 detailDinas.jenisDinas === 'luar_kota' ? 'Dinas Luar Kota' : 
                 detailDinas.jenisDinas === 'luar_negeri' ? 'Dinas Luar Negeri' : 
                 detailDinas.jenisDinas || 'Tidak diketahui'}
              </Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#004643" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Lokasi</Text>
              <Text style={styles.infoValue}>{detailDinas.lokasi}</Text>
              {detailDinas.lokasi_dinas && detailDinas.lokasi_dinas.length > 0 && (
                <View style={styles.lokasiDinasList}>
                  {detailDinas.lokasi_dinas.map((lokasi, index) => (
                    <Text key={lokasi.id} style={styles.lokasiDinasItem}>
                      • {lokasi.nama_lokasi} ({lokasi.jenis_lokasi === 'tetap' ? 'Kantor Tetap' : 'Lokasi Dinas'})
                    </Text>
                  ))}
                </View>
              )}
            </View>
          </View>

          {detailDinas.deskripsi && (
            <View style={styles.infoRow}>
              <Ionicons name="document-text-outline" size={20} color="#004643" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Deskripsi</Text>
                <Text style={styles.infoValue}>{detailDinas.deskripsi}</Text>
              </View>
            </View>
          )}
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Waktu & Jadwal Dinas</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#004643" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Tanggal Mulai</Text>
              <Text style={styles.infoValue}>{formatDate(detailDinas.tanggal_mulai)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#004643" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Tanggal Selesai</Text>
              <Text style={styles.infoValue}>{formatDate(detailDinas.tanggal_selesai)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#004643" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Jam Mulai</Text>
              <Text style={styles.infoValue}>{detailDinas.jamMulai || '-'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#004643" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Jam Selesai</Text>
              <Text style={styles.infoValue}>{detailDinas.jamSelesai || '-'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="radio-outline" size={20} color="#004643" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Radius Absen</Text>
              <Text style={styles.infoValue}>{detailDinas.radius} meter</Text>
            </View>
          </View>

          {detailDinas.koordinat_lat && detailDinas.koordinat_lng && (
            <View style={styles.infoRow}>
              <Ionicons name="navigate-outline" size={20} color="#004643" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Koordinat GPS</Text>
                <Text style={styles.infoValue}>
                  {detailDinas.koordinat_lat.toFixed(6)}, {detailDinas.koordinat_lng.toFixed(6)}
                </Text>
              </View>
            </View>
          )}
        </View>





        {/* Dokumen SPT */}
        {detailDinas.dokumen_spt && (
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Dokumen SPT</Text>
            
            <TouchableOpacity style={styles.documentRow}>
              <Ionicons name="document-attach-outline" size={20} color="#004643" />
              <View style={styles.infoContent}>
                <Text style={styles.infoValue}>Dokumen SPT</Text>
                <Text style={styles.infoSubtext}>Tap untuk membuka dokumen</Text>
              </View>
              <Ionicons name="download-outline" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        )}

        {/* Daftar Pegawai */}
        <View style={styles.pegawaiSection}>
          <Text style={styles.cardTitle}>Daftar Pegawai ({totalPegawai})</Text>
          
          {detailDinas.pegawai.map((pegawai, index) => (
            <View key={`pegawai-${pegawai.id}-${index}`} style={styles.pegawaiCard}>
              <View style={styles.pegawaiHeader}>
                <View style={styles.avatarContainer}>
                  <Ionicons name="person-circle" size={40} color="#004643" />
                </View>
                <View style={styles.pegawaiInfo}>
                  <Text style={styles.pegawaiName}>{pegawai.nama}</Text>
                  <Text style={styles.pegawaiNip}>NIP: {pegawai.nip}</Text>
                  <Text style={styles.pegawaiJabatan}>{pegawai.jabatan}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>


      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
  
  // Header Card
  headerCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleSection: {
    flex: 1,
    marginRight: 12,
  },
  kegiatanTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sptNumber: {
    fontSize: 14,
    color: '#666',
  },
  dinasStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  dinasStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  createdDate: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },

  // Info Card
  infoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  deskripsiSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  deskripsiLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  deskripsiText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },

  // Progress Card
  progressCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 16,
    color: '#004643',
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  progressFill: {
    height: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },

  // Pegawai Section
  pegawaiSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  pegawaiCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  pegawaiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  pegawaiInfo: {
    flex: 1,
  },
  pegawaiName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  pegawaiNip: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  pegawaiJabatan: {
    fontSize: 12,
    color: '#004643',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  absenDetails: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  absenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  absenLabel: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  absenValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  fotoContainer: {
    marginTop: 8,
  },
  fotoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  fotoAbsen: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  keteranganContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  keteranganText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },

  // Action Section
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#004643',
    fontWeight: '500',
    marginLeft: 6,
  },
  infoSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  lokasiDinasList: {
    marginTop: 8,
  },
  lokasiDinasItem: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
});