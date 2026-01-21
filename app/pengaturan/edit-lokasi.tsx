import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
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
  }, []);

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
          <Text style={styles.infoText}>
            {formData.jenis === 'tetap' ? 'Kantor Tetap' : 'Lokasi Dinas'}
          </Text>
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
            {formData.latitude && formData.longitude && !markerPosition && (
              <Marker
                coordinate={{latitude: formData.latitude, longitude: formData.longitude}}
                title="Lokasi Saat Ini"
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
    paddingBottom: 120
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F8F7',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
    marginHorizontal: 20
  },
  infoText: {
    fontSize: 14,
    color: '#004643',
    marginLeft: 10,
    fontWeight: '600'
  },
  formGroup: {
    marginBottom: 20,
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
  }
});