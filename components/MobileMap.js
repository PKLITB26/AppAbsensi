import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function MobileMap({ onLocationSelect, initialLocation, style }) {
  return (
    <View style={[styles.container, style]}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: initialLocation?.latitude || -6.2088,
          longitude: initialLocation?.longitude || 106.8456,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        onPress={(event) => {
          const { latitude, longitude } = event.nativeEvent.coordinate;
          onLocationSelect({ latitude, longitude });
        }}
      >
        {initialLocation && (
          <Marker 
            coordinate={initialLocation}
            title="Lokasi Dipilih"
            description="Tap pada map untuk mengubah lokasi"
          />
        )}
      </MapView>
      <Text style={styles.instruction}>Tap pada map untuk memilih lokasi</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  map: {
    flex: 1,
  },
  instruction: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 8,
    borderRadius: 5,
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
  },
});