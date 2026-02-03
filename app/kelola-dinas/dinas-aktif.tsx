import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { KelolaDinasAPI } from '../../constants/config';
import { AppHeader } from '../../components';

interface DinasAktif {
  id: number;
  namaKegiatan: string;
  nomorSpt: string;
  lokasi: string;
  jamKerja: string;
  radius: number;
  tanggal_mulai: string;
  tanggal_selesai: string;
  pegawai: Array<{
    nama: string;
    status: 'hadir' | 'terlambat' | 'belum_absen';
    jamAbsen?: string;
  }>;
}

export default function DinasAktifScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState('berlangsung');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [dinasAktif, setDinasAktif] = useState<DinasAktif[]>([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;
  
  useEffect(() => {
    fetchDinasAktif();
  }, [selectedFilter]);

  const fetchDinasAktif = async () => {
    try {
      setLoading(true);
      console.log('Fetching dinas aktif data with filter:', selectedFilter);
      const statusParam = selectedFilter === 'semua' ? undefined : selectedFilter;
      const response = await KelolaDinasAPI.getDinasAktif(statusParam);
      console.log('Dinas aktif API response:', response);
      
      if (response && response.success && Array.isArray(response.data)) {
        console.log('Setting dinas data:', response.data.length, 'items');
        setDinasAktif(response.data);
      } else {
        console.log('No valid data received, setting empty array');
        setDinasAktif([]);
      }
    } catch (error) {
      console.error('Error fetching dinas aktif:', error);
      setDinasAktif([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hadir': return '#4CAF50';
      case 'terlambat': return '#FF9800';
      case 'belum_absen': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'hadir': return 'Hadir';
      case 'terlambat': return 'Terlambat';
      case 'belum_absen': return 'Belum Absen';
      default: return status;
    }
  };

  const getDinasStatus = (tanggalMulai: string, tanggalSelesai: string) => {
    const today = new Date();
    const mulai = new Date(tanggalMulai);
    const selesai = new Date(tanggalSelesai);
    
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

  const getFilteredData = () => {
    let filtered = dinasAktif;
    
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.namaKegiatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nomorSpt.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter berdasarkan status dinas
    if (selectedFilter !== 'semua') {
      filtered = filtered.filter(item => {
        const dinasStatusInfo = getDinasStatus(item.tanggal_mulai, item.tanggal_selesai);
        const status = dinasStatusInfo.status;
        
        switch (selectedFilter) {
          case 'berlangsung':
            return status === 'Sedang Berlangsung';
          case 'selesai':
            return status === 'Selesai';
          case 'belum_dimulai':
            return status === 'Belum Dimulai';
          default:
            return true;
        }
      });
    }
    
    return filtered;
  };

  const filteredData = getFilteredData();
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const renderDinasCard = ({ item }: { item: DinasAktif }) => {
    const pegawaiArray = item.pegawai || [];
    const hadirCount = pegawaiArray.filter(p => p.status === 'hadir').length;
    const totalPegawai = pegawaiArray.length;
    const dinasStatusInfo = getDinasStatus(item.tanggal_mulai, item.tanggal_selesai);

    return (
      <View style={styles.dinasCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitle}>
            <Text style={styles.kegiatanName}>{item.namaKegiatan}</Text>
            <Text style={styles.sptNumber}>{item.nomorSpt}</Text>
          </View>
          <View style={[styles.dinasStatusBadge, { backgroundColor: dinasStatusInfo.color + '20' }]}>
            <Text style={[styles.dinasStatusText, { color: dinasStatusInfo.color }]}>
              {dinasStatusInfo.status === 'Sedang Berlangsung' ? 'Berlangsung' : 
               dinasStatusInfo.status === 'Belum Dimulai' ? 'Belum Mulai' : 'Selesai'}
            </Text>
          </View>
        </View>

        <View style={styles.cardInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text style={styles.infoText}>{item.lokasi}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.infoText}>{item.jamKerja}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={14} color="#666" />
            <Text style={styles.infoText}>
              {new Date(item.tanggal_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - 
              {new Date(item.tanggal_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
            </Text>
          </View>
        </View>

        {/* Hanya tampilkan status absen jika dinas sedang berlangsung */}
        {dinasStatusInfo.status === 'Sedang Berlangsung' && (
          <>
            <View style={styles.statusSummary}>
              <Text style={styles.statusText}>
                Status Absen: {hadirCount}/{totalPegawai} Hadir
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: totalPegawai > 0 ? `${(hadirCount / totalPegawai) * 100}%` : '0%' }
                  ]} 
                />
              </View>
            </View>

            <View style={styles.pegawaiList}>
              {pegawaiArray.length > 0 ? (
                pegawaiArray.map((pegawai, index) => (
                  <View key={index} style={styles.pegawaiItem}>
                    <View style={styles.pegawaiInfo}>
                      <Text style={styles.pegawaiName}>{pegawai.nama}</Text>
                      {pegawai.jamAbsen && (
                        <Text style={styles.jamAbsen}>({pegawai.jamAbsen})</Text>
                      )}
                    </View>
                    <View style={[
                      styles.statusBadge, 
                      { backgroundColor: getStatusColor(pegawai.status) + '20' }
                    ]}>
                      <Text style={[
                        styles.statusBadgeText, 
                        { color: getStatusColor(pegawai.status) }
                      ]}>
                        {getStatusLabel(pegawai.status)}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noPegawaiText}>Belum ada pegawai yang ditugaskan</Text>
              )}
            </View>
          </>
        )}
        
        {/* Tampilkan info ringkas untuk dinas yang selesai atau belum dimulai */}
        {dinasStatusInfo.status !== 'Sedang Berlangsung' && (
          <View style={styles.dinasInfoSection}>
            <Text style={styles.dinasInfoText}>
              {dinasStatusInfo.status === 'Selesai' 
                ? `Dinas telah selesai. Total ${totalPegawai} pegawai ditugaskan.`
                : `Dinas belum dimulai. ${totalPegawai} pegawai akan ditugaskan.`
              }
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent={true} backgroundColor="transparent" />
      
      {/* HEADER */}
      <AppHeader 
        title="Data Dinas"
        showBack={true}
        showStats={true}
        statsText={`${filteredData.length} Data Dinas`}
        fallbackRoute="/kelola-dinas"
      />

      <View style={styles.contentWrapper}>
        {/* Fixed Search and Date */}
        <View style={styles.fixedControls}>
          {/* Search Container */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Cari nama kegiatan atau nomor SPT..."
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

          {/* Summary dengan Filter Toggle dan Tombol Tambah */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryLeft}>
                <TouchableOpacity 
                  style={styles.filterToggle}
                  onPress={() => setIsFilterExpanded(!isFilterExpanded)}
                >
                  <Ionicons name="funnel-outline" size={16} color="#004643" />
                  <Text style={styles.filterToggleText}>Filter</Text>
                  <Ionicons 
                    name={isFilterExpanded ? "chevron-up" : "chevron-down"} 
                    size={14} 
                    color="#004643" 
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.summaryRight}>
                <TouchableOpacity 
                  style={styles.addBtn}
                  onPress={() => router.push('/kelola-dinas/tambah-dinas' as any)}
                >
                  <Ionicons name="add" size={14} color="#004643" />
                  <Text style={styles.addBtnText}>Tambah</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Filter Status Dinas - Expandable */}
          {isFilterExpanded && (
            <View style={styles.filterContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScrollContent}
              >
                {[
                  { key: 'semua', label: 'Semua' },
                  { key: 'berlangsung', label: 'Berlangsung' },
                  { key: 'selesai', label: 'Selesai' },
                  { key: 'belum_dimulai', label: 'Belum Dimulai' }
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
          )}
        </View>

        {/* Scrollable List */}
        <FlatList
          style={styles.flatList}
          data={currentData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderDinasCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchDinasAktif}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Ionicons name="briefcase-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>
                {loading ? 'Memuat data...' : 'Tidak ada data dinas'}
              </Text>
            </View>
          )}
          ListFooterComponent={() => {
            if (totalPages <= 1) return null;
            return (
              <View style={styles.paginationContainer}>
                <TouchableOpacity 
                  style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
                  onPress={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <Ionicons name="chevron-back" size={16} color={currentPage === 1 ? '#ccc' : '#004643'} />
                </TouchableOpacity>
                
                <View style={styles.pageNumbers}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <TouchableOpacity
                      key={page}
                      style={[styles.pageNumber, currentPage === page && styles.pageNumberActive]}
                      onPress={() => setCurrentPage(page)}
                    >
                      <Text style={[styles.pageNumberText, currentPage === page && styles.pageNumberTextActive]}>
                        {page}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <TouchableOpacity 
                  style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
                  onPress={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <Ionicons name="chevron-forward" size={16} color={currentPage === totalPages ? '#ccc' : '#004643'} />
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
  container: { flex: 1, backgroundColor: '#fff' },
  contentWrapper: {
    flex: 1,
    backgroundColor: "#F8FAFB",
  },
  fixedControls: {
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    backgroundColor: "#FAFBFC",
  },
  flatList: {
    flex: 1,
  },

  searchContainer: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: "#F8FAFB"
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
    shadowRadius: 2
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
  listContent: {
    paddingHorizontal: 5,
    paddingTop: 10,
    paddingBottom: 20
  },

  statusSummary: { marginBottom: 12 },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3
  },
  progressFill: {
    height: 6,
    backgroundColor: '#4CAF50',
    borderRadius: 3
  },
  pegawaiList: { marginBottom: 12 },
  pegawaiItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  pegawaiInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  pegawaiName: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500'
  },
  jamAbsen: {
    fontSize: 11,
    color: '#666',
    marginLeft: 6
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold'
  },
  noPegawaiText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingTop: 100
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 10
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 10
  },
  pageBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5'
  },
  pageBtnDisabled: {
    backgroundColor: '#F0F0F0'
  },
  pageNumbers: {
    flexDirection: 'row',
    marginHorizontal: 15
  },
  pageNumber: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 2,
    borderRadius: 8,
    backgroundColor: '#F5F5F5'
  },
  pageNumberActive: {
    backgroundColor: '#004643'
  },
  pageNumberText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  pageNumberTextActive: {
    color: '#fff',
    fontWeight: 'bold'
  },

  filterContainer: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  filterScrollContent: {
    paddingRight: 15,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipActive: {
    backgroundColor: '#004643',
    borderColor: '#004643',
  },
  filterChipText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  summaryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 8,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  summaryLeft: {
    flex: 1
  },
  summaryRight: {
    alignItems: 'flex-end'
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F0F8F7',
    borderWidth: 1,
    borderColor: '#004643',
  },
  addBtnText: {
    fontSize: 10,
    color: '#004643',
    fontWeight: '500',
    marginLeft: 3
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#F0F8F7',
    borderRadius: 8,
    alignSelf: 'flex-start'
  },
  filterToggleText: {
    fontSize: 12,
    color: '#004643',
    fontWeight: '500',
    marginHorizontal: 4
  },
  summaryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },


  dinasCard: {
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
    marginBottom: 12
  },
  cardTitle: { flex: 1, marginRight: 10 },
  dinasStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dinasStatusText: {
    fontSize: 10,
    fontWeight: 'bold'
  },
  kegiatanName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2
  },
  sptNumber: {
    fontSize: 11,
    color: '#666'
  },
  cardInfo: { marginBottom: 12 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6
  },
  dinasInfoSection: {
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 8,
    marginTop: 8
  },
  dinasInfoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic'
  }
});
