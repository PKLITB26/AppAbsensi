import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MapComponentProps {
  latitude?: number;
  longitude?: number;
  title?: string;
  style?: any;
  showOfficeMarker?: boolean;
  officeCoords?: { latitude: number; longitude: number };
}

export default function MapComponent({ 
  latitude = -6.2088, 
  longitude = 106.8456, 
  title = "Location",
  style,
  showOfficeMarker = false,
  officeCoords = { latitude: -6.8915, longitude: 107.6107 }
}: MapComponentProps) {
  
  return (
    <View style={[styles.mapContainer, style]}>
      <View style={styles.mapPlaceholder}>
        <Ionicons name="map" size={60} color="#004643" />
        <Text style={styles.mapTitle}>Maps Temporarily Disabled</Text>
        <Text style={styles.mapSubtitle}>📍 {title}</Text>
        <Text style={styles.coordinates}>
          Lat: {latitude.toFixed(4)}, Lng: {longitude.toFixed(4)}
        </Text>
        {showOfficeMarker && (
          <View style={styles.officeInfo}>
            <Text style={styles.officeText}>🏢 Kantor ITB</Text>
            <Text style={styles.officeCoords}>
              Lat: {officeCoords.latitude.toFixed(4)}, Lng: {officeCoords.longitude.toFixed(4)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    minHeight: 200,
  },
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
  officeInfo: {
    marginTop: 15,
    padding: 10,
    backgroundColor: 'rgba(0,70,67,0.1)',
    borderRadius: 8,
    alignItems: 'center',
  },
  officeText: {
    fontSize: 14,
    color: '#004643',
    fontWeight: '600',
  },
  officeCoords: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
});