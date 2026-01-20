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
        style={[styles.absenCard, (liburInfo || (isWeekend && !item.jam_masuk)) && styles.liburCard]}
        onPress={() => showDetailForDate(item)}
      >
        <View style={styles.dateSection}>
          <Text style={styles.dayText}>{dateInfo.day}</Text>
          <Text style={styles.dateText}>{dateInfo.date}</Text>
          <Text style={styles.monthText}>{dateInfo.month}</Text>
        </View>
        
        <View style={styles.statusSection}>
          <View style={[styles.statusIndicator, { backgroundColor: config.color }]}>
            <Ionicons name={config.icon as any} size={16} color="#fff" />
          </View>
          <View style={styles.statusInfo}>
            <Text style={[styles.statusText, { color: config.color }]}>{displayStatus}</Text>
            <Text style={[styles.keteranganText, { color: isDinas ? '#607D8B' : '#666' }]}>{displayKeterangan}</Text>
          </View>
        </View>
        
        <View style={styles.timeSection}>
          {item.jam_masuk && item.jam_keluar ? (
            <>
              <Text style={styles.timeText}>{item.jam_masuk}</Text>
              <Text style={styles.timeSeparator}>-</Text>
              <Text style={styles.timeText}>{item.jam_keluar}</Text>
            </>
          ) : (
            <Text style={styles.noTimeText}>-</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const filteredData = selectedDate 
    ? absenData.filter(item => item.tanggal === selectedDate)
    : absenData;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#004643" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>{pegawai.nama}</Text>
            <Text style={styles.headerSubtitle}>NIP: {pegawai.nip}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.exportBtn}>
          <Ionicons name="download-outline" size={18} color="#004643" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#004643" />
          <Text style={styles.loadingText}>Memuat data absen...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          <TouchableOpacity 
            style={styles.monthYearBtn}
            onPress={() => setShowMonthPicker(true)}
          >
            <Ionicons name="calendar-outline" size={16} color="#004643" />
            <Text style={styles.monthYearText}>{getMonthName(selectedMonth)} {selectedYear}</Text>
            <Ionicons name="chevron-down" size={16} color="#004643" />
          </TouchableOpacity>
          
          <FlatList
            data={filteredData}
            keyExtractor={(item) => item.tanggal}
            renderItem={renderAbsenItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        </View>
      )}
      
      {/* Month/Year Picker Modal */}
      <Modal
        visible={showMonthPicker}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModal}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Pilih Bulan & Tahun</Text>
              <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.monthYearPicker}>
              <View style={styles.monthGrid}>
                {generateMonthYearOptions().months.map((month) => (
                  <TouchableOpacity
                    key={month.value}
                    style={[styles.monthItem, selectedMonth === month.value && styles.selectedMonth]}
                    onPress={() => setSelectedMonth(month.value)}
                  >
                    <Text style={[styles.monthTextPicker, selectedMonth === month.value && styles.selectedMonthText]}>
                      {month.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <View style={styles.yearPicker}>
                <Text style={styles.yearLabel}>Tahun</Text>
                <View style={styles.yearControls}>
                  <TouchableOpacity 
                    style={styles.yearBtn}
                    onPress={() => setSelectedYear(selectedYear - 1)}
                  >
                    <Ionicons name="chevron-back" size={20} color="#004643" />
                  </TouchableOpacity>
                  <Text style={styles.yearText}>{selectedYear}</Text>
                  <TouchableOpacity 
                    style={styles.yearBtn}
                    onPress={() => setSelectedYear(selectedYear + 1)}
                  >
                    <Ionicons name="chevron-forward" size={20} color="#004643" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.confirmBtn}
              onPress={() => setShowMonthPicker(false)}
            >
              <Text style={styles.confirmText}>Pilih</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Detail Absen Modal */}
      <Modal
        visible={showDetailModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModal}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>Detail Absensi</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            {detailAbsen && (
              <View style={styles.detailContent}>
                <Text style={styles.detailDate}>{detailAbsen.tanggal}</Text>
                
                {detailAbsen.isLibur ? (
                  <View style={styles.liburContent}>
                    <View style={styles.liburIcon}>
                      <Ionicons name="calendar" size={48} color="#F44336" />
                    </View>
                    <Text style={styles.liburStatus}>Hari Libur</Text>
                    <Text style={styles.liburKeterangan}>{detailAbsen.keterangan}</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionTitle}>Waktu Kehadiran</Text>
                      <View style={styles.timeRow}>
                        <View style={styles.timeItem}>
                          <Ionicons name="log-in" size={16} color="#4CAF50" />
                          <Text style={styles.timeLabel}>Masuk</Text>
                          <Text style={styles.timeValue}>{detailAbsen.jam_masuk || '-'}</Text>
                        </View>
                        <View style={styles.timeItem}>
                          <Ionicons name="log-out" size={16} color="#FF5722" />
                          <Text style={styles.timeLabel}>Pulang</Text>
                          <Text style={styles.timeValue}>{detailAbsen.jam_pulang || '-'}</Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionTitle}>Lokasi</Text>
                      <View style={styles.locationRow}>
                        <Ionicons name="location" size={16} color="#2196F3" />
                        <View style={styles.locationInfo}>
                          <Text style={styles.locationText}>Masuk: {detailAbsen.lokasi_masuk || '-'}</Text>
                          <Text style={styles.locationText}>Pulang: {detailAbsen.lokasi_pulang || '-'}</Text>
                          <Text style={styles.coordText}>
                            {detailAbsen.lat_masuk && detailAbsen.long_masuk 
                              ? `${detailAbsen.lat_masuk}, ${detailAbsen.long_masuk}` 
                              : '-'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    {detailAbsen.jam_pulang && (
                      <View style={styles.detailSection}>
                        <Text style={styles.sectionTitle}>Alasan Pulang Cepat</Text>
                        <Text style={styles.reasonText}>
                          {detailAbsen.alasan_pulang_cepat && detailAbsen.alasan_pulang_cepat.trim() !== '' 
                            ? detailAbsen.alasan_pulang_cepat 
                            : '-'
                          }
                        </Text>
                      </View>
                    )}
                    
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionTitle}>Foto Absensi</Text>
                      <View style={styles.photoRow}>
                        <View style={styles.photoItem}>
                          <Text style={styles.photoLabel}>Foto Masuk</Text>
                          {detailAbsen.foto_masuk ? (
                            <View style={styles.photoPlaceholder}>
                              <Ionicons name="image" size={24} color="#666" />
                              <Text style={styles.photoText}>Ada foto</Text>
                            </View>
                          ) : (
                            <View style={styles.photoPlaceholder}>
                              <Ionicons name="image-outline" size={24} color="#ccc" />
                              <Text style={styles.noPhotoText}>Tidak ada foto</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.photoItem}>
                          <Text style={styles.photoLabel}>Foto Pulang</Text>
                          {detailAbsen.foto_pulang ? (
                            <View style={styles.photoPlaceholder}>
                              <Ionicons name="image" size={24} color="#666" />
                              <Text style={styles.photoText}>Ada foto</Text>
                            </View>
                          ) : (
                            <View style={styles.photoPlaceholder}>
                              <Ionicons name="image-outline" size={24} color="#ccc" />
                              <Text style={styles.noPhotoText}>Tidak ada foto</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
    elevation: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    padding: 10,
    marginRight: 15,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#004643',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  exportBtn: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#E6F0EF',
  },
  content: { flex: 1, padding: 20 },
  monthYearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
    gap: 8,
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#004643',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
  },
  monthYearPicker: {
    gap: 20,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  monthItem: {
    width: '30%',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  selectedMonth: {
    backgroundColor: '#004643',
  },
  monthTextPicker: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  selectedMonthText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  yearPicker: {
    alignItems: 'center',
    gap: 10,
  },
  yearLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#004643',
  },
  yearControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  yearBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  yearText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#004643',
    minWidth: 60,
    textAlign: 'center',
  },
  confirmBtn: {
    backgroundColor: '#004643',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#004643',
  },
  listContent: { paddingBottom: 20 },
  absenCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 1,
  },
  dateSection: {
    alignItems: 'center',
    width: 50,
    marginRight: 16,
  },
  dayText: {
    fontSize: 10,
    color: '#666',
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  monthText: {
    fontSize: 10,
    color: '#666',
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusInfo: { flex: 1 },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  keteranganText: {
    fontSize: 11,
    color: '#666',
  },
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
  },
  timeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  timeSeparator: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 4,
  },
  noTimeText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#666' },
  liburCard: {
    backgroundColor: '#FFEBEE',
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  detailModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 0,
    width: '90%',
    maxHeight: '85%',
    overflow: 'hidden',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#004643',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  detailContent: {
    padding: 20,
  },
  detailDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#004643',
    textAlign: 'center',
    marginBottom: 20,
    paddingVertical: 12,
    backgroundColor: '#E6F0EF',
    borderRadius: 8,
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#004643',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeItem: {
    flex: 1,
    backgroundColor: '#F8FAFB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  timeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 2,
  },
  locationRow: {
    backgroundColor: '#F8FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationInfo: {
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  coordText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  reasonText: {
    fontSize: 14,
    color: '#92400E',
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    lineHeight: 20,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  photoItem: {
    flex: 1,
    alignItems: 'center',
  },
  photoLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  photoPlaceholder: {
    width: '100%',
    height: 80,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  photoText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  noPhotoText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  liburContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  liburIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  liburStatus: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 8,
  },
  liburKeterangan: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});