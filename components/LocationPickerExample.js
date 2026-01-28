import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  ScrollView,
  SafeAreaView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UniversalMap from './UniversalMap';

export default function LocationPickerExample() {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isMapVisible, setIsMapVisible] = useState(true);

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    console.log('Location selected:', location);
  };

  const handleSubmit = () => {
    if (!selectedLocation) {
      Alert.alert('Peringatan', 'Silakan pilih lokasi terlebih dahulu');
      return;
    }

    Alert.alert(
      'Lokasi Dipilih',
      `Latitude: ${selectedLocation.latitude}\nLongitude: ${selectedLocation.longitude}`,
      [
        { text: 'OK', onPress: () => console.log('Location confirmed:', selectedLocation) }
      ]
    );
  };

  const resetLocation = () => {
    setSelectedLocation(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Pilih Lokasi Absensi</Text>
          <Text style={styles.subtitle}>
            Tap pada map untuk memilih lokasi atau gunakan tombol lokasi saat ini
          </Text>
        </View>

        <View style={styles.mapContainer}>
          {isMapVisible ? (
            <UniversalMap
              onLocationSelect={handleLocationSelect}
              initialLocation={selectedLocation}
              showCurrentLocationButton={true}
            />
          ) : (
            <View style={styles.mapPlaceholder}>
              <Ionicons name="map-outline" size={48} color="#CCC" />
              <Text style={styles.placeholderText}>Map disembunyikan</Text>
            </View>
          )}
        </View>

        <View style={styles.controls}>
          <TouchableOpacity 
            style={styles.toggleButton}
            onPress={() => setIsMapVisible(!isMapVisible)}
          >
            <Ionicons 
              name={isMapVisible ? "eye-off-outline" : "eye-outline"} 
              size={20} 
              color="#666" 
            />
            <Text style={styles.toggleText}>
              {isMapVisible ? 'Sembunyikan Map' : 'Tampilkan Map'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.resetButton}
            onPress={resetLocation}
            disabled={!selectedLocation}
          >
            <Ionicons name="refresh-outline" size={20} color="#666" />
            <Text style={styles.resetText}>Reset Lokasi</Text>
          </TouchableOpacity>
        </View>

        {selectedLocation && (
          <View style={styles.locationDetails}>
            <Text style={styles.detailsTitle}>Lokasi Terpilih:</Text>
            <Text style={styles.detailsText}>
              📍 Latitude: {selectedLocation.latitude.toFixed(6)}
            </Text>
            <Text style={styles.detailsText}>
              📍 Longitude: {selectedLocation.longitude.toFixed(6)}
            </Text>
          </View>
        )}

        <TouchableOpacity 
          style={[
            styles.submitButton, 
            !selectedLocation && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!selectedLocation}
        >
          <Ionicons 
            name="checkmark-circle-outline" 
            size={20} 
            color={selectedLocation ? "#fff" : "#999"} 
          />
          <Text style={[
            styles.submitText,
            !selectedLocation && styles.submitTextDisabled
          ]}>
            Konfirmasi Lokasi
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  mapContainer: {
    margin: 20,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mapPlaceholder: {
    height: 300,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
  },
  placeholderText: {
    marginTop: 10,
    color: '#999',
    fontSize: 14,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  toggleText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  resetText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  locationDetails: {
    margin: 20,
    padding: 15,
    backgroundColor: '#E6F0EF',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#004643',
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#004643',
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#004643',
    margin: 20,
    padding: 15,
    borderRadius: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
  },
  submitText: {
    marginLeft: 8,
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitTextDisabled: {
    color: '#999',
  },
});