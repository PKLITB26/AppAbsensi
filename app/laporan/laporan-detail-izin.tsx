import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, FlatList, TouchableOpacity, ActivityIndicator, TextInput, ScrollView, Modal, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { API_CONFIG, getApiUrl } from '../../constants/config';

interface IzinData {
  id: number;
  nama_lengkap: string;
  nip: string;
  jenis_pengajuan: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  alasan_text: string;
  status: string;
  jabatan: string;
  foto_profil?: string;
}

export default function LaporanDetailIzinScreen() {
  const router = useRouter();
  const [data, setData] = useState<IzinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState('semua');
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, [selectedDateFilter, searchQuery, selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = `${getApiUrl(API_CONFIG.ENDPOINTS.LAPORAN)}?type=izin`;
      
      if (selectedDateFilter === 'hari_ini') {
        const today = new Date().toISOString().split('T')[0];
        url += `&date=${today}`;
      } else if (selectedDateFilter === 'tanggal_tertentu') {
        const dateStr = selectedDate.toISOString().split('T')[0];
        url += `&date=${dateStr}`;
      }
      
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        const sortedData = result.data.sort((a: IzinData, b: IzinData) => 
          a.nama_lengkap.localeCompare(b.nama_lengkap)
        );
        setData(sortedData);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const renderCalendarModal = () => (
    <Modal visible={showCalendar} transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.calendarModal}>
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarTitle}>Pilih Tanggal</Text>
            <TouchableOpacity onPress={() => setShowCalendar(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <Calendar
            onDayPress={(day) => {
              setSelectedDate(new Date(day.dateString));
              setSelectedDateFilter('tanggal_tertentu');
              setShowCalendar(false);
            }}
            markedDates={{
              [selectedDate.toISOString().split('T')[0]]: {
                selected: true,
                selectedColor: '#004643'
              }
            }}
            maxDate={new Date().toISOString().split('T')[0]}
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#004643',
              selectedDayBackgroundColor: '#004643',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#004643',
              dayTextColor: '#2d4150',
              textDisabledColor: '#d9e1e8',
              dotColor: '#004643',
              selectedDotColor: '#ffffff',
              arrowColor: '#004643',
              disabledArrowColor: '#d9e1e8',
              monthTextColor: '#004643',
              indicatorColor: '#004643',
              textDayFontFamily: 'System',
              textMonthFontFamily: 'System',
              textDayHeaderFontFamily: 'System',
              textDayFontWeight: '400',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14
            }}
          />
        </View>
      </View>
    </Modal>
  );

  const getJenisLabel = (jenis: string) => {
    const labels: any = {
      'cuti_tahunan': 'Cuti Tahunan',
      'cuti_khusus': 'Cuti Khusus',
      'izin_pribadi': 'Izin Pribadi',
      'izin_sakit': 'Izin Sakit'
    };
    return labels[jenis] || jenis;
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

  const renderItem = ({ item }: { item: IzinData }) => (
    <TouchableOpacity 
      style={styles.dataCard}
      onPress={() => {
        router.push(`/laporan/detail-izin/${item.id}` as any);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          {item.foto_profil ? (
            <Image 
              source={{ uri: item.foto_profil }} 
              style={styles.avatarImage}
              onError={() => {}}
            />
          ) : (
            <Text style={styles.avatarText}>{item.nama_lengkap.charAt(0).toUpperCase()}</Text>
          )}
        </View>
        <View style={styles.employeeInfo}>
          <Text style={styles.employeeName}>{item.nama_lengkap}</Text>
          <Text style={styles.employeeNip}>NIP: {item.nip}</Text>
          <Text style={styles.employeeJob}>{item.jabatan}</Text>
        </View>
        <TouchableOpacity style={styles.detailBtn}>
          <Ionicons name="chevron-forward" size={16} color="#666" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Ionicons name="document-text-outline" size={16} color="#666" />
          <Text style={styles.infoText}>Jenis: {getJenisLabel(item.jenis_pengajuan)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.infoText}>Periode: {item.tanggal_mulai} - {item.tanggal_selesai}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="information-circle-outline" size={16} color="#666" />
          <Text style={styles.infoText}>Alasan: {item.alasan_text}</Text>
        </View>
        
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

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
          <View style={styles.headerTitleContainer}>
            <Ionicons name="calendar" size={20} color="#004643" style={styles.headerIcon} />
            <Text style={styles.headerTitle}>Laporan Izin/Cuti</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.exportBtn}
          onPress={() => console.log('Export semua data izin/cuti')}
        >
          <Ionicons name="download-outline" size={18} color="#004643" />
          <Text style={styles.exportText}>Export</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#004643" />
          <Text style={styles.loadingText}>Memuat data izin/cuti...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Ionicons name="search-outline" size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Cari nama pegawai atau jenis izin..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Date Filter */}
          <View style={styles.filterCard}>
            <View style={styles.filterHeader}>
              <Ionicons name="calendar-outline" size={20} color="#004643" />
              <Text style={styles.filterTitle}>Filter Periode</Text>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
              {[
                { key: 'semua', label: 'Semua' },
                { key: 'hari_ini', label: 'Hari Ini' },
                { key: 'minggu_ini', label: 'Minggu Ini' },
                { key: 'bulan_ini', label: 'Bulan Ini' },
                { key: 'tanggal_tertentu', label: 'Pilih Tanggal' }
              ].map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterChip,
                    selectedDateFilter === filter.key && styles.filterChipActive
                  ]}
                  onPress={() => {
                    if (filter.key === 'tanggal_tertentu') {
                      setShowCalendar(true);
                    } else {
                      setSelectedDateFilter(filter.key);
                    }
                  }}
                >
                  <Text style={[
                    styles.filterChipText,
                    selectedDateFilter === filter.key && styles.filterChipTextActive
                  ]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedDateFilter === 'tanggal_tertentu' && (
              <View style={styles.selectedDateInfo}>
                <Text style={styles.selectedDateText}>
                  Tanggal terpilih: {selectedDate.toLocaleDateString('id-ID')}
                </Text>
              </View>
            )}

            <View style={styles.resultSummary}>
              <Text style={styles.resultText}>
                Menampilkan {data.length} data izin/cuti
              </Text>
            </View>
          </View>
          
          <FlatList
            data={data || []}
            keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Ionicons name="document-outline" size={60} color="#ccc" />
                <Text style={styles.emptyText}>Tidak ada data izin/cuti ditemukan</Text>
              </View>
            )}
          />
        </View>
      )}
      
      {renderCalendarModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  header: { 
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 8,
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
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F0EF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  exportText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#004643',
  },
  content: { flex: 1, marginTop: 120 },
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
    gap: 10
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 12
  },
  filterCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 5,
    borderRadius: 16,
    padding: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
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
    marginBottom: 10
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  filterChipActive: {
    backgroundColor: '#004643',
    borderColor: '#004643'
  },
  filterChipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500'
  },
  filterChipTextActive: {
    color: '#fff'
  },
  selectedDateInfo: {
    backgroundColor: '#F0F8F7',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10
  },
  selectedDateText: {
    fontSize: 12,
    color: '#004643',
    fontWeight: '500'
  },
  resultSummary: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0'
  },
  resultText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  listContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  dataCard: {
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    color: '#FF9800',
    fontWeight: 'bold',
    fontSize: 16,
  },
  detailBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  employeeInfo: { flex: 1 },
  employeeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  employeeNip: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  employeeJob: {
    fontSize: 12,
    color: '#888',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusContainer: {
    marginTop: 8,
    alignItems: 'flex-start'
  },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  cardContent: { gap: 8 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    flexWrap: 'wrap',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#666' },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 10
  },
  
  // Calendar Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  calendarModal: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '90%',
    maxWidth: 400
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#004643'
  },
});
