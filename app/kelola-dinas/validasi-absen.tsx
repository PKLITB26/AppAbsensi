import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, TextInput, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { KelolaDinasAPI } from '../../constants/config';
import { AppHeader } from '../../components';

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
      
      // Handle response safely
      if (response && response.data) {
        setAbsensiData(response.data);
        
        // Handle pagination safely
        if (response.pagination) {
          setTotalRecords(response.pagination.total_records || 0);
          setTotalPages(response.pagination.total_pages || 0);
        } else {
          // Fallback if no pagination
          setTotalRecords(response.data.length || 0);
          setTotalPages(1);
        }
      } else {
        // Handle empty or invalid response
        setAbsensiData([]);
        setTotalRecords(0);
        setTotalPages(0);
      }
    } catch (error) {
      console.error('Error fetching validasi absen:', error);
      // Set empty state on error
      setAbsensiData([]);
      setTotalRecords(0);
      setTotalPages(0);
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
    <View style={styles.container}>
      <StatusBar style="dark" translucent={true} backgroundColor="transparent" />
      
      {/* HEADER */}
      <AppHeader 
        title="Validasi Absensi"
        showBack={true}
        showStats={true}
        statsText={`${totalRecords} Absensi`}
        fallbackRoute="/kelola-dinas"
      />

      <View style={styles.contentContainer}>
        {/* Fixed Search and Sort */}
        <View style={styles.fixedControls}>
          {/* Search Container */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Cari nama pegawai atau kegiatan..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity 
                  onPress={() => setSearchQuery('')}
                  style={styles.clearBtn}
                >
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Status Filter */}
          <View style={styles.filterCard}>
            <View style={styles.filterHeader}>
              <Ionicons name="funnel-outline" size={20} color="#004643" />
              <Text style={styles.filterTitle}>Filter Status</Text>
            </View>
            
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterChips}
            >
              {[
                { key: 'pending', label: 'Menunggu' },
                { key: 'approved', label: 'Disetujui' },
                { key: 'rejected', label: 'Ditolak' }
              ].map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterChip,
                    selectedFilter === filter.key && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedFilter(filter.key)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedFilter === filter.key && styles.filterChipTextActive,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Absensi List */}
        <FlatList
          data={absensiData}
          renderItem={renderAbsensiCard}
          keyExtractor={(item) => item.id.toString()}
          style={styles.flatList}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={() => fetchValidasiAbsen()}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>
                {loading ? 'Memuat data...' : 'Tidak ada data absensi'}
              </Text>
            </View>
          )}
          ListFooterComponent={() => {
            if (totalPages <= 1) return null;
            return (
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  style={[
                    styles.pageBtn,
                    currentPage === 1 && styles.pageBtnDisabled,
                  ]}
                  onPress={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <Ionicons
                    name="chevron-back"
                    size={16}
                    color={currentPage === 1 ? '#ccc' : '#004643'}
                  />
                </TouchableOpacity>

                <View style={styles.pageNumbers}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <TouchableOpacity
                        key={page}
                        style={[
                          styles.pageNumber,
                          currentPage === page && styles.pageNumberActive,
                        ]}
                        onPress={() => setCurrentPage(page)}
                      >
                        <Text
                          style={[
                            styles.pageNumberText,
                            currentPage === page && styles.pageNumberTextActive,
                          ]}
                        >
                          {page}
                        </Text>
                      </TouchableOpacity>
                    ),
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.pageBtn,
                    currentPage === totalPages && styles.pageBtnDisabled,
                  ]}
                  onPress={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={currentPage === totalPages ? '#ccc' : '#004643'}
                  />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  contentContainer: {
    flex: 1,
  },
  fixedControls: {
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FAFBFC',
  },
  flatList: {
    flex: 1,
  },
  
  searchContainer: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#F8FAFB'
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 10
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 12
  },
  clearBtn: {
    padding: 4
  },
  
  filterCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 5,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8
  },
  filterChips: {
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipActive: {
    backgroundColor: '#004643',
    borderColor: '#004643',
  },
  filterChipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  
  listContent: {
    paddingHorizontal: 5,
    paddingTop: 10,
    paddingBottom: 20,
  },
  absensiCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    marginHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
  },
  
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 10,
  },
  pageBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  pageBtnDisabled: {
    backgroundColor: '#F0F0F0',
  },
  pageNumbers: {
    flexDirection: 'row',
    marginHorizontal: 15,
  },
  pageNumber: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 2,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  pageNumberActive: {
    backgroundColor: '#004643',
  },
  pageNumberText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  pageNumberTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
