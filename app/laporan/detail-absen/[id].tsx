import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, Image, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AppHeader } from '../../../components';

interface AbsenDetail {
  tanggal: string;
  status: string;
  jam_masuk: string | null;
  jam_keluar: string | null;
  keterangan: string;
}

const statusConfig = {
  'Hadir': { color: '#4CAF50', icon: 'checkmark-circle' },
  'Tidak Hadir': { color: '#a52b06ff', icon: 'close-circle' },
  'Belum Waktunya': { color: '#9E9E9E', icon: 'time-outline' },
  'Belum Absen': { color: '#FF6F00', icon: 'alert-circle' },
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
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
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
      // Silent error handling
    }
  };

  const fetchDetailAbsen = async () => {
    setLoading(true);
    
    try {
      // Coba endpoint detail pegawai dulu untuk mendapatkan info pegawai
      const pegawaiResponse = await fetch(`${getApiUrl(API_CONFIG.ENDPOINTS.DETAIL_PEGAWAI)}/${id}`);
      const pegawaiData = await pegawaiResponse.json();
      
      console.log('Pegawai response:', pegawaiData);
      
      if (pegawaiData.success && pegawaiData.data) {
        setPegawai({ 
          nama: pegawaiData.data.nama_lengkap || 'Nama tidak ditemukan', 
          nip: pegawaiData.data.nip || '-',
          user_id: pegawaiData.data.id_user || pegawaiData.data.id_pegawai || '' 
        });
        
        // Coba ambil data absen dari endpoint presensi pegawai
        const userId = pegawaiData.data.id_user || pegawaiData.data.id_pegawai;
        if (userId) {
          await fetchAbsenData(userId);
        } else {
          setAbsenData([]);
        }
      } else {
        setPegawai({ nama: 'Data pegawai tidak ditemukan', nip: '-', user_id: '' });
        setAbsenData([]);
      }
      
    } catch (error) {
      console.error('Fetch error:', error);
      setPegawai({ nama: 'Error memuat data', nip: '-', user_id: '' });
      setAbsenData([]);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAbsenData = async (userId: string) => {
    try {
      // Coba ambil data presensi untuk bulan ini
      const startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];
      
      const response = await fetch(`${getApiUrl(API_CONFIG.ENDPOINTS.PEGAWAI_PRESENSI)}?user_id=${userId}&start_date=${startDate}&end_date=${endDate}`);
      const data = await response.json();
      
      console.log('Absen response:', data);
      
      if (data.success && data.data) {
        // Transform data presensi ke format yang dibutuhkan
        const transformedData = transformPresensiData(data.data);
        setAbsenData(transformedData);
      } else {
        console.log('No presensi data found, using empty data');
        // Jika tidak ada data, buat data kosong untuk bulan ini
        const emptyData = generateEmptyAbsenData(selectedMonth, selectedYear);
        setAbsenData(emptyData);
      }
    } catch (error) {
      console.error('Error fetching absen data:', error);
      // Fallback ke data kosong
      const emptyData = generateEmptyAbsenData(selectedMonth, selectedYear);
      setAbsenData(emptyData);
    }
  };
  
  const transformPresensiData = (presensiData: any) => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const absenData = [];
    
    // Pastikan presensiData adalah array
    const dataArray = Array.isArray(presensiData) ? presensiData : [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedYear, selectedMonth - 1, day);
      const dateString = date.toISOString().split('T')[0];
      
      // Cari data presensi untuk tanggal ini
      const presensi = dataArray.find(p => p.tanggal === dateString);
      
      if (presensi) {
        absenData.push({
          tanggal: dateString,
          status: presensi.status || 'Hadir',
          jam_masuk: presensi.jam_masuk,
          jam_keluar: presensi.jam_keluar,
          keterangan: presensi.keterangan || 'Hadir normal'
        });
      } else {
        // Tidak ada data presensi
        const dayOfWeek = date.getDay();
        const today = new Date();
        const currentTime = new Date();
        const itemDate = new Date(dateString);
        itemDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        
        let status = 'Tidak Hadir';
        let keterangan = 'Belum absen';
        
        // Weekend
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          status = 'Libur';
          keterangan = dayOfWeek === 0 ? 'Hari Minggu' : 'Hari Sabtu';
        }
        // Hari yang akan datang
        else if (itemDate > today) {
          status = 'Belum Waktunya';
          keterangan = 'Belum waktunya absen';
        }
        // Hari ini
        else if (itemDate.getTime() === today.getTime()) {
          // Cek apakah sudah lewat jam pulang (17:00)
          const jamPulang = new Date();
          jamPulang.setHours(17, 0, 0, 0);
          
          if (currentTime > jamPulang) {
            status = 'Tidak Hadir';
            keterangan = 'Tidak hadir';
          } else {
            status = 'Belum Absen';
            keterangan = 'Belum melakukan absensi';
          }
        }
        // Hari yang sudah lewat tapi belum absen
        else if (itemDate < today) {
          status = 'Tidak Hadir';
          keterangan = 'Tidak hadir';
        }
        
        absenData.push({
          tanggal: dateString,
          status,
          jam_masuk: null,
          jam_keluar: null,
          keterangan
        });
      }
    }
    
    return absenData;
  };
  
  const generateEmptyAbsenData = (month: number, year: number) => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const absenData = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateString = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      const today = new Date();
      const currentTime = new Date();
      const itemDate = new Date(dateString);
      itemDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      
      let status = 'Tidak Hadir';
      let keterangan = 'Belum absen';
      
      // Weekend
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        status = 'Libur';
        keterangan = dayOfWeek === 0 ? 'Hari Minggu' : 'Hari Sabtu';
      }
      // Hari yang akan datang
      else if (itemDate > today) {
        status = 'Belum Waktunya';
        keterangan = 'Belum waktunya absen';
      }
      // Hari ini
      else if (itemDate.getTime() === today.getTime()) {
        // Cek apakah sudah lewat jam pulang (17:00)
        const jamPulang = new Date();
        jamPulang.setHours(17, 0, 0, 0);
        
        if (currentTime > jamPulang) {
          status = 'Tidak Hadir';
          keterangan = 'Tidak hadir';
        } else {
          status = 'Belum Absen';
          keterangan = 'Belum melakukan absensi';
        }
      }
      // Hari yang sudah lewat tapi belum absen
      else if (itemDate < today) {
        status = 'Tidak Hadir';
        keterangan = 'Tidak hadir';
      }
      
      absenData.push({
        tanggal: dateString,
        status,
        jam_masuk: null,
        jam_keluar: null,
        keterangan
      });
    }
    
    return absenData;
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
      // Tentukan status berdasarkan waktu untuk yang belum absen
      const today = new Date();
      const currentTime = new Date();
      const itemDate = new Date(item.tanggal);
      itemDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      
      let detailStatus = 'Tidak Hadir';
      let detailKeterangan = 'Tidak hadir';
      
      // Hari ini - cek jam kerja
      if (itemDate.getTime() === today.getTime()) {
        const jamPulang = new Date();
        jamPulang.setHours(17, 0, 0, 0);
        
        if (currentTime > jamPulang) {
          detailStatus = 'Tidak Hadir';
          detailKeterangan = 'Tidak hadir';
        } else {
          detailStatus = 'Belum Absen';
          detailKeterangan = 'Belum melakukan absensi';
        }
      }
      // Hari yang akan datang
      else if (itemDate > today) {
        detailStatus = 'Belum Waktunya';
        detailKeterangan = 'Belum waktunya absen';
      }
      // Hari yang sudah lewat
      else {
        detailStatus = 'Tidak Hadir';
        detailKeterangan = 'Tidak hadir';
      }
      
      const mockTidakHadirData = {
        tanggal: item.tanggal,
        status: detailStatus,
        jam_masuk: '-',
        jam_pulang: '-',
        lokasi_masuk: '-',
        lokasi_pulang: '-',
        lat_masuk: '-',
        long_masuk: null,
        lat_pulang: null,
        long_pulang: null,
        alasan_pulang_cepat: null,
        foto_masuk: null,
        foto_pulang: null,
        keterangan: detailKeterangan
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
        const fallbackData = {
          tanggal: tanggal,
          status: 'Tidak Hadir',
          jam_masuk: '-',
          jam_pulang: '-',
          lokasi_masuk: '-',
          lokasi_pulang: '-',
          lat_masuk: null,
          long_masuk: null,
          lat_pulang: null,
          long_pulang: null,
          alasan_pulang_cepat: null,
          foto_masuk: null,
          foto_pulang: null,
          keterangan: 'Tidak ada data absensi'
        };
        setDetailAbsen(fallbackData);
        setShowDetailModal(true);
      }
    } catch (error) {
      // Silent error handling
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
    
    // Check if date is in the future (not clickable)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const itemDate = new Date(item.tanggal);
    itemDate.setHours(0, 0, 0, 0);
    const isFutureDate = itemDate > today;
    
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
    
    // Normalisasi status - handle case sensitivity
    if (displayStatus && typeof displayStatus === 'string') {
      const normalizedStatus = displayStatus.toLowerCase();
      if (normalizedStatus === 'tidak hadir') {
        displayStatus = 'Tidak Hadir';
      } else if (normalizedStatus === 'belum waktunya') {
        displayStatus = 'Belum Waktunya';
      } else if (normalizedStatus === 'belum absen') {
        displayStatus = 'Belum Absen';
      } else if (normalizedStatus === 'hadir') {
        displayStatus = 'Hadir';
      } else if (normalizedStatus === 'libur') {
        displayStatus = 'Libur';
      } else {
        displayStatus = displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1).toLowerCase();
      }
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
        style={[styles.absenItem, isFutureDate && styles.absenItemDisabled]} 
        onPress={() => !isFutureDate && showDetailForDate(item)}
        activeOpacity={isFutureDate ? 1 : 0.7}
        disabled={isFutureDate}
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
        animationType="none"
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

    const calculateWorkDuration = (jamMasuk: string, jamPulang: string) => {
      if (!jamMasuk || !jamPulang) return '-';
      const masuk = new Date(`2000-01-01 ${jamMasuk}`);
      const pulang = new Date(`2000-01-01 ${jamPulang}`);
      const diff = pulang.getTime() - masuk.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours} jam ${minutes} menit`;
    };
    
    return (
      <Modal
        visible={showDetailModal}
        transparent={true}
        animationType="none"
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
            
            <ScrollView style={styles.detailContent} showsVerticalScrollIndicator={false}>
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
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Jam Masuk:</Text>
                    <Text style={styles.detailValue}>{detailAbsen.jam_masuk || '-'}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Jam Pulang:</Text>
                    <Text style={styles.detailValue}>{detailAbsen.jam_pulang || '-'}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Durasi Kerja:</Text>
                    <Text style={styles.detailValue}>
                      {detailAbsen.jam_masuk && detailAbsen.jam_pulang ? calculateWorkDuration(detailAbsen.jam_masuk, detailAbsen.jam_pulang) : '-'}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Lokasi Masuk:</Text>
                    <Text style={styles.detailValue}>{detailAbsen.lokasi_masuk || '-'}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Lokasi Pulang:</Text>
                    <Text style={styles.detailValue}>{detailAbsen.lokasi_pulang || '-'}</Text>
                  </View>

                  {/* Koordinat GPS */}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Koordinat Masuk:</Text>
                    <Text style={styles.detailValue}>
                      {detailAbsen.lat_masuk && detailAbsen.long_masuk ? 
                        `${parseFloat(detailAbsen.lat_masuk).toFixed(6)}, ${parseFloat(detailAbsen.long_masuk).toFixed(6)}` : '-'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Koordinat Pulang:</Text>
                    <Text style={styles.detailValue}>
                      {detailAbsen.lat_pulang && detailAbsen.long_pulang ? 
                        `${parseFloat(detailAbsen.lat_pulang).toFixed(6)}, ${parseFloat(detailAbsen.long_pulang).toFixed(6)}` : '-'}
                    </Text>
                  </View>

                  {/* Jarak dari Kantor */}
                  {detailAbsen.jarak_masuk && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Jarak Masuk:</Text>
                      <Text style={styles.detailValue}>{Math.round(detailAbsen.jarak_masuk)} meter</Text>
                    </View>
                  )}

                  {detailAbsen.jarak_pulang && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Jarak Pulang:</Text>
                      <Text style={styles.detailValue}>{Math.round(detailAbsen.jarak_pulang)} meter</Text>
                    </View>
                  )}

                  {/* Status Keterlambatan */}
                  {detailAbsen.menit_terlambat && detailAbsen.menit_terlambat > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Keterlambatan:</Text>
                      <Text style={[styles.detailValue, { color: '#F44336' }]}>
                        {detailAbsen.menit_terlambat} menit
                      </Text>
                    </View>
                  )}
                  
                  {detailAbsen.alasan_terlambat && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Alasan Terlambat:</Text>
                      <Text style={styles.detailValue}>{detailAbsen.alasan_terlambat}</Text>
                    </View>
                  )}
                  
                  {detailAbsen.alasan_pulang_cepat && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Alasan Pulang Cepat:</Text>
                      <Text style={styles.detailValue}>{detailAbsen.alasan_pulang_cepat}</Text>
                    </View>
                  )}
                  
                  {/* Foto Presensi */}
                  {(detailAbsen.foto_masuk || detailAbsen.foto_pulang) && (
                    <View style={styles.photoRow}>
                      {detailAbsen.foto_masuk && (
                        <View style={styles.photoColumn}>
                          <View style={styles.photoHeader}>
                            <Ionicons name="camera" size={16} color="#4CAF50" />
                            <Text style={styles.photoLabel}>Foto Masuk</Text>
                          </View>
                          <View style={styles.photoContainer}>
                            <Image 
                              source={{ uri: detailAbsen.foto_masuk }} 
                              style={styles.photoPresensi}
                            />
                          </View>
                        </View>
                      )}
                      
                      {detailAbsen.foto_pulang && (
                        <View style={styles.photoColumn}>
                          <View style={styles.photoHeader}>
                            <Ionicons name="camera" size={16} color="#FF5722" />
                            <Text style={styles.photoLabel}>Foto Pulang</Text>
                          </View>
                          <View style={styles.photoContainer}>
                            <Image 
                              source={{ uri: detailAbsen.foto_pulang }} 
                              style={styles.photoPresensi}
                            />
                          </View>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Device Info */}
                  {detailAbsen.device_info && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Perangkat:</Text>
                      <Text style={styles.detailValue}>{detailAbsen.device_info}</Text>
                    </View>
                  )}

                  {/* Keterangan Tambahan */}
                  {detailAbsen.keterangan && !detailAbsen.isLibur && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Keterangan:</Text>
                      <Text style={styles.detailValue}>{detailAbsen.keterangan}</Text>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" translucent={true} backgroundColor="transparent" />
        
        <AppHeader 
          title="Detail Absensi"
          showBack={true}
          fallbackRoute="/laporan/laporan-detail-absen"
        />
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#004643" />
          <Text style={styles.loadingText}>Memuat data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent={true} backgroundColor="transparent" />
      
      <AppHeader 
        title="Detail Absensi"
        showBack={true}
        fallbackRoute="/laporan/laporan-detail-absen"
      />

      <View style={styles.pegawaiInfo}>
        <View style={styles.pegawaiHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={40} color="#004643" />
          </View>
          <View style={styles.pegawaiDetails}>
            <Text style={styles.pegawaiNama}>{pegawai.nama}</Text>
            <Text style={styles.pegawaiNip}>NIP: {pegawai.nip || 'Belum diisi'}</Text>
          </View>
        </View>
      </View>



      <View style={styles.monthNavigation}>
        <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
          <Ionicons name="chevron-back" size={20} color="#004643" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => setShowMonthPicker(true)} style={styles.monthButton}>
          <Ionicons name="calendar" size={16} color="#004643" />
          <Text style={styles.monthText}>{getMonthName(selectedMonth)} {selectedYear}</Text>
          <Ionicons name="chevron-down" size={16} color="#004643" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={20} color="#004643" />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  pegawaiInfo: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
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
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pegawaiDetails: {
    flex: 1,
  },
  pegawaiNama: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  pegawaiNip: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  navButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  monthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F0F8F7',
    borderRadius: 8,
    gap: 6,
  },
  monthText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#004643',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  absenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  absenItemDisabled: {
    opacity: 0.5,
    backgroundColor: '#F5F5F5',
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
    paddingHorizontal: 20,
  },
  monthPickerContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
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
    backgroundColor: '#004643',
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
    backgroundColor: '#004643',
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
    maxHeight: 400,
    paddingBottom: 10
  },
  detailDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#004643',
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
  photoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
    gap: 12,
  },
  photoColumn: {
    flex: 1,
  },
  photoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  photoSection: {
    marginVertical: 12,
  },
  photoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  photoContainer: {
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 8,
  },
  photoPresensi: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
  },
  debugSection: {
    backgroundColor: '#FFF3CD',
    padding: 10,
    borderRadius: 6,
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107',
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 4,
  },
  debugText: {
    fontSize: 10,
    color: '#856404',
    marginBottom: 2,
  },
});