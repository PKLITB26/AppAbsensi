import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { PengaturanAPI } from '../../constants/config';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { NetworkDiagnostic } from '../../components/NetworkDiagnostic';

export default function TambahLokasiScreen() {
  const router = useRouter();
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
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

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
      console.error('Error getting location:', error);
    }
  };

  const searchLocation = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      
      // Cek apakah input adalah koordinat (format: lat,lng atau lat lng)
      const coordPattern = /^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/;
      const coordMatch = query.trim().match(coordPattern);
      
      if (coordMatch) {
        // Input adalah koordinat
        const lat = parseFloat(coordMatch[1]);
        const lng = parseFloat(coordMatch[2]);
        
        // Validasi koordinat Indonesia
        if (lat >= -11 && lat <= 6 && lng >= 95 && lng <= 141) {
          try {
            const reverseResult = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
            
            let displayName = 'Lokasi dari Koordinat';
            let address = 'Indonesia';
            
            if (reverseResult.length > 0) {
              const addr = reverseResult[0];
              const nameParts = [];
              if (addr.name) nameParts.push(addr.name);
              if (addr.street) nameParts.push(addr.street);
              if (addr.district) nameParts.push(addr.district);
              
              displayName = nameParts.length > 0 ? nameParts.join(', ') : 'Lokasi dari Koordinat';
              
              const addressParts = [];
              if (addr.street) addressParts.push(addr.street);
              if (addr.district) addressParts.push(addr.district);
              if (addr.city) addressParts.push(addr.city);
              if (addr.region) addressParts.push(addr.region);
              
              address = addressParts.join(', ') || 'Indonesia';
            }
            
            setSearchResults([{
              latitude: lat,
              longitude: lng,
              displayName: displayName,
              fullAddress: address,
              category: 'coordinate',
              source: 'coordinate'
            }]);
            return;
          } catch (error) {
            Alert.alert('Info', 'Koordinat tidak valid atau tidak dapat diakses');
            setSearchResults([]);
            return;
          }
        } else {
          Alert.alert('Info', 'Koordinat di luar wilayah Indonesia');
          setSearchResults([]);
          return;
        }
      }
      
      // Gunakan Google Places API style search
      const searchVariations = [
        query,
        `${query} Jakarta`,
        `${query} Bandung`,
        `${query} Surabaya`,
        `${query} Indonesia`
      ];
      
      let allResults: any[] = [];
      
      // Search dengan berbagai variasi
      for (const searchTerm of searchVariations) {
        try {
          const results = await Location.geocodeAsync(searchTerm);
          if (results && results.length > 0) {
            // Filter hasil yang valid (dalam Indonesia)
            const indonesianResults = results.filter(result => 
              result.latitude >= -11 && result.latitude <= 6 && // Latitude Indonesia
              result.longitude >= 95 && result.longitude <= 141   // Longitude Indonesia
            );
            allResults = [...allResults, ...indonesianResults];
          }
        } catch (error) {
          console.log(`Search failed for: ${searchTerm}`);
        }
      }
      
      // Hapus duplikat berdasarkan koordinat
      const uniqueResults = [];
      const seen = new Set();
      
      for (const result of allResults) {
        const key = `${Math.round(result.latitude * 1000)}_${Math.round(result.longitude * 1000)}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueResults.push(result);
        }
      }
      
      // Ambil maksimal 10 hasil terbaik
      const limitedResults = uniqueResults.slice(0, 10);
      
      // Enrich dengan informasi detail
      const enrichedResults = await Promise.all(
        limitedResults.map(async (result, index) => {
          try {
            const reverseResult = await Location.reverseGeocodeAsync({
              latitude: result.latitude,
              longitude: result.longitude
            });
            
            let displayName = `${query} ${index + 1}`;
            let address = 'Alamat tidak tersedia';
            
            if (reverseResult.length > 0) {
              const addr = reverseResult[0];
              
              // Buat nama yang lebih deskriptif
              const nameParts = [];
              if (addr.name && !addr.name.includes('Unnamed')) {
                nameParts.push(addr.name);
              }
              if (addr.street && addr.street !== addr.name) {
                nameParts.push(addr.street);
              }
              
              // Jika tidak ada nama spesifik, gunakan area
              if (nameParts.length === 0) {
                if (addr.district) nameParts.push(addr.district);
                if (addr.subregion) nameParts.push(addr.subregion);
              }
              
              displayName = nameParts.length > 0 ? nameParts.join(', ') : `${query} - ${addr.city || addr.region || 'Indonesia'}`;
              
              // Buat alamat lengkap
              const addressParts = [];
              if (addr.street) addressParts.push(addr.street);
              if (addr.district) addressParts.push(addr.district);
              if (addr.city) addressParts.push(addr.city);
              if (addr.region && addr.region !== addr.city) addressParts.push(addr.region);
              
              address = addressParts.join(', ') || 'Indonesia';
            }
            
            return {
              ...result,
              displayName: displayName,
              fullAddress: address,
              category: query // Kategori pencarian
            };
          } catch (error) {
            return {
              ...result,
              displayName: `${query} ${index + 1}`,
              fullAddress: 'Indonesia',
              category: query
            };
          }
        })
      );
      
      // Sort berdasarkan relevansi (nama yang mengandung query di awal)
      const sortedResults = enrichedResults.sort((a, b) => {
        const aStartsWith = a.displayName.toLowerCase().startsWith(query.toLowerCase());
        const bStartsWith = b.displayName.toLowerCase().startsWith(query.toLowerCase());
        
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return 0;
      });
      
      setSearchResults(sortedResults);
      
      if (sortedResults.length === 0) {
        Alert.alert('Info', `Tidak ditemukan "${query}" di Indonesia. Coba kata kunci lain.`);
      }
      
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      Alert.alert('Info', 'Gagal mencari lokasi. Periksa koneksi internet.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchInput = (text: string) => {
    setSearchQuery(text);
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout untuk debounce
    const timeout = setTimeout(() => {
      searchLocation(text);
    }, 800); // Tunggu 800ms setelah user berhenti mengetik
    
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

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setMarkerPosition({ latitude, longitude });
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
      
      console.log('Attempting to save location:', {
        nama_lokasi: formData.namaLokasi.trim(),
        alamat: formData.alamat.trim(),
        latitude: formData.latitude,
        longitude: formData.longitude,
        radius: parseInt(formData.radius),
        jenis_lokasi: formData.jenis
      });
      
      const response = await PengaturanAPI.saveLokasiKantor({
        nama_lokasi: formData.namaLokasi.trim(),
        alamat: formData.alamat.trim(),
        latitude: formData.latitude,
        longitude: formData.longitude,
        radius: parseInt(formData.radius),
        jenis_lokasi: formData.jenis
      });

      console.log('Save location response:', response);

      if (response.success) {
        Alert.alert('Sukses', 'Lokasi berhasil disimpan', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Info', response.message || 'Gagal menyimpan lokasi');
      }
    } catch (error: any) {
      console.error('Error in handleSave:', error);
      
      let errorMessage = 'Terjadi kesalahan saat menyimpan';
      
      if (error.message) {
        if (error.message.includes('terhubung ke server')) {
          errorMessage = 'Tidak dapat terhubung ke server.\n\nSolusi:\n1. Pastikan HP dan komputer di WiFi yang sama\n2. Periksa apakah XAMPP/server backend berjalan\n3. Coba restart aplikasi';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Koneksi timeout. Periksa koneksi internet dan coba lagi.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Kesalahan Koneksi', errorMessage, [
        { text: 'OK' },
        { 
          text: 'Coba Lagi', 
          onPress: () => handleSave() 
        }
      ]);
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
          <Text style={styles.headerTitle}>Tambah Lokasi</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Network Diagnostic */}
        <NetworkDiagnostic />
        
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#004643" />
          <View style={styles.infoContent}>
            <Text style={styles.infoText}>
              Lokasi absen menentukan area dimana karyawan dapat melakukan presensi. Pilih koordinat dan radius sesuai kebutuhan.
            </Text>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Jenis Lokasi</Text>
          <View style={styles.roleContainer}>
            {[
              { key: 'tetap', label: 'Kantor Tetap' },
              { key: 'dinas', label: 'Lokasi Dinas' }
            ].map((item) => (
              <TouchableOpacity 
                key={item.key}
                style={[styles.roleBtn, formData.jenis === item.key && styles.roleActive]}
                onPress={() => setFormData({...formData, jenis: item.key as 'tetap' | 'dinas'})}
              >
                <Text style={[styles.roleText, formData.jenis === item.key && styles.roleTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
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
                // Hanya izinkan angka
                const numericValue = text.replace(/[^0-9]/g, '');
                // Izinkan input sementara, validasi saat simpan
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

      {/* Sticky Save Button */}
      <View style={styles.stickyFooter}>
        <TouchableOpacity 
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]} 
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.submitText}>Simpan Lokasi</Text>
            </>
          )}
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

          {/* Search Bar */}
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
            
            {/* Search Results */}
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
                      <View style={styles.searchResultMeta}>
                        <Text style={styles.searchResultCoord}>
                          {result.latitude.toFixed(6)}, {result.longitude.toFixed(6)}
                        </Text>
                        {result.source === 'coordinate' && (
                          <Text style={styles.searchResultSource}>
                            📍 Koordinat
                          </Text>
                        )}
                      </View>
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
            {currentLocation && (
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
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 50, 
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
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
    paddingBottom: 120,
    paddingTop: 12
  },
  infoCard: {
    backgroundColor: '#F0F8F7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  infoContent: {
    flex: 1,
    marginLeft: 12
  },
  infoText: {
    fontSize: 12,
    color: '#004643',
    lineHeight: 16
  },
  formGroup: {
    marginBottom: 16,
    marginHorizontal: 20
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
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
  },
  searchResultMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2
  },
  searchResultSource: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '500'
  },
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: '#004643',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 30
  },
  saveBtnDisabled: {
    backgroundColor: '#999'
  },
  saveBtnText: {
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
  map: {
    flex: 1,
    minHeight: 400
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
  }
});
