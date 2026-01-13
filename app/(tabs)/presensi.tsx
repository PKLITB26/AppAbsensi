import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

export default function PresensiScreen() {
  const [location, setLocation] = useState<any>(null);
  const [type, setType] = useState('Kantor');
  const [distance, setDistance] = useState<number>(0);

  const officeCoords = {
    latitude: -6.8915, 
    longitude: 107.6107,
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      
      // Update lokasi secara real-time
      let currLocation = await Location.getCurrentPositionAsync({});
      setLocation(currLocation.coords);
      
      // Hitung jarak saat lokasi didapat
      const dist = getDistance(
        currLocation.coords.latitude,
        currLocation.coords.longitude,
        officeCoords.latitude,
        officeCoords.longitude
      );
      setDistance(dist);
    })();
  }, []);

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

  // Logika Tombol Aktif/Nonaktif
  const isOutOfRange = type === 'Kantor' && distance > 100; // Radius 100 meter

  const handleAbsen = () => {
    if (isOutOfRange) {
      Alert.alert("Gagal", "Lokasi Anda terlalu jauh dari kantor!");
    } else {
      Alert.alert("Berhasil", `Berhasil Absen ${type}!`);
      // Nantinya di sini panggil Kamera atau Simpan ke Database
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Presensi Kehadiran</Text>
        <Text style={styles.headerSubtitle}>Status: {type}</Text>
      </View>

      <View style={styles.typeSelector}>
        <TouchableOpacity 
          style={[styles.typeBtn, type === 'Kantor' && styles.typeBtnActive]} 
          onPress={() => setType('Kantor')}
        >
          <View style={styles.typeBtnContent}>
            <Ionicons name="business-outline" size={16} color={type === 'Kantor' ? '#fff' : '#666'} />
            <Text style={[styles.typeText, type === 'Kantor' && styles.typeTextActive]}>Kantor</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.typeBtn, type === 'Dinas Luar' && styles.typeBtnActive]} 
          onPress={() => setType('Dinas Luar')}
        >
          <View style={styles.typeBtnContent}>
            <Ionicons name="car-outline" size={16} color={type === 'Dinas Luar' ? '#fff' : '#666'} />
            <Text style={[styles.typeText, type === 'Dinas Luar' && styles.typeTextActive]}>Dinas Luar</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.mapWrapper}>
        <MapView
          style={styles.map}
          region={{
            latitude: location ? location.latitude : officeCoords.latitude,
            longitude: location ? location.longitude : officeCoords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
        >
          {location && <Marker coordinate={location} title="Lokasi Anda" pinColor="blue" />}
          <Marker coordinate={officeCoords} title="Kantor ITB" />
          <Circle center={officeCoords} radius={100} fillColor="rgba(0, 70, 67, 0.2)" strokeColor="#004643" />
        </MapView>
      </View>

      <View style={styles.bottomCard}>
        <View style={styles.infoRow}>
          <Ionicons name="navigate-circle" size={24} color={isOutOfRange ? "red" : "green"} />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.distText}>
              Jarak: {Math.round(distance)} meter dari kantor
            </Text>
            <Text style={styles.statusText}>
              {isOutOfRange && type === 'Kantor' ? "Di luar radius" : "Lokasi sudah sesuai"}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.absenBtn, isOutOfRange && styles.absenBtnDisabled]}
          onPress={handleAbsen}
          disabled={isOutOfRange}
        >
          <Text style={styles.absenBtnText}>
            {isOutOfRange ? "LOKASI TERLALU JAUH" : "AMBIL FOTO & ABSEN"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  header: { padding: 20, backgroundColor: '#fff' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 13, color: '#666' },
  typeSelector: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 15, justifyContent: 'space-between' },
  typeBtn: { width: '48%', padding: 12, borderRadius: 10, backgroundColor: '#E0E0E0', alignItems: 'center' },
  typeBtnActive: { backgroundColor: '#004643' },
  typeBtnContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeText: { fontWeight: '600', color: '#666' },
  typeTextActive: { color: '#fff' },
  mapWrapper: { flex: 1, marginHorizontal: 20, borderRadius: 20, overflow: 'hidden' },
  map: { width: '100%', height: '100%' },
  bottomCard: { padding: 25, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, elevation: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  distText: { fontWeight: 'bold', fontSize: 14 },
  statusText: { fontSize: 12, color: '#777' },
  absenBtn: { backgroundColor: '#004643', padding: 18, borderRadius: 15, alignItems: 'center' },
  absenBtnDisabled: { backgroundColor: '#CCC' },
  absenBtnText: { color: '#fff', fontWeight: 'bold' },
});