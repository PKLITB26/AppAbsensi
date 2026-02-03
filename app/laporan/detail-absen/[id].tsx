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
  const { id, filter, start_date, end_date } = useLocalSearchParams();
  const [pegawai, setPegawai] = useState({ nama: '', nip: '', user_id: '' });
  const [absenData, setAbsenData] = useState<AbsenDetail[]>([]);
  const [hariLibur, setHariLibur] = useState<{tanggal: string, nama_libur: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [detailAbsen, setDetailAbsen] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [periodInfo, setPeriodInfo] = useState('');

  useEffect(() => {
    fetchDetailAbsen();
    fetchHariLibur();
    generatePeriodInfo();
  }, []);

  const generatePeriodInfo = () => {
    const today = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    switch(filter) {
      case 'hari_ini':
        setPeriodInfo(`${days[today.getDay()]}, ${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`);
        break;
      case 'minggu_ini':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        setPeriodInfo(`Minggu, ${startOfWeek.getDate()}-${endOfWeek.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`);
        break;
      case 'bulan_ini':
        setPeriodInfo(`${months[today.getMonth()]} ${today.getFullYear()}`);
        break;
      case 'pilih_tanggal':
        if (start_date && end_date) {
          const startDate = new Date(start_date as string);
          const endDate = new Date(end_date as string);
          setPeriodInfo(`${startDate.getDate()} ${months[startDate.getMonth()].slice(0,3)} - ${endDate.getDate()} ${months[endDate.getMonth()].slice(0,3)} ${endDate.getFullYear()}`);
        }
        break;
      default:
        setPeriodInfo('Periode tidak diketahui');
    }
  };

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
      // Determine date range based on filter
      let startDate, endDate;
      const today = new Date();
      
      switch(filter) {
        case 'hari_ini':
          startDate = endDate = today.toISOString().split('T')[0];
          break;
        case 'minggu_ini':
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          startDate = startOfWeek.toISOString().split('T')[0];
          endDate = endOfWeek.toISOString().split('T')[0];
          break;
        case 'bulan_ini':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
          endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
          break;
        case 'pilih_tanggal':
          startDate = start_date as string;
          endDate = end_date as string;
          break;
        default:
          startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
          endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
      }
      
      const response = await fetch(`${getApiUrl(API_CONFIG.ENDPOINTS.PEGAWAI_PRESENSI)}?user_id=${userId}&start_date=${startDate}&end_date=${endDate}`);
      const data = await response.json();
      
      console.log('Absen response:', data);
      
      if (data.success && data.data) {
        // Transform data presensi ke format yang dibutuhkan
        const transformedData = transformPresensiData(data.data, startDate, endDate);
        setAbsenData(transformedData);
      } else {
        console.log('No presensi data found, using empty data');
        // Jika tidak ada data, buat data kosong untuk periode yang dipilih
        const emptyData = generateEmptyAbsenData(startDate, endDate);
        setAbsenData(emptyData);
      }
    } catch (error) {
      console.error('Error fetching absen data:', error);
      // Fallback ke data kosong
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
      const emptyData = generateEmptyAbsenData(startDate, endDate);
      setAbsenData(emptyData);
    }
  };
  
  const transformPresensiData = (presensiData: any, startDateStr: string, endDateStr: string) => {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    const absenData = [];
    
    // Pastikan presensiData adalah array
    const dataArray = Array.isArray(presensiData) ? presensiData : [];
    
    // Loop through each day in the date range
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateString = d.toISOString().split('T')[0];
      
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
        const dayOfWeek = d.getDay();
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
  
  const generateEmptyAbsenData = (startDateStr: string, endDateStr: string) => {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    const absenData = [];
    
    // Loop through each day in the date range
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateString = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();
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



      <View style={styles.periodInfo}>
        <View style={styles.periodHeader}>
          <Ionicons name="calendar-outline" size={20} color="#004643" />
          <Text style={styles.periodTitle}>Periode Laporan</Text>
        </View>
        <Text style={styles.periodText}>
          {periodInfo}
        </Text>
      </View>

      <FlatList
        data={absenData}
        keyExtractor={(item, index) => `${item.tanggal}-${index}`}
        renderItem={renderAbsenItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
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
  periodInfo: {
    backgroundColor: '#F0F8F7',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0F2F1',
  },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  periodTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#004643',
    marginLeft: 8,
  },
  periodText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#004643',
    textAlign: 'center',
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
});