import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView, TouchableOpacity, FlatList, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { KelolaDinasAPI } from '../../constants/config';

interface AbsensiValidation {
  id: number;
  namaKegiatan: string;
  nomorSpt: string;
  tanggal: string;
  pegawai: {
    nama: string;
    nip: string;
    jamMasuk: string;
    jamKeluar?: string;
    lokasi: string;
    foto: string;
    lokasiValid: boolean;
    fotoValid: boolean;
    jarak: number;
    status: 'pending' | 'approved' | 'rejected';
    keterangan?: string;
  };
}

export default function ValidasiAbsenScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [absensiData, setAbsensiData] = useState<AbsensiValidation[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchValidasiAbsen();
  }, [currentPage, selectedFilter, searchQuery]);

  const fetchValidasiAbsen = async () => {
    try {
      setLoading(true);
      const params = {
        status: selectedFilter,
        search: searchQuery,
        page: currentPage,
        limit: itemsPerPage
      };
      
      const response = await KelolaDinasAPI.getValidasiAbsen(params);
      setAbsensiData(response.data);
      setTotalRecords(response.pagination.total_records);
      setTotalPages(response.pagination.total_pages);
    } catch (error) {
      console.error('Error fetching validasi absen:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'approved': return '#4CAF50';
      case 'rejected': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Menunggu';
      case 'approved': return 'Disetujui';
      case 'rejected': return 'Ditolak';
      default: return status;
    }
  };

  const handleValidation = async (id: number, action: 'approve' | 'reject', reason?: string) => {
    Alert.alert(
      'Konfirmasi',
      `Apakah Anda yakin ingin ${action === 'approve' ? 'menyetujui' : 'menolak'} absensi ini?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya',
          onPress: async () => {
            try {
              await KelolaDinasAPI.updateValidasiAbsen({
                id,
                action,
                keterangan: reason || ''
              });
              Alert.alert('Berhasil', `Absensi berhasil ${action === 'approve' ? 'disetujui' : 'ditolak'}`);
              fetchValidasiAbsen();
            } catch (error) {
              Alert.alert('Error', 'Gagal mengupdate validasi');
            }
          }
        }
      ]
    );
  };

  const renderAbsensiCard = ({ item }: { item: AbsensiValidation }) => {
    return (
      <View style={styles.absensiCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitle}>
            <Text style={styles.kegiatanName}>{item.namaKegiatan}</Text>
            <Text style={styles.sptNumber}>{item.nomorSpt}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.pegawai.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.pegawai.status) }]}>
              {getStatusLabel(item.pegawai.status)}
            </Text>
          </View>
        </View>

        <View style={styles.pegawaiSection}>
          <View style={styles.pegawaiHeader}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person-circle" size={40} color="#004643" />
            </View>
            <View style={styles.pegawaiInfo}>
              <Text style={styles.pegawaiName}>{item.pegawai.nama}</Text>
              <Text style={styles.pegawaiNip}>NIP: {item.pegawai.nip}</Text>
            </View>
          </View>
        </View>

        <View style={styles.absensiDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {new Date(item.tanggal).toLocaleDateString('id-ID', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              Masuk: {item.pegawai.jamMasuk}
              {item.pegawai.jamKeluar && ` | Keluar: ${item.pegawai.jamKeluar}`}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{item.pegawai.lokasi}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="camera-outline" size={16} color="#666" />
            <Text style={styles.detailText}>Foto: {item.pegawai.foto}</Text>
          </View>
        </View>

        <View style={styles.validasiRingkas}>
          <View style={styles.validasiItem}>
            <Ionicons 
              name={item.pegawai.lokasiValid ? "checkmark-circle" : "close-circle"} 
              size={16} 
              color={item.pegawai.lokasiValid ? '#4CAF50' : '#F44336'} 
            />
            <Text style={styles.validasiLabel}>Lokasi</Text>
            <Text style={styles.validasiValue}>{item.pegawai.jarak}m</Text>
          </View>
          
          <View style={styles.validasiItem}>
            <Ionicons 
              name={item.pegawai.fotoValid ? "checkmark-circle" : "close-circle"} 
              size={16} 
              color={item.pegawai.fotoValid ? '#4CAF50' : '#F44336'} 
            />
            <Text style={styles.validasiLabel}>Foto</Text>
            <Text style={styles.validasiValue}>{item.pegawai.fotoValid ? 'Valid' : 'Invalid'}</Text>
          </View>
        </View>

        {item.pegawai.keterangan && (
          <View style={styles.keteranganSection}>
            <Text style={styles.keteranganText}>{item.pegawai.keterangan}</Text>
          </View>
        )}

        {item.pegawai.status === 'rejected' && (
          <View style={styles.alasanSection}>
            <Text style={styles.alasanText}>Ditolak: {item.pegawai.keterangan}</Text>
          </View>
        )}

        {item.pegawai.status === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => handleValidation(item.id, 'reject')}
            >
              <Ionicons name="close-circle-outline" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Tolak</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => handleValidation(item.id, 'approve')}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Setujui</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.viewPhotoBtn}>
          <Ionicons name="image-outline" size={16} color="#004643" />
          <Text style={styles.viewPhotoText}>Lihat Foto Absensi</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#004643" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Validasi Absensi</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search-outline" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama pegawai atau kegiatan..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterBtn, selectedFilter === 'pending' && styles.filterBtnActive]}
          onPress={() => setSelectedFilter('pending')}
        >
          <Text style={[styles.filterText, selectedFilter === 'pending' && styles.filterTextActive]}>
            Menunggu
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterBtn, selectedFilter === 'approved' && styles.filterBtnActive]}
          onPress={() => setSelectedFilter('approved')}
        >
          <Text style={[styles.filterText, selectedFilter === 'approved' && styles.filterTextActive]}>
            Disetujui
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterBtn, selectedFilter === 'rejected' && styles.filterBtnActive]}
          onPress={() => setSelectedFilter('rejected')}
        >
          <Text style={[styles.filterText, selectedFilter === 'rejected' && styles.filterTextActive]}>
            Ditolak
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={absensiData}
        renderItem={renderAbsensiCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Tidak ada data absensi</Text>
          </View>
        }
      />

      {totalPages > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
            onPress={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <Ionicons name="chevron-back" size={20} color={currentPage === 1 ? '#ccc' : '#004643'} />
          </TouchableOpacity>
          
          <Text style={styles.pageText}>
            Halaman {currentPage} dari {totalPages}
          </Text>
          
          <TouchableOpacity
            style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
            onPress={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <Ionicons name="chevron-forward" size={20} color={currentPage === totalPages ? '#ccc' : '#004643'} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 50, 
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  backBtn: {
    padding: 10,
    marginRight: 15,
    borderRadius: 10,
    backgroundColor: '#F5F5F5'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#004643',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    gap: 8,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  filterBtnActive: {
    backgroundColor: '#004643',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  absensiCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    flex: 1,
  },
  kegiatanName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#004643',
    marginBottom: 4,
  },
  sptNumber: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  pegawaiSection: {
    marginBottom: 12,
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
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  pegawaiNip: {
    fontSize: 12,
    color: '#666',
  },
  absensiDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  validasiRingkas: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  validasiItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  validasiLabel: {
    fontSize: 12,
    color: '#666',
  },
  validasiValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  keteranganSection: {
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  keteranganText: {
    fontSize: 12,
    color: '#666',
  },
  alasanSection: {
    backgroundColor: '#ffebee',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  alasanText: {
    fontSize: 12,
    color: '#F44336',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  rejectBtn: {
    backgroundColor: '#F44336',
  },
  approveBtn: {
    backgroundColor: '#4CAF50',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  viewPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#004643',
    borderRadius: 8,
    gap: 4,
  },
  viewPhotoText: {
    color: '#004643',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  pageBtn: {
    padding: 8,
  },
  pageBtnDisabled: {
    opacity: 0.3,
  },
  pageText: {
    fontSize: 14,
    color: '#333',
    marginHorizontal: 16,
  },
});
