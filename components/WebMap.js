import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Web-only imports - akan di-handle oleh bundler
let MapContainer, TileLayer, Marker, useMapEvents;

if (typeof window !== 'undefined') {
  try {
    const leaflet = require('react-leaflet');
    MapContainer = leaflet.MapContainer;
    TileLayer = leaflet.TileLayer;
    Marker = leaflet.Marker;
    useMapEvents = leaflet.useMapEvents;
    
    // Import CSS untuk leaflet
    require('leaflet/dist/leaflet.css');
  } catch (error) {
    console.log('Leaflet not available, using fallback');
  }
}

function LocationMarker({ onLocationSelect }) {
  if (!useMapEvents) return null;
  
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onLocationSelect({ latitude: lat, longitude: lng });
    },
  });
  return null;
}

export default function WebMap({ onLocationSelect, initialLocation, style }) {
  // Fallback jika leaflet tidak tersedia
  if (!MapContainer) {
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.fallbackText}>
          Map tidak tersedia di web. Install react-leaflet untuk mengaktifkan.
        </Text>
        <Text style={styles.installText}>
          npm install react-leaflet leaflet
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <MapContainer
        center={[
          initialLocation?.latitude || -6.2088, 
          initialLocation?.longitude || 106.8456
        ]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <LocationMarker onLocationSelect={onLocationSelect} />
        {initialLocation && (
          <Marker position={[initialLocation.latitude, initialLocation.longitude]} />
        )}
      </MapContainer>
      <Text style={styles.instruction}>Klik pada map untuk memilih lokasi</Text>
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
    zIndex: 1000,
  },
  fallback: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 20,
  },
  fallbackText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  installText: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
    backgroundColor: '#F0F0F0',
    padding: 8,
    borderRadius: 5,
  },
});