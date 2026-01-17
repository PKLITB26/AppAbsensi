import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, FlatList, TouchableOpacity, ActivityIndicator, TextInput, ScrollView, Modal, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { API_CONFIG, getApiUrl } from '../../constants/config';

interface LemburData {
  id: number;
  nama_lengkap: string;
  nip: string;
  jenis_pengajuan: string;
  tanggal_mulai: string;
  jam_mulai: string;
  jam_selesai: string;
  status: string;
  jabatan: string;
  foto_profil?: string;
}

export default function LaporanDetailLemburScreen() {
  const router = useRouter();
  const [data, setData] = useState<LemburData[]>([]);
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
      let url = `${getApiUrl(API_CONFIG.ENDPOINTS.LAPORAN)}?type=lembur`;
      
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
        const sortedData = result.data.sort((a: LemburData, b: LemburData) => 
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

  const renderCalendarModal = () => {
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isSelected = selectedDate.toDateString() === date.toDateString();
      const isToday = new Date().toDateString() === date.toDateString();
      
      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isSelected && styles.selectedDay,
            isToday && styles.todayDay
          ]}
          onPress={() => {
            setSelectedDate(date);
            setSelectedDateFilter('tanggal_tertentu');
            setShowCalendar(false);
          }}
        >
          <Text style={[
            styles.calendarDayText,
            isSelected && styles.selectedDayText,
            isToday && styles.todayDayText
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <Modal visible={showCalendar} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModal}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                onPress={() => setSelectedDate(new Date(currentYear, currentMonth - 1, 1))}
              >
                <Ionicons name="chevron-back" size={24} color="#004643" />
              </TouchableOpacity>
              <Text style={styles.calendarTitle}>
                {selectedDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedDate(new Date(currentYear, currentMonth + 1, 1))}
              >
                <Ionicons name="chevron-forward" size={24} color="#004643" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.weekDays}>
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                <Text key={day} style={styles.weekDayText}>{day}</Text>
              ))}
            </View>
            
            <View style={styles.calendarGrid}>
              {days}
            </View>
            
            <TouchableOpacity
              style={styles.closeCalendarBtn}
              onPress={() => setShowCalendar(false)}
            >
              <Text style={styles.closeCalendarText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const getJenisLabel = (jenis: string) => {
    const labels: any = {
      'lembur_weekday': 'Lembur Hari Kerja',
      'lembur_weekend': 'Lembur Weekend',
      'lembur_libur': 'Lembur Hari Libur'
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

  const renderItem = ({ item }: { item: LemburData }) => (
    <TouchableOpacity 
      style={styles.dataCard}
      onPress={() => {
        router.push(`/laporan/detail-lembur/${item.id}` as any);
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
          <Ionicons name="moon-outline" size={16} color="#666" />
          <Text style={styles.infoText}>Jenis: {getJenisLabel(item.jenis_pengajuan)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.infoText}>Tanggal: {item.tanggal_mulai}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.infoText}>Waktu: {item.jam_mulai} - {item.jam_selesai}</Text>
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
      
      <View style={styles.stickyHeader}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backBtn}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#004643" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Ionicons name="moon" size={20} color="#004643" style={styles.headerIcon} />
              <Text style={styles.headerTitle}>Laporan Lembur</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.exportBtn}
            onPress={() => console.log('Export semua data lembur')}
          >
            <Ionicons name="download-outline" size={18} color="#004643" />
            <Text style={styles.exportText}>Export</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#004643" />
          <Text style={styles.loadingText}>Memuat data lembur...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Ionicons name="search-outline" size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Cari nama pegawai atau jenis lembur..."
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
                Menampilkan {data.length} data lembur
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
                <Ionicons name="moon-outline" size={60} color="#ccc" />
                <Text style={styles.emptyText}>Tidak ada data lembur ditemukan</Text>
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
  stickyHeader: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    color: '#004643',
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
  content: { flex: 1 },
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
    backgroundColor: '#E1BEE7',
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
    color: '#9C27B0',
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
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
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
    borderRadius: 16,
    padding: 20,
    margin: 20,
    width: '90%',
    maxWidth: 350
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
    width: 40
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around'
  },
  calendarDay: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5
  },
  selectedDay: {
    backgroundColor: '#004643',
    borderRadius: 20
  },
  todayDay: {
    borderWidth: 2,
    borderColor: '#004643',
    borderRadius: 20
  },
  calendarDayText: {
    fontSize: 14,
    color: '#333'
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  todayDayText: {
    color: '#004643',
    fontWeight: 'bold'
  },
  closeCalendarBtn: {
    backgroundColor: '#004643',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20
  },
  closeCalendarText: {
    color: '#fff',
    fontWeight: 'bold'
  },
});
