import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TextInput, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { getApiUrl, API_CONFIG, PegawaiAkunAPI } from '../../constants/config';

interface PegawaiData {
  id_pegawai?: number;
  id_user?: number;
  nama_lengkap: string;
  email?: string;
  password?: string;
  has_password?: boolean;
  nip?: string;
  jenis_kelamin?: string;
  jabatan?: string;
  divisi?: string;
  no_telepon?: string;
  status_pegawai?: string;
  foto_profil?: string;
  role?: string;
}

export default function DataPegawaiAdminScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [pegawai, setPegawai] = useState<PegawaiData[]>([]);
  const [filteredPegawai, setFilteredPegawai] = useState<PegawaiData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortType, setSortType] = useState<'alphabetical' | 'newest' | 'oldest'>('alphabetical');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const sortData = (data: PegawaiData[], type: 'alphabetical' | 'newest' | 'oldest') => {
    const sorted = [...data];
    switch (type) {
      case 'alphabetical':
        return sorted.sort((a, b) => a.nama_lengkap.localeCompare(b.nama_lengkap));
      case 'newest':
        return sorted.sort((a, b) => (b.id_pegawai || b.id_user || 0) - (a.id_pegawai || a.id_user || 0));
      case 'oldest':
        return sorted.sort((a, b) => (a.id_pegawai || a.id_user || 0) - (b.id_pegawai || b.id_user || 0));
      default:
        return sorted;
    }
  };

  const handleSort = (type: 'alphabetical' | 'newest' | 'oldest') => {
    setSortType(type);
    const sortedData = sortData(pegawai, type);
    setFilteredPegawai(sortData(filteredPegawai, type));
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPegawai(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPegawai();
    }, [])
  );

  useEffect(() => {
    if (params.refresh) {
      fetchPegawai();
    }
  }, [params.refresh]);

  useEffect(() => {
    filterPegawai();
  }, [searchQuery, pegawai]);

  const filterPegawai = () => {
    let filtered = pegawai;
    if (searchQuery.trim() !== '') {
      filtered = pegawai.filter(p =>
        p.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.jabatan && p.jabatan.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.nip && p.nip.includes(searchQuery))
      );
    }
    setFilteredPegawai(sortData(filtered, sortType));
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredPegawai.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredPegawai.slice(startIndex, endIndex);

  const fetchPegawai = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.DATA_PEGAWAI));
      const result = await response.json();
      
      if (result.success) {
        const sortedData = sortData(result.data, sortType);
        setPegawai(sortedData);
        setFilteredPegawai(sortedData);
      } else {
        Alert.alert('Error', 'Gagal memuat data pegawai');
      }
    } catch (error) {
      Alert.alert('Koneksi Error', 'Pastikan XAMPP nyala dan HP satu Wi-Fi dengan laptop.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const deletePegawai = async (id: number, nama: string) => {
    try {
      const result = await PegawaiAkunAPI.deletePegawai(id);
      if (result.success) {
        Alert.alert('Sukses', result.message);
        fetchPegawai(); // Refresh data
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal menghapus data pegawai');
    }
  };

  const renderHeader = () => (
    <View style={styles.stickyHeader}>
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#004643" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Data Pegawai</Text>
        </View>
        <View style={styles.headerStats}>
          <Text style={styles.statsText}>{filteredPegawai.length} Pegawai</Text>
        </View>
      </View>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari nama, email, jabatan, atau NIP..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.sortContainer}>
        <TouchableOpacity 
          style={[styles.sortBtn, sortType === 'alphabetical' && styles.sortBtnActive]}
          onPress={() => handleSort('alphabetical')}
        >
          <Ionicons name="text-outline" size={16} color={sortType === 'alphabetical' ? '#fff' : '#666'} />
          <Text style={[styles.sortText, sortType === 'alphabetical' && styles.sortTextActive]}>A-Z</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.sortBtn, sortType === 'newest' && styles.sortBtnActive]}
          onPress={() => handleSort('newest')}
        >
          <Ionicons name="arrow-down-outline" size={16} color={sortType === 'newest' ? '#fff' : '#666'} />
          <Text style={[styles.sortText, sortType === 'newest' && styles.sortTextActive]}>Terbaru</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.sortBtn, sortType === 'oldest' && styles.sortBtnActive]}
          onPress={() => handleSort('oldest')}
        >
          <Ionicons name="arrow-up-outline" size={16} color={sortType === 'oldest' ? '#fff' : '#666'} />
          <Text style={[styles.sortText, sortType === 'oldest' && styles.sortTextActive]}>Terlama</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#004643" />
        </View>
      ) : (
        <FlatList
          data={currentData}
          keyExtractor={(item) => item.id_pegawai?.toString() || item.id_user?.toString() || Math.random().toString()}
          ListHeaderComponent={renderHeader}
          stickyHeaderIndices={[0]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#004643']}
              tintColor="#004643"
            />
          }
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
          renderItem={({ item }) => (
            <View style={styles.pegawaiCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.nama_lengkap?.charAt(0) || 'P'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pegawaiName}>{item.nama_lengkap}</Text>
                <Text style={styles.pegawaiEmail}>{item.email || 'Email belum diisi'}</Text>
                <Text style={styles.pegawaiNip}>NIP: {item.nip || 'Belum diisi'}</Text>
              </View>
              <View style={styles.pegawaiActions}>
                <TouchableOpacity 
                  style={[styles.statusBadge, {
                    backgroundColor: (item.email && item.email.trim() !== '' && 
                                    item.has_password === true && 
                                    item.nama_lengkap && item.nama_lengkap.trim() !== '' && 
                                    item.nip && item.nip.trim() !== '') ? '#E8F5E9' : '#FFEBEE'
                  }]}
                  onPress={() => {
                    if (!(item.email && item.email.trim() !== '' && 
                          item.has_password === true && 
                          item.nama_lengkap && item.nama_lengkap.trim() !== '' && 
                          item.nip && item.nip.trim() !== '')) {
                      const missing = [];
                      if (!item.email || item.email.trim() === '') missing.push('Email');
                      if (item.has_password !== true) missing.push('Password');
                      if (!item.nama_lengkap || item.nama_lengkap.trim() === '') missing.push('Nama Lengkap');
                      if (!item.nip || item.nip.trim() === '') missing.push('NIP');
                      Alert.alert(
                        'Informasi Belum Lengkap',
                        `Data yang kurang: ${missing.join(', ')}`,
                        [{ text: 'OK' }]
                      );
                    }
                  }}
                >
                  <Text style={[styles.statusText, {
                    color: (item.email && item.email.trim() !== '' && 
                           item.has_password === true && 
                           item.nama_lengkap && item.nama_lengkap.trim() !== '' && 
                           item.nip && item.nip.trim() !== '') ? '#2E7D32' : '#F44336'
                  }]}>
                    {(item.email && item.email.trim() !== '' && 
                      item.has_password === true && 
                      item.nama_lengkap && item.nama_lengkap.trim() !== '' && 
                      item.nip && item.nip.trim() !== '') ? 'Lengkap' : 'Belum Lengkap'}
                  </Text>
                </TouchableOpacity>
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.detailBtn}
                    onPress={() => router.push(`/pegawai-akun/detail/${item.id_pegawai || item.id_user}` as any)}
                  >
                    <Ionicons name="eye-outline" size={15} color="#2196F3" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.editBtn}
                    onPress={() => router.push(`/pegawai-akun/detail/edit/${item.id_pegawai || item.id_user}` as any)}
                  >
                    <Ionicons name="create-outline" size={15} color="#FF9800" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.deleteBtn}
                    onPress={() => {
                      Alert.alert(
                        'Konfirmasi Hapus',
                        `Apakah Anda yakin ingin menghapus data ${item.nama_lengkap}?`,
                        [
                          {
                            text: 'Batal',
                            style: 'cancel'
                          },
                          {
                            text: 'Hapus',
                            style: 'destructive',
                            onPress: () => deletePegawai(item.id_pegawai || item.id_user || 0, item.nama_lengkap)
                          }
                        ]
                      );
                    }}
                  >
                    <Ionicons name="trash-outline" size={15} color="#F44336" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={80} color="#ccc" />
              <Text style={styles.emptyText}>Belum ada data pegawai</Text>
            </View>
          }
        />
      )}
      
      <TouchableOpacity 
        style={styles.floatingAddBtn}
        onPress={() => router.push('/pegawai-akun/add-data-pegawai' as any)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  stickyHeader: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 45,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: '#333' },
  clearButton: { padding: 5 },
  sortContainer: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    gap: 4,
  },
  sortBtnActive: { backgroundColor: '#004643' },
  sortText: { fontSize: 12, color: '#666', fontWeight: '500' },
  sortTextActive: { color: '#fff' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  backBtn: { padding: 10, marginRight: 15, borderRadius: 10, backgroundColor: '#F5F5F5' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#004643', flex: 1 },
  headerStats: { backgroundColor: '#E6F0EF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statsText: { fontSize: 12, fontWeight: 'bold', color: '#004643' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingBottom: 20 },
  pegawaiCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 16, 
    marginTop: 15,
    marginHorizontal: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  avatar: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: '#E6F0EF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 16 
  },
  avatarText: { color: '#004643', fontWeight: 'bold', fontSize: 20 },
  pegawaiName: { fontWeight: 'bold', fontSize: 16, color: '#333', marginBottom: 2 },
  pegawaiEmail: { color: '#888', fontSize: 12, marginBottom: 2 },
  pegawaiNip: { color: '#666', fontSize: 12, marginBottom: 2 },
  pegawaiActions: { alignItems: 'flex-end', justifyContent: 'space-between' },
  actionButtons: { flexDirection: 'row', gap: 5 },
  detailBtn: { padding: 6, borderRadius: 6, backgroundColor: '#E3F2FD' },
  editBtn: { padding: 6, borderRadius: 6, backgroundColor: '#FFF3E0' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 16, color: '#ccc', marginTop: 16 },
  deleteBtn: { padding: 6, borderRadius: 6, backgroundColor: '#FFEBEE' },
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
