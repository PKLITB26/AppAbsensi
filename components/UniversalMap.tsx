import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

let MapView: any = null;
let Marker: any = null;

try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
} catch (error) {
  // Maps tidak tersedia
}

interface UniversalMapProps {
  style?: any;
  region?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  onPress?: (event: any) => void;
  children?: React.ReactNode;
}

export default function UniversalMap({ style, region, onPress, children }: UniversalMapProps) {
  if (MapView) {
    return (
      <MapView
        style={style}
        region={region}
        onPress={onPress}
      >
        {children}
      </MapView>
    );
  }

  return (
    <View style={[styles.mapPlaceholder, style]}>
      <Ionicons name="map" size={60} color="#004643" />
      <Text style={styles.mapTitle}>Peta</Text>
      <Text style={styles.mapSubtitle}>Ketuk untuk pilih lokasi</Text>
      {region && (
        <Text style={styles.coordinates}>
          Lat: {region.latitude.toFixed(4)}, Lng: {region.longitude.toFixed(4)}
        </Text>
      )}
    </View>
  );
}

export { MapView, Marker };

const styles = StyleSheet.create({
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
    minHeight: 200,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#004643',
    marginTop: 10,
  },
  mapSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  coordinates: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
});