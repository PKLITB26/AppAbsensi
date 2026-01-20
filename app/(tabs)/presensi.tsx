import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Alert, TextInput, Modal } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { PegawaiAPI, API_CONFIG } from '../../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PresensiScreen() {
  const [location, setLocation] = useState<any>(null);
  const [distance, setDistance] = useState<number>(0);
  const [availableLocations, setAvailableLocations] = useState<any[]>([]);
  const [nearestLocation, setNearestLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDinas, setIsDinas] = useState<boolean>(false);
  const [dinasLocation, setDinasLocation] = useState<any>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [workEndTime, setWorkEndTime] = useState<string>('17:00');
  const [showEarlyLeaveInput, setShowEarlyLeaveInput] = useState(false);
  const [earlyLeaveReason, setEarlyLeaveReason] = useState('');

  useEffect(() => {
    checkDinasStatus();
    fetchLocations();
    getCurrentLocation();
    checkTodayAttendance();
    
    // Update waktu setiap detik
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Untuk testing - uncomment baris ini untuk simulasi sudah check-in
  // setHasCheckedIn(true);
  // setCheckInTime('08:15:30');
  
  const checkTodayAttendance = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) return;
      
      const user = JSON.parse(userData);
      const userId = user.id_user || user.id;
      const today = new Date().toISOString().split('T')[0];
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/check-attendance.php?user_id=${userId}&date=${today}`);
      const data = await response.json();
      
      if (data.success && data.has_checked_in) {
        setHasCheckedIn(true);
        setCheckInTime(data.check_in_time);
        setWorkEndTime(data.work_end_time || '17:00');
      }
    } catch (error) {
      console.error('Error checking attendance:', error);
    }
  };

  const checkDinasStatus = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) return;
      
      const user = JSON.parse(userData);
      const userId = user.id_user || user.id;
      
      // Cek status dinas hari ini
      const response = await fetch(`${API_CONFIG.BASE_URL}/check-dinas.php?user_id=${userId}`);
      const responseText = await response.text();
      
      // Cek apakah response adalah JSON yang valid
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.log('Response bukan JSON valid:', responseText);
        // Set default tidak dinas jika API error
        setIsDinas(false);
        setDinasLocation(null);
        return;
      }
      
      if (data.success && data.is_dinas) {
        setIsDinas(true);
        setDinasLocation(data.lokasi_dinas);
      } else {
        setIsDinas(false);
        setDinasLocation(null);
      }
    } catch (error) {
      console.error('Error checking dinas status:', error);
      // Set default tidak dinas jika ada error
      setIsDinas(false);
      setDinasLocation(null);
    }
  };

  const fetchLocations = async () => {
    try {
      // Fetch lokasi dari API debug yang sudah dibuat
      const response = await fetch(`${API_CONFIG.BASE_URL}/debug-lokasi.php`);
      const data = await response.json();
      
      if (data.lokasi_kantor) {
        let activeLocations = data.lokasi_kantor.filter((loc: any) => 
          loc.status === 'aktif' && loc.is_active === 1
        );
        
        // Jika sedang dinas, tambahkan lokasi dinas dari database dinas
        if (isDinas && dinasLocation) {
          // Filter hanya lokasi kantor tetap
          activeLocations = activeLocations.filter((loc: any) => 
            loc.jenis_lokasi === 'tetap'
          );
          
          // Tambahkan lokasi dinas dari tabel dinas
          const dinasLoc = {
            id: dinasLocation.id,
            nama_lokasi: dinasLocation.nama_lokasi,
            alamat: dinasLocation.alamat,
            latitude: dinasLocation.latitude.toString(),
            longitude: dinasLocation.longitude.toString(),
            radius: dinasLocation.radius,
            jenis_lokasi: 'dinas',
            status: 'aktif',
            is_active: 1
          };
          activeLocations.push(dinasLoc);
        } else {
          // Jika tidak dinas, hanya tampilkan lokasi tetap
          activeLocations = activeLocations.filter((loc: any) => 
            loc.jenis_lokasi === 'tetap'
          );
        }
        
        setAvailableLocations(activeLocations);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      Alert.alert('Error', 'Gagal memuat data lokasi');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      
      let currLocation = await Location.getCurrentPositionAsync({});
      setLocation(currLocation.coords);
      
      // Hitung jarak ke semua lokasi setelah mendapat koordinat
      if (availableLocations.length > 0) {
        calculateDistances(currLocation.coords);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const calculateDistances = (userLocation: any) => {
    let minDistance = Infinity;
    let closest = null;
    
    availableLocations.forEach((loc) => {
      const dist = getDistance(
        userLocation.latitude,
        userLocation.longitude,
        parseFloat(loc.latitude),
        parseFloat(loc.longitude)
      );
      
      if (dist < minDistance) {
        minDistance = dist;
        closest = { ...loc, distance: dist };
      }
    });
    
    setDistance(minDistance);
    setNearestLocation(closest);
  };

  // Update distances when location changes
  useEffect(() => {
    if (location && availableLocations.length > 0) {
      calculateDistances(location);
    }
  }, [location, availableLocations]);

  // Re-fetch locations when dinas status changes
  useEffect(() => {
    if (isDinas !== null) {
      fetchLocations();
    }
  }, [isDinas, dinasLocation]);

  // Fungsi Hitung Jarak (Meter)
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Radius bumi dalam meter
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Hasil dalam meter
  };

  // Logika validasi lokasi berdasarkan status dinas
  const validateLocation = () => {
    if (!nearestLocation) return { valid: false, message: "Lokasi tidak terdeteksi" };
    
    const isInRange = distance <= nearestLocation.radius;
    
    if (isDinas) {
      // Jika sedang dinas, HANYA boleh absen di lokasi dinas
      if (!dinasLocation) {
        return { valid: false, message: "Lokasi dinas belum ditentukan" };
      }
      if (nearestLocation.jenis_lokasi !== 'dinas') {
        return { valid: false, message: "Anda sedang dinas, harus absen di lokasi dinas yang ditentukan!" };
      }
      if (!isInRange) {
        return { valid: false, message: "Anda berada di luar radius lokasi dinas" };
      }
    } else {
      // Jika tidak dinas, tidak boleh absen di lokasi dinas
      if (nearestLocation.jenis_lokasi === 'dinas') {
        return { valid: false, message: "Anda tidak sedang dinas, tidak bisa absen di lokasi dinas" };
      }
      if (!isInRange) {
        return { valid: false, message: "Anda berada di luar radius lokasi kantor" };
      }
    }
    
    return { valid: true, message: "Lokasi valid" };
  };

  const locationValidation = validateLocation();
  const isOutOfRange = !locationValidation.valid;

  const isWorkTimeOver = () => {
    const now = currentTime;
    const [endHour, endMinute] = workEndTime.split(':').map(Number);
    const endTime = new Date();
    endTime.setHours(endHour, endMinute, 0, 0);
    return now >= endTime;
  };

  const getButtonText = () => {
    const currentTimeStr = currentTime.toTimeString().split(' ')[0];
    
    if (isProcessing) return "MEMPROSES...";
    if (isOutOfRange) return "TIDAK BISA ABSEN";
    if (!hasCheckedIn) return `ABSEN MASUK\n${currentTimeStr}`;
    if (isWorkTimeOver()) return `ABSEN PULANG\n${currentTimeStr}`;
    return `PULANG CEPAT\n${currentTimeStr}`;
  };

  const handleAbsen = async () => {
    if (isOutOfRange) {
      Alert.alert("Gagal", locationValidation.message);
      return;
    }
    
    if (!hasCheckedIn) {
      await takeSelfie('masuk');
    } else {
      await takeSelfie('pulang');
    }
  };

  const takeSelfie = async (type: string = 'masuk') => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Izin kamera diperlukan untuk absen');
        return;
      }

      // Ambil lokasi terbaru sebelum foto
      let currentLocation = location;
      try {
        const freshLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });
        currentLocation = freshLocation.coords;
        setLocation(currentLocation);
      } catch (locError) {
        console.log('Menggunakan lokasi terakhir:', locError);
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [1, 1],
        quality: 0.8,
        cameraType: ImagePicker.CameraType.front,
        exif: true, // Simpan metadata EXIF termasuk lokasi
      });

      if (!result.canceled && result.assets[0]) {
        const photoData = {
          uri: result.assets[0].uri,
          location: currentLocation,
          timestamp: new Date().toISOString(),
          distance: distance,
          nearestLocation: nearestLocation?.nama_lokasi
        };
        
        setCapturedPhoto(JSON.stringify(photoData));
        
        // Jika pulang dan belum waktunya, tampilkan form alasan
        if (type === 'pulang' && !isWorkTimeOver()) {
          setShowEarlyLeaveInput(true);
        } else {
          const currentValidation = validateLocation();
          if (!currentValidation.valid) {
            Alert.alert('Error', 'Lokasi tidak valid saat mengambil foto: ' + currentValidation.message);
            return;
          }
          showConfirmation(JSON.stringify(photoData), type);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal mengambil foto');
    }
  };

  const showConfirmation = (photoUri: string, type: string) => {
    let message = "Foto selfie sudah diambil. Pastikan wajah Anda terlihat jelas dan lokasi sudah sesuai.";
    
    if (type === 'pulang_cepat') {
      message += `\n\nAlasan pulang cepat: ${earlyLeaveReason}`;
    }
    
    Alert.alert(
      "Konfirmasi Absen",
      message + " Lanjutkan absen?",
      [
        {
          text: "Ulangi Foto",
          style: "cancel",
          onPress: () => {
            setCapturedPhoto(null);
            takeSelfie(type);
          }
        },
        {
          text: "Konfirmasi Absen",
          onPress: () => submitAbsen(photoUri, type)
        }
      ]
    );
  };

  const submitAbsen = async (photoData: string, type: string = 'masuk') => {
    setIsProcessing(true);
    
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        Alert.alert('Error', 'Silakan login ulang');
        return;
      }
      
      const user = JSON.parse(userData);
      const userId = user.id_user || user.id;
      if (!userId) {
        Alert.alert('Error', 'Data login tidak valid');
        return;
      }
      
      // Parse photo data yang mengandung lokasi
      let parsedPhotoData;
      try {
        parsedPhotoData = JSON.parse(photoData);
      } catch {
        // Fallback jika photoData adalah string URI biasa
        parsedPhotoData = {
          uri: photoData,
          location: location,
          timestamp: new Date().toISOString(),
          distance: distance,
          nearestLocation: nearestLocation?.nama_lokasi
        };
      }
      
      let result;
      
      if (isDinas && dinasLocation) {
        // Absen dinas
        const dinasData = {
          id_dinas: dinasLocation.id,
          id_user: userId,
          tanggal_absen: new Date().toISOString().split('T')[0],
          [type === 'masuk' ? 'jam_masuk' : 'jam_pulang']: new Date().toTimeString().split(' ')[0],
          [type === 'masuk' ? 'latitude_masuk' : 'latitude_pulang']: parsedPhotoData.location?.latitude || 0,
          [type === 'masuk' ? 'longitude_masuk' : 'longitude_pulang']: parsedPhotoData.location?.longitude || 0,
          [type === 'masuk' ? 'foto_masuk' : 'foto_pulang']: parsedPhotoData.uri,
          status: 'hadir',
          keterangan: type === 'pulang_cepat' ? earlyLeaveReason : `Absen ${type} dinas di ${parsedPhotoData.nearestLocation}`,
          photo_metadata: JSON.stringify({
            timestamp: parsedPhotoData.timestamp,
            distance: parsedPhotoData.distance,
            location_name: parsedPhotoData.nearestLocation
          })
        };
        
        const response = await fetch(`${API_CONFIG.BASE_URL}/submit-absen-dinas.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dinasData)
        });
        result = await response.json();
      } else {
        // Absen normal
        const presensiData = {
          id_user: userId,
          tanggal: new Date().toISOString().split('T')[0],
          [type === 'masuk' ? 'jam_masuk' : 'jam_pulang']: new Date().toTimeString().split(' ')[0],
          [type === 'masuk' ? 'lat_absen' : 'lat_pulang']: parsedPhotoData.location?.latitude || 0,
          [type === 'masuk' ? 'long_absen' : 'long_pulang']: parsedPhotoData.location?.longitude || 0,
          [type === 'masuk' ? 'foto_selfie' : 'foto_pulang']: parsedPhotoData.uri,
          status: type === 'pulang_cepat' ? 'Pulang Cepat' : 'Hadir',
          alasan_luar_lokasi: type === 'pulang_cepat' ? earlyLeaveReason : parsedPhotoData.nearestLocation || 'Lokasi kantor',
          photo_metadata: JSON.stringify({
            timestamp: parsedPhotoData.timestamp,
            distance: parsedPhotoData.distance,
            location_name: parsedPhotoData.nearestLocation
          })
        };
        
        result = await PegawaiAPI.submitPresensi(presensiData);
      }
      
      if (result.success) {
        let message = "";
        if (type === 'masuk') {
          message = isDinas ? "Absen masuk dinas berhasil!" : "Absen masuk berhasil!";
          setHasCheckedIn(true);
          setCheckInTime(new Date().toTimeString().split(' ')[0]);
        } else if (type === 'pulang_cepat') {
          message = "Absen pulang cepat berhasil!";
        } else {
          message = "Absen pulang berhasil!";
        }
        
        message += `\n\nLokasi foto: ${parsedPhotoData.nearestLocation}\nJarak: ${Math.round(parsedPhotoData.distance)}m`;
        
        Alert.alert("Berhasil", message);
        setCapturedPhoto(null);
        setEarlyLeaveReason('');
        
        if (type !== 'masuk') {
          setHasCheckedIn(false);
        }
      } else {
        Alert.alert("Gagal", result.message);
      }
    } catch (error) {
      Alert.alert("Error", "Gagal menyimpan presensi");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Presensi Kehadiran</Text>
        <Text style={styles.headerSubtitle}>
          {isDinas ? 
            `Status: Sedang Dinas - ${dinasLocation?.nama_lokasi || 'Lokasi Dinas'}` :
            'Status: Kerja Normal'}
        </Text>
        
        <Text style={styles.timeInfo}>
          {hasCheckedIn ? 
            `Masuk: ${checkInTime} | Pulang: ${workEndTime}` :
            `Jam Kerja: 08:00 - ${workEndTime}`
          }
        </Text>
        <Text style={styles.locationInfo}>
          {nearestLocation ? 
            `Terdeteksi: ${nearestLocation.nama_lokasi} (${nearestLocation.jenis_lokasi})` : 
            'Mencari lokasi...'}
        </Text>
      </View>

      <View style={styles.mapWrapper}>
        <MapView
          style={styles.map}
          region={{
            latitude: location ? location.latitude : (nearestLocation ? parseFloat(nearestLocation.latitude) : -6.8915),
            longitude: location ? location.longitude : (nearestLocation ? parseFloat(nearestLocation.longitude) : 107.6107),
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          {location && <Marker coordinate={location} title="Lokasi Anda" pinColor="blue" />}
          
          {availableLocations.map((loc, index) => (
            <React.Fragment key={index}>
              <Marker 
                coordinate={{
                  latitude: parseFloat(loc.latitude),
                  longitude: parseFloat(loc.longitude)
                }} 
                title={loc.nama_lokasi}
                description={`${loc.jenis_lokasi} - Radius: ${loc.radius}m`}
                pinColor={loc.jenis_lokasi === 'tetap' ? 'red' : loc.jenis_lokasi === 'dinas' ? 'purple' : 'orange'}
              />
              <Circle 
                center={{
                  latitude: parseFloat(loc.latitude),
                  longitude: parseFloat(loc.longitude)
                }} 
                radius={loc.radius} 
                fillColor={loc.jenis_lokasi === 'tetap' ? 'rgba(0, 70, 67, 0.2)' : loc.jenis_lokasi === 'dinas' ? 'rgba(128, 0, 128, 0.2)' : 'rgba(255, 165, 0, 0.2)'} 
                strokeColor={loc.jenis_lokasi === 'tetap' ? '#004643' : loc.jenis_lokasi === 'dinas' ? '#800080' : '#FFA500'} 
              />
            </React.Fragment>
          ))}
        </MapView>
      </View>

      <View style={styles.bottomCard}>
        <View style={styles.infoRow}>
          <Ionicons name="navigate-circle" size={24} color={isOutOfRange ? "red" : "green"} />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.distText}>
              Jarak: {Math.round(distance)} meter dari {nearestLocation?.nama_lokasi || 'lokasi terdekat'}
            </Text>
            <Text style={styles.statusText}>
              {isOutOfRange ? locationValidation.message : `Lokasi sesuai - ${nearestLocation?.nama_lokasi}`}
            </Text>
          </View>
        </View>

        {isOutOfRange && (
          <View style={styles.warningBox}>
            <Ionicons name="warning" size={20} color="red" />
            <Text style={styles.warningText}>{locationValidation.message}</Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={[styles.absenBtn, (isOutOfRange || isProcessing) && styles.absenBtnDisabled]}
          onPress={handleAbsen}
          disabled={isOutOfRange || isProcessing}
        >
          <View style={styles.btnContent}>
            <Ionicons name="camera" size={16} color="#fff" style={styles.btnIcon} />
            <View style={styles.btnTextContainer}>
              <Text style={styles.absenBtnText}>
                {isProcessing ? "MEMPROSES..." : 
                 isOutOfRange ? "TIDAK BISA ABSEN" : 
                 !hasCheckedIn ? "ABSEN MASUK" : "ABSEN PULANG"}
              </Text>
              <Text style={styles.timeText}>
                {currentTime.toTimeString().split(' ')[0]}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
      
      <Modal visible={showEarlyLeaveInput} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Alasan Pulang Cepat</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Masukkan alasan pulang cepat..."
              value={earlyLeaveReason}
              onChangeText={setEarlyLeaveReason}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelBtn]} 
                onPress={() => {
                  setShowEarlyLeaveInput(false);
                  setEarlyLeaveReason('');
                  setCapturedPhoto(null);
                }}
              >
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.submitBtn]} 
                onPress={() => {
                  if (!earlyLeaveReason.trim()) {
                    Alert.alert('Error', 'Silakan isi alasan pulang cepat');
                    return;
                  }
                  setShowEarlyLeaveInput(false);
                  if (capturedPhoto) {
                    showConfirmation(capturedPhoto, 'pulang_cepat');
                  }
                }}
              >
                <Text style={styles.submitBtnText}>Konfirmasi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  header: { padding: 20, backgroundColor: '#fff' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 13, color: '#004643', fontWeight: '500' },
  locationInfo: { fontSize: 12, color: '#666', marginTop: 5 },
  timeInfo: { fontSize: 11, color: '#007ACC', marginTop: 3, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 15, width: '90%', maxWidth: 400 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  textInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, minHeight: 80, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, marginHorizontal: 5 },
  cancelBtn: { backgroundColor: '#f0f0f0' },
  submitBtn: { backgroundColor: '#004643' },
  cancelBtnText: { textAlign: 'center', color: '#666', fontWeight: '500' },
  submitBtnText: { textAlign: 'center', color: '#fff', fontWeight: '500' },
  warningBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3CD', padding: 10, borderRadius: 8, marginBottom: 15 },
  warningText: { marginLeft: 8, color: '#856404', fontSize: 12 },
  mapWrapper: { flex: 1, marginHorizontal: 20, borderRadius: 20, overflow: 'hidden' },
  map: { width: '100%', height: '100%' },
  bottomCard: { padding: 25, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, elevation: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  distText: { fontWeight: 'bold', fontSize: 14 },
  statusText: { fontSize: 12, color: '#777' },
  absenBtn: { backgroundColor: '#004643', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, width: '100%' },
  absenBtnDisabled: { backgroundColor: '#CCC' },
  btnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' },
  btnIcon: { marginRight: 12 },
  btnTextContainer: { flex: 1 },
  absenBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  timeText: { color: '#fff', fontSize: 11, marginTop: 2, opacity: 0.9 },
});