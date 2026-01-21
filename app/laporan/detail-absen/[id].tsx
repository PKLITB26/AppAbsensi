import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

interface AbsenDetail {
  tanggal: string;
  status: string;
  jam_masuk: string | null;
  jam_keluar: string | null;
  keterangan: string;
}

const statusConfig = {
  'Hadir': { color: '#4CAF50', icon: 'checkmark-circle' },
  'Tidak Hadir': { color: '#9E9E9E', icon: 'close-circle' },
  'Terlambat': { color: '#FF9800', icon: 'time' },
  'Izin': { color: '#2196F3', icon: 'information-circle' },
  'Sakit': { color: '#E91E63', icon: 'medical' },
  'Cuti': { color: '#9C27B0', icon: 'calendar' },
  'Pulang Cepat': { color: '#795548', icon: 'exit' },
  'Libur': { color: '#F44336', icon: 'calendar' }
};

import { API_CONFIG, getApiUrl } from '../../../constants/config';

export default function DetailAbsenPegawai() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [pegawai, setPegawai] = useState({ nama: '', nip: '', user_id: '' });
  const [absenData, setAbsenData] = useState<AbsenDetail[]>([]);
  const [hariLibur, setHariLibur] = useState<{tanggal: string, nama_libur: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [detailAbsen, setDetailAbsen] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  useEffect(() => {
    fetchDetailAbsen();
    fetchHariLibur();
  }, [selectedMonth, selectedYear]);

  const fetchHariLibur = async () => {
    try {
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.HARI_LIBUR));
      const data = await response.json();
      if (data.success) {
        setHariLibur(data.data.map((item: any) => ({ tanggal: item.tanggal, nama_libur: item.nama_libur })));
      }
    } catch (error) {
      console.error('Error fetching hari libur:', error);
    }
  };

  const fetchDetailAbsen = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`${getApiUrl(API_CONFIG.ENDPOINTS.DETAIL_ABSEN_PEGAWAI)}?id=${id}&bulan=${selectedMonth}&tahun=${selectedYear}`);
      const data = await response.json();
      
      if (data.success) {
        setPegawai({ 
          nama: data.pegawai.nama_lengkap, 
          nip: data.pegawai.nip,
          user_id: data.pegawai.id_user 
        });
        setAbsenData(data.absen);
      } else {
        console.error('Error:', data.message);
      }
    } catch (error) {
      console.error('Network error:', error);
      setPegawai({ nama: 'Error', nip: '-', user_id: '' });
      setAbsenData([]);
    } finally {
      setLoading(false);
    }
  };

  const showDetailForDate = (item: AbsenDetail) => {
    const date = new Date(item.tanggal);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const liburInfo = hariLibur.find(h => h.tanggal === item.tanggal);
    
    if (liburInfo) {
      const mockLiburData = {
        tanggal: item.tanggal,
        status: 'Libur',
        keterangan: liburInfo.nama_libur,
        isLibur: true
      };
      setDetailAbsen(mockLiburData);
      setShowDetailModal(true);
    }
    else if (isWeekend && !item.jam_masuk) {
      let keteranganLibur = 'Hari Libur';
      if (dayOfWeek === 0) {
        keteranganLibur = 'Hari Minggu';
      } else if (dayOfWeek === 6) {
        keteranganLibur = 'Hari Sabtu';
      }
      
      const mockLiburData = {
        tanggal: item.tanggal,
        status: 'Libur',
        keterangan: keteranganLibur,
        isLibur: true
      };
      setDetailAbsen(mockLiburData);
      setShowDetailModal(true);
    } else if (item.jam_masuk) {
      fetchDetailAbsenHarian(item.tanggal, pegawai.user_id);
    } else {
      const mockTidakHadirData = {
        tanggal: item.tanggal,
        status: 'Tidak Hadir',
        jam_masuk: null,
        jam_pulang: null,
        lokasi_masuk: '-',
        lokasi_pulang: '-',
        lat_masuk: null,
        long_masuk: null,
        lat_pulang: null,
        long_pulang: null,
        alasan_pulang_cepat: null,
        foto_masuk: null,
        foto_pulang: null
      };
      setDetailAbsen(mockTidakHadirData);
      setShowDetailModal(true);
    }
  };

  const fetchDetailAbsenHarian = async (tanggal: string, user_id: string) => {
    try {
      const response = await fetch(`${getApiUrl(API_CONFIG.ENDPOINTS.DETAIL_ABSEN)}?date=${tanggal}&user_id=${user_id}`);
      const data = await response.json();
      
      if (data.success) {
        setDetailAbsen(data.data);
        setShowDetailModal(true);
      } else {
        console.error('Detail absen not found:', data.message);
      }
    } catch (error) {
      console.error('Error fetching detail absen:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    
    return {
      day: days[date.getDay()],
      date: date.getDate(),
      month: months[date.getMonth()]
    };
  };

  const getMonthName = (month: number) => {
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return months[month - 1];
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === 1) {
        setSelectedMonth(12);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 12) {
        setSelectedMonth(1);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  const generateMonthYearOptions = () => {
    const months = [
      { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' }, { value: 3, label: 'Maret' },
      { value: 4, label: 'April' }, { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
      { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' }, { value: 9, label: 'September' },
      { value: 10, label: 'Oktober' }, { value: 11, label: 'November' }, { value: 12, label: 'Desember' }
    ];
    
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 2020; i <= currentYear + 5; i++) {
      years.push(i);
    }
    
    return { months, years };
  };

  const renderAbsenItem = ({ item }: { item: AbsenDetail }) => {
    const dateInfo = formatDate(item.tanggal);
    const date = new Date(item.tanggal);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const liburInfo = hariLibur.find(h => h.tanggal === item.tanggal);
    
    let displayStatus = item.status;
    let displayKeterangan = item.keterangan;
    
    // Gabung Mangkir/Alpha ke Tidak Hadir
    if (displayStatus === 'Mangkir/ Alpha' || displayStatus === 'Mangkir' || displayStatus === 'Alpha') {
      displayStatus = 'Tidak Hadir';
    }
    
    // Gabung Dinas ke Hadir
    if (displayStatus === 'Dinas Luar/ Perjalanan Dinas' || displayStatus === 'Dinas Luar' || displayStatus === 'Perjalanan Dinas') {
      displayStatus = 'Hadir';
    }
    
    // Prioritas: Jika ada hari libur merah, selalu tampilkan sebagai libur
    if (liburInfo) {
      displayStatus = 'Libur';
      displayKeterangan = liburInfo.nama_libur;
    }
    // Jika weekend dan tidak ada absensi
    else if (isWeekend && (!item.status || item.status === 'Tidak Hadir') && !item.jam_masuk) {
      displayStatus = 'Libur';
      if (dayOfWeek === 0) {
        displayKeterangan = 'Hari Minggu';
      } else if (dayOfWeek === 6) {
        displayKeterangan = 'Hari Sabtu';
      }
    }
    
    // Normalisasi status - kapitalisasi huruf pertama
    if (displayStatus && typeof displayStatus === 'string') {
      displayStatus = displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1).toLowerCase();
    }
    
    const config = statusConfig[displayStatus as keyof typeof statusConfig] || statusConfig['Tidak Hadir'];
    
    // Debug: log untuk melihat status yang tidak cocok
    if (!statusConfig[displayStatus as keyof typeof statusConfig]) {
      console.log('Status tidak ditemukan:', displayStatus, 'Original:', item.status);
    }
    
    // Cek jika hadir tapi dinas untuk warna keterangan khusus
    const isDinas = displayStatus === 'Hadir' && 
      (displayKeterangan.toLowerCase().includes('dinas') || 
       item.status === 'Dinas Luar/ Perjalanan Dinas' ||
       item.status === 'Dinas Luar' ||
       item.status === 'Perjalanan Dinas');
    
    return (
      <TouchableOpacity 
        style={styles.absenItem} 
        onPress={() => showDetailForDate(item)}
        activeOpacity={0.7}
      >
        <View style={styles.dateSection}>
          <Text style={styles.dayText}>{dateInfo.day}</Text>
          <Text style={styles.dateText}>{dateInfo.date}</Text>
          <Text style={styles.monthTextSmall}>{dateInfo.month}</Text>
        </View>
        
        <View style={styles.statusSection}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusBadge, { backgroundColor: config.color }]}>
              <Ionicons name={config.icon as any} size={16} color="white" />
              <Text style={styles.statusText}>{displayStatus}</Text>
            </View>
          </View>
          
          <Text style={[
            styles.keteranganText,
            isDinas && { color: '#2196F3', fontWeight: '600' }
          ]}>
            {displayKeterangan || '-'}
          </Text>
          
          {item.jam_masuk && (
            <View style={styles.timeInfo}>
              <Text style={styles.timeText}>
                Masuk: {item.jam_masuk} | Keluar: {item.jam_keluar || 'Belum'}
              </Text>
            </View>
          )}
        </View>
        
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>
    );
  };

  const renderMonthPicker = () => {
    const { months, years } = generateMonthYearOptions();
    
    return (
      <Modal
        visible={showMonthPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.monthPickerContainer}>
            <View style={styles.monthPickerHeader}>
              <Text style={styles.monthPickerTitle}>Pilih Bulan & Tahun</Text>
              <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.pickerRow}>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Bulan</Text>
                <FlatList
                  data={months}
                  keyExtractor={(item) => item.value.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.pickerItem,
                        selectedMonth === item.value && styles.selectedPickerItem
                      ]}
                      onPress={() => setSelectedMonth(item.value)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        selectedMonth === item.value && styles.selectedPickerItemText
                      ]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  )}
                  showsVerticalScrollIndicator={false}
                  style={styles.pickerList}
                />
              </View>
              
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Tahun</Text>
                <FlatList
                  data={years}
                  keyExtractor={(item) => item.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.pickerItem,
                        selectedYear === item && styles.selectedPickerItem
                      ]}
                      onPress={() => setSelectedYear(item)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        selectedYear === item && styles.selectedPickerItemText
                      ]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                  showsVerticalScrollIndicator={false}
                  style={styles.pickerList}
                />
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => setShowMonthPicker(false)}
            >
              <Text style={styles.confirmButtonText}>Konfirmasi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderDetailModal = () => {
    if (!detailAbsen) return null;
    
    const formatDetailDate = (dateString: string) => {
      const date = new Date(dateString);
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      
      return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    };
    
    return (
      <Modal
        visible={showDetailModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContainer}>
            <View style={styles.detailModalHeader}>
              <Text style={styles.detailModalTitle}>Detail Absensi</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.detailContent}>
              <Text style={styles.detailDate}>{formatDetailDate(detailAbsen.tanggal)}</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <View style={[
                  styles.detailStatusBadge, 
                  { backgroundColor: statusConfig[detailAbsen.status as keyof typeof statusConfig]?.color || '#9E9E9E' }
                ]}>
                  <Text style={styles.detailStatusText}>{detailAbsen.status}</Text>
                </View>
              </View>
              
              {detailAbsen.isLibur ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Keterangan:</Text>
                  <Text style={styles.detailValue}>{detailAbsen.keterangan}</Text>
                </View>
              ) : (
                <>
                  {detailAbsen.jam_masuk && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Jam Masuk:</Text>
                      <Text style={styles.detailValue}>{detailAbsen.jam_masuk}</Text>
                    </View>
                  )}
                  
                  {detailAbsen.jam_pulang && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Jam Pulang:</Text>
                      <Text style={styles.detailValue}>{detailAbsen.jam_pulang}</Text>
                    </View>
                  )}
                  
                  {detailAbsen.lokasi_masuk && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Lokasi Masuk:</Text>
                      <Text style={styles.detailValue}>{detailAbsen.lokasi_masuk}</Text>
                    </View>
                  )}
                  
                  {detailAbsen.lokasi_pulang && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Lokasi Pulang:</Text>
                      <Text style={styles.detailValue}>{detailAbsen.lokasi_pulang}</Text>
                    </View>
                  )}
                  
                  {detailAbsen.alasan_pulang_cepat && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Alasan Pulang Cepat:</Text>
                      <Text style={styles.detailValue}>{detailAbsen.alasan_pulang_cepat}</Text>
                    </View>
                  )}
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detail Absensi</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Memuat data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Absensi</Text>
      </View>

      <View style={styles.pegawaiInfo}>
        <Text style={styles.pegawaiNama}>{pegawai.nama}</Text>
        <Text style={styles.pegawaiNip}>NIP: {pegawai.nip}</Text>
      </View>

      <View style={styles.monthNavigation}>
        <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
          <Ionicons name="chevron-back" size={20} color="#007AFF" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => setShowMonthPicker(true)} style={styles.monthButton}>
          <Text style={styles.monthText}>{getMonthName(selectedMonth)} {selectedYear}</Text>
          <Ionicons name="chevron-down" size={16} color="#007AFF" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={absenData}
        keyExtractor={(item, index) => `${item.tanggal}-${index}`}
        renderItem={renderAbsenItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
      
      {renderMonthPicker()}
      {renderDetailModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  pegawaiInfo: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
  },
  pegawaiNama: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  pegawaiNip: {
    fontSize: 14,
    color: '#666',
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  navButton: {
    padding: 8,
  },
  monthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 4,
  },
  listContainer: {
    padding: 16,
  },
  absenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateSection: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 60,
  },
  dayText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  monthTextSmall: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusSection: {
    flex: 1,
    marginRight: 8,
  },
  statusHeader: {
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  keteranganText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  timeInfo: {
    marginTop: 4,
  },
  timeText: {
    fontSize: 11,
    color: '#888',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthPickerContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  monthPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 20,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  pickerList: {
    maxHeight: 200,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  selectedPickerItem: {
    backgroundColor: '#007AFF',
  },
  pickerItemText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  selectedPickerItemText: {
    color: 'white',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  detailModalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  detailModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  detailModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  detailContent: {
    gap: 16,
  },
  detailDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  detailStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  detailStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});