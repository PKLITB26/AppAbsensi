import React, { useState } from 'react';
import { Platform, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Platform-specific imports
let MobileMap, WebMap;

if (Platform.OS === 'web') {
  WebMap = require('./WebMap').default;
} else {
  MobileMap = require('./MobileMap').default;
}

export default function UniversalMap({ 
  onLocationSelect, 
  initialLocation, 
  style,
  showCurrentLocationButton = true 
}) {
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [error, setError] = useState(null);

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    onLocationSelect(location);
  };

  const getCurrentLocation = async () => {
    try {
      if (Platform.OS !== 'web') {
        // Mobile: Gunakan expo-location
        const { Location } = require('expo-location');
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          setError('Permission untuk akses lokasi ditolak');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const currentLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        
        handleLocationSelect(currentLocation);
      } else {
        // Web: Gunakan browser geolocation
        if (!navigator.geolocation) {
          setError('Geolocation tidak didukung browser ini');
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const currentLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            handleLocationSelect(currentLocation);
          },
          (error) => {
            setError('Gagal mendapatkan lokasi: ' + error.message);
          }
        );
      }
    } catch (error) {
      setError('Error: ' + error.message);
    }
  };

  const MapComponent = Platform.OS === 'web' ? WebMap : MobileMap;

  return (
    <View style={[styles.container, style]}>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.dismissButton}
            onPress={() => setError(null)}
          >
            <Ionicons name="close" size={16} color="#666" />
          </TouchableOpacity>
        </View>
      )}

      <MapComponent
        onLocationSelect={handleLocationSelect}
        initialLocation={selectedLocation}
        style={styles.map}
      />

      {showCurrentLocationButton && (
        <TouchableOpacity 
          style={styles.currentLocationButton}
          onPress={getCurrentLocation}
        >
          <Ionicons name="locate" size={20} color="#004643" />
        </TouchableOpacity>
      )}

      {selectedLocation && (
        <View style={styles.locationInfo}>
          <Text style={styles.locationText}>
            📍 Lat: {selectedLocation.latitude.toFixed(6)}, 
            Lng: {selectedLocation.longitude.toFixed(6)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  map: {
    height: 300,
  },
  currentLocationButton: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationInfo: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 8,
    borderRadius: 5,
  },
  locationText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FFE6E6',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 12,
    flex: 1,
  },
  dismissButton: {
    padding: 5,
  },
});