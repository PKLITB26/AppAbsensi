import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { KelolaDinasAPI } from '../../constants/config';

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
  const [selectedFilter, setSelectedFilter] = useState('semua');
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [dinasAktif, setDinasAktif] = useState<DinasAktif[]>([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;
  
  useEffect(() => {
    fetchDinasAktif();
  }, []);

  const fetchDinasAktif = async () => {
    try {
      setLoading(true);
      const data = await KelolaDinasAPI.getDinasAktif();
      if (data && Array.isArray(data)) {
        setDinasAktif(data);
      } else {
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
    
    filtered = filtered.filter(item => {
      const today = new Date();
      const selesai = new Date(item.tanggal_selesai);
      today.setHours(0, 0, 0, 0);
      selesai.setHours(23, 59, 59, 999);
      return today <= selesai;
    });
    
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
          <View style={styles.headerRight}>
            <View style={[styles.dinasStatusBadge, { backgroundColor: dinasStatusInfo.color + '20' }]}>
              <Text style={[styles.dinasStatusText, { color: dinasStatusInfo.color }]}>
                {dinasStatusInfo.status}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.infoText}>{item.lokasi}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.infoText}>{item.jamKerja}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="radio-outline" size={16} color="#666" />
            <Text style={styles.infoText}>{item.radius}m radius</Text>
          </View>
        </View>

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
          <Text style={styles.headerTitle}>Data Dinas Aktif</Text>
        </View>
      </View>

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

      <View style={styles.filterSummaryCard}>
        <View style={styles.summarySection}>
          <View style={styles.summaryLeft}>
            <View style={styles.dateContainer}>
              <Ionicons name="calendar-outline" size={16} color="#004643" />
              <Text style={styles.summaryDate}>
                {new Date().toLocaleDateString('id-ID', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </Text>
            </View>
          </View>
          <View style={styles.summaryRight}>
            <View style={styles.countBadge}>
              <Text style={styles.countNumber}>{filteredData.length}</Text>
              <Text style={styles.countLabel}>Dinas Aktif</Text>
            </View>
          </View>
        </View>
      </View>

      <FlatList
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
              {loading ? 'Memuat data...' : 'Tidak ada dinas aktif'}
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
      
      <TouchableOpacity 
        style={styles.floatingAddBtn}
        onPress={() => router.push('/kelola-dinas/tambah-dinas' as any)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
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
    color: '#004643' 
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#004643',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  floatingAddBtn: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#004643',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
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
  filterSummaryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 5,
    marginBottom: 10,
    borderRadius: 16,
    padding: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  summaryLeft: {
    flex: 1
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  summaryDate: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500'
  },
  summaryRight: {
    alignItems: 'flex-end'
  },
  countBadge: {
    backgroundColor: '#F0F8F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80
  },
  countNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#004643'
  },
  countLabel: {
    fontSize: 10,
    color: '#004643',
    fontWeight: '500',
    marginTop: 2
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20
  },
  dinasCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15
  },
  cardTitle: { flex: 1 },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8
  },
  dinasStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center'
  },
  dinasStatusText: {
    fontSize: 10,
    fontWeight: 'bold'
  },
  kegiatanName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  sptNumber: {
    fontSize: 12,
    color: '#666'
  },
  cardInfo: { marginBottom: 15 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8
  },
  statusSummary: { marginBottom: 15 },
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
  pegawaiList: { marginBottom: 15 },
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
    fontSize: 14,
    color: '#333',
    fontWeight: '500'
  },
  jamAbsen: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8
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
    paddingVertical: 40
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
  }
});
