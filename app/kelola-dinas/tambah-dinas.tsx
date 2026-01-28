import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Picker } from '@react-native-picker/picker';
import { Calendar } from 'react-native-calendars';
import { KelolaDinasAPI as DinasAPI, PegawaiAkunAPI, PengaturanAPI } from '../../constants/config';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppHeader } from '../../components';

export default function TambahDinasScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPegawaiModal, setShowPegawaiModal] = useState(false);
  const [pegawaiList, setPegawaiList] = useState<any[]>([]);
  const [selectedPegawai, setSelectedPegawai] = useState<any[]>([]);
  const [mapRegion, setMapRegion] = useState({
    latitude: -6.2088,
    longitude: 106.8456,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01
  });
  const [markerPosition, setMarkerPosition] = useState<{latitude: number, longitude: number} | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showPegawaiDropdown, setShowPegawaiDropdown] = useState(false);
  const [pegawaiSearchQuery, setPegawaiSearchQuery] = useState('');
  const [filteredPegawai, setFilteredPegawai] = useState<any[]>([]);
  const [lokasiSearchQuery, setLokasiSearchQuery] = useState('');
  const [filteredLokasi, setFilteredLokasi] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [showInputModal, setShowInputModal] = useState(false);
  const [coordinateInput, setCoordinateInput] = useState('');
  const [isUpdatingFromInput, setIsUpdatingFromInput] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [showJamMulaiPicker, setShowJamMulaiPicker] = useState(false);
  const [showJamSelesaiPicker, setShowJamSelesaiPicker] = useState(false);

  const handleJamMulaiConfirm = (time: Date) => {
    const formattedTime = formatTime(time);
    setFormData({...formData, jamMulai: formattedTime});
    validateField('jamMulai', formattedTime);
    setShowJamMulaiPicker(false);
  };

  const handleJamSelesaiConfirm = (time: Date) => {
    const formattedTime = formatTime(time);
    setFormData({...formData, jamSelesai: formattedTime});
    validateField('jamSelesai', formattedTime);
    setShowJamSelesaiPicker(false);
  };

  const [showJenisDinasDropdown, setShowJenisDinasDropdown] = useState(false);
  const [showDateMulaiPicker, setShowDateMulaiPicker] = useState(false);
  const [showDateSelesaiPicker, setShowDateSelesaiPicker] = useState(false);
  const [selectedDateMulai, setSelectedDateMulai] = useState('');
  const [selectedDateSelesai, setSelectedDateSelesai] = useState('');
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const totalSteps = 5;

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
        multiple: false
      });
      
      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        if (file.size && file.size > 5 * 1024 * 1024) {
          Alert.alert('Error', 'Ukuran file maksimal 5MB');
          return;
        }
        setSelectedFile(file);
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal memilih file');
    }
  };

  const [formData, setFormData] = useState({
    namaKegiatan: '',
    nomorSpt: '',
    jenisDinas: 'lokal',
    tanggalMulai: '',
    tanggalSelesai: '',
    jamMulai: '',
    jamSelesai: '',
    deskripsi: '',
    pegawaiIds: [] as number[]
  });
  const [selectedLokasi, setSelectedLokasi] = useState<any[]>([]);
  const [availableLokasi, setAvailableLokasi] = useState<any[]>([]);
  const [showLokasiModal, setShowLokasiModal] = useState(false);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setCurrentLocation({ latitude, longitude });
      setMapRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      });
    } catch (error) {
      Alert.alert('Error', 'Could not fetch location');
    }
  };

  const searchLocation = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    // Cek apakah input adalah koordinat
    const coordPattern = /^-?\d+\.?\d*[,\s]+-?\d+\.?\d*$/;
    if (coordPattern.test(query.trim())) {
      const coords = query.trim().split(/[,\s]+/);
      if (coords.length === 2) {
        const latitude = parseFloat(coords[0]);
        const longitude = parseFloat(coords[1]);
        
        if (!isNaN(latitude) && !isNaN(longitude) && 
            latitude >= -90 && latitude <= 90 && 
            longitude >= -180 && longitude <= 180) {
          try {
            const address = await reverseGeocode(latitude, longitude);
            setSearchResults([{
              latitude,
              longitude,
              address: `📍 ${address}`,
              id: `coord-${latitude}-${longitude}`
            }]);
            return;
          } catch (error) {
            console.error('Coordinate error:', error);
          }
        }
      }
    }

    // Gunakan Nominatim OpenStreetMap (GRATIS, tidak perlu API key)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&countrycodes=id`,
        {
          headers: {
            'User-Agent': 'HadirinApp/1.0'
          }
        }
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const formattedResults = data.map((item: any) => ({
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          address: `📍 ${item.display_name}`,
          id: item.place_id
        }));
        setSearchResults(formattedResults);
        return;
      }
    } catch (error) {
      console.error('Nominatim error:', error);
    }

    // Fallback ke Location.geocodeAsync
    try {
      const results = await Location.geocodeAsync(query);
      const formattedResults = await Promise.all(
        results.map(async (result) => {
          const address = await reverseGeocode(result.latitude, result.longitude);
          return {
            ...result,
            address: `📍 ${address}`,
            id: `${result.latitude}-${result.longitude}`
          };
        })
      );
      setSearchResults(formattedResults);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  };

  const selectSearchResult = (result: any) => {
    setMarkerPosition({ latitude: result.latitude, longitude: result.longitude });
    setMapRegion({
      latitude: result.latitude,
      longitude: result.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const result = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (result.length > 0) {
        const address = result[0];
        const fullAddress = `${address.street || ''} ${address.name || ''}, ${address.district || ''}, ${address.city || ''}, ${address.region || ''} ${address.postalCode || ''}`.trim();
        return fullAddress;
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
    return 'Alamat tidak ditemukan';
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setMarkerPosition({ latitude, longitude });
  };

  const confirmLocation = async () => {
    if (!markerPosition) {
      Alert.alert('Error', 'Pilih lokasi terlebih dahulu');
      return;
    }

    try {
      const address = await reverseGeocode(markerPosition.latitude, markerPosition.longitude);
      setShowMapModal(false);
      setMarkerPosition(null);
    } catch (error) {
      Alert.alert('Error', 'Gagal mendapatkan alamat');
    }
  };

  const openMapPicker = () => {
    setShowMapModal(true);
  };

  useEffect(() => {
    fetchPegawai();
    fetchAvailableLokasi();
    loadDraftData();
  }, []);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveDraftData();
    }, 30000);
    return () => clearInterval(interval);
  }, [formData, selectedPegawai, selectedLokasi]);

  // Real-time validation
  const validateField = (field: string, value: any) => {
    const errors = { ...validationErrors };
    
    switch (field) {
      case 'namaKegiatan':
        if (!value?.trim()) {
          errors.namaKegiatan = 'Nama kegiatan wajib diisi';
        } else {
          delete errors.namaKegiatan;
        }
        break;
      case 'nomorSpt':
        if (!value?.trim()) {
          errors.nomorSpt = 'Nomor SPT wajib diisi';
        } else {
          delete errors.nomorSpt;
        }
        break;
      case 'tanggalMulai':
        if (!value) {
          errors.tanggalMulai = 'Tanggal mulai wajib diisi';
        } else if (!isValidDate(value)) {
          errors.tanggalMulai = 'Format tanggal tidak valid';
        } else {
          delete errors.tanggalMulai;
        }
        break;
      case 'tanggalSelesai':
        if (!value) {
          errors.tanggalSelesai = 'Tanggal selesai wajib diisi';
        } else if (!isValidDate(value)) {
          errors.tanggalSelesai = 'Format tanggal tidak valid';
        } else if (formData.tanggalMulai && new Date(convertDateFormat(value)) < new Date(convertDateFormat(formData.tanggalMulai))) {
          errors.tanggalSelesai = 'Tanggal selesai harus setelah tanggal mulai';
        } else {
          delete errors.tanggalSelesai;
        }
        break;
      case 'jamMulai':
        if (!value) {
          errors.jamMulai = 'Jam mulai wajib diisi';
        } else if (!isValidTime(value)) {
          errors.jamMulai = 'Format jam tidak valid (HH:MM)';
        } else {
          delete errors.jamMulai;
        }
        break;
      case 'jamSelesai':
        if (!value) {
          errors.jamSelesai = 'Jam selesai wajib diisi';
        } else if (!isValidTime(value)) {
          errors.jamSelesai = 'Format jam tidak valid (HH:MM)';
        } else if (formData.jamMulai && value <= formData.jamMulai) {
          errors.jamSelesai = 'Jam selesai harus setelah jam mulai';
        } else {
          delete errors.jamSelesai;
        }
        break;
    }
    
    setValidationErrors(errors);
  };

  const isValidDate = (dateStr: string) => {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!regex.test(dateStr)) return false;
    const [day, month, year] = dateStr.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year;
  };

  const isValidTime = (timeStr: string) => {
    const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(timeStr);
  };

  // Auto-save functions
  const saveDraftData = async () => {
    try {
      const draftData = {
        formData,
        selectedPegawai,
        selectedLokasi,
        selectedFile,
        timestamp: new Date().toISOString()
      };
      await AsyncStorage.setItem('dinas_draft', JSON.stringify(draftData));
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const loadDraftData = async () => {
    try {
      const draftStr = await AsyncStorage.getItem('dinas_draft');
      if (draftStr) {
        const draft = JSON.parse(draftStr);
        const draftAge = new Date().getTime() - new Date(draft.timestamp).getTime();
        
        // Only load draft if it's less than 24 hours old
        if (draftAge < 24 * 60 * 60 * 1000) {
          Alert.alert(
            'Draft Ditemukan',
            'Ditemukan data draft yang belum disimpan. Muat data draft?',
            [
              { text: 'Tidak', onPress: () => clearDraftData() },
              { 
                text: 'Ya', 
                onPress: () => {
                  setFormData(draft.formData || formData);
                  setSelectedPegawai(draft.selectedPegawai || []);
                  setSelectedLokasi(draft.selectedLokasi || []);
                  setSelectedFile(draft.selectedFile || null);
                }
              }
            ]
          );
        } else {
          clearDraftData();
        }
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  };

  const clearDraftData = async () => {
    try {
      await AsyncStorage.removeItem('dinas_draft');
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  };

  const fetchAvailableLokasi = async () => {
    try {
      const response = await PengaturanAPI.getLokasiKantor();
      if (response.success && response.data) {
        setAvailableLokasi(response.data);
        setFilteredLokasi(response.data);
      }
    } catch (error) {
      console.error('Error fetching lokasi:', error);
      // Fallback data
      const fallbackData = [
        { id: 1, nama_lokasi: 'Kantor Pusat', jenis_lokasi: 'tetap' },
        { id: 2, nama_lokasi: 'Kantor Cabang Bandung', jenis_lokasi: 'dinas' },
        { id: 3, nama_lokasi: 'Hotel Santika Jakarta', jenis_lokasi: 'dinas' }
      ];
      setAvailableLokasi(fallbackData);
      setFilteredLokasi(fallbackData);
    }
  };

  const fetchPegawai = async () => {
    try {
      const response = await PegawaiAkunAPI.getDataPegawai();
      console.log('Pegawai API Response:', response); // Debug log
      if (response && response.data) {
        console.log('Pegawai data:', response.data); // Debug log
        setPegawaiList(response.data);
        setFilteredPegawai(response.data);
      }
    } catch (error) {
      console.error('Error fetching pegawai:', error);
      setPegawaiList([]);
      setFilteredPegawai([]);
    }
  };

  const filterPegawai = (query: string) => {
    setPegawaiSearchQuery(query);
    if (!query.trim()) {
      setFilteredPegawai(pegawaiList);
      return;
    }
    
    const filtered = pegawaiList.filter((pegawai: any) => 
      pegawai.nama_lengkap?.toLowerCase().includes(query.toLowerCase()) ||
      pegawai.nip?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredPegawai(filtered);
  };

  const filterLokasi = (query: string) => {
    setLokasiSearchQuery(query);
    if (!query.trim()) {
      setFilteredLokasi(availableLokasi);
      return;
    }
    
    const filtered = availableLokasi.filter((lokasi: any) => 
      lokasi.nama_lokasi?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredLokasi(filtered);
  };

  const togglePegawai = (pegawai: any) => {
    console.log('Toggling pegawai:', pegawai); // Debug log
    
    // Gunakan id yang paling reliable
    const pegawaiId = pegawai.id_user || pegawai.id_pegawai || pegawai.id;
    const isSelected = selectedPegawai.find((p: any) => {
      const selectedId = p.id_user || p.id_pegawai || p.id;
      return selectedId === pegawaiId;
    });
    
    let updatedPegawai;
    if (isSelected) {
      // Remove pegawai
      updatedPegawai = selectedPegawai.filter((p: any) => {
        const selectedId = p.id_user || p.id_pegawai || p.id;
        return selectedId !== pegawaiId;
      });
    } else {
      // Add pegawai
      updatedPegawai = [...selectedPegawai, pegawai];
    }
    
    setSelectedPegawai(updatedPegawai);
    
    // Update pegawaiIds di formData
    const validIds = updatedPegawai
      .map((p: any) => p.id_user || p.id_pegawai || p.id)
      .filter(id => id != null && !isNaN(parseInt(id)))
      .map(id => parseInt(id));
    
    console.log('Valid pegawai IDs:', validIds); // Debug log
    
    setFormData({
      ...formData,
      pegawaiIds: validIds
    });
  };

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleDateMulaiSelect = (day: any) => {
    const date = new Date(day.dateString);
    const formattedDate = formatDate(date);
    setSelectedDateMulai(day.dateString);
    setFormData({...formData, tanggalMulai: formattedDate});
    validateField('tanggalMulai', formattedDate);
    setShowDateMulaiPicker(false);
  };

  const handleDateSelesaiSelect = (day: any) => {
    const date = new Date(day.dateString);
    const formattedDate = formatDate(date);
    setSelectedDateSelesai(day.dateString);
    setFormData({...formData, tanggalSelesai: formattedDate});
    validateField('tanggalSelesai', formattedDate);
    setShowDateSelesaiPicker(false);
  };



  const formatTime = (time: Date) => {
    const hours = String(time.getHours()).padStart(2, '0');
    const minutes = String(time.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatTanggal = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 5) {
      return `${cleaned.slice(0,2)}/${cleaned.slice(2,4)}/${cleaned.slice(4,8)}`;
    } else if (cleaned.length >= 3) {
      return `${cleaned.slice(0,2)}/${cleaned.slice(2,4)}`;
    }
    return cleaned;
  };

  const formatJam = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 3) {
      return `${cleaned.slice(0,2)}:${cleaned.slice(2,4)}`;
    }
    return cleaned;
  };

  const convertDateFormat = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`; // Convert DD/MM/YYYY to YYYY-MM-DD
    }
    return dateStr;
  };

  const handleSave = async () => {
    // Validate all required fields first
    const errors: {[key: string]: string} = {};
    
    if (!formData.namaKegiatan.trim()) errors.namaKegiatan = 'Nama kegiatan wajib diisi';
    if (!formData.nomorSpt.trim()) errors.nomorSpt = 'Nomor SPT wajib diisi';
    if (!formData.tanggalMulai) errors.tanggalMulai = 'Tanggal mulai wajib diisi';
    if (!formData.tanggalSelesai) errors.tanggalSelesai = 'Tanggal selesai wajib diisi';
    if (!formData.jamMulai) errors.jamMulai = 'Jam mulai wajib diisi';
    if (!formData.jamSelesai) errors.jamSelesai = 'Jam selesai wajib diisi';
    if (selectedLokasi.length === 0) errors.lokasi = 'Minimal pilih 1 lokasi untuk dinas';
    if (selectedPegawai.length === 0) errors.pegawai = 'Minimal pilih 1 pegawai untuk dinas';
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      Alert.alert('Data Belum Lengkap', 'Mohon lengkapi semua field yang wajib diisi sebelum melanjutkan');
      return;
    }
    
    // Show confirmation modal if all data is valid
    setShowConfirmModal(true);
  };

  const confirmSave = async () => {
    // Validate all fields
    const errors: {[key: string]: string} = {};
    
    if (!formData.namaKegiatan.trim()) errors.namaKegiatan = 'Nama kegiatan wajib diisi';
    if (!formData.nomorSpt.trim()) errors.nomorSpt = 'Nomor SPT wajib diisi';
    if (!formData.tanggalMulai) errors.tanggalMulai = 'Tanggal mulai wajib diisi';
    if (!formData.tanggalSelesai) errors.tanggalSelesai = 'Tanggal selesai wajib diisi';
    if (!formData.jamMulai) errors.jamMulai = 'Jam mulai wajib diisi';
    if (!formData.jamSelesai) errors.jamSelesai = 'Jam selesai wajib diisi';
    if (selectedLokasi.length === 0) errors.lokasi = 'Minimal pilih 1 lokasi untuk dinas';
    if (selectedPegawai.length === 0) errors.pegawai = 'Minimal pilih 1 pegawai untuk dinas';
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setShowConfirmModal(false);
      Alert.alert('Error', 'Mohon lengkapi semua field yang wajib diisi');
      return;
    }
    
    try {
      setLoading(true);
      setShowConfirmModal(false);
      
      const dinasData = {
        nama_kegiatan: formData.namaKegiatan.trim(),
        nomor_spt: formData.nomorSpt.trim(),
        jenis_dinas: formData.jenisDinas,
        tanggal_mulai: convertDateFormat(formData.tanggalMulai),
        tanggal_selesai: convertDateFormat(formData.tanggalSelesai),
        jam_mulai: formData.jamMulai || '08:00:00',
        jam_selesai: formData.jamSelesai || '17:00:00',
        deskripsi: formData.deskripsi?.trim() || '',
        pegawai_ids: formData.pegawaiIds.filter(id => id != null && !isNaN(id) && id > 0),
        lokasi_ids: selectedLokasi.map(lokasi => lokasi.id)
      };
      
      console.log('Data yang akan dikirim:', dinasData);
      
      try {
        const response = await DinasAPI.createDinas(dinasData);
        
        if (response.success) {
          // Clear draft after successful save
          await clearDraftData();
          Alert.alert('Sukses', 'Data dinas berhasil disimpan', [
            { text: 'OK', onPress: () => router.replace('/kelola-dinas/dinas-aktif' as any) }
          ]);
        } else {
          const errorMsg = response.message || response.error || 'Gagal menyimpan data dinas';
          Alert.alert('Error', errorMsg);
          console.log('API Error Response:', response);
        }
      } catch (apiError: any) {
        console.error('API Error:', apiError);
        let errorMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
        
        if (apiError.message) {
          errorMessage = apiError.message;
        }
        
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Error saving dinas:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <AppHeader 
        title="Tambah Dinas Baru"
        showBack={true}
      />

      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          
          {/* Informasi Dasar */}
          <View style={styles.formCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="information-circle-outline" size={20} color="#004643" />
              <Text style={styles.cardTitle}>Informasi Dasar Dinas</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nama Kegiatan *</Text>
                <TextInput
                  style={[styles.textInput, validationErrors.namaKegiatan && styles.inputError]}
                  placeholder="Contoh: Rapat Koordinasi Regional"
                  value={formData.namaKegiatan}
                  onChangeText={(text) => {
                    setFormData({...formData, namaKegiatan: text});
                    validateField('namaKegiatan', text);
                  }}
                />
                {validationErrors.namaKegiatan && (
                  <Text style={styles.errorText}>{validationErrors.namaKegiatan}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nomor SPT *</Text>
                <TextInput
                  style={[styles.textInput, validationErrors.nomorSpt && styles.inputError]}
                  placeholder="Contoh: SPT/001/2024"
                  value={formData.nomorSpt}
                  onChangeText={(text) => {
                    setFormData({...formData, nomorSpt: text});
                    validateField('nomorSpt', text);
                  }}
                />
                {validationErrors.nomorSpt && (
                  <Text style={styles.errorText}>{validationErrors.nomorSpt}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Jenis Dinas *</Text>
                <TouchableOpacity 
                  style={styles.dropdownBtn}
                  onPress={() => setShowJenisDinasDropdown(!showJenisDinasDropdown)}
                >
                  <Text style={styles.dropdownBtnText}>
                    {formData.jenisDinas === 'lokal' ? 'Dinas Lokal' : 
                     formData.jenisDinas === 'luar_kota' ? 'Dinas Luar Kota' : 'Dinas Luar Negeri'}
                  </Text>
                  <Ionicons 
                    name={showJenisDinasDropdown ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color="#666" 
                  />
                </TouchableOpacity>
                
                {showJenisDinasDropdown && (
                  <View style={styles.dropdownContainer}>
                    {[
                      { key: 'lokal', label: 'Dinas Lokal' },
                      { key: 'luar_kota', label: 'Dinas Luar Kota' },
                      { key: 'luar_negeri', label: 'Dinas Luar Negeri' }
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.key}
                        style={[styles.dropdownItem, formData.jenisDinas === item.key && styles.dropdownItemSelected]}
                        onPress={() => {
                          setFormData({...formData, jenisDinas: item.key});
                          setShowJenisDinasDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{item.label}</Text>
                        {formData.jenisDinas === item.key && (
                          <Ionicons name="checkmark-circle" size={20} color="#004643" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Deskripsi</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Deskripsi kegiatan dinas..."
                  value={formData.deskripsi}
                  onChangeText={(text) => setFormData({...formData, deskripsi: text})}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          </View>

          {/* Waktu & Jadwal */}
          <View style={styles.formCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="time-outline" size={20} color="#004643" />
              <Text style={styles.cardTitle}>Waktu & Jadwal Dinas</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tanggal Mulai *</Text>
                <View style={styles.dateInputContainer}>
                  <TextInput
                    style={[styles.textInput, validationErrors.tanggalMulai && styles.inputError]}
                    placeholder="DD/MM/YYYY"
                    value={formData.tanggalMulai}
                    onChangeText={(text) => {
                      const formatted = formatTanggal(text);
                      setFormData({...formData, tanggalMulai: formatted});
                      validateField('tanggalMulai', formatted);
                    }}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                  <TouchableOpacity onPress={() => setShowDateMulaiPicker(true)} style={styles.calendarButton}>
                    <Ionicons name="calendar" size={20} color="#004643" />
                  </TouchableOpacity>
                </View>
                {validationErrors.tanggalMulai && (
                  <Text style={styles.errorText}>{validationErrors.tanggalMulai}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tanggal Selesai *</Text>
                <View style={styles.dateInputContainer}>
                  <TextInput
                    style={[styles.textInput, validationErrors.tanggalSelesai && styles.inputError]}
                    placeholder="DD/MM/YYYY"
                    value={formData.tanggalSelesai}
                    onChangeText={(text) => {
                      const formatted = formatTanggal(text);
                      setFormData({...formData, tanggalSelesai: formatted});
                      validateField('tanggalSelesai', formatted);
                    }}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                  <TouchableOpacity onPress={() => setShowDateSelesaiPicker(true)} style={styles.calendarButton}>
                    <Ionicons name="calendar" size={20} color="#004643" />
                  </TouchableOpacity>
                </View>
                {validationErrors.tanggalSelesai && (
                  <Text style={styles.errorText}>{validationErrors.tanggalSelesai}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Jam Mulai *</Text>
                <View style={styles.dateInputContainer}>
                  <TextInput
                    style={[styles.textInput, validationErrors.jamMulai && styles.inputError]}
                    placeholder="08:00"
                    value={formData.jamMulai}
                    onChangeText={(text) => {
                      const formatted = formatJam(text);
                      setFormData({...formData, jamMulai: formatted});
                      validateField('jamMulai', formatted);
                    }}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                  <TouchableOpacity onPress={() => setShowJamMulaiPicker(true)} style={styles.calendarButton}>
                    <Ionicons name="time" size={20} color="#004643" />
                  </TouchableOpacity>
                </View>
                {validationErrors.jamMulai && (
                  <Text style={styles.errorText}>{validationErrors.jamMulai}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Jam Selesai *</Text>
                <View style={styles.dateInputContainer}>
                  <TextInput
                    style={[styles.textInput, validationErrors.jamSelesai && styles.inputError]}
                    placeholder="17:00"
                    value={formData.jamSelesai}
                    onChangeText={(text) => {
                      const formatted = formatJam(text);
                      setFormData({...formData, jamSelesai: formatted});
                      validateField('jamSelesai', formatted);
                    }}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                  <TouchableOpacity onPress={() => setShowJamSelesaiPicker(true)} style={styles.calendarButton}>
                    <Ionicons name="time" size={20} color="#004643" />
                  </TouchableOpacity>
                </View>
                {validationErrors.jamSelesai && (
                  <Text style={styles.errorText}>{validationErrors.jamSelesai}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Lokasi & Pegawai */}
          <View style={styles.formCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="location-outline" size={20} color="#004643" />
              <Text style={styles.cardTitle}>Lokasi & Pegawai Dinas</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Lokasi Dinas *</Text>
                <TouchableOpacity 
                  style={styles.dropdownBtn}
                  onPress={() => setShowLokasiModal(!showLokasiModal)}
                >
                  <Text style={styles.dropdownBtnText}>
                    {selectedLokasi.length > 0 
                      ? `${selectedLokasi.length} lokasi dipilih` 
                      : 'Pilih Lokasi Dinas'
                    }
                  </Text>
                  <Ionicons 
                    name={showLokasiModal ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color="#666" 
                  />
                </TouchableOpacity>
                
                {showLokasiModal && (
                  <View style={styles.dropdownContainer}>
                    <View style={styles.searchWrapper}>
                      <Ionicons name="search-outline" size={16} color="#666" />
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Cari nama lokasi..."
                        value={lokasiSearchQuery}
                        onChangeText={filterLokasi}
                      />
                    </View>
                    
                    <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                      {filteredLokasi.map((lokasi) => {
                        const isSelected = selectedLokasi.find(l => l.id === lokasi.id);
                        return (
                          <TouchableOpacity
                            key={lokasi.id}
                            style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
                            onPress={() => {
                              if (isSelected) {
                                setSelectedLokasi(selectedLokasi.filter(l => l.id !== lokasi.id));
                              } else {
                                setSelectedLokasi([...selectedLokasi, lokasi]);
                              }
                            }}
                          >
                            <View style={styles.itemInfo}>
                              <Text style={styles.itemName}>{lokasi.nama_lokasi}</Text>
                              <Text style={styles.itemSubtext}>
                                {lokasi.jenis_lokasi === 'tetap' ? 'Kantor Tetap' : 'Lokasi Dinas'}
                              </Text>
                            </View>
                            {isSelected && (
                              <Ionicons name="checkmark-circle" size={20} color="#004643" />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
                
                {validationErrors.lokasi && (
                  <Text style={styles.errorText}>{validationErrors.lokasi}</Text>
                )}
                
                {selectedLokasi.length > 0 && (
                  <View style={styles.selectedContainer}>
                    {selectedLokasi.map((lokasi) => (
                      <View key={lokasi.id} style={styles.selectedChip}>
                        <Text style={styles.selectedChipText}>{lokasi.nama_lokasi}</Text>
                        <TouchableOpacity 
                          onPress={() => {
                            const updated = selectedLokasi.filter(l => l.id !== lokasi.id);
                            setSelectedLokasi(updated);
                          }}
                        >
                          <Ionicons name="close-circle" size={16} color="#F44336" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Pegawai Dinas * ({selectedPegawai.length} dipilih)</Text>
                <TouchableOpacity 
                  style={styles.dropdownBtn}
                  onPress={() => setShowPegawaiDropdown(!showPegawaiDropdown)}
                >
                  <Text style={styles.dropdownBtnText}>
                    {selectedPegawai.length > 0 
                      ? `${selectedPegawai.length} pegawai dipilih` 
                      : 'Pilih Pegawai Dinas'
                    }
                  </Text>
                  <Ionicons 
                    name={showPegawaiDropdown ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color="#666" 
                  />
                </TouchableOpacity>
                
                {showPegawaiDropdown && (
                  <View style={styles.dropdownContainer}>
                    <View style={styles.searchWrapper}>
                      <Ionicons name="search-outline" size={16} color="#666" />
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Cari nama atau NIP pegawai..."
                        value={pegawaiSearchQuery}
                        onChangeText={filterPegawai}
                      />
                    </View>
                    
                    <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                      {filteredPegawai.map((pegawai: any, index) => {
                        const pegawaiId = pegawai.id_user || pegawai.id_pegawai || pegawai.id;
                        const isSelected = selectedPegawai.find((p: any) => {
                          const selectedId = p.id_user || p.id_pegawai || p.id;
                          return selectedId === pegawaiId;
                        });
                        return (
                          <TouchableOpacity
                            key={pegawaiId || index}
                            style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
                            onPress={() => togglePegawai(pegawai)}
                          >
                            <View style={styles.itemInfo}>
                              <Text style={styles.itemName}>{pegawai.nama_lengkap}</Text>
                              <Text style={styles.itemSubtext}>NIP: {pegawai.nip}</Text>
                            </View>
                            {isSelected && (
                              <Ionicons name="checkmark-circle" size={20} color="#004643" />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
                
                {validationErrors.pegawai && (
                  <Text style={styles.errorText}>{validationErrors.pegawai}</Text>
                )}
                
                {selectedPegawai.length > 0 && (
                  <View style={styles.selectedContainer}>
                    {selectedPegawai.map((pegawai: any, index) => (
                      <View key={index} style={styles.selectedChip}>
                        <Text style={styles.selectedChipText}>{pegawai.nama_lengkap}</Text>
                        <TouchableOpacity onPress={() => togglePegawai(pegawai)}>
                          <Ionicons name="close-circle" size={16} color="#F44336" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Upload Dokumen SPT</Text>
                <TouchableOpacity style={styles.uploadBtn} onPress={pickDocument}>
                  <Ionicons name="document-attach-outline" size={20} color="#004643" />
                  <View style={styles.uploadContent}>
                    <Text style={styles.uploadText}>
                      {selectedFile ? selectedFile.name : 'Pilih File SPT'}
                    </Text>
                    <Text style={styles.uploadSubtext}>PDF, DOC, JPG (Max 5MB)</Text>
                  </View>
                  {selectedFile && (
                    <TouchableOpacity 
                      onPress={() => setSelectedFile(null)}
                      style={styles.removeFileBtn}
                    >
                      <Ionicons name="close-circle" size={20} color="#F44336" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>

      {/* Calendar Modals */}
      <Modal visible={showDateMulaiPicker} transparent>
        <View style={styles.calendarModalOverlay}>
          <View style={styles.calendarModalContainer}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Pilih Tanggal Mulai</Text>
              <TouchableOpacity onPress={() => setShowDateMulaiPicker(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={handleDateMulaiSelect}
              markedDates={{
                [selectedDateMulai]: {
                  selected: true,
                  selectedColor: '#004643'
                }
              }}
              minDate={new Date().toISOString().split('T')[0]}
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

      <Modal visible={showDateSelesaiPicker} transparent>
        <View style={styles.calendarModalOverlay}>
          <View style={styles.calendarModalContainer}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Pilih Tanggal Selesai</Text>
              <TouchableOpacity onPress={() => setShowDateSelesaiPicker(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={handleDateSelesaiSelect}
              markedDates={{
                [selectedDateSelesai]: {
                  selected: true,
                  selectedColor: '#004643'
                }
              }}
              minDate={selectedDateMulai || new Date().toISOString().split('T')[0]}
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

      {/* Time Picker Modals - Simple Version */}
      <DateTimePickerModal
        isVisible={showJamMulaiPicker}
        mode="time"
        onConfirm={handleJamMulaiConfirm}
        onCancel={() => setShowJamMulaiPicker(false)}
        is24Hour={true}
        display="default"
      />

      <DateTimePickerModal
        isVisible={showJamSelesaiPicker}
        mode="time"
        onConfirm={handleJamSelesaiConfirm}
        onCancel={() => setShowJamSelesaiPicker(false)}
        is24Hour={true}
        display="default"
      />

      {/* Sticky Save Button */}
      <View style={styles.stickyFooter}>
        <TouchableOpacity 
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]} 
          onPress={handleSave}
          disabled={loading}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          <Text style={styles.submitText}>
            {loading ? 'Menyimpan...' : 'Simpan Data Dinas'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Confirmation Modal */}
      <Modal visible={showConfirmModal} transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContainer}>
            <View style={styles.confirmModalHeader}>
              <Text style={styles.confirmModalTitle}>Konfirmasi Data Dinas</Text>
              <TouchableOpacity onPress={() => setShowConfirmModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.confirmModalContent}>
              <View style={styles.confirmItem}>
                <Text style={styles.confirmLabel}>Nama Kegiatan:</Text>
                <Text style={styles.confirmValue}>{formData.namaKegiatan}</Text>
              </View>
              
              <View style={styles.confirmItem}>
                <Text style={styles.confirmLabel}>Nomor SPT:</Text>
                <Text style={styles.confirmValue}>{formData.nomorSpt}</Text>
              </View>
              
              <View style={styles.confirmItem}>
                <Text style={styles.confirmLabel}>Jenis Dinas:</Text>
                <Text style={styles.confirmValue}>
                  {formData.jenisDinas === 'lokal' ? 'Dinas Lokal' : 
                   formData.jenisDinas === 'luar_kota' ? 'Dinas Luar Kota' : 'Dinas Luar Negeri'}
                </Text>
              </View>
              
              <View style={styles.confirmItem}>
                <Text style={styles.confirmLabel}>Periode:</Text>
                <Text style={styles.confirmValue}>
                  {formData.tanggalMulai} - {formData.tanggalSelesai}
                </Text>
              </View>
              
              <View style={styles.confirmItem}>
                <Text style={styles.confirmLabel}>Waktu:</Text>
                <Text style={styles.confirmValue}>
                  {formData.jamMulai} - {formData.jamSelesai}
                </Text>
              </View>
              
              <View style={styles.confirmItem}>
                <Text style={styles.confirmLabel}>Lokasi ({selectedLokasi.length}):</Text>
                {selectedLokasi.map((lokasi, index) => (
                  <Text key={index} style={styles.confirmValue}>• {lokasi.nama_lokasi}</Text>
                ))}
              </View>
              
              <View style={styles.confirmItem}>
                <Text style={styles.confirmLabel}>Pegawai ({selectedPegawai.length}):</Text>
                {selectedPegawai.map((pegawai, index) => (
                  <Text key={index} style={styles.confirmValue}>• {pegawai.nama_lengkap}</Text>
                ))}
              </View>
              
              {formData.deskripsi && (
                <View style={styles.confirmItem}>
                  <Text style={styles.confirmLabel}>Deskripsi:</Text>
                  <Text style={styles.confirmValue}>{formData.deskripsi}</Text>
                </View>
              )}
            </ScrollView>
            
            <View style={styles.confirmModalFooter}>
              <TouchableOpacity 
                style={styles.cancelConfirmBtn}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.cancelConfirmText}>Batal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveConfirmBtn}
                onPress={confirmSave}
                disabled={loading}
              >
                <Text style={styles.saveConfirmText}>
                  {loading ? 'Menyimpan...' : 'Simpan Data'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Input Modal */}
      <Modal visible={showInputModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.inputModalContainer}>
            <View style={styles.inputModalHeader}>
              <Text style={styles.inputModalTitle}>Input Data</Text>
              <TouchableOpacity onPress={() => setShowInputModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.inputModalContent}>
              <TouchableOpacity 
                style={styles.inputModalItem}
                onPress={() => {
                  Alert.prompt('Nama Kegiatan', 'Masukkan nama kegiatan:', [
                    { text: 'Batal', style: 'cancel' },
                    { text: 'OK', onPress: (value: string | undefined) => value && setFormData({...formData, namaKegiatan: value}) }
                  ]);
                }}
              >
                <Ionicons name="clipboard-outline" size={20} color="#004643" />
                <Text style={styles.inputModalItemText}>Nama Kegiatan</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.inputModalItem}
                onPress={() => {
                  Alert.prompt('Nomor SPT', 'Masukkan nomor SPT:', [
                    { text: 'Batal', style: 'cancel' },
                    { text: 'OK', onPress: (value: string | undefined) => value && setFormData({...formData, nomorSpt: value}) }
                  ]);
                }}
              >
                <Ionicons name="document-text-outline" size={20} color="#004643" />
                <Text style={styles.inputModalItemText}>Nomor SPT</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  contentContainer: {
    flex: 1
  },
  formContainer: {
    paddingHorizontal: 5,
    paddingTop: 20,
    paddingBottom: 100
  },
  formCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#004643',
    marginLeft: 8
  },
  cardContent: {
    padding: 15
  },
  inputGroup: {
    marginBottom: 16
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  textArea: {
    textAlignVertical: 'top',
    minHeight: 80
  },
  dateInputContainer: {
    position: 'relative'
  },
  calendarButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#F0F8F0'
  },
  dropdownBtn: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  dropdownBtnText: {
    fontSize: 16,
    color: '#333'
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    maxHeight: 200
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5'
  },
  dropdownItemSelected: {
    backgroundColor: '#F0F8F7'
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
    flex: 1
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#333'
  },
  dropdownList: {
    maxHeight: 150
  },
  itemInfo: {
    flex: 1
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2
  },
  itemSubtext: {
    fontSize: 12,
    color: '#666'
  },
  selectedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 8
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8F7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6
  },
  selectedChipText: {
    fontSize: 12,
    color: '#004643',
    fontWeight: '500'
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FAFAFA'
  },
  uploadContent: {
    flex: 1,
    marginLeft: 12
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#666'
  },
  removeFileBtn: {
    padding: 4
  },
  submitBtn: {
    backgroundColor: '#004643',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12
  },
  submitBtnDisabled: {
    backgroundColor: '#ccc'
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8
  },
  stickyFooter: {
    backgroundColor: 'rgba(248, 250, 251, 0.98)',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  inputError: {
    borderColor: '#F44336',
    borderWidth: 2
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
    marginLeft: 4
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  confirmModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '90%',
    maxHeight: '80%'
  },
  confirmModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  confirmModalContent: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    maxHeight: 400
  },
  confirmItem: {
    marginBottom: 15
  },
  confirmLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4
  },
  confirmValue: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20
  },
  confirmModalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 10
  },
  cancelConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center'
  },
  cancelConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666'
  },
  saveConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#004643',
    alignItems: 'center'
  },
  saveConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff'
  },
  calendarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  calendarModalContainer: {
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
  
  // Input Modal styles
  inputModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  inputModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '90%',
    maxHeight: '70%'
  },
  inputModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  inputModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  inputModalContent: {
    paddingHorizontal: 20,
    paddingVertical: 15
  },
  inputModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  inputModalItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12
  }
});
