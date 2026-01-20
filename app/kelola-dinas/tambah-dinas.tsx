import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { KelolaDinasAPI, PegawaiAkunAPI, PengaturanAPI } from '../../constants/config';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [showJenisDinasDropdown, setShowJenisDinasDropdown] = useState(false);
  const [showDateMulaiPicker, setShowDateMulaiPicker] = useState(false);
  const [showDateSelesaiPicker, setShowDateSelesaiPicker] = useState(false);
  const [selectedDateMulai, setSelectedDateMulai] = useState(new Date());
  const [selectedDateSelesai, setSelectedDateSelesai] = useState(new Date());
  const [showTimeMulaiPicker, setShowTimeMulaiPicker] = useState(false);
  const [showTimeSelesaiPicker, setShowTimeSelesaiPicker] = useState(false);
  const [selectedTimeMulai, setSelectedTimeMulai] = useState(new Date());
  const [selectedTimeSelesai, setSelectedTimeSelesai] = useState(new Date());
  
  // New states for improvements
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const jamOptions = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'
  ];

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

  // Progress calculation
  const calculateProgress = () => {
    let completedSteps = 0;
    if (formData.namaKegiatan && formData.nomorSpt) completedSteps++;
    if (formData.tanggalMulai && formData.tanggalSelesai) completedSteps++;
    if (formData.jamMulai && formData.jamSelesai) completedSteps++;
    if (selectedLokasi.length > 0) completedSteps++;
    if (selectedPegawai.length > 0) completedSteps++;
    return completedSteps;
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

  const handleDateMulaiChange = (event: any, date?: Date) => {
    setShowDateMulaiPicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDateMulai(date);
      const formattedDate = formatDate(date);
      setFormData({...formData, tanggalMulai: formattedDate});
    }
  };

  const handleDateSelesaiChange = (event: any, date?: Date) => {
    setShowDateSelesaiPicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDateSelesai(date);
      const formattedDate = formatDate(date);
      setFormData({...formData, tanggalSelesai: formattedDate});
    }
  };

  const handleTimeMulaiChange = (event: any, time?: Date) => {
    setShowTimeMulaiPicker(Platform.OS === 'ios');
    if (time) {
      setSelectedTimeMulai(time);
      const formattedTime = formatTime(time);
      setFormData({...formData, jamMulai: formattedTime});
      validateField('jamMulai', formattedTime);
    }
  };

  const handleTimeSelesaiChange = (event: any, time?: Date) => {
    setShowTimeSelesaiPicker(Platform.OS === 'ios');
    if (time) {
      setSelectedTimeSelesai(time);
      const formattedTime = formatTime(time);
      setFormData({...formData, jamSelesai: formattedTime});
      validateField('jamSelesai', formattedTime);
    }
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
        const response = await KelolaDinasAPI.createDinas(dinasData);
        
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
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#004643" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tambah Dinas Baru</Text>
        </View>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(calculateProgress() / totalSteps) * 100}%` }]} />
        </View>
      </View>

      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nama Kegiatan *</Text>
            <View style={[styles.inputWrapper, validationErrors.namaKegiatan && styles.inputError]}>
              <Ionicons name="clipboard-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Contoh: Rapat Koordinasi Regional"
                value={formData.namaKegiatan}
                onChangeText={(text) => {
                  setFormData({...formData, namaKegiatan: text});
                  validateField('namaKegiatan', text);
                }}
              />
            </View>
            {validationErrors.namaKegiatan && (
              <Text style={styles.errorText}>{validationErrors.namaKegiatan}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nomor SPT *</Text>
            <View style={[styles.inputWrapper, validationErrors.nomorSpt && styles.inputError]}>
              <Ionicons name="document-text-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Contoh: SPT/001/2024"
                value={formData.nomorSpt}
                onChangeText={(text) => {
                  setFormData({...formData, nomorSpt: text});
                  validateField('nomorSpt', text);
                }}
              />
            </View>
            {validationErrors.nomorSpt && (
              <Text style={styles.errorText}>{validationErrors.nomorSpt}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Jenis Dinas *</Text>
            <TouchableOpacity 
              style={styles.dropdownBtn}
              onPress={() => setShowJenisDinasDropdown(!showJenisDinasDropdown)}
            >
              <Ionicons 
                name={formData.jenisDinas === 'lokal' ? 'business-outline' : formData.jenisDinas === 'luar_kota' ? 'car-outline' : 'airplane-outline'} 
                size={20} 
                color="#004643" 
              />
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
                  { key: 'lokal', label: 'Dinas Lokal', icon: 'business-outline' },
                  { key: 'luar_kota', label: 'Dinas Luar Kota', icon: 'car-outline' },
                  { key: 'luar_negeri', label: 'Dinas Luar Negeri', icon: 'airplane-outline' }
                ].map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.pegawaiDropdownItem, formData.jenisDinas === item.key && styles.pegawaiSelected]}
                    onPress={() => {
                      setFormData({...formData, jenisDinas: item.key});
                      setShowJenisDinasDropdown(false);
                    }}
                  >
                    <Ionicons name={item.icon as any} size={20} color="#004643" />
                    <Text style={[styles.pegawaiItemName, {marginLeft: 12, marginBottom: 0}]}>{item.label}</Text>
                    {formData.jenisDinas === item.key && (
                      <Ionicons name="checkmark-circle" size={20} color="#004643" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tanggal Mulai *</Text>
            <View style={styles.dateInputContainer}>
              <View style={[styles.inputWrapper, validationErrors.tanggalMulai && styles.inputError]}>
                <Ionicons name="calendar-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
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
            </View>
            {validationErrors.tanggalMulai && (
              <Text style={styles.errorText}>{validationErrors.tanggalMulai}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tanggal Selesai *</Text>
            <View style={styles.dateInputContainer}>
              <View style={[styles.inputWrapper, validationErrors.tanggalSelesai && styles.inputError]}>
                <Ionicons name="calendar-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
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
            </View>
            {validationErrors.tanggalSelesai && (
              <Text style={styles.errorText}>{validationErrors.tanggalSelesai}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Jam Mulai *</Text>
            <View style={styles.dateInputContainer}>
              <View style={[styles.inputWrapper, validationErrors.jamMulai && styles.inputError]}>
                <Ionicons name="time-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
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
                <TouchableOpacity onPress={() => setShowTimeMulaiPicker(true)} style={styles.calendarButton}>
                  <Ionicons name="time" size={20} color="#004643" />
                </TouchableOpacity>
              </View>
            </View>
            {validationErrors.jamMulai && (
              <Text style={styles.errorText}>{validationErrors.jamMulai}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Jam Selesai *</Text>
            <View style={styles.dateInputContainer}>
              <View style={[styles.inputWrapper, validationErrors.jamSelesai && styles.inputError]}>
                <Ionicons name="time-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
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
                <TouchableOpacity onPress={() => setShowTimeSelesaiPicker(true)} style={styles.calendarButton}>
                  <Ionicons name="time" size={20} color="#004643" />
                </TouchableOpacity>
              </View>
            </View>
            {validationErrors.jamSelesai && (
              <Text style={styles.errorText}>{validationErrors.jamSelesai}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Deskripsi (Opsional)</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <Ionicons name="document-outline" size={20} color="#666" style={[styles.inputIcon, styles.textAreaIcon]} />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Deskripsi kegiatan dinas..."
                value={formData.deskripsi}
                onChangeText={(text) => setFormData({...formData, deskripsi: text})}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Upload Dokumen SPT (Opsional)</Text>
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Lokasi Dinas *</Text>
            <TouchableOpacity 
              style={styles.dropdownBtn}
              onPress={() => setShowLokasiModal(!showLokasiModal)}
            >
              <Ionicons name="location-outline" size={20} color="#004643" />
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
                <View style={styles.pegawaiSearchWrapper}>
                  <Ionicons name="search-outline" size={16} color="#666" />
                  <TextInput
                    style={styles.searchPegawaiInput}
                    placeholder="Cari nama lokasi..."
                    value={lokasiSearchQuery}
                    onChangeText={filterLokasi}
                  />
                </View>
                
                <ScrollView style={styles.pegawaiDropdownList} nestedScrollEnabled>
                  {filteredLokasi.map((lokasi) => {
                    const isSelected = selectedLokasi.find(l => l.id === lokasi.id);
                    return (
                      <TouchableOpacity
                        key={lokasi.id}
                        style={[styles.pegawaiDropdownItem, isSelected && styles.pegawaiSelected]}
                        onPress={() => {
                          if (isSelected) {
                            setSelectedLokasi(selectedLokasi.filter(l => l.id !== lokasi.id));
                          } else {
                            setSelectedLokasi([...selectedLokasi, lokasi]);
                          }
                        }}
                      >
                        <View style={styles.pegawaiItemInfo}>
                          <Text style={styles.pegawaiItemName}>{lokasi.nama_lokasi}</Text>
                          <View style={{flexDirection: 'row', alignItems: 'center'}}>
                            <Ionicons 
                              name={lokasi.jenis_lokasi === 'tetap' ? 'business-outline' : 'location-outline'} 
                              size={12} 
                              color="#666" 
                            />
                            <Text style={[styles.pegawaiItemNip, {marginLeft: 4}]}>
                              {lokasi.jenis_lokasi === 'tetap' ? 'Kantor Tetap' : 'Lokasi Dinas'}
                            </Text>
                          </View>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={20} color="#004643" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                  
                  {filteredLokasi.length === 0 && (
                    <View style={styles.emptyPegawai}>
                      <Text style={styles.emptyPegawaiText}>Lokasi tidak ditemukan</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}
            
            {selectedLokasi.length > 0 && (
              <View style={styles.selectedLokasiContainer}>
                {selectedLokasi.map((lokasi, index) => (
                  <View key={lokasi.id} style={styles.selectedLokasiChip}>
                    <View style={styles.lokasiChipContent}>
                      <Text style={styles.lokasiChipText}>{lokasi.nama_lokasi}</Text>
                      <Text style={styles.lokasiChipSubtext}>
                        {lokasi.jenis_lokasi === 'tetap' ? 'Kantor Tetap' : 'Lokasi Dinas'}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => {
                        const updated = selectedLokasi.filter(l => l.id !== lokasi.id);
                        setSelectedLokasi(updated);
                      }}
                    >
                      <Ionicons name="close-circle" size={20} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pegawai Dinas * ({selectedPegawai.length} dipilih)</Text>
            <TouchableOpacity 
              style={styles.dropdownBtn}
              onPress={() => setShowPegawaiDropdown(!showPegawaiDropdown)}
            >
              <Ionicons name="people-outline" size={20} color="#004643" />
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
                <View style={styles.pegawaiSearchWrapper}>
                  <Ionicons name="search-outline" size={16} color="#666" />
                  <TextInput
                    style={styles.searchPegawaiInput}
                    placeholder="Cari nama atau NIP pegawai..."
                    value={pegawaiSearchQuery}
                    onChangeText={filterPegawai}
                  />
                </View>
                
                <ScrollView style={styles.pegawaiDropdownList} nestedScrollEnabled>
                  {filteredPegawai.map((pegawai: any, index) => {
                    const pegawaiId = pegawai.id_user || pegawai.id_pegawai || pegawai.id;
                    const isSelected = selectedPegawai.find((p: any) => {
                      const selectedId = p.id_user || p.id_pegawai || p.id;
                      return selectedId === pegawaiId;
                    });
                    return (
                      <TouchableOpacity
                        key={pegawaiId || index}
                        style={[styles.pegawaiDropdownItem, isSelected && styles.pegawaiSelected]}
                        onPress={() => togglePegawai(pegawai)}
                      >
                        <View style={styles.pegawaiItemInfo}>
                          <Text style={styles.pegawaiItemName}>{pegawai.nama_lengkap}</Text>
                          <Text style={styles.pegawaiItemNip}>NIP: {pegawai.nip}</Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={20} color="#004643" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                  
                  {filteredPegawai.length === 0 && (
                    <View style={styles.emptyPegawai}>
                      <Text style={styles.emptyPegawaiText}>Pegawai tidak ditemukan</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}
            
            {selectedPegawai.length > 0 && (
              <View style={styles.selectedPegawaiContainer}>
                {selectedPegawai.map((pegawai: any, index) => (
                  <View key={index} style={styles.selectedPegawaiChip}>
                    <Text style={styles.selectedPegawaiChipText}>{pegawai.nama_lengkap}</Text>
                    <TouchableOpacity onPress={() => togglePegawai(pegawai)}>
                      <Ionicons name="close-circle" size={16} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Date Pickers */}
      {showDateMulaiPicker && (
        <DateTimePicker
          value={selectedDateMulai}
          mode="date"
          display="default"
          onChange={handleDateMulaiChange}
          minimumDate={new Date()}
          accentColor="#004643"
          textColor="#004643"
        />
      )}
      
      {showDateSelesaiPicker && (
        <DateTimePicker
          value={selectedDateSelesai}
          mode="date"
          display="default"
          onChange={handleDateSelesaiChange}
          minimumDate={new Date()}
          accentColor="#004643"
          textColor="#004643"
        />
      )}

      {/* Time Pickers */}
      {showTimeMulaiPicker && (
        <DateTimePicker
          value={selectedTimeMulai}
          mode="time"
          display="default"
          onChange={handleTimeMulaiChange}
          accentColor="#004643"
          textColor="#004643"
        />
      )}
      
      {showTimeSelesaiPicker && (
        <DateTimePicker
          value={selectedTimeSelesai}
          mode="time"
          display="default"
          onChange={handleTimeSelesaiChange}
          accentColor="#004643"
          textColor="#004643"
        />
      )}

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
        <View style={styles.inputModalOverlay}>
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
  contentContainer: {
    flex: 1,
    marginTop: 120
  },
  formContainer: {
    padding: 20,
    paddingBottom: 100
  },
  inputGroup: { 
    marginBottom: 25 
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 45,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  inputIcon: {
    marginRight: 12
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333'
  },
  textArea: {
    textAlignVertical: 'top',
    paddingTop: 15
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    gap: 20
  },
  halfInput: { 
    flex: 1
  },

  roleContainer: {
    flexDirection: 'row',
    gap: 8
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  roleActive: {
    backgroundColor: '#004643'
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666'
  },
  roleTextActive: {
    color: '#fff'
  },
  lokasiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'space-between'
  },
  lokasiBtnText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 10
  },
  selectedLokasiContainer: {
    marginTop: 10,
    gap: 8
  },
  selectedLokasiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8F7',
    padding: 12,
    borderRadius: 10,
    justifyContent: 'space-between'
  },
  lokasiChipContent: {
    flex: 1
  },
  lokasiChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#004643'
  },
  lokasiChipSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
  lokasiModalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    marginTop: 'auto',
    paddingBottom: 20
  },
  lokasiList: {
    maxHeight: 400,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20
  },
  lokasiItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginVertical: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  lokasiItemSelected: {
    backgroundColor: '#F0F8F7',
    borderColor: '#004643',
    borderWidth: 2
  },
  lokasiItemContent: {
    flex: 1
  },
  lokasiItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  lokasiItemType: {
    fontSize: 12,
    color: '#004643',
    fontWeight: '500',
    marginBottom: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#E8F5E8',
    borderRadius: 10,
    alignSelf: 'flex-start'
  },
  lokasiItemAddress: {
    fontSize: 12,
    color: '#666'
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0'
  },

  placeholder: {
    color: '#999'
  },
  jamPickerContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  jamPickerList: {
    maxHeight: 180
  },
  jamPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5'
  },
  jamPickerSelected: {
    backgroundColor: '#F0F8F7'
  },
  jamPickerText: {
    fontSize: 14,
    color: '#333'
  },
  jamPickerTextSelected: {
    color: '#004643',
    fontWeight: '600'
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 15,
    backgroundColor: '#FAFAFA',
    minHeight: 60
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
  textAreaWrapper: {
    minHeight: 80,
    alignItems: 'flex-start',
    paddingTop: 12
  },
  textAreaIcon: {
    alignSelf: 'flex-start',
    marginTop: 3
  },

  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8F7',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  mapBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#004643',
    marginLeft: 8
  },

  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10
  },
  sliderLabel: {
    fontSize: 12,
    color: '#666'
  },
  customSlider: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10
  },
  sliderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F8F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    position: 'relative',
    marginHorizontal: 10
  },
  sliderFill: {
    height: 4,
    backgroundColor: '#004643',
    borderRadius: 2
  },
  sliderThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    backgroundColor: '#004643',
    borderRadius: 8,
    marginLeft: -8
  },

  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  dropdownBtnText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 10
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    maxHeight: 250
  },
  pegawaiSearchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  searchPegawaiInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#333'
  },
  pegawaiDropdownList: {
    maxHeight: 180
  },
  pegawaiDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5'
  },
  pegawaiSelected: {
    backgroundColor: '#F0F8F7'
  },
  pegawaiItemInfo: {
    flex: 1
  },
  pegawaiItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2
  },
  pegawaiItemNip: {
    fontSize: 12,
    color: '#666'
  },
  emptyPegawai: {
    padding: 20,
    alignItems: 'center'
  },
  emptyPegawaiText: {
    fontSize: 14,
    color: '#999'
  },
  selectedPegawaiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 8
  },
  selectedPegawaiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8F7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6
  },
  selectedPegawaiChipText: {
    fontSize: 12,
    color: '#004643',
    fontWeight: '500'
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
    backgroundColor: '#999',
    elevation: 0
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(248, 250, 251, 0.98)',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20
  },

  selectedPegawaiList: {
    marginTop: 10,
    gap: 8
  },
  selectedPegawaiItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F8F7',
    padding: 10,
    borderRadius: 8
  },
  selectedPegawaiName: {
    fontSize: 14,
    color: '#004643',
    fontWeight: '500'
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  pegawaiModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingTop: 20
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  pegawaiList: {
    flex: 1,
    paddingHorizontal: 20
  },
  pegawaiItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  pegawaiItemSelected: {
    backgroundColor: '#F0F8F7'
  },
  pegawaiInfo: {
    flex: 1
  },
  pegawaiName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  pegawaiNip: {
    fontSize: 12,
    color: '#666'
  },
  confirmBtn: {
    backgroundColor: '#004643',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: '#fff'
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  backButton: {
    padding: 10,
    marginRight: 15,
    borderRadius: 10,
    backgroundColor: '#F5F5F5'
  },
  mapTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#004643'
  },
  mapSearchContainer: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    zIndex: 1000
  },
  mapSearchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    marginLeft: 6,
    color: '#333'
  },
  currentLocationBtn: {
    padding: 4
  },
  searchResults: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    maxHeight: 160
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  searchResultText: {
    flex: 1,
    fontSize: 12,
    color: '#333',
    marginLeft: 6
  },
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
    borderBottomColor: '#f0f0f0'
  },
  inputModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  inputModalContent: {
    paddingHorizontal: 20,
    paddingVertical: 10
  },
  inputModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5'
  },
  inputModalItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15
  },
  map: {
    flex: 1
  },
  mapActions: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    flexDirection: 'row',
    gap: 10
  },
  confirmLocationBtn: {
    flex: 1,
    backgroundColor: '#004643',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8
  },
  confirmLocationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  cancelLocationBtn: {
    flex: 1,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    gap: 8
  },
  cancelLocationText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600'
  },
  mapInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8
  },
  mapInfoText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center'
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  emptyLokasiContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20
  },
  emptyLokasiText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999',
    marginTop: 12,
    textAlign: 'center'
  },
  emptyLokasiSubtext: {
    fontSize: 12,
    color: '#CCC',
    marginTop: 4,
    textAlign: 'center'
  },
  dateInputContainer: {
    position: 'relative'
  },
  calendarButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F0F8F0'
  },
  
  // New styles for improvements
  progressContainer: {
    position: 'absolute',
    top: 90,
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2
  },
  progressFill: {
    height: 4,
    backgroundColor: '#004643',
    borderRadius: 2
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center'
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
  
  confirmModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '90%',
    maxHeight: '80%',
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto'
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
  }
});
