import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { PengaturanAPI } from '../../constants/config';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';

export default function EditLokasiScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [markerPosition, setMarkerPosition] = useState<{latitude: number, longitude: number} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: -6.2088,
    longitude: 106.8456,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01
  });
  const [formData, setFormData] = useState({
    namaLokasi: '',
    alamat: '',
    latitude: null as number | null,
    longitude: null as number | null,
    radius: '100',
    jenis: 'dinas' as 'tetap' | 'dinas'
  });

  useEffect(() => {
    fetchLokasiData();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setCurrentLocation({ latitude, longitude });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const fetchLokasiData = async () => {
    try {
      setLoading(true);
      const response = await PengaturanAPI.getLokasiKantor();
      if (response.success && response.data) {
        const lokasi = response.data.find((item: any) => item.id == id);
        if (lokasi) {
          setFormData({
            namaLokasi: lokasi.nama_lokasi,
            alamat: lokasi.alamat,
            latitude: lokasi.latitude,
            longitude: lokasi.longitude,
            radius: lokasi.radius?.toString() || '100',
            jenis: lokasi.jenis_lokasi
          });
          if (lokasi.latitude && lokasi.longitude) {
            setMapRegion({
              latitude: lokasi.latitude,
              longitude: lokasi.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01
            });
          }
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal memuat data lokasi');
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setMarkerPosition({ latitude, longitude });
  };

  const searchLocation = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const results = await Location.geocodeAsync(query);
      if (results && results.length > 0) {
        const indonesianResults = results.filter(result => 
          result.latitude >= -11 && result.latitude <= 6 &&
          result.longitude >= 95 && result.longitude <= 141
        ).slice(0, 5);
        
        const enrichedResults = await Promise.all(
          indonesianResults.map(async (result, index) => {
            try {
              const reverseResult = await Location.reverseGeocodeAsync({
                latitude: result.latitude,
                longitude: result.longitude
              });
              
              let displayName = `${query} ${index + 1}`;
              let address = 'Indonesia';
              
              if (reverseResult.length > 0) {
                const addr = reverseResult[0];
                const nameParts = [];
                if (addr.name) nameParts.push(addr.name);
                if (addr.street) nameParts.push(addr.street);
                displayName = nameParts.length > 0 ? nameParts.join(', ') : displayName;
                
                const addressParts = [];
                if (addr.street) addressParts.push(addr.street);
                if (addr.district) addressParts.push(addr.district);
                if (addr.city) addressParts.push(addr.city);
                address = addressParts.join(', ') || 'Indonesia';
              }
              
              return {
                ...result,
                displayName,
                fullAddress: address
              };
            } catch (error) {
              return {
                ...result,
                displayName: `${query} ${index + 1}`,
                fullAddress: 'Indonesia'
              };
            }
          })
        );
        
        setSearchResults(enrichedResults);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchInput = (text: string) => {
    setSearchQuery(text);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      searchLocation(text);
    }, 800);
    
    setSearchTimeout(timeout);
  };

  const selectSearchResult = (result: any) => {
    const { latitude, longitude } = result;
    setMarkerPosition({ latitude, longitude });
    setMapRegion({
      latitude,
      longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  const confirmLocation = async () => {
    if (!markerPosition) {
      Alert.alert('Info', 'Pilih lokasi terlebih dahulu');
      return;
    }

    try {
      const result = await Location.reverseGeocodeAsync(markerPosition);
      let address = 'Alamat tidak ditemukan';
      if (result.length > 0) {
        const addr = result[0];
        address = `${addr.street || ''} ${addr.name || ''}, ${addr.district || ''}, ${addr.city || ''}, ${addr.region || ''}`.trim();
      }
      
      setFormData({
        ...formData,
        latitude: markerPosition.latitude,
        longitude: markerPosition.longitude,
        alamat: address
      });
      setShowMapModal(false);
      setMarkerPosition(null);
    } catch (error) {
      Alert.alert('Info', 'Gagal mendapatkan alamat');
    }
  };

  const handleSave = async () => {
    if (!formData.namaLokasi.trim() || !formData.alamat.trim()) {
      Alert.alert('Info', 'Nama lokasi dan alamat wajib diisi');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      Alert.alert('Info', 'Lokasi wajib dipilih di peta');
      return;
    }

    if (!formData.radius || parseInt(formData.radius) < 10 || parseInt(formData.radius) > 1000) {
      Alert.alert('Info', 'Radius harus antara 10-1000 meter');
      return;
    }

    try {
      setLoading(true);
      const response = await PengaturanAPI.updateLokasi(id, {
        nama_lokasi: formData.namaLokasi.trim(),
        alamat: formData.alamat.trim(),
        latitude: formData.latitude,
        longitude: formData.longitude,
        radius: parseInt(formData.radius),
        jenis_lokasi: formData.jenis
      });

      if (response.success) {
        Alert.alert('Sukses', 'Lokasi berhasil diupdate', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Info', response.message || 'Gagal mengupdate lokasi');
      }
    } catch (error) {
      Alert.alert('Info', 'Terjadi kesalahan saat mengupdate');
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={styles.headerTitle}>Edit Lokasi</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#004643" />
          <View style={styles.infoContent}>
            <Text style={styles.infoText}>
              Edit informasi lokasi absensi. Pastikan koordinat dan radius sesuai kebutuhan.
            </Text>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nama Lokasi *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="business-outline" size={20} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Contoh: Kantor Pusat"
              value={formData.namaLokasi}
              onChangeText={(text) => setFormData({ ...formData, namaLokasi: text })}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Alamat Lengkap *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Alamat lengkap..."
              value={formData.alamat}
              onChangeText={(text) => setFormData({ ...formData, alamat: text })}
              multiline
              numberOfLines={2}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <TouchableOpacity 
            style={styles.mapBtn} 
            onPress={() => setShowMapModal(true)}
          >
            <Ionicons name="map-outline" size={20} color="#004643" />
            <Text style={styles.mapBtnText}>
              {formData.latitude ? 'Lokasi Dipilih' : 'Pilih Lokasi di Peta'}
            </Text>
            {formData.latitude && (
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            )}
          </TouchableOpacity>
          {formData.latitude && formData.longitude && (
            <Text style={styles.coordText}>
              {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
            </Text>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Radius Absensi (meter) *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="radio-outline" size={20} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Masukkan radius dalam meter (10-1000)"
              value={formData.radius}
              onChangeText={(text) => {
                const numericValue = text.replace(/[^0-9]/g, '');
                if (numericValue === '' || numericValue.length <= 4) {
                  setFormData({ ...formData, radius: numericValue });
                }
              }}
              keyboardType="numeric"
              maxLength={4}
            />
            <Text style={styles.unitText}>m</Text>
          </View>
          <Text style={styles.helperText}>Rentang: 10-1000 meter</Text>
        </View>
      </ScrollView>

      <View style={styles.stickyFooter}>
        <TouchableOpacity 
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]} 
          onPress={handleSave}
          disabled={loading}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          <Text style={styles.submitText}>
            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showMapModal} animationType="slide">
        <SafeAreaView style={styles.mapModalContainer}>
          <View style={styles.mapHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setShowMapModal(false)}
            >
              <Ionicons name="arrow-back" size={24} color="#004643" />
            </TouchableOpacity>
            <Text style={styles.mapTitle}>Pilih Lokasi</Text>
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Ionicons name="search" size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Cari nama tempat atau koordinat (-6.2088, 106.8456)"
                value={searchQuery}
                onChangeText={handleSearchInput}
              />
              {searchLoading && <ActivityIndicator size="small" color="#004643" />}
            </View>
            
            {searchResults.length > 0 && (
              <View style={styles.searchResults}>
                {searchResults.map((result, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.searchResultItem}
                    onPress={() => selectSearchResult(result)}
                  >
                    <Ionicons name="location-outline" size={16} color="#666" />
                    <View style={styles.searchResultContent}>
                      <Text style={styles.searchResultName}>
                        {result.displayName}
                      </Text>
                      <Text style={styles.searchResultAddress}>
                        {result.fullAddress}
                      </Text>
                      <Text style={styles.searchResultCoord}>
                        {result.latitude.toFixed(6)}, {result.longitude.toFixed(6)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <MapView
            style={styles.map}
            region={mapRegion}
            onPress={handleMapPress}
          >
            {markerPosition && (
              <Marker
                coordinate={markerPosition}
                title="Lokasi Dipilih"
                description="Tap 'Konfirmasi' untuk menggunakan lokasi ini"
              />
            )}
            {currentLocation && !markerPosition && (
              <Marker
                coordinate={currentLocation}
                title="Lokasi Anda"
                pinColor="blue"
              />
            )}
          </MapView>
          
          {markerPosition && (
            <View style={styles.mapActions}>
              <TouchableOpacity 
                style={styles.confirmLocationBtn}
                onPress={confirmLocation}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.confirmLocationText}>Konfirmasi Lokasi</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cancelLocationBtn}
                onPress={() => setMarkerPosition(null)}
              >
                <Ionicons name="close-circle" size={20} color="#666" />
                <Text style={styles.cancelLocationText}>Batal</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.mapInfo}>
            <Text style={styles.mapInfoText}>Tap pada peta untuk memilih lokasi</Text>
          </View>
        </SafeAreaView>
      </Modal>
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
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 12,
    marginTop: 120
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F8F7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'flex-start'
  },
  infoText: {
    fontSize: 12,
    color: '#004643',
    lineHeight: 16
  },
  infoContent: {
    flex: 1,
    marginLeft: 12
  },
  formGroup: {
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
    marginLeft: 10
  },
  textArea: {
    textAlignVertical: 'top',
    paddingTop: 12
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8F7',
    padding: 15,
    borderRadius: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1
  },
  mapBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#004643',
    marginLeft: 8,
    flex: 1
  },
  coordText: {
    fontSize: 11,
    color: '#666',
    marginTop: 5,
    fontFamily: 'monospace'
  },
  unitText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginLeft: 8
  },
  helperText: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    marginLeft: 4
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(248, 250, 251, 0.98)',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 30
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
    backgroundColor: '#fff'
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
  searchContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 8
  },
  searchResults: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  searchResultContent: {
    flex: 1,
    marginLeft: 8
  },
  searchResultName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500'
  },
  searchResultAddress: {
    fontSize: 12,
    color: '#888',
    marginTop: 1
  },
  searchResultCoord: {
    fontSize: 10,
    color: '#999',
    fontFamily: 'monospace',
    marginTop: 2
  }
});