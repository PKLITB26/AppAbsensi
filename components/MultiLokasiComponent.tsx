import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';

interface LokasiHari {
  hari: number;
  tanggal: string;
  nama_lokasi: string;
  alamat: string;
  latitude: number;
  longitude: number;
  radius: number;
}

interface MultiLokasiProps {
  tanggalMulai: string;
  tanggalSelesai: string;
  onLokasiChange: (lokasi: LokasiHari[]) => void;
  initialLokasi?: LokasiHari[];
}

export default function MultiLokasiComponent({ 
  tanggalMulai, 
  tanggalSelesai, 
  onLokasiChange,
  initialLokasi = []
}: MultiLokasiProps) {
  const [lokasiList, setLokasiList] = useState<LokasiHari[]>(initialLokasi);
  const [showMapModal, setShowMapModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [tempLokasi, setTempLokasi] = useState<Partial<LokasiHari>>({});
  const [mapRegion, setMapRegion] = useState({
    latitude: -6.2088,
    longitude: 106.8456,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01
  });
  const [markerPosition, setMarkerPosition] = useState<{latitude: number, longitude: number} | null>(null);

  // Generate daftar hari berdasarkan tanggal mulai dan selesai
  const generateHariList = () => {
    if (!tanggalMulai || !tanggalSelesai) return [];
    
    const startDate = new Date(convertToDate(tanggalMulai));
    const endDate = new Date(convertToDate(tanggalSelesai));
    const hariList = [];
    
    let currentDate = new Date(startDate);
    let hariKe = 1;
    
    while (currentDate <= endDate) {
      hariList.push({
        hari: hariKe,
        tanggal: formatTanggal(currentDate),
        nama_lokasi: '',
        alamat: '',
        latitude: 0,
        longitude: 0,
        radius: 100
      });
      currentDate.setDate(currentDate.getDate() + 1);
      hariKe++;
    }
    
    return hariList;
  };

  const convertToDate = (dateStr: string) => {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  const formatTanggal = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  // Initialize lokasi list saat tanggal berubah
  React.useEffect(() => {
    const hariList = generateHariList();
    if (hariList.length > 0 && lokasiList.length === 0) {
      setLokasiList(hariList);
      onLokasiChange(hariList);
    }
  }, [tanggalMulai, tanggalSelesai]);

  const handleEditLokasi = (index: number) => {
    setEditingIndex(index);
    setTempLokasi(lokasiList[index]);
    setShowMapModal(true);
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setMarkerPosition({ latitude, longitude });
    setTempLokasi({
      ...tempLokasi,
      latitude,
      longitude
    });
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const result = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (result.length > 0) {
        const address = result[0];
        return `${address.street || ''} ${address.name || ''}, ${address.district || ''}, ${address.city || ''}, ${address.region || ''}`.trim();
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
    return 'Alamat tidak ditemukan';
  };

  const confirmLokasi = async () => {
    if (!markerPosition || !tempLokasi.nama_lokasi) {
      Alert.alert('Error', 'Nama lokasi dan posisi di peta harus diisi');
      return;
    }

    try {
      const alamat = await reverseGeocode(markerPosition.latitude, markerPosition.longitude);
      
      const updatedLokasi = [...lokasiList];
      updatedLokasi[editingIndex] = {
        ...updatedLokasi[editingIndex],
        nama_lokasi: tempLokasi.nama_lokasi || '',
        alamat,
        latitude: markerPosition.latitude,
        longitude: markerPosition.longitude,
        radius: tempLokasi.radius || 100
      };
      
      setLokasiList(updatedLokasi);
      onLokasiChange(updatedLokasi);
      setShowMapModal(false);
      setMarkerPosition(null);
      setTempLokasi({});
    } catch (error) {
      Alert.alert('Error', 'Gagal mendapatkan alamat');
    }
  };

  const copyFromPrevious = (index: number) => {
    if (index > 0) {
      const prevLokasi = lokasiList[index - 1];
      const updatedLokasi = [...lokasiList];
      updatedLokasi[index] = {
        ...updatedLokasi[index],
        nama_lokasi: prevLokasi.nama_lokasi,
        alamat: prevLokasi.alamat,
        latitude: prevLokasi.latitude,
        longitude: prevLokasi.longitude,
        radius: prevLokasi.radius
      };
      setLokasiList(updatedLokasi);
      onLokasiChange(updatedLokasi);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lokasi per Hari ({lokasiList.length} hari)</Text>
      <Text style={styles.subtitle}>Atur lokasi untuk setiap hari dinas</Text>
      
      <ScrollView style={styles.lokasiList} nestedScrollEnabled>
        {lokasiList.map((lokasi, index) => (
          <View key={index} style={styles.lokasiCard}>
            <View style={styles.lokasiHeader}>
              <View style={styles.hariInfo}>
                <Text style={styles.hariText}>Hari {lokasi.hari}</Text>
                <Text style={styles.tanggalText}>{lokasi.tanggal}</Text>
              </View>
              
              <View style={styles.actionButtons}>
                {index > 0 && (
                  <TouchableOpacity 
                    style={styles.copyBtn}
                    onPress={() => copyFromPrevious(index)}
                  >
                    <Ionicons name="copy-outline" size={16} color="#666" />
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  style={styles.editBtn}
                  onPress={() => handleEditLokasi(index)}
                >
                  <Ionicons name="location-outline" size={16} color="#004643" />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.lokasiContent}>
              {lokasi.nama_lokasi ? (
                <>
                  <Text style={styles.namaLokasi}>{lokasi.nama_lokasi}</Text>
                  <Text style={styles.alamatLokasi}>{lokasi.alamat}</Text>
                  <Text style={styles.radiusText}>Radius: {lokasi.radius}m</Text>
                </>
              ) : (
                <Text style={styles.belumDiatur}>Lokasi belum diatur</Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Map Modal */}
      <Modal visible={showMapModal} animationType="slide">
        <View style={styles.mapModalContainer}>
          <View style={styles.mapHeader}>
            <TouchableOpacity onPress={() => setShowMapModal(false)}>
              <Ionicons name="arrow-back" size={24} color="#004643" />
            </TouchableOpacity>
            <Text style={styles.mapTitle}>
              Atur Lokasi Hari {editingIndex >= 0 ? lokasiList[editingIndex]?.hari : ''}
            </Text>
          </View>

          <View style={styles.inputSection}>
            <TextInput
              style={styles.namaLokasiInput}
              placeholder="Nama lokasi (contoh: Kantor Dinas Yogyakarta)"
              value={tempLokasi.nama_lokasi || ''}
              onChangeText={(text) => setTempLokasi({...tempLokasi, nama_lokasi: text})}
            />
            
            <View style={styles.radiusContainer}>
              <Text style={styles.radiusLabel}>Radius Absen: {tempLokasi.radius || 100}m</Text>
              <View style={styles.radiusButtons}>
                <TouchableOpacity 
                  style={styles.radiusBtn}
                  onPress={() => setTempLokasi({...tempLokasi, radius: Math.max(50, (tempLokasi.radius || 100) - 50)})}
                >
                  <Ionicons name="remove" size={16} color="#004643" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.radiusBtn}
                  onPress={() => setTempLokasi({...tempLokasi, radius: Math.min(500, (tempLokasi.radius || 100) + 50)})}
                >
                  <Ionicons name="add" size={16} color="#004643" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <MapView
            style={styles.map}
            region={mapRegion}
            onPress={handleMapPress}
          >
            {markerPosition && (
              <Marker
                coordinate={markerPosition}
                title={tempLokasi.nama_lokasi || 'Lokasi Dinas'}
              />
            )}
          </MapView>

          <View style={styles.mapActions}>
            <TouchableOpacity 
              style={styles.cancelBtn}
              onPress={() => setShowMapModal(false)}
            >
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.confirmBtn}
              onPress={confirmLokasi}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.confirmBtnText}>Simpan Lokasi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15
  },
  lokasiList: {
    maxHeight: 300
  },
  lokasiCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  lokasiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  hariInfo: {
    flex: 1
  },
  hariText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#004643'
  },
  tanggalText: {
    fontSize: 12,
    color: '#666'
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8
  },
  copyBtn: {
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 6
  },
  editBtn: {
    padding: 8,
    backgroundColor: '#F0F8F7',
    borderRadius: 6
  },
  lokasiContent: {
    paddingTop: 5
  },
  namaLokasi: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4
  },
  alamatLokasi: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
  radiusText: {
    fontSize: 11,
    color: '#999'
  },
  belumDiatur: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic'
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: '#fff'
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#004643',
    marginLeft: 15
  },
  inputSection: {
    padding: 20,
    backgroundColor: '#F8FAFB'
  },
  namaLokasiInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 15
  },
  radiusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  radiusLabel: {
    fontSize: 14,
    color: '#333'
  },
  radiusButtons: {
    flexDirection: 'row',
    gap: 10
  },
  radiusBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F8F7',
    justifyContent: 'center',
    alignItems: 'center'
  },
  map: {
    flex: 1
  },
  mapActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 10
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center'
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666'
  },
  confirmBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#004643',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff'
  }
});